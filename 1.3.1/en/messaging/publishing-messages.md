# Publishing messages

How to build a message, what its payload may be, which headers travel with it, and what a publish returns.

## Build a message

```java
// Bytes, for example JSON
Message<byte[]> json = Message.ofBytes("loan-opened", JsonCodec.serialize(new LoanOpened("l-42", "m-7")));

// Text
Message<String> text = Message.<String>builder()
    .channel("loan-returned")
    .payload("l-42")
    .build();

// With headers and an id of your own
Message<String> traced = Message.<String>builder()
    .channel("loan-returned")
    .messageId("return-l-42")
    .payload("l-42")
    .headers(MessageHeaders.empty()
        .with(MessageHeaders.CORRELATION_ID, "req-1")
        .with(MessageHeaders.SOURCE, "desk"))
    .build();

PublishResult result = messagePublisher.publish(traced);
```

| Part of `Message<T>` | Default | Meaning |
|---|---|---|
| `channel` | required | where the message goes |
| `payload` | none | the content: `byte[]`, `String`, or a Wire protobuf message through `Message.ofProtobuf` |
| `messageId` | a generated UUID | the identity of the message, which brokers and handlers use to drop duplicates |
| `headers` | empty | a `MessageHeaders`: text values that travel with the payload |
| `timestamp` | now | when the message was created |

> ⚠ An object is not turned into JSON for you. Publishing a `Message<LoanOpened>` fails with `IllegalArgumentException: Unsupported payload type`. Serialise it first, with `JsonCodec.serialize` or your own `ObjectMapper`.

## JSON

```java
byte[] bytes = JsonCodec.serialize(new LoanOpened("l-42", "m-7"));
LoanOpened event = JsonCodec.deserialize(bytes, LoanOpened.class);
```

`JsonCodec` writes and reads JSON with a mapper that knows the `java.time` types. `new JsonCodec(objectMapper)` uses a mapper of your own through `encode` and `decode`, and a failure is a `JsonCodec.JsonCodecException`.

## Headers

| Constant of `MessageHeaders` | Header | Set by |
|---|---|---|
| `MESSAGE_ID` | `x-message-id` | the publisher, from the id of the message |
| `TIMESTAMP` | `x-timestamp` | the publisher, from the time of the message |
| `CORRELATION_ID` | `x-correlation-id` | you, to tie messages of one business event together; the request-reply template uses it too |
| `SOURCE` | `x-source` | you, to say which component sent it |
| `CONTENT_TYPE` | `x-content-type` | you, when the payload is not what the channel usually carries |
| `PARTITION_KEY` | `x-partition-key` | you, to keep the messages of one key in order on a partitioned broker |
| `REPLY_CHANNEL` | `x-reply-channel` | the request-reply template |
| `RETRY_COUNT`, `DEAD_LETTER_REASON`, `ORIGINAL_CHANNEL`, `DEAD_LETTERED_AT` | `x-retry-count`, `x-dead-letter-reason`, `x-original-channel`, `x-dead-lettered-at` | the dead letter strategy |

`MessageHeaders` is immutable: `with(key, value)` returns a new instance. `get(key)` reads a header, and `correlationId()`, `contentType()`, `source()`, `replyChannel()` and `retryCount()` read the common ones.

## The result

| Field of `PublishResult` | Holds |
|---|---|
| `recordId` | the id the broker gave the stored message |
| `channel` | the channel |
| `timestamp` | when the broker took it |
| `duplicate` | `true` when the broker recognised the message id and dropped the message |

`publish` returns when the broker has the message, not when a handler ran. A channel nobody subscribes to takes the message all the same. `publishAsync` returns a `CompletableFuture` and sends on another thread; `isAvailable()` tells whether the broker is ready.

## Publish with the data change

A message published inside a transaction leaves even when the transaction rolls back. Publish after the commit, so that no handler acts on a loan that was never stored.

```java
@Component
@RequiredArgsConstructor
public class LoanMessages {

    private final MessagePublisher messagePublisher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(LoanOpenedEvent event) {
        messagePublisher.publish(Message.ofBytes("loan-opened", JsonCodec.serialize(event.payload())));
    }
}
```

## Related documents

- [Handling messages](en/messaging/handling-messages.md)
- [Replaying messages and request-reply](en/messaging/replaying-messages-and-request-reply.md)
