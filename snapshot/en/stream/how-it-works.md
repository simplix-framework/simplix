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

## Other public methods

The guides show the methods a task needs. The types they name also have these public methods.

| Type | Method | Does |
|---|---|---|
| `SessionRegistry` | `register(session)`, `unregister(sessionId)` | store a new session and remove one; a registry of your own implements every method of this interface |
| `SessionRegistry` | `findById(sessionId)`, `findByUserId(userId)`, `findAll()`, `countByUserId(userId)` | find one session, the sessions of a user and all sessions, and count the sessions of a user |
| `SessionRegistry`, `BroadcastService` | `isAvailable()`, `initialize()`, `shutdown()` | say whether the part can be used, and prepare and release what it needs |
| `BroadcastService` | `sendToSession(sessionId, message)` | sends a message to one session and says whether it was handed over |
| `ConnectTicketService` | `redeem(ticket)` | exchanges a ticket for the user it was issued to; a ticket can be redeemed once, and an unknown, used or expired one gives an empty `Optional` |
| `AdminCommandService` | `queueCommand(command)`, `queueTerminateSession(sessionId)`, `queueStopScheduler(subscriptionKey)`, `queueTriggerScheduler(subscriptionKey)` | store a command for the instance that holds the target |
| `AdminCommandService` | `getCommand(commandId)`, `getCommandsForTarget(targetId)`, `getPendingCommands()`, `isEnabled()` | read one command, the recent commands of a target and the commands not carried out yet, and say whether commands are stored at all |
| `MessageSender` | `isActive()` | says whether the connection of the sender is still open |
| `SubscriptionKey` | `fromString(keyString)`, `toKeyString()` | read a key from its text form, the resource followed by `:` and the hash of the parameters, and write it in that form |
| `Subscription` | `getIntervalMs()` | returns the interval of the subscription in milliseconds |
| `SessionManager` | `getSession(sessionId)`, `findSession(sessionId)`, `getSessionForUser(sessionId, userId)` | return a session by its id; `findSession` answers with an `Optional`, and `getSessionForUser` also checks that the session belongs to the user |
| `SessionManager` | `getSessionsByUser(userId)`, `getAllSessions()`, `getSessionCount()` | return the sessions of a user, every session and the number of sessions |
| `SessionManager` | `terminateSession(sessionId)` | ends a session at once and returns the subscription keys it held |
| `SessionManager` | `createSession(userId, transportType)`, `markDisconnected(sessionId)`, `restoreSession(sessionId, userId)`, `isRestorationSupported()`, `touch(sessionId)`, `setOnSessionTerminated(callback)` | the calls of the transports: open a session, start the grace period of a lost connection, restore a session that another instance held, and register the callback for ended sessions |
| `StreamSession` | `touch()`, `markDisconnected()`, `markReconnected()`, `markTerminated()`, `addSubscription(key)`, `removeSubscription(key)`, `clearSubscriptions()` | change the state and the subscriptions of the session; the module calls them as the connection changes |
| `StreamSession` | `addMetadata(key, value)`, `getMetadata(key)`, `addTransientMetadata(key, value)`, `getTransientMetadata(key)` | keep values with the session; persistence stores the metadata with the session, and the transient metadata stays in the memory of the instance |
| `StreamMessage` | `subscriptionRemoved(key, reason)`, `sessionTerminated(reason)`, `serialize(objectMapper)` | create the message for a removed subscription and for an ended session, and return the message as JSON |
| `SimpliXStreamDataCollectorRegistry`, `SimpliXStreamEventSourceRegistry` | `register(collector)`, `register(source)` | add a collector or an event source that is not a bean; the beans of these types are registered at start |
| `StreamAuthorizationService` | `registerAuthorizer(authorizer)` | adds a `ResourceAuthorizer` that is not a bean |
| `SubscriptionKey`, `Subscription`, `StreamSession` | `getParamsHash()`, `getRequestedAt()`, `getDisconnectedAt()` | the hash of the parameters of a key, the time a subscription was requested, and the time a session lost its connection |
| `CommandResponse` | `getErrorMessage()` | the reason an admin command failed |
| `SimpliXStreamDataCollectorRegistry` | `getCollector(resource)`, `findCollector(resource)`, `hasCollector(resource)` | return the collector of a resource name, the same as an `Optional`, and whether one is registered |
| `SimpliXStreamDataCollectorRegistry` | `getRegisteredResources()`, `getCollectors()`, `unregister(resource)` | return the registered resource names and collectors, and remove the collector of a resource, returning it or `null` |
| `SimpliXStreamEventSourceRegistry` | `findByResource(resource)`, `findByEventType(eventType)`, `hasEventSource(resource)`, `hasEventSourceForEventType(eventType)` | find the event source of a resource name or of an event type, and say whether one is registered |
| `SimpliXStreamEventSourceRegistry` | `getRegisteredResources()`, `getRegisteredEventTypes()`, `getEventSources()`, `unregister(resource)` | return the registered resource names, event types and event sources, and remove the event source of a resource, returning it or `null` |
| `SubscriptionManager` | `updateSubscriptions(sessionId, subscriptions)`, `clearSubscriptions(sessionId)` | replace the subscription list of a session, returning the `SubscriptionUpdateResult`, and remove every subscription of a session; the subscription endpoint calls the first |
| `SubscriptionManager` | `setOnSubscriptionAdded(callback)`, `setOnSubscriptionRemoved(callback)`, `getActualInterval(key, requested)` | register the callbacks the module uses for added and removed subscriptions, and return the interval a subscription runs at |
| `StreamStatisticsService` | `getStats`, `getSessionStatsByState`, `getTopResources`, `getServerStats`, `getSessions`, `getSessionDetails`, `getSubscriptionsByResource` | return the numbers and lists of the global endpoints of the admin API; inject the service to read them in code |
| `SchedulerManager` | `getScheduler`, `getAllSchedulers`, `getSchedulerCount`, `getLocalSubscribers`, `getLocalSubscriberCount`, `isLeader`, `isDistributedMode` | read the running collections, their subscribers on this instance and the mode |
| `SchedulerManager` | `triggerNow`, `stopScheduler`, `forceStopScheduler` | run a collection at once and stop one; the admin API calls them |
| `SchedulerManager` | `addSubscriber`, `removeSubscriber`, `asSubscriberLookup` | the calls of the module when subscriptions change |
| `SubscriptionScheduler` | `getSubscribers`, `getSubscriberCount`, `hasSubscribers`, `getIntervalMs`, `isActive`, `getExecutionCount`, `getSuccessCount`, `getErrorCount`, `getConsecutiveErrors`, `getLastSuccessAt`, `getLastError` | the subscribers, the interval, the state, the counters, the time of the last success and the last error of a collection, as the admin API reports them |
| `SubscriptionScheduler` | `addSubscriber`, `removeSubscriber`, `recordSuccess`, `recordError`, `setScheduledFuture` | the calls of the module while a collection runs |
| `StreamServerManager` | `getActiveServers`, `getServer`, `getActiveServerCount`, `isRunning` | read the instances registered in the database and whether this manager runs |
| `StreamServerManager` | `registerInstance`, `unregisterInstance`, `updateStats`, `handleDeadServer`, `setOnDeadServerDetected` | the calls of the module at start, at stop, with each heartbeat and when an instance is found dead |

## Related documents

- [Running several instances](en/stream/running-several-instances.md)
- [Configuration reference](en/stream/configuration-reference.md)
- [Troubleshooting](en/stream/troubleshooting.md)
