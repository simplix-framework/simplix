# simplix-stream 문제 해결

스트림을 사용할 때 발생하는 증상과 원인, 조치를 정리합니다.

## 연결

| 증상 | 원인 | 조치 |
|---|---|---|
| `GET /api/stream/connect?ticket=...`이 401 `AUTH_AUTHENTICATION_REQUIRED`를 반환함 | 보안 설정이 티켓을 읽기 전에 요청을 거부합니다 | `simplix.auth.security.permit-all-patterns`에 `/api/stream/connect`를 추가하세요 |
| 요청에 토큰이 있는데 세션에 사용자가 없음 | 연결 경로를 허용했습니다. 허용한 경로에서는 토큰을 평가하지 않습니다 | 티켓으로 연결하거나, 경로를 허용하지 않고 헤더로 연결하세요 |
| 티켓으로 연결했는데 익명 세션이 열림 | 이미 사용한 티켓이거나 `security.connect-ticket-validity`가 지난 티켓입니다 | 연결할 때마다 새 티켓을 발급받으세요 |
| 모든 연결이 5분 뒤에 종료됨 | `session.timeout`이 지나면 데이터 전송 여부와 관계없이 연결을 종료합니다 | 클라이언트에서 다시 연결하거나 `session.timeout`을 늘리세요 |
| 재연결한 `EventSource`가 데이터를 받지 못함 | 브라우저가 사용한 티켓의 URL로 재시도해 구독이 없는 새 세션을 열었습니다 | 오류가 발생하면 `EventSource`를 닫고 새 티켓으로 연결한 뒤 다시 구독하세요 |
| 같은 사용자의 이전 탭이 수신을 멈춤 | 사용자가 `session.max-per-user`에 도달해 가장 오래된 세션이 종료되었습니다 | 한도를 늘리거나 탭 간에 연결 하나를 공유하세요 |
| 세션 호출이 404 `Stream session not found`를 반환함 | 세션이 종료되었거나 호출이 다른 인스턴스에 도달했습니다 | 다시 연결하세요. 로드 밸런서에서는 스티키 세션을 사용하세요 |
| 인증된 사용자의 세션 호출이 401을 반환함 | 다른 사용자의 세션이거나 익명 세션입니다 | 연결한 사용자로 호출하세요 |

## 구독과 데이터

| 증상 | 원인 | 조치 |
|---|---|---|
| `failed`에 `Resource not found`가 포함됨 | 해당 리소스 이름의 수집기와 이벤트 소스가 없습니다. 이벤트 소스에는 `event-source.enabled`도 필요합니다 | 이름을 `getResource()`와 비교하고, 클래스가 Spring 빈인지 확인한 뒤 이벤트 소스를 활성화하세요 |
| `failed`에 `No authorizer configured for resource`가 포함됨 | `security.enforce-authorization`을 지정했는데 리소스에 `ResourceAuthorizer`가 없습니다 | 리소스의 권한 검사기를 선언하세요 |
| 잘못된 매개변수의 구독이 허용됨 | 수집기의 `validateParams`는 호출되지 않습니다 | 리소스의 `ResourceAuthorizer`에서 매개변수를 검사하세요 |
| 두 번째 구독 호출 뒤에 첫 구독이 해제됨 | 호출에는 전체 목록을 지정해야 합니다 | 세션이 유지할 모든 구독을 전송하세요 |
| 수집기가 `ticket` 매개변수나 구독에서 보내지 않은 매개변수를 받음 | 연결 요청의 쿼리 매개변수가 모든 구독에 추가됩니다 | 수집기에서는 해당 값을 무시하고, 구독별 값은 `params`로 전송하세요 |
| 애플리케이션 이벤트가 스트림에 전달되지 않음 | `EventManager`로 발행했거나 타입이 `getEventType()`과 다릅니다 | `ApplicationEventPublisher`로 `Event`를 발행하고 타입을 비교하세요 |
| 구독자가 다른 매개변수의 이벤트를 받음 | 이벤트의 매개변수와 정확히 일치하는 구독 세션이 없어 리소스의 모든 구독자가 받았습니다 | 대상을 리소스 이름과 권한 검사기로 구분하세요 |
| 클라이언트가 `SCHEDULER_ERROR`가 포함된 `error` 메시지를 받음 | 수집기에서 예외가 발생합니다 | 로그에서 예외를 확인하세요. 수집기는 다음 주기에 다시 호출됩니다 |
| 새 구독 키가 데이터를 받지 못하고 로그에 `Maximum scheduler limit reached`가 기록됨 | 이미 `scheduler.max-total-schedulers`개의 키를 수집하고 있습니다 | 한도를 늘리거나 같은 매개변수로 구독해 키를 공유하세요 |

## 시작

| 증상 | 원인 | 조치 |
|---|---|---|
| 애플리케이션이 시작되지 않음: `SessionRegistry` 타입의 빈을 찾을 수 없음 | 세션 레지스트리 없이 `mode: distributed`를 지정했습니다 | `simplix.stream.persistence.enabled: true`를 지정하세요 |
| 애플리케이션이 시작되지 않음: `Not a managed type: class ...StreamSessionEntity` | 모듈의 엔티티가 스캔되지 않았습니다 | `@EntityScan`에 애플리케이션 패키지와 함께 `dev.simplecore.simplix.stream.persistence.entity`를 지정하세요 |
| `distributed.broker: REDIS`에서 애플리케이션이 시작되지 않음: `BroadcastService` 타입의 빈을 찾을 수 없거나 의존성 순환이 발생함 | 브로커 구성의 빈을 연결할 수 없습니다 | `distributed.broker: NONE`을 사용하세요 |
| `admin.enabled`를 지정했는데 `distributedAdminEnabled`가 `false`임 | 명령 저장소가 등록되지 않았습니다 | `@EnableJpaRepositories`와 `@EntityScan`에 `dev.simplecore.simplix.stream.admin.command`를 지정하세요 |
| `/ws/stream`의 WebSocket 핸드셰이크가 리다이렉트로 실패함 | 경로에 웹 로그인이 적용되어 있습니다 | `/ws/stream`과 `/ws/stream/**`을 허용하거나 먼저 사용자를 로그인시키세요 |

## 관련 문서

- [simplix-stream 동작 방식](./how-it-works.md)
- [클라이언트 연결](./connecting-clients.md)
- [다중 인스턴스 실행](./running-several-instances.md)
