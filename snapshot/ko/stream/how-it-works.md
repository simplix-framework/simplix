# simplix-stream 동작 방식

구독부터 메시지 전송까지 관여하는 구성 요소, 모듈이 등록하는 구성, 애플리케이션이 교체할 수 있는 부분을 설명합니다.

## 구독부터 메시지까지

1. 클라이언트가 연결합니다. `SessionManager`가 `StreamSession`을 생성해 `SessionRegistry`에 등록합니다. 전송 계층은 연결을 `MessageSender`(`SseStreamSession` 또는 `WebSocketStreamSession`)로 감싸 브로드캐스터에 등록합니다.
2. 클라이언트가 구독 목록을 전송합니다. 항목마다 `SubscriptionKey`가 포함된 `Subscription`으로 변환됩니다. 전송 계층은 수집기 레지스트리나 이벤트 소스 레지스트리에서 리소스 존재 여부를, `StreamAuthorizationService`에서 사용자의 구독 권한을 확인합니다.
3. `SubscriptionManager`가 현재 목록과 비교해 `SubscriptionDiff`를 적용합니다.
4. 수집기 리소스이면 `SchedulerManager`가 해당 키의 `SubscriptionScheduler`에 세션을 추가하거나 새로 생성합니다. 스케줄러는 모든 구독자를 위해 주기마다 수집기를 실행하고, 마지막 구독자가 빠지면 중지됩니다.
5. 이벤트 리소스이면 `EventStreamHandler`가 세션을 `EventSubscriberRegistry`에 기록하고 이벤트 수신을 대기합니다.
6. 수집한 데이터와 이벤트는 `StreamMessage`로 변환됩니다. `BroadcastService`가 구독 중인 각 세션의 `MessageSender`에 전달하고, `MessageSender`는 메시지를 큐에 넣은 뒤 쓰기 스레드에서 연결에 기록합니다.

## 모듈이 등록하는 구성

`SimpliXStreamAutoConfiguration`은 `simplix.stream`을 `StreamProperties`에 바인딩하며 `simplix.stream.enabled`가 `false`가 아니면 활성화됩니다.

| 구성 클래스 | 활성 조건 | 등록 대상 |
|---|---|---|
| `SimpliXStreamCoreConfiguration` | 항상 | `SessionManager`, `SubscriptionManager`, `SchedulerManager`, 스레드 풀. 로컬 모드에서는 `LocalSessionRegistry`와 `LocalBroadcaster`도 등록합니다 |
| `SimpliXStreamSecurityConfiguration` | 항상 | `StreamAuthorizationService`, `ConnectTicketService`, 모든 세션을 허용하는 `SessionValidator` |
| `SimpliXStreamSseConfiguration` | 서블릿 웹 애플리케이션 | 비동기 요청 타임아웃(`session.timeout`). `SseStreamController`는 컴포넌트 스캔으로 등록됩니다 |
| `SimpliXStreamWebSocketConfiguration` | `websocket.enabled`를 지정했고 Spring WebSocket이 클래스패스에 있음 | STOMP 엔드포인트와 `WebSocketStreamHandler` |
| `SimpliXStreamEventSourceConfiguration` | `event-source.enabled`를 지정함 | `SimpliXStreamEventSourceRegistry`, `EventSubscriberRegistry`, `EventStreamHandler` |
| `SimpliXStreamPersistenceConfiguration` | `persistence.enabled`를 지정했고 JPA를 사용함 | `DbSessionRegistry`, `StreamServerManager`, `StreamStatisticsService`, 저장소 |
| `SimpliXStreamDistributedConfiguration` | `mode: distributed` | 인스턴스 ID, 설정한 브로커의 브로드캐스터와 리더 선출 |
| `SimpliXStreamAdminConfiguration` | 항상 | `StreamAdminController`, `StreamHealthIndicator`, `StreamMetrics`. `admin.enabled`를 지정하면 명령 서비스와 프로세서도 등록합니다 |

## 애플리케이션이 교체할 수 있는 구성 요소

| 선언할 빈 | 용도 |
|---|---|
| `SessionValidator` | 하트비트 전송 전마다 세션 유지 여부를 판정 |
| `ResourceAuthorizer`(리소스마다 하나) | 구독 권한 결정 |
| `SessionRegistry` | 세션을 다른 위치에 보관 |
| `BroadcastService` | 메시지를 다른 방식으로 전달 |
| `ConnectTicketService` | 여러 인스턴스가 공유하는 저장소에서 티켓 발급. 기본 구현은 단일 인스턴스의 메모리에 보관합니다 |
| `AdminCommandService` | 관리 명령을 다른 방식으로 저장 |

> ℹ 티켓은 발급한 인스턴스에서만 사용할 수 있습니다. 로드 밸런서 뒤에서는 티켓 요청과 연결 요청이 같은 인스턴스에 도달해야 하며, 스티키 세션으로 보장합니다.

## 스레드

| 풀 | 크기 | 실행 대상 |
|---|---|---|
| 스케줄러 | `scheduler.thread-pool-size`(10) | 수집기, 하트비트, 유예 시간 타이머 |
| 쓰기(`sse-writer-N`) | `send.writer-threads`. 0이면 프로세서 수(최소 4) | 큐에서 대기 중인 메시지를 연결에 기록합니다. 느린 클라이언트 하나가 다른 클라이언트를 지연시키지 않습니다 |
| 세션 검증 | 필요에 따라 증가 | `SessionValidator`. `session.validation-timeout`으로 제한합니다 |

## 엔드포인트의 오류

모듈의 예외는 `SimpliXGeneralException`의 하위 클래스인 `StreamException`을 상속하므로, 스타터가 표준 오류 형식으로 응답합니다.

| 예외 | 오류 코드 |
|---|---|
| `SessionNotFoundException`, `ResourceNotFoundException` | `GEN_NOT_FOUND` |
| `SessionExpiredException` | `AUTH_SESSION_EXPIRED` |
| `AuthorizationDeniedException`(`DenialDetail` 포함) | `AUTHZ_ACCESS_DENIED` |
| `SubscriptionLimitExceededException`(`SubscriptionLimitExceededException.LimitDetail` 포함) | `BIZ_QUOTA_EXCEEDED` |
| `SchedulerException`, `BroadcastException` | `GEN_INTERNAL_SERVER_ERROR` |

## 관련 문서

- [다중 인스턴스 실행](ko/stream/running-several-instances.md)
- [설정 레퍼런스](ko/stream/configuration-reference.md)
- [문제 해결](ko/stream/troubleshooting.md)
