# simplix-stream 시작하기

모듈을 추가하고 수집기 하나를 작성한 뒤, Server-Sent Events 연결로 데이터가 도착하는 것을 확인합니다.

## 의존성 추가

이 모듈은 [스타터](ko/starter/readme.md)에 포함되어 있지 않습니다. 스타터와 함께 추가하세요.

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-stream:${version}"
}
```

서블릿 웹 애플리케이션이 필요합니다. 별도 설정 없이 사용할 수 있습니다. 기본 모드는 `local`이며, 세션을 메모리에 보관하고 `/api/stream` 아래의 엔드포인트를 등록합니다.

## 수집기 작성

수집기는 리소스 이름을 정하고 해당 리소스의 현재 데이터를 반환합니다. 모듈은 구독 중인 클라이언트가 있는 동안 일정 주기로 수집기를 호출합니다.

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

## 연결

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

첫 이벤트에 세션 ID가 포함됩니다. 이후의 모든 호출에 이 ID를 사용합니다. 이 터미널의 연결은 그대로 유지하세요.

## 구독

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

요청에는 세션이 구독할 전체 목록을 지정합니다. 수집기가 없는 리소스는 `failed`에 포함되고 나머지는 구독됩니다.

## 데이터 수신

연결을 유지 중인 터미널에 주기마다 `data` 이벤트가 하나씩 도착합니다.

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

## 연결 종료

```bash
curl -X DELETE -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8080/api/stream/sessions/9d095875-b05a-4b5f-9389-23a40dcd2466
```

호출은 204를 반환하고 세션이 종료됩니다. 구독 중인 세션이 없어지면 수집기 호출도 중지됩니다.

## 다음 단계

- [데이터 수집](ko/stream/collecting-data.md): 주기, 매개변수, 수집 공유
- [클라이언트 연결](ko/stream/connecting-clients.md): 프로토콜과 브라우저 클라이언트
- [스트림 보안](ko/stream/securing-streams.md): 연결과 구독 권한
