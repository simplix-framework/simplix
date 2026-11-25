# Replaying messages and request-reply

How to read messages again that a channel still holds, how to ask a question over a channel and wait for the answer, and what became of delayed delivery.

## Replay

```java
@Service
@RequiredArgsConstructor
public class LoanHistoryRebuilder {

    private final ReplayService replayService;

    public long rebuildSince(Instant from) {
        return replayService.replay("loan-returned", from, Instant.now(),
            (message, acknowledgment) -> apply(new String(message.getPayload(), StandardCharsets.UTF_8)));
    }
}
```

A replay reads the stored messages of a channel and hands each to a listener, without touching the consumer groups: the handlers of the channel see nothing of it. Use it to rebuild a projection, to fill a new consumer with history, or to process a dead letter channel after a fix.

| Method of `ReplayService` | Reads |
|---|---|
| `replay(channel, from, to, listener)` with two `Instant` values | the messages stored between two moments |
| `replay(channel, fromId, toId, listener)` | the messages between two record ids of the broker; with the local and the Redis broker `"0"` means the beginning and `"+"` the end |
| `replayPaginated(channel, fromId, toId, listener, pageSize)` | the same range, at most `pageSize` messages at a time |

Each returns the number of messages it replayed. A `ReplayService` bean is registered with the local, the Redis and the NATS broker. How far back a replay reaches is the retention of the channel: `max-age` on NATS, the stream length on Redis.

## Request and reply

```java
@Configuration
public class StockQueryConfig {

    @Bean(destroyMethod = "shutdown")
    public RequestReplyTemplate stockRequests(BrokerStrategy brokerStrategy) {
        return new RequestReplyTemplate(brokerStrategy, "stock-replies", "desk");
    }
}
```

```java
Message<byte[]> request = Message.ofBytes("stock-query", "isbn-978-1".getBytes(StandardCharsets.UTF_8));

Message<byte[]> reply = stockRequests.sendAndReceive(request, Duration.ofSeconds(3)).get();
String count = new String(reply.getPayload(), StandardCharsets.UTF_8);
```

```java
@Component
@RequiredArgsConstructor
public class StockQueryHandler {

    private final MessagePublisher messagePublisher;
    private final StockCounter stockCounter;

    @MessageHandler(channel = "stock-query", group = "stock")
    public void onStockQuery(Message<String> message) {
        MessageHeaders replyHeaders = MessageHeaders.empty()
            .with(MessageHeaders.CORRELATION_ID, message.getHeaders().correlationId());

        messagePublisher.publish(Message.<String>builder()
            .channel(message.getHeaders().replyChannel())
            .payload(String.valueOf(stockCounter.count(message.getPayload())))
            .headers(replyHeaders)
            .build());
    }
}
```

1. `sendAndReceive` adds a correlation id and the reply channel to the headers of the request and publishes it.
2. The answering handler reads `replyChannel()` and publishes the answer there, with the same correlation id.
3. The template, which listens on the reply channel, completes the future of the request that carries that id.
4. A request without an answer within the timeout completes the future with a `TimeoutException`, which `get()` reports as the cause of an `ExecutionException`.

Create one `RequestReplyTemplate` per reply channel and keep it for the life of the application; `shutdown()` ends its subscription. Use a request over a broker for a question another service answers within seconds. For a call that has to answer at once, an HTTP call is simpler.

> ⚠ On NATS the template needs the stream of the reply channel to exist before the first request. Without it the request fails with `Failed to add/update consumer for stream <stream>` (`stream not found`). Create the stream `<stream-prefix><reply channel>` on the subject `<subject-prefix><reply channel>` beforehand. On the local and the Redis broker nothing has to be prepared.

## Delayed delivery

`MessageScheduler` publishes a message after a delay: `publishDelayed(message, delay)` returns an id, and `cancel(id)` withdraws it. The interface and its implementations are deprecated and will be removed in a future major release. They are registered only with `simplix.messaging.local.scheduler.enabled`, `simplix.messaging.redis.scheduler.enabled` or `simplix.messaging.nats.scheduler.enabled` set to `true`.

For new code, keep the time a message is due in a database column and publish it from a `@Scheduled` method with a lock, as [simplix-scheduler](en/scheduler/readme.md) describes, or use a scheduling engine.

## Related documents

- [Handling failures](en/messaging/handling-failures.md)
- [Choosing a broker](en/messaging/choosing-a-broker.md)
