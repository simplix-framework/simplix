# 스트림 관리

관리 API를 설명합니다. 세션과 실행 중인 수집을 조회하고, 세션 종료와 수집 중지를 수동으로 실행하는 방법을 다룹니다.

> ⚠ `StreamAdminController`는 항상 등록되며 자체 접근 규칙이 없습니다. 애플리케이션을 외부에 공개하기 전에 `/api/stream/admin/**`을 관리자만 접근하도록 제한하세요. [스트림 보안](ko/stream/securing-streams.md)에서 설명합니다.

## 현재 인스턴스

| 요청 | 응답 |
|---|---|
| `GET /api/stream/admin/stats` | `StreamStats`: 건수, 모드, 가용 상태 |
| `GET /api/stream/admin/sessions` | 모든 세션(`SessionInfo`) |
| `GET /api/stream/admin/sessions/{sessionId}` | 세션 하나. 없으면 404 |
| `GET /api/stream/admin/sessions/user/{userId}` | 사용자 한 명의 세션 |
| `DELETE /api/stream/admin/sessions/{sessionId}` | 204. 세션을 종료합니다 |
| `GET /api/stream/admin/schedulers` | 실행 중인 모든 수집(`SchedulerInfo`) |
| `GET /api/stream/admin/schedulers/{subscriptionKey}` | 수집 하나. 없으면 404 |
| `POST /api/stream/admin/schedulers/{subscriptionKey}/trigger` | 204. 수집기를 즉시 호출합니다 |
| `DELETE /api/stream/admin/schedulers/{subscriptionKey}` | 204. 수집을 중지합니다. 세션의 구독 목록에는 해당 구독이 남습니다 |

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

`messagesDelivered`와 `messagesFailed`는 0으로 유지됩니다. 이 값을 집계하는 코드가 없습니다.

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

| `SessionInfo`의 필드 | 값 |
|---|---|
| `transportType` | `TransportType`: `SSE` 또는 `WEBSOCKET` |
| `state` | `SessionState`: `CONNECTED`, 유예 시간 중인 `DISCONNECTED`, `TERMINATED` |
| `lastActiveAt` | 연결 시각. 이후의 활동으로 갱신되지 않습니다 |

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

`SchedulerInfo`의 `state`는 `SchedulerState`입니다. `CREATED`, `RUNNING`, `scheduler.max-consecutive-errors`회 연속 실패한 뒤의 `ERROR`, `STOPPED` 중 하나입니다. `errorCount`가 증가하는 수집은 수집기에서 예외가 발생하고 있다는 뜻이며, 예외 메시지는 로그에 기록됩니다.

## 전체 인스턴스

아래 엔드포인트는 `StreamStatisticsService`로 분산 모드의 테이블을 조회하며, `simplix.stream.persistence.enabled`를 지정하지 않으면 404를 반환합니다.

| 요청 | 응답 |
|---|---|
| `GET /api/stream/admin/stats/global` | `GlobalStreamStats`: 세션과 구독 건수, 구독이 많은 리소스(`ResourceStats`), 인스턴스(`ServerStats`) |
| `GET /api/stream/admin/servers` | 인스턴스 목록(`ServerStats`). `status`는 `StreamServerInstanceEntity.Status`이며 `ACTIVE`, 하트비트가 누락된 `SUSPECTED`, `DEAD` 중 하나입니다 |
| `GET /api/stream/admin/sessions/global` | 모든 인스턴스의 세션(`SessionSummary`). `?state=`로 필터링합니다 |
| `GET /api/stream/admin/sessions/global/{sessionId}` | 세션의 구독을 포함한 `SessionDetails` |
| `GET /api/stream/admin/subscriptions/resource/{resource}` | 특정 리소스의 구독(`SubscriptionSummary`) |

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

## 명령

분산 모드에서 `simplix.stream.admin.enabled`를 지정하면 세션 종료와 수집 중지 · 즉시 실행 호출은 `CommandResponse`와 함께 202를 반환하고, 대상을 유지하는 인스턴스에서 실행됩니다. 설정과 상태는 [다중 인스턴스 실행](ko/stream/running-several-instances.md)에서 설명합니다.

| 요청 | 응답 |
|---|---|
| `GET /api/stream/admin/commands/{commandId}` | 특정 명령의 `CommandResponse`. 없으면 404 |
| `GET /api/stream/admin/commands/pending` | 실행 대기 중인 명령 |

## 관련 문서

- [스트림 모니터링](ko/stream/monitoring-streams.md)
- [다중 인스턴스 실행](ko/stream/running-several-instances.md)
- [스트림 보안](ko/stream/securing-streams.md)
