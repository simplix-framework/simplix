# Troubleshooting simplix-stream

Symptoms an application meets with streams, the cause of each and what to change.

## Connecting

| Symptom | Cause | What to do |
|---|---|---|
| `GET /api/stream/connect?ticket=...` answers 401 `AUTH_AUTHENTICATION_REQUIRED` | the security configuration refuses the request before the ticket is read | add `/api/stream/connect` to `simplix.auth.security.permit-all-patterns` |
| A session has no user although the request carried a token | the connect path is permitted, and a permitted path does not evaluate the token | connect with a ticket, or do not permit the path and connect with the header |
| A connection with a ticket opens an anonymous session | the ticket was used before, or is older than `security.connect-ticket-validity` | ask for a new ticket for every connection |
| Every connection ends after five minutes | `session.timeout` ends a connection, whether or not data flows | let the client connect again, or raise `session.timeout` |
| An `EventSource` that reconnected receives no data | the browser retried the URL with the used ticket and opened a new session without subscriptions | close the `EventSource` on an error, connect with a new ticket and subscribe again |
| An older tab of the same user stops receiving | the user reached `session.max-per-user`, and the oldest session was ended | raise the limit, or share one connection among the tabs |
| A call on a session answers 404 `Stream session not found` | the session ended, or the call reached another instance | connect again; behind a load balancer use sticky sessions |
| A call on a session answers 401 for an authenticated user | the session belongs to another user, or is anonymous | call with the user that connected |

## Subscribing and data

| Symptom | Cause | What to do |
|---|---|---|
| `failed` lists `Resource not found` | no collector and no event source has that resource name; event sources also need `event-source.enabled` | compare the name with `getResource()`, check that the class is a Spring bean, and enable event sources |
| `failed` lists `No authorizer configured for resource` | `security.enforce-authorization` is on and the resource has no `ResourceAuthorizer` | declare an authorizer for the resource |
| A subscription with wrong parameters is accepted | `validateParams` of a collector is never called | check the parameters in the `ResourceAuthorizer` of the resource |
| A second subscribe call removed the first subscription | a call states the whole list | send every subscription the session should have |
| The collector receives a parameter `ticket`, or parameters the subscription did not send | the query parameters of the connect request are added to every subscription | ignore them in the collector, and send per-subscription values in `params` |
| An event of the application never reaches the stream | it was published with `EventManager`, or its type differs from `getEventType()` | publish an `Event` with the `ApplicationEventPublisher`, and compare the types |
| A subscriber receives events of other parameters | no session subscribed with exactly the parameters of the event, so every subscriber of the resource received it | separate audiences by resource name and by authorizer |
| Clients receive `error` messages with `SCHEDULER_ERROR` | the collector throws | read the exception in the log; the collector is called again at the next interval |
| A new subscription key receives no data, and the log says `Maximum scheduler limit reached` | `scheduler.max-total-schedulers` keys are collected already | raise the limit, or share keys by subscribing with the same parameters |

## Starting

| Symptom | Cause | What to do |
|---|---|---|
| The application does not start: a bean of type `SessionRegistry` could not be found | `mode: distributed` without a session registry | set `simplix.stream.persistence.enabled: true` |
| The application does not start: `Not a managed type: class ...StreamSessionEntity` | the entities of the module are not scanned | name `dev.simplecore.simplix.stream.persistence.entity` in `@EntityScan`, together with the package of the application |
| The application does not start with `distributed.broker: REDIS`: a bean of type `BroadcastService` could not be found, or a dependency cycle | the broker configuration cannot be wired | use `distributed.broker: NONE` |
| `distributedAdminEnabled` is `false` although `admin.enabled` is set | the repository of the commands is not registered | name `dev.simplecore.simplix.stream.admin.command` in `@EnableJpaRepositories` and in `@EntityScan` |
| A WebSocket handshake to `/ws/stream` fails with a redirect | the path is behind the web login | permit `/ws/stream` and `/ws/stream/**`, or log the user in first |

## Related documents

- [How simplix-stream works](./how-it-works.md)
- [Connecting clients](./connecting-clients.md)
- [Running several instances](./running-several-instances.md)
