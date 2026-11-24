# Securing streams

Who may connect, who may subscribe to what, how a session is ended when its user loses access, and which limits protect the server.

## Who the user of a session is

The user of a session is the name of the Spring Security authentication of the connect request, or the user a connect ticket was issued for. A connect request with neither opens a session whose user is `null`.

> ⚠ The module does not refuse anonymous sessions: `simplix.stream.security.require-authentication` has no effect, because no code reads it. Refuse them where the application decides access: keep `/api/stream/**` behind authentication, and when the connect path is permitted for tickets, deny a `null` user in every authorizer and set `enforce-authorization`.

## Decide who may subscribe

```java
@Component
public class ShelfOccupancyAuthorizer implements ResourceAuthorizer {

    @Override
    public String getResource() {
        return "shelf-occupancy";
    }

    @Override
    public boolean authorize(String userId, Map<String, Object> params) {
        return userId != null && !"staff-room".equals(params.get("shelfId"));
    }

    @Override
    public String getDenialReason(String userId, Map<String, Object> params) {
        return "Shelf " + params.get("shelfId") + " is not open to " + userId;
    }
}
```

A `ResourceAuthorizer` bean decides for one resource. `StreamAuthorizationService` calls it for every entry of a subscription request, with the user of the session and the parameters of the entry, and reports the outcome as an `AuthorizationResult`.

| Method | Default | Meaning |
|---|---|---|
| `getResource()` | required | the resource this authorizer decides for; one authorizer per resource |
| `authorize(userId, params)` | required | `true` allows the subscription; an exception denies it |
| `getDenialReason(userId, params)` | `Access denied to resource: <resource>` | the `reason` the client reads under `failed` |
| `getRequiredPermission()` | `null` | informational; the service returns it and does not check it |

```json
{
  "success" : true,
  "subscribed" : [ ],
  "failed" : [ {
    "resource" : "shelf-occupancy",
    "params" : { "shelfId" : "staff-room" },
    "reason" : "Shelf staff-room is not open to alice"
  } ],
  "totalCount" : 0
}
```

A resource without an authorizer is open to every session. Turn that around for anything that is not public.

```yaml
simplix:
  stream:
    security:
      enforce-authorization: true
```

With `enforce-authorization`, a subscription to a resource without an authorizer fails with the reason `No authorizer configured for resource: <resource>`.

## End a session whose user lost access

```java
@Component
@RequiredArgsConstructor
public class MemberSessionValidator implements SessionValidator {

    private final MemberStatusLookup memberStatusLookup;

    @Override
    public SessionValidationResult validate(StreamSession session) {
        if (memberStatusLookup.isSuspended(session.getUserId())) {
            return SessionValidationResult.invalid("Member is suspended");
        }
        return SessionValidationResult.ok();
    }
}
```

A stream stays open long after the request that opened it was authenticated. A `SessionValidator` bean is asked before every heartbeat whether the session may go on. When it answers `SessionValidationResult.invalid(reason)`, the client receives `session_terminated` with the reason and the session ends.

```text
id:1795540618684
event:session_terminated
data:{
data:  "type" : {
data:    "type" : "MessageType",
data:    "value" : "SESSION_TERMINATED"
data:  },
data:  "timestamp" : "2026-11-25T02:16:58.684+09:00",
data:  "message" : "Member is suspended"
data:}
```

- Without a bean of your own, every session is valid.
- The check runs on a thread pool of its own and is given `session.validation-timeout`, 5 seconds by default. A check that takes longer skips that heartbeat and does not end the session.
- The access token of the connect request is kept with the session as transient metadata under `bearerToken`, so a validator can check whether it was revoked. It is not stored in a database.

The `StreamSession` a validator receives offers these methods:

| Method | Returns |
|---|---|
| `getId()` | the session id the client received |
| `getUserId()` | the user of the session; an anonymous session has none |
| `getTransportType()` | `TransportType.SSE` or `TransportType.WEBSOCKET` |
| `getConnectedAt()` | the time the session was opened |
| `getState()`, `isConnected()`, `isTerminated()` | the `SessionState`: `CONNECTED`, `DISCONNECTED` or `TERMINATED` |
| `getSubscriptions()`, `getSubscriptionCount()`, `hasSubscription(key)` | the `SubscriptionKey` values the session holds, their number, and whether one of them is held |

## Limits

| Property | Default | Meaning |
|---|---|---|
| `simplix.stream.session.max-per-user` | `5` | sessions one user may hold; a further connection ends the oldest session of that user. All anonymous sessions count as one user |
| `simplix.stream.subscription.max-per-session` | `20` | subscriptions one session may hold |
| `simplix.stream.scheduler.max-total-schedulers` | `500` | distinct subscription keys collected at once |
| `simplix.stream.send.queue-capacity` | `256` | messages that may wait for one client before its session is closed |

## The admin API

The endpoints under `/api/stream/admin` list and end the sessions of every user, and the module puts no access rule on them. Restrict the path to administrators in the security configuration of the application, as [simplix-auth](../../../simplix-auth/README.md) describes. [Managing streams](./managing-streams.md) lists the endpoints.

## Related documents

- [Connecting clients](./connecting-clients.md)
- [Managing streams](./managing-streams.md)
- [Troubleshooting](./troubleshooting.md)
