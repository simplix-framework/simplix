# Handling failures

What happens to a message whose handler throws, how each broker delivers it again, and how to set aside a message that can never be processed.

## When a handler throws

The exception is logged with the name of the handler, and the message is not acknowledged. What follows is decided by the broker.

| Broker | A message that was not acknowledged |
|---|---|
| `local` | is not delivered again: the handler ran once and the message stays only in the replay history |
| `redis` | stays pending; every `redis.pending-check-interval` the consumers claim messages that were idle longer than `redis.claim-min-idle-time` and process them again |
| `nats` | is negatively acknowledged at once and delivered again, at most `nats.max-deliver` times; without that setting, `error.max-retries` + 1 times. A message whose consumer stopped before it answered is delivered again after `nats.ack-wait`, 30 seconds unless set |
| `kafka`, `rabbit` | is not acknowledged; the listener container of Spring Kafka or Spring AMQP runs in manual acknowledgment mode, and its behaviour decides the redelivery |

A handler therefore has to be safe to run twice. Make the work idempotent, or let the module skip repeated ids with `idempotent = true`.

## Set a broken message aside

A message with a payload nobody can read fails on every delivery and keeps the consumers busy. Tell such a message apart from a temporary failure and park it in a dead letter channel.

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

- `PoisonMessageHandler.isPoisonMessage(exception)` answers true for a `ProtocolException`, an `IOException`, a `ClassCastException` and an `IllegalArgumentException`: failures of the content, not of the surroundings. Declare a bean of your own to judge differently.
- `DeadLetterStrategy.send(message, reason)` publishes the message to the channel `<channel>.dlq`, with the headers `x-dead-letter-reason`, `x-original-channel`, `x-retry-count` and `x-dead-lettered-at`. The bean exists only with `error.dead-letter.enabled: true`.
- `PoisonMessageHandler.handle(message, exception, deadLetterStrategy, acknowledgment)` does both steps of the example in one call: it sends the message to the dead letter channel when a strategy is passed, and acknowledges it in every case, so that the message is not delivered again.
- The module does not call either by itself. They are tools for a handler that acknowledges by hand, as above.
- Read the dead letter channel with a handler of its own, or with a replay, once the cause is fixed.

## Wait between attempts

```java
RetryPolicy policy = RetryPolicy.defaults();   // 3 retries, 1 s first, doubling, 30 s at most

policy.backoffFor(0);   // 1 s
policy.backoffFor(1);   // 2 s
policy.backoffFor(2);   // 4 s
```

A `RetryPolicy` bean is built from `error.max-retries` and `error.retry-backoff`. It describes a schedule and does not retry anything: inject it where your own code repeats a call, for example a handler that calls another service. On NATS, `error.max-retries` also sets how often a message is delivered, as the table above says.

## Related documents

- [Handling messages](./handling-messages.md)
- [Choosing a broker](./choosing-a-broker.md)
- [Replaying messages and request-reply](./replaying-messages-and-request-reply.md)
