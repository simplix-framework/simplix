# 설정 레퍼런스

`simplix.stream` 아래에 있는 모듈의 모든 속성을 정리합니다.

## 모듈과 모드

| 속성 | 기본값 | 의미 |
|---|---|---|
| `enabled` | `true` | 모듈을 등록합니다 |
| `mode` | `local` | `local` 또는 `distributed`(`StreamProperties.Mode`) |
| `instance-id` | 자동 생성 | 분산 모드와 관리 명령에서 사용하는 인스턴스 이름 |
| `persistence.enabled` | `false` | 세션, 구독, 인스턴스를 데이터베이스에 보관합니다 |
| `event-source.enabled` | `false` | 이벤트 소스를 등록합니다 |

## 세션

| 속성 | 기본값 | 의미 |
|---|---|---|
| `session.timeout` | 5분 | 서버가 연결을 종료하기 전까지의 연결 유지 시간 |
| `session.heartbeat-interval` | 30초 | 세션 검증과 하트비트 전송 주기 |
| `session.grace-period` | 30초 | 연결이 끊긴 세션이 구독을 유지하는 시간 |
| `session.cleanup-interval` | 30초 | 타임아웃이 지난 세션을 확인하는 주기 |
| `session.max-per-user` | `5` | 사용자별 세션 수. 한도를 넘으면 가장 오래된 세션을 종료합니다. 0은 제한 없음 |
| `session.validation-timeout` | 5초 | `SessionValidator`에 허용하는 시간 |

## 수집

| 속성 | 기본값 | 의미 |
|---|---|---|
| `scheduler.thread-pool-size` | `10` | 수집기와 하트비트용 스레드 수 |
| `scheduler.default-interval` | 1초 | 수집기가 없는 리소스의 구독 주기 |
| `scheduler.min-interval` | 100밀리초 | 구독의 최소 주기 |
| `scheduler.max-interval` | 60초 | 구독의 최대 주기 |
| `scheduler.max-consecutive-errors` | `5` | 수집을 `ERROR`로 보고하기까지의 연속 실패 횟수 |
| `scheduler.max-total-schedulers` | `500` | 동시에 수집하는 구독 키 수. 0은 제한 없음 |
| `subscription.max-per-session` | `20` | 세션별 구독 수. 0은 제한 없음 |
| `subscription.partial-success` | `true` | 거부된 항목이 있는 요청의 `success`를 true로 보고할지 여부 |

## 전송

| 속성 | 기본값 | 의미 |
|---|---|---|
| `send.queue-capacity` | `256` | 클라이언트 하나에 대기할 수 있는 메시지 수. 초과하면 세션을 종료합니다 |
| `send.writer-threads` | `0` | 연결에 기록하는 스레드 수. 0이면 프로세서 수(최소 4) |
| `broadcast.timeout` | 5초 | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |
| `broadcast.batch-size` | `0` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

## 보안

| 속성 | 기본값 | 의미 |
|---|---|---|
| `security.enforce-authorization` | `false` | `ResourceAuthorizer`가 없는 리소스의 구독을 거부합니다 |
| `security.connect-ticket-validity` | 30초 | 연결 티켓의 유효 시간 |
| `security.require-authentication` | `false` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

## WebSocket

| 속성 | 기본값 | 의미 |
|---|---|---|
| `websocket.enabled` | `false` | WebSocket 전송 방식을 등록합니다 |
| `websocket.endpoint` | `/ws/stream` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |
| `websocket.allowed-origins` | `*` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |
| `websocket.sockjs-enabled` | `true` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

## 다중 인스턴스

| 속성 | 기본값 | 의미 |
|---|---|---|
| `server.instance-id` | 자동 생성 | 서버와 세션 테이블에 기록하는 인스턴스 이름 |
| `server.heartbeat-interval` | 30초 | 인스턴스의 하트비트 기록 주기 |
| `server.dead-threshold` | 2분 | 하트비트가 없는 인스턴스의 세션을 종료하기까지의 시간 |
| `server.cleanup-interval` | 60초 | 하트비트가 없는 인스턴스를 확인하는 주기 |
| `distributed.broker` | `NONE` | `NONE`, `REDIS`, `NATS` 중 하나(`StreamProperties.Broker`) |
| `distributed.leader-election.ttl` | 30초 | 리더 자격의 유효 시간 |
| `distributed.leader-election.renew-interval` | 10초 | 리더가 자격을 갱신하는 주기 |
| `distributed.leader-election.retry-interval` | 5초 | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |
| `distributed.pubsub.channel-prefix` | `stream:data:` | Redis 채널의 접두어 |
| `distributed.registry.key-prefix` | `stream:` | Redis 리더 키의 접두어 |
| `distributed.registry.ttl` | 1시간 | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |
| `distributed.nats.subject-prefix` | `stream.data.` | NATS 서브젝트의 접두어 |
| `distributed.nats.broadcast-subject-segment` | `broadcast` | 접두어 뒤에 추가하는 키별 메시지의 서브젝트 |
| `distributed.nats.direct-subject-segment` | `direct` | 접두어 뒤에 추가하는 세션 대상 메시지의 서브젝트 |
| `distributed.nats.leader-bucket` | `simplix-stream-leaders` | 리더를 보관하는 키-값 버킷 |

## 관리 명령

| 속성 | 기본값 | 의미 |
|---|---|---|
| `admin.enabled` | `false` | 분산 모드에서 변경 관리 호출을 명령으로 저장합니다 |
| `admin.polling-interval` | 2초 | 인스턴스가 자신의 명령을 조회하는 주기 |
| `admin.command-timeout` | 5분 | 실행되지 않은 명령이 만료되기까지의 시간 |
| `admin.retention-period` | 7일 | 완료된 명령의 보관 기간 |
| `admin.cleanup-cron` | `0 0 3 * * ?` | 오래된 명령을 삭제하는 시점 |

## 모니터링

| 속성 | 기본값 | 의미 |
|---|---|---|
| `monitoring.metrics-enabled` | `true` | 메트릭을 등록합니다 |
| `monitoring.metrics-prefix` | `simplix.stream` | 메트릭 이름의 접두어 |
| `monitoring.health-check-interval` | 10초 | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

## 이벤트 발행

| 속성 | 기본값 | 의미 |
|---|---|---|
| `event-publishing.enabled` | `false` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |
| `event-publishing.events.session-connected` | `true` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |
| `event-publishing.events.session-disconnected` | `true` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |
| `event-publishing.events.subscription-changed` | `false` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

## 관련 문서

- [simplix-stream 동작 방식](ko/stream/how-it-works.md)
- [문제 해결](ko/stream/troubleshooting.md)
