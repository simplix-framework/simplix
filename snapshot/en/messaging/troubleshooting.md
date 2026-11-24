# Troubleshooting simplix-messaging

Symptoms an application meets when it publishes and handles messages, the cause of each and what to change.

## Publishing and handling

| Symptom | Cause | What to do |
|---|---|---|
| `IllegalArgumentException: Unsupported payload type` on publish | the payload is an object; only `byte[]`, `String` and Wire protobuf messages are sent | serialise it first: `Message.ofBytes(channel, JsonCodec.serialize(object))` |
| The application does not start: `@MessageHandler method's first parameter must be Message<T>` | the handler takes the payload type directly | take `Message<T>`, and optionally a `MessageAcknowledgment` second |
| A handler never runs | the class is not a Spring bean, the channel name differs from the one published to, or the broker of the publisher is another one | check the bean, compare the channel names, and read `/actuator/health/messaging` on both sides |
| A message is processed twice | brokers deliver at least once: after a timeout, a restart or a claim the message arrives again | make the handler idempotent, or set `idempotent = true` and publish with a stable `messageId` |
| The log says `Idempotency store is not configured but idempotent=true` | the broker in use registers no `IdempotencyStore`, as Kafka and RabbitMQ | declare an `IdempotencyStore` bean, or make the work idempotent |
| A handler that throws is never called again with the local broker | the local broker does not deliver again | test redelivery against a real broker |
| A failing message is delivered for ever | nothing tells a broken message from a temporary failure | acknowledge by hand and park broken messages with `DeadLetterStrategy`; NATS gives a message up after `nats.max-deliver` deliveries |
| No `DeadLetterStrategy` bean can be injected | `error.dead-letter.enabled` is `false` | set it to `true` |
| Messages are published although the transaction rolled back | the publish ran inside the transaction | publish from a listener that runs after the commit |

## Brokers

| Symptom | Cause | What to do |
|---|---|---|
| With NATS a channel fails with `Stream <name> is not provisioned`, or a stream cannot be created | `auto-create-streams` is `false` and the stream does not exist, or the user may not create streams | create the stream beforehand, or allow the user to create it |
| With NATS the application fails at start in the scheduler | `nats.scheduler.enabled` is `true` and the user has no key-value rights | switch the scheduler off, or grant the rights |
| With Redis a slow message is processed by two consumers | `claim-min-idle-time` is shorter than the handler runs | raise it well above the longest run |
| With Kafka messages of one record arrive out of order | order holds inside a partition only | set the `x-partition-key` header to the id of the record |
| A replay returns nothing | the messages are older than the retention of the channel, or the broker has no replay | check `max-age` or `max-length`, and `capabilities().replay()` |
| The health endpoint reports `DOWN` for messaging | the broker is not ready: the server cannot be reached, or the credentials are refused | check the address and the credentials; the log of the connection names the reason |

## Related documents

- [How simplix-messaging works](en/messaging/how-it-works.md)
- [Handling failures](en/messaging/handling-failures.md)
