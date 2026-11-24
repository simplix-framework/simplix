# Managing streams

The admin API: how to see the sessions and the collection that is running, and how to end a session or stop a collection by hand.

> ⚠ `StreamAdminController` is always registered and carries no access rule of its own. Restrict `/api/stream/admin/**` to administrators before the application is reachable: [Securing streams](./securing-streams.md).

## This instance

| Request | Answers |
|---|---|
| `GET /api/stream/admin/stats` | a `StreamStats`: counts, mode and availability |
| `GET /api/stream/admin/sessions` | every session, each a `SessionInfo` |
| `GET /api/stream/admin/sessions/{sessionId}` | one session; 404 when it is unknown |
| `GET /api/stream/admin/sessions/user/{userId}` | the sessions of one user |
| `DELETE /api/stream/admin/sessions/{sessionId}` | 204; the session is ended |
| `GET /api/stream/admin/schedulers` | every running collection, each a `SchedulerInfo` |
| `GET /api/stream/admin/schedulers/{subscriptionKey}` | one collection; 404 when it is unknown |
| `POST /api/stream/admin/schedulers/{subscriptionKey}/trigger` | 204; the collector is called at once |
| `DELETE /api/stream/admin/schedulers/{subscriptionKey}` | 204; the collection stops, and the sessions keep the subscription in their list |

```json
{
  "activeSessions" : 1,
  "activeSchedulers" : 1,
  "totalSubscriptions" : 1,
  "messagesDelivered" : 0,
  "messagesFailed" : 0,
  "mode" : "LOCAL",
  "sessionRegistryAvailable" : true,
  "broadcastServiceAvailable" : true,
  "serverStartedAt" : "2026-11-25T02:12:20.815+09:00",
  "instanceId" : "local",
  "distributedAdminEnabled" : false
}
```

`messagesDelivered` and `messagesFailed` stay 0: no code counts them.

```json
{
  "sessionId" : "21f831ec-2757-4c8b-87a9-aa34798ea927",
  "userId" : "alice",
  "transportType" : { "type" : "TransportType", "value" : "SSE" },
  "state" : { "type" : "SessionState", "value" : "CONNECTED" },
  "connectedAt" : "2026-11-25T02:16:14.808+09:00",
  "lastActiveAt" : "2026-11-25T02:16:14.808+09:00",
  "subscriptions" : [ "shelf-occupancy:99f47ca2", "loan-returns:323666ce" ],
  "subscriptionCount" : 2,
  "instanceId" : "local"
}
```

| Field of `SessionInfo` | Values |
|---|---|
| `transportType` | a `TransportType`: `SSE` or `WEBSOCKET` |
| `state` | a `SessionState`: `CONNECTED`, `DISCONNECTED` while the grace period runs, `TERMINATED` |
| `lastActiveAt` | the time of the connection; it is not moved by later activity |

```json
{
  "subscriptionKey" : "shelf-occupancy:99f47ca2",
  "resource" : "shelf-occupancy",
  "params" : { "branchId" : "b1", "shelfId" : "s1" },
  "state" : { "type" : "SchedulerState", "value" : "RUNNING" },
  "intervalMs" : 1000,
  "subscribers" : [ "21f831ec-2757-4c8b-87a9-aa34798ea927" ],
  "subscriberCount" : 1,
  "createdAt" : "2026-11-25T02:16:18.355+09:00",
  "lastExecutedAt" : "2026-11-25T02:16:23.358+09:00",
  "executionCount" : 5,
  "errorCount" : 0,
  "consecutiveErrors" : 0,
  "instanceId" : "local"
}
```

The `state` of a `SchedulerInfo` is a `SchedulerState`: `CREATED`, `RUNNING`, `ERROR` after `scheduler.max-consecutive-errors` failures in a row, or `STOPPED`. A collection whose `errorCount` rises points at a collector that throws; the message is in the log.

## All instances

`StreamStatisticsService` reads the tables of distributed mode for these endpoints, which answer 404 without `simplix.stream.persistence.enabled`.

| Request | Answers |
|---|---|
| `GET /api/stream/admin/stats/global` | a `GlobalStreamStats`: session and subscription counts, the busiest resources as `ResourceStats`, the instances as `ServerStats` |
| `GET /api/stream/admin/servers` | the instances, each a `ServerStats` whose `status` is a `StreamServerInstanceEntity.Status`: `ACTIVE`, `SUSPECTED` after missed heartbeats, or `DEAD` |
| `GET /api/stream/admin/sessions/global` | the sessions of every instance, each a `SessionSummary`; `?state=` filters |
| `GET /api/stream/admin/sessions/global/{sessionId}` | a `SessionDetails` with the subscriptions of the session |
| `GET /api/stream/admin/subscriptions/resource/{resource}` | the subscriptions to one resource, each a `SubscriptionSummary` |

```json
{
  "connectedSessions" : 1,
  "disconnectedSessions" : 0,
  "totalActiveSessions" : 1,
  "activeSubscriptions" : 0,
  "activeServers" : 1,
  "topResources" : [ ],
  "serverInstances" : [ {
    "instanceId" : "f8ebfbd5",
    "hostname" : "library-1.internal",
    "status" : "ACTIVE",
    "activeSessions" : 0,
    "activeSchedulers" : 0,
    "startedAt" : "2026-11-24T17:19:52.853728Z",
    "lastHeartbeatAt" : "2026-11-24T17:19:53.270606Z"
  } ]
}
```

## Commands

With `simplix.stream.admin.enabled` in distributed mode, the calls that end a session and stop or trigger a collection answer 202 with a `CommandResponse` and are carried out by the instance that holds the target. [Running several instances](./running-several-instances.md) describes the setup and the states.

| Request | Answers |
|---|---|
| `GET /api/stream/admin/commands/{commandId}` | the `CommandResponse` of one command; 404 when it is unknown |
| `GET /api/stream/admin/commands/pending` | the commands that wait to be carried out |

## Related documents

- [Monitoring streams](./monitoring-streams.md)
- [Running several instances](./running-several-instances.md)
- [Securing streams](./securing-streams.md)
