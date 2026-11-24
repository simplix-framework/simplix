# simplix-messaging 문제 해결

메시지를 발행하고 처리할 때 발생하는 증상과 원인, 조치를 정리합니다.

## 발행과 처리

| 증상 | 원인 | 조치 |
|---|---|---|
| 발행할 때 `IllegalArgumentException: Unsupported payload type`이 발생함 | 페이로드가 객체입니다. `byte[]`, `String`, Wire protobuf 메시지만 전송할 수 있습니다 | 먼저 직렬화하세요: `Message.ofBytes(channel, JsonCodec.serialize(object))` |
| 애플리케이션이 시작되지 않음: `@MessageHandler method's first parameter must be Message<T>` | 핸들러가 페이로드 타입을 직접 받고 있습니다 | `Message<T>`를 받으세요. 두 번째 매개변수로 `MessageAcknowledgment`를 추가할 수 있습니다 |
| 핸들러가 실행되지 않음 | 클래스가 Spring 빈이 아니거나, 채널 이름이 발행한 이름과 다르거나, 발행 측이 다른 브로커를 사용합니다 | 빈 등록 여부와 채널 이름을 확인하고, 양쪽의 `/actuator/health/messaging`을 확인하세요 |
| 메시지가 중복 처리됨 | 브로커는 메시지를 한 번 이상 전달합니다. 타임아웃, 재시작, 메시지 재할당 뒤에 다시 도착합니다 | 핸들러를 멱등하게 구현하거나, `idempotent = true`를 지정하고 고정된 `messageId`로 발행하세요 |
| 로그에 `Idempotency store is not configured but idempotent=true`가 기록됨 | Kafka, RabbitMQ처럼 사용 중인 브로커가 `IdempotencyStore`를 등록하지 않습니다 | `IdempotencyStore` 빈을 선언하거나 작업을 멱등하게 구현하세요 |
| 로컬 브로커에서 예외가 발생한 핸들러가 다시 호출되지 않음 | 로컬 브로커는 메시지를 다시 전달하지 않습니다 | 재전달은 실제 브로커에서 테스트하세요 |
| 실패하는 메시지가 계속 전달됨 | 처리할 수 없는 메시지와 일시적인 실패를 구분하지 않고 있습니다 | 수동으로 확인 응답을 보내고 처리할 수 없는 메시지는 `DeadLetterStrategy`로 분리하세요. NATS는 `nats.max-deliver`회 전달한 뒤 메시지 전달을 중단합니다 |
| `DeadLetterStrategy` 빈을 주입할 수 없음 | `error.dead-letter.enabled`가 `false`입니다 | `true`로 지정하세요 |
| 트랜잭션이 롤백되었는데 메시지가 발행됨 | 트랜잭션 안에서 발행했습니다 | 커밋 후에 실행되는 리스너에서 발행하세요 |

## 브로커

| 증상 | 원인 | 조치 |
|---|---|---|
| NATS에서 채널이 `Stream <name> is not provisioned`로 실패하거나 스트림을 생성할 수 없음 | `auto-create-streams`가 `false`인데 스트림이 없거나, 사용자에게 스트림 생성 권한이 없습니다 | 스트림을 미리 생성하거나 사용자에게 생성 권한을 부여하세요 |
| NATS에서 스케줄러 때문에 시작에 실패함 | `nats.scheduler.enabled`가 `true`인데 사용자에게 키-값 권한이 없습니다 | 스케줄러를 끄거나 권한을 부여하세요 |
| Redis에서 처리 시간이 긴 메시지를 여러 컨슈머가 처리함 | `claim-min-idle-time`이 핸들러 실행 시간보다 짧습니다 | 최대 실행 시간보다 충분히 길게 지정하세요 |
| Kafka에서 같은 레코드의 메시지 순서가 바뀜 | 순서는 파티션 안에서만 보장됩니다 | `x-partition-key` 헤더에 레코드의 ID를 지정하세요 |
| 재생 결과가 비어 있음 | 메시지가 채널의 보존 기간보다 오래되었거나 브로커가 재생을 지원하지 않습니다 | `max-age`나 `max-length`와 `capabilities().replay()`를 확인하세요 |
| 헬스 엔드포인트에서 메시징이 `DOWN`으로 보고됨 | 브로커가 준비 상태가 아닙니다. 서버에 접속할 수 없거나 인증이 거부되었습니다 | 주소와 인증 정보를 확인하세요. 연결 로그에 사유가 기록됩니다 |
| NATS에서 발행이 `Failed to publish message to subject <subject>`로 실패함 | 채널에 아직 스트림이 없습니다. 스트림은 핸들러가 구독할 때 생성됩니다 | 채널을 처리하는 애플리케이션을 먼저 시작하거나 스트림을 미리 생성하세요 |
| NATS에서 `RequestReplyTemplate` 요청이 `Failed to add/update consumer for stream <stream>`으로 실패함 | 응답 채널에 스트림이 없습니다 | 응답 채널의 스트림을 미리 생성하세요 |

## 관련 문서

- [simplix-messaging 동작 방식](./how-it-works.md)
- [실패 처리](./handling-failures.md)
