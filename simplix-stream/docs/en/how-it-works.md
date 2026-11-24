# How simplix-stream works

The parts between a subscription and a message on the wire, what the module registers, and which parts an application can replace.

## From a subscription to a message

1. A client connects. `SessionManager` creates a `StreamSession` and puts it into the `SessionRegistry`; the transport wraps the connection in a `MessageSender` (`SseStreamSession` or `WebSocketStreamSession`) and registers it with the broadcaster.
2. The client sends its subscriptions. Each entry becomes a `Subscription` with a `SubscriptionKey`; the transport asks the collector registry or the event source registry whether the resource exists, and `StreamAuthorizationService` whether the user may subscribe.
3. `SubscriptionManager` compares the list with the current one and applies the `SubscriptionDiff`.
4. For a collector resource, `SchedulerManager` adds the session to the `SubscriptionScheduler` of the key, or creates one. A scheduler runs the collector at its interval for all its subscribers and stops when the last one leaves.
5. For an event resource, `EventStreamHandler` records the session in the `EventSubscriberRegistry` and waits for events.
6. Collected data and events become a `StreamMessage`. The `BroadcastService` hands it to the `MessageSender` of each subscribed session, which queues it and writes it to the connection on a writer thread.

## What the module registers

`SimpliXStreamAutoConfiguration` binds `simplix.stream` to `StreamProperties` and is active unless `simplix.stream.enabled` is `false`.

| Configuration | Active | Registers |
|---|---|---|
| `SimpliXStreamCoreConfiguration` | always | `SessionManager`, `SubscriptionManager`, `SchedulerManager`, the thread pools, and in local mode `LocalSessionRegistry` and `LocalBroadcaster` |
| `SimpliXStreamSecurityConfiguration` | always | `StreamAuthorizationService`, `ConnectTicketService`, a `SessionValidator` that accepts every session |
| `SimpliXStreamSseConfiguration` | in a servlet web application | the asynchronous request timeout, set to `session.timeout`; `SseStreamController` itself is found by component scanning |
| `SimpliXStreamWebSocketConfiguration` | `websocket.enabled` and Spring WebSocket on the classpath | the STOMP endpoint and `WebSocketStreamHandler` |
| `SimpliXStreamEventSourceConfiguration` | `event-source.enabled` | `SimpliXStreamEventSourceRegistry`, `EventSubscriberRegistry`, `EventStreamHandler` |
| `SimpliXStreamPersistenceConfiguration` | `persistence.enabled` and JPA | `DbSessionRegistry`, `StreamServerManager`, `StreamStatisticsService` and the repositories |
| `SimpliXStreamDistributedConfiguration` | `mode: distributed` | the instance id, and the broadcaster and leader election of the configured broker |
| `SimpliXStreamAdminConfiguration` | always | `StreamAdminController`, `StreamHealthIndicator`, `StreamMetrics`, and with `admin.enabled` the command service and processor |

## Parts an application can replace

| Declare a bean of | To |
|---|---|
| `SessionValidator` | decide before each heartbeat whether a session goes on |
| `ResourceAuthorizer`, one per resource | decide who may subscribe |
| `SessionRegistry` | keep sessions somewhere else |
| `BroadcastService` | deliver messages in another way |
| `ConnectTicketService` | issue tickets from a store several instances share; the built-in one keeps them in the memory of one instance |
| `AdminCommandService` | store admin commands in another way |

> ℹ A ticket is redeemed by the instance that issued it. Behind a load balancer the ticket request and the connect request have to reach the same instance, which sticky sessions provide.

The module registers the beans below only when the application has no bean of the same name, so a bean you declare with that name takes its place.

| Bean name | Type | What the module registers |
|---|---|---|
| `streamScheduledExecutor` | `ScheduledExecutorService` | a pool of `scheduler.thread-pool-size` threads named `stream-scheduler` |
| `streamSendExecutor` | `ExecutorService` | the writer pool of `send.writer-threads` threads |
| `sessionValidationExecutor` | `ExecutorService` | a cached pool of threads named `session-validator` |
| `streamInstanceId` | `String` | the value of `simplix.stream.instance-id`, or a generated UUID; registered in distributed mode |
| `persistenceInstanceId` | `String` | the value of `simplix.stream.server.instance-id`, or the first eight characters of a generated UUID; registered with persistence |
| `streamHealthIndicator` | `HealthIndicator` | `StreamHealthIndicator`, the source of `/actuator/health/stream` |

## Threads

| Pool | Size | Runs |
|---|---|---|
| scheduler | `scheduler.thread-pool-size`, 10 | collectors, heartbeats, grace period timers |
| writers, named `sse-writer-N` | `send.writer-threads`; 0 means the number of processors, at least 4 | the writing of queued messages to connections, so that one slow client does not hold up the others |
| session validation | grows as needed | the `SessionValidator`, bounded by `session.validation-timeout` |

## Errors of the endpoints

The exceptions of the module extend `StreamException`, a `SimpliXGeneralException`, so the starter answers them in its error format.

| Exception | Error code |
|---|---|
| `SessionNotFoundException`, `ResourceNotFoundException` | `GEN_NOT_FOUND` |
| `SessionExpiredException` | `AUTH_SESSION_EXPIRED` |
| `AuthorizationDeniedException`, with a `DenialDetail` | `AUTHZ_ACCESS_DENIED` |
| `SubscriptionLimitExceededException`, with a `SubscriptionLimitExceededException.LimitDetail` | `BIZ_QUOTA_EXCEEDED` |
| `SchedulerException`, `BroadcastException` | `GEN_INTERNAL_SERVER_ERROR` |

## Related documents

- [Running several instances](./running-several-instances.md)
- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
