# Handling messages

How to write a handler, when a message counts as processed, how duplicates are skipped and how work is shared between instances.

## Write a handler

```java
@Component
@Slf4j
public class LoanEventHandlers {

    private final List<String> received = new CopyOnWriteArrayList<>();

    // The payload arrives as text; the handler decodes the JSON itself
    @MessageHandler(channel = "loan-opened", group = "notifier")
    public void onLoanOpened(Message<String> message) {
        LoanOpened event = JsonCodec.deserialize(message.getPayload().getBytes(StandardCharsets.UTF_8), LoanOpened.class);
        received.add("opened:" + event.loanId());
    }

    // The handler decides when the message counts as processed
    @MessageHandler(channel = "loan-returned", group = "ledger", autoAck = false)
    public void onLoanReturned(Message<String> message, MessageAcknowledgment acknowledgment) {
        received.add("returned:" + message.getPayload());
        acknowledgment.ack();
    }

    // A message id that was seen before is skipped
    @MessageHandler(channel = "fee-charged", group = "billing", idempotent = true)
    public void onFeeCharged(Message<String> message) {
        received.add("fee:" + message.getPayload());
    }

    public List<String> received() {
        return received;
    }
}
```

A handler is a method of a Spring bean. Its first parameter is a `Message<T>`, and a second parameter, when there is one, is a `MessageAcknowledgment`. A method with another shape stops the start of the application with a message that names it.

| `T` of the parameter | The payload arrives as |
|---|---|
| `byte[]` | the bytes |
| `String` | the bytes read as UTF-8 |
| a Wire protobuf class | the decoded message |
| any other type | the bytes; decode them in the method, for example with `JsonCodec.deserialize` |

| Attribute of `@MessageHandler` | Default | Meaning |
|---|---|---|
| `channel` | required | the channel to read |
| `group` | empty | the consumer group; handlers of one group share the messages |
| `concurrency` | `1` | how many consumers this instance runs for the handler |
| `autoAck` | `true` | acknowledges when the method returns without an exception |
| `idempotent` | `false` | skips a message whose id this group has processed before |

## Groups

| Setup | Who gets a message |
|---|---|
| two handlers with different groups | both, each once |
| one handler, three instances of the application | one of the three |
| `concurrency = 4` | one of the four consumers of an instance; messages are then processed in parallel and no longer strictly in order |

Give each purpose its own group name, such as `notifier` and `ledger`, and keep the name stable: a broker remembers per group which messages were processed. RabbitMQ has no consumer groups; see [Choosing a broker](en/messaging/choosing-a-broker.md).

## Acknowledge by hand

```java
@Component
@RequiredArgsConstructor
public class FeeHandlers {

    private final BillingService billing;

    // The method decides when the message counts as processed
    @MessageHandler(channel = "fee-charged", group = "billing", autoAck = false)
    public void onFeeCharged(Message<byte[]> message, MessageAcknowledgment acknowledgment) {
        FeeCharged event = JsonCodec.deserialize(message.getPayload(), FeeCharged.class);
        if (billing.record(event)) {
            acknowledgment.ack();
        } else {
            acknowledgment.nack(true);
        }
    }
}
```

| Call | Tells the broker |
|---|---|
| `ack()` | the message is processed |
| `nack(true)` | not processed; deliver it again |
| `nack(false)` | not processed; do not deliver it again |
| `reject(reason)` | the message cannot be processed at all |

Use `autoAck = false` when the work is finished somewhere else than at the end of the method, for example after an asynchronous call returned.

## Skip duplicates

A broker delivers a message at least once: after a timeout or a restart the same message can arrive again. With `idempotent = true` the module remembers the message ids of a group and acknowledges a repeated one without calling the method. Three messages published with the id `fee-1` reach the handler once.

| Property | Default | Meaning |
|---|---|---|
| `simplix.messaging.idempotent.ttl` | 24 hours | how long a message id is remembered |

The ids are kept in an `IdempotencyStore`: in memory with the local broker, in Redis with the Redis broker, and in NATS with the NATS broker. Publish with a `messageId` taken from the business event, such as the id of the fee, so that a publisher that sends twice produces the same id.

## Start consuming later

```yaml
simplix:
  messaging:
    subscriber-startup-delay: 10s
```

Handlers start after the application is ready. With a delay they wait that long first, which gives clients that reconnect after a restart, such as browsers on a stream, time to come back before the first message is pushed to them.

## Related documents

- [Handling failures](en/messaging/handling-failures.md)
- [Publishing messages](en/messaging/publishing-messages.md)
