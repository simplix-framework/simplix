# Getting started with simplix-stream

Add the module, write one collector, and watch its data arrive over a Server-Sent Events connection.

## Add the dependency

The module is not part of the [starter](../../../spring-boot-starter-simplix/README.md). Add it beside the starter.

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-stream:${version}"
}
```

It needs a servlet web application. Nothing has to be configured: the mode is `local`, sessions are kept in memory, and the endpoints under `/api/stream` are registered.

## Write a collector

A collector names a resource and returns the current data of that resource. The module calls it at an interval for as long as a client is subscribed.

```java
@Component
@RequiredArgsConstructor
public class ShelfOccupancyCollector implements SimpliXStreamDataCollector {

    private final ShelfCounter shelfCounter;

    @Override
    public String getResource() {
        return "shelf-occupancy";
    }

    @Override
    public Object collect(Map<String, Object> params) {
        String shelfId = String.valueOf(params.get("shelfId"));
        return Map.of("shelfId", shelfId, "free", shelfCounter.freeSlots(shelfId));
    }

    @Override
    public long getDefaultIntervalMs() {
        return 1000L;
    }

    @Override
    public boolean validateParams(Map<String, Object> params) {
        return params.get("shelfId") != null;
    }
}
```

## Connect

```bash
curl -N -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:8080/api/stream/connect
```

```text
id:1795540359229
event:connected
data:{
data:  "type" : {
data:    "type" : "MessageType",
data:    "value" : "CONNECTED"
data:  },
data:  "payload" : {
data:    "sessionId" : "9d095875-b05a-4b5f-9389-23a40dcd2466",
data:    "serverTime" : "2026-11-25T02:12:39.229+09:00"
data:  },
data:  "timestamp" : "2026-11-25T02:12:39.229+09:00"
data:}
```

The first event carries the id of the session. Every later call names that id. Keep the connection open in this terminal.

## Subscribe

```bash
curl -X PUT http://localhost:8080/api/stream/sessions/9d095875-b05a-4b5f-9389-23a40dcd2466/subscriptions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subscriptions":[
        {"resource":"shelf-occupancy","params":{"shelfId":"s1"}},
        {"resource":"no-such","params":{}}
      ]}'
```

```json
{
  "success" : true,
  "subscribed" : [ {
    "resource" : "shelf-occupancy",
    "params" : { "shelfId" : "s1" },
    "subscriptionKey" : "shelf-occupancy:3b02a4c3",
    "intervalMs" : 1000
  } ],
  "failed" : [ {
    "resource" : "no-such",
    "params" : { },
    "reason" : "Resource not found"
  } ],
  "totalCount" : 1
}
```

The request lists everything the session should be subscribed to. A resource nobody collects is reported under `failed`, and the rest is subscribed.

## Receive data

The open connection now receives one `data` event per interval.

```text
id:shelf-occupancy:3b02a4c3-1795540362539
event:data
data:{
data:  "type" : {
data:    "type" : "MessageType",
data:    "value" : "DATA"
data:  },
data:  "subscriptionKey" : "shelf-occupancy:3b02a4c3",
data:  "resource" : "shelf-occupancy",
data:  "payload" : {
data:    "free" : 12,
data:    "shelfId" : "s1"
data:  },
data:  "timestamp" : "2026-11-25T02:12:42.539+09:00"
data:}
```

## Disconnect

```bash
curl -X DELETE -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8080/api/stream/sessions/9d095875-b05a-4b5f-9389-23a40dcd2466
```

The call answers 204, the session ends, and the collector stops being called once no session is subscribed to it.

## Next steps

- [Collecting data](./collecting-data.md): intervals, parameters and shared collection
- [Connecting clients](./connecting-clients.md): the protocol and a browser client
- [Securing streams](./securing-streams.md): who may connect and subscribe
