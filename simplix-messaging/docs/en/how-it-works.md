# How simplix-messaging works

The classes between a publish and a handler, how the broker is chosen, and what the module registers.

## From a publish to a handler

1. `MessagePublisher`, implemented by `DefaultMessagePublisher`, turns the payload into bytes, adds the message id and the timestamp to the headers, and calls `BrokerStrategy.send`.
2. The `BrokerStrategy` of the configured broker stores the message in the channel.
3. At start, `MessageHandlerRegistrar` finds every `@MessageHandler` method and checks its shape. When the application is ready, after `subscriber-startup-delay`, it subscribes each one with a `SubscribeRequest` and keeps the returned `Subscription`.
4. The broker hands a message to a `MessageListener`. The registrar asks the `IdempotencyStore` first when the handler is idempotent, converts the payload to the type of the parameter, and calls the method.
5. When the method returns and `autoAck` is on, the registrar acknowledges through the `MessageAcknowledgment` of the broker. When the method throws, nothing is acknowledged.

## How the broker is chosen

| `broker` | Configuration | Strategy | Also registers |
|---|---|---|---|
| `local` or not set | in `MessagingAutoConfiguration` | `LocalBrokerStrategy` | `LocalReplayService`, `LocalIdempotencyStore`, and `LocalMessageScheduler` when its flag is on |
| `nats` | `NatsMessagingConfiguration` | `NatsBrokerStrategy` | the connection built by `NatsOptionsBuilder` with `NatsLoggingConnectionListener` and `NatsLoggingErrorListener`, `NatsJetStreamPublisher`, `NatsJetStreamPullSubscriber`, `NatsConsumerGroupManager`, `NatsJetStreamReplayService`, `NatsNativeIdempotencyStore`, and `NatsScheduledMessagePublisher` with `NatsLeaderElection` when its flag is on |
| `redis` | `RedisMessagingConfiguration` | `RedisBrokerStrategy` | `RedisStreamPublisher`, `RedisStreamSubscriber`, `RedisConsumerGroupManager`, `RedisStreamReplayService`, `RedisIdempotencyStore`, and `RedisScheduledMessagePublisher` when its flag is on |
| `kafka` | `KafkaMessagingConfiguration` | `KafkaBrokerStrategy` | nothing further |
| `rabbit` | `RabbitMessagingConfiguration` | `RabbitBrokerStrategy` | nothing further |

Each configuration is active only for its broker value and with its client library on the classpath. `MessagingAutoConfiguration` binds `simplix.messaging` to `MessagingProperties` and registers the parts every broker shares: the publisher, the registrar, the `RetryPolicy`, the `PoisonMessageHandler`, the `DeadLetterStrategy` when it is enabled, and the metrics and the health indicator when their libraries are present.

## Helpers inside the brokers

| Class | Role |
|---|---|
| `SubscriptionHealthTracker` | records whether the consumers of a channel are alive, for the health indicator |
| `InFlightTracker` | counts the NATS messages a consumer is working on, so a shutdown can wait for them |
| `NatsMessageAcknowledgment`, `NatsSubscription` | the acknowledgment and the subscription of the NATS broker |
| `LocalBrokerStrategy.PublishedMessage` | a message the local broker keeps for replays and for assertions in tests, through `getPublishedMessages(channel)` |
| `StreamReplayService`, `ScheduledMessagePublisher`, `IdempotentGuard` | earlier Redis-only classes, kept for existing code; use `ReplayService`, `MessageScheduler` and `IdempotencyStore` |

## A broker of your own

Declare a bean that implements `BrokerStrategy` to carry messages over something else. It sends bytes with headers to a channel, subscribes a listener for a group, acknowledges, and reports its `BrokerCapabilities` honestly: code that depends on a capability asks for it.

| Method of `BrokerStrategy` | Does |
|---|---|
| `send(channel, payload, headers)` | stores the bytes in the channel and returns a `PublishResult` |
| `ensureConsumerGroup(channel, groupName)` | creates the group of a channel when the broker has groups |
| `subscribe(request)` | starts delivering the channel to the listener of a `SubscribeRequest` and returns the `Subscription` |
| `acknowledge(channel, groupName, messageId)` | marks a message as processed |
| `capabilities()`, `name()`, `isReady()` | describe the broker for callers, the log and the health indicator |
| `initialize()`, `shutdown()` | open and close connections |

## Related documents

- [Choosing a broker](./choosing-a-broker.md)
- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
