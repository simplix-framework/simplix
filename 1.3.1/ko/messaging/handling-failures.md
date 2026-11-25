# 실패 처리

핸들러에서 예외가 발생한 메시지의 처리 방식, 브로커별 재전달 방식, 처리할 수 없는 메시지를 분리하는 방법을 설명합니다.

## 핸들러에서 예외가 발생했을 때

예외는 핸들러 이름과 함께 로그에 기록되고, 메시지에는 확인 응답을 보내지 않습니다. 이후의 처리는 브로커에 따라 달라집니다.

| 브로커 | 확인 응답을 받지 못한 메시지의 처리 |
|---|---|
| `local` | 다시 전달하지 않습니다. 핸들러는 한 번만 실행되고 메시지는 재생 이력에만 남습니다 |
| `redis` | 대기 상태로 남습니다. 컨슈머가 `redis.pending-check-interval`마다 `redis.claim-min-idle-time`보다 오래 유휴 상태인 메시지를 가져와 다시 처리합니다 |
| `nats` | 즉시 부정 확인 응답을 보내고 다시 전달합니다. 전달 횟수는 최대 `nats.max-deliver`회이며, 지정하지 않으면 `error.max-retries` + 1회입니다. 컨슈머가 응답하기 전에 중단된 메시지는 `nats.ack-wait`(지정하지 않으면 30초)가 지난 뒤 다시 전달합니다 |
| `kafka` | 확인 응답을 보내지 않으며, Spring Kafka 리스너 컨테이너의 오류 핸들러가 메시지를 여러 번 연속해서 다시 전달합니다 |
| `rabbit` | 확인 응답을 보내지 않습니다. 메시지는 큐에 남아 컨슈머가 다시 연결될 때 다시 전달되며, 데드 레터 큐로 이동하지 않습니다 |

따라서 핸들러는 여러 번 실행되어도 안전해야 합니다. 작업을 멱등하게 구현하거나 `idempotent = true`로 반복된 ID를 건너뛰게 하세요.

## 처리할 수 없는 메시지 분리

읽을 수 없는 페이로드의 메시지는 전달할 때마다 실패해 컨슈머의 처리량을 소모합니다. 이런 메시지를 일시적인 실패와 구분해 데드 레터 채널로 분리하세요.

```yaml
simplix:
  messaging:
    error:
      dead-letter:
        enabled: true
```

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class FeeChargeHandler {

    private final BillingService billing;
    private final PoisonMessageHandler poisonMessageHandler;
    private final DeadLetterStrategy deadLetterStrategy;

    @MessageHandler(channel = "fee-charged", group = "billing", autoAck = false)
    public void onFeeCharged(Message<byte[]> message, MessageAcknowledgment acknowledgment) {
        try {
            billing.record(JsonCodec.deserialize(message.getPayload(), FeeCharged.class));
            acknowledgment.ack();
        } catch (RuntimeException e) {
            if (poisonMessageHandler.isPoisonMessage(e)) {
                // Never processable: park it and move on
                deadLetterStrategy.send(message, e.getMessage());
                acknowledgment.ack();
            } else {
                // May work later: ask for another delivery
                acknowledgment.nack(true);
            }
        }
    }
}
```

- `PoisonMessageHandler.isPoisonMessage(exception)`은 `ProtocolException`, `IOException`, `ClassCastException`, `IllegalArgumentException`에 true를 반환합니다. 주변 환경이 아닌 내용에서 발생한 실패입니다. 판정 기준을 바꾸려면 빈을 직접 선언하세요.
- `DeadLetterStrategy.send(message, reason)`은 메시지를 `<channel>.dlq` 채널로 발행하며 `x-dead-letter-reason`, `x-original-channel`, `x-retry-count`, `x-dead-lettered-at` 헤더를 추가합니다. 이 빈은 `error.dead-letter.enabled: true`일 때만 등록됩니다.
- `PoisonMessageHandler.handle(message, exception, deadLetterStrategy, acknowledgment)`는 예제의 처리 과정을 한 번의 호출로 실행합니다. 전략을 전달하면 메시지를 데드 레터 채널로 보내고, 메시지가 다시 전달되지 않도록 항상 확인 응답을 보냅니다.
- 모듈은 이 기능을 자동으로 호출하지 않습니다. 위 예시처럼 수동으로 확인 응답을 보내는 핸들러에서 사용하는 도구입니다.
- 원인을 해결한 뒤 데드 레터 채널을 전용 핸들러나 재생 기능으로 읽으세요.

## 시도 간 대기

```java
RetryPolicy policy = RetryPolicy.defaults();   // 3 retries, 1 s first, doubling, 30 s at most

policy.backoffFor(0);   // 1 s
policy.backoffFor(1);   // 2 s
policy.backoffFor(2);   // 4 s
```

`RetryPolicy` 빈은 `error.max-retries`와 `error.retry-backoff`로 구성됩니다. 이 빈은 재시도 일정만 계산하며 재시도를 실행하지 않습니다. 다른 서비스를 호출하는 핸들러처럼 애플리케이션 코드에서 호출을 반복하는 위치에 주입해 사용하세요. NATS에서는 위 표와 같이 `error.max-retries`가 메시지 전달 횟수에도 적용됩니다.

## 관련 문서

- [메시지 처리](ko/messaging/handling-messages.md)
- [브로커 선택](ko/messaging/choosing-a-broker.md)
- [메시지 재생과 요청-응답](ko/messaging/replaying-messages-and-request-reply.md)
