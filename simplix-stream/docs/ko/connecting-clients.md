# 클라이언트 연결

모듈의 Server-Sent Events 프로토콜을 설명합니다. 엔드포인트, 메시지, 브라우저 인증 방식, 재연결하는 클라이언트 예제를 다룹니다.

## 엔드포인트

`SseStreamController`가 `/api/stream` 아래에서 제공합니다.

| 요청 | 동작 | 응답 |
|---|---|---|
| `POST /tickets` | 인증된 사용자의 연결 티켓을 발급합니다 | `{"ticket": "..."}` |
| `GET /connect` | 세션을 엽니다. 쿼리 매개변수는 모든 구독의 매개변수에 포함됩니다 | `connected`로 시작하는 이벤트 스트림 |
| `PUT /sessions/{sessionId}/subscriptions` | 세션의 구독을 본문의 목록으로 교체합니다. 본문은 `SubscriptionItem`을 최대 100개 포함하는 `SubscriptionRequest`입니다 | `SubscriptionResponse` |
| `GET /sessions/{sessionId}/subscriptions` | 세션의 구독을 조회합니다 | `SubscribedResource` 목록 |
| `GET /reconnect?sessionId=` | 연결이 끊긴 세션에 구독을 유지한 채 새 연결을 엽니다 | `reconnected`로 시작하는 이벤트 스트림 |
| `DELETE /sessions/{sessionId}` | 세션을 종료합니다 | 204 |

세션에 대한 모든 호출은 호출자가 세션의 소유 사용자인지 확인합니다. 다른 사용자는 401을, 존재하지 않는 세션 ID는 404와 `GEN_NOT_FOUND`를 받습니다.

## 구독

`PUT`에는 전체 목록을 지정합니다. 모듈은 현재 구독과 비교한 `SubscriptionDiff`를 계산해 새 항목을 시작하고 빠진 항목을 중지합니다. 빈 목록을 보내면 모든 구독이 해제됩니다.

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

| 필드 | 의미 |
|---|---|
| `subscribed` | 현재 적용된 구독. 항목은 `subscriptionKey`와 `intervalMs`를 포함하는 `SubscribedResource`입니다 |
| `failed` | 거부된 항목. 항목은 `reason`을 포함하는 `FailedSubscription`입니다. 사유는 `Resource not found` 또는 권한 검사기가 반환한 값입니다 |
| `success` | 실패한 항목이 없거나 `simplix.stream.subscription.partial-success`가 `true`(기본값)이면 `true`입니다 |
| `totalCount` | 적용된 구독 수 |

## 메시지

모든 이벤트는 `StreamMessage`입니다. SSE 이벤트 이름은 메시지 타입의 소문자 표기이므로 클라이언트는 타입별로 리스너를 등록합니다.

| 이벤트 | `MessageType` | 전송 시점 | 포함 내용 |
|---|---|---|---|
| `connected` | `CONNECTED` | 새 연결의 첫 이벤트 | `payload`(`ConnectedPayload`): `sessionId`, `serverTime` |
| `reconnected` | `RECONNECTED` | `/reconnect` 후 첫 이벤트 | `payload`(`ReconnectedPayload`): `sessionId`, `restoredSubscriptions`, `serverTime` |
| `data` | `DATA` | 주기마다 또는 이벤트마다 | `subscriptionKey`, `resource`, `payload` |
| `heartbeat` | `HEARTBEAT` | `session.heartbeat-interval`마다 | 타임스탬프만 포함 |
| `error` | `ERROR` | 수집기가 실패했을 때 | `subscriptionKey`, `resource`, `errorCode`, `message` |
| `subscription_removed` | `SUBSCRIPTION_REMOVED` | 서버가 구독을 해제했을 때 | `subscriptionKey`, `resource`, `message` |
| `session_terminated` | `SESSION_TERMINATED` | `SessionValidator`가 세션을 거부했을 때 | `message`(사유) |

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

스타터를 사용하면 enum을 객체로 직렬화하므로 JSON 안의 타입은 `type.value`입니다. 분기에는 이벤트 이름을 사용하는 것이 더 단순합니다.

## 브라우저 인증

브라우저의 `EventSource`는 `Authorization` 헤더를 전송할 수 없습니다. 따라서 클라이언트는 인증된 일반 요청으로 티켓을 발급받아 연결 URL에 포함합니다. `ConnectTicketService`가 발급하는 무작위 티켓은 한 번만 사용할 수 있고 `simplix.stream.security.connect-ticket-validity`(기본 30초)가 지나면 만료됩니다.

```bash
curl -X POST -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:8080/api/stream/tickets
# {"ticket":"E_koSXW_wd6mCYce3L6O9AfTxVpcrJUWtIzqkTe3WDI"}

curl -N "http://localhost:8080/api/stream/connect?ticket=E_koSXW_wd6mCYce3L6O9AfTxVpcrJUWtIzqkTe3WDI"
```

[simplix-auth](../../../simplix-auth/README.ko.md)를 사용하면 연결 경로를 토큰 없이 접근할 수 있게 허용해야 합니다. 허용하지 않으면 티켓을 읽기 전에 401을 반환합니다.

```yaml
simplix:
  auth:
    security:
      permit-all-patterns:
        - /api/stream/connect
```

> ⚠ 허용한 경로에서는 요청의 토큰을 평가하지 않습니다. `/api/stream/connect`를 허용한 뒤에는 티켓으로만 연결을 인증합니다. 티켓 없이 `Authorization` 헤더만 보낸 연결과 이미 사용한 티켓으로 보낸 연결에는 익명 세션이 생성됩니다. 애플리케이션에서는 헤더와 티켓 중 한 가지 방식만 사용하고, 익명 세션에 허용되는 동작은 [스트림 보안](./securing-streams.md)에서 확인하세요.

## 연결 유지 시간

| 시점 | 동작 |
|---|---|
| `session.heartbeat-interval`(30초)마다 | `SessionValidator`로 세션을 검사한 뒤 `heartbeat`를 전송합니다 |
| 연결 후 `session.timeout`(5분) 경과 | 데이터 전송 여부와 관계없이 서버가 연결을 종료합니다 |
| 연결이 끊김 | 세션이 `DISCONNECTED` 상태가 되고 `session.grace-period`(30초) 동안 구독을 유지합니다 |
| 유예 시간 안에 `/reconnect` 호출 | 세션이 구독을 유지한 채 다시 `CONNECTED` 상태가 됩니다 |
| 유예 시간 경과 | 세션이 `TERMINATED` 상태가 되고, 다른 구독자가 없는 수집기가 중지됩니다 |
| 클라이언트의 수신이 `send.queue-capacity`(256)건만큼 지연됨 | 세션을 종료합니다. 클라이언트는 다시 연결해 현재 데이터를 받습니다 |

클라이언트는 연결 종료에 대비해 다시 연결하도록 구현해야 합니다. `/reconnect`는 `Authorization` 헤더로만 인증합니다. 티켓으로 연결하는 클라이언트는 아래 예제처럼 새 티켓으로 새 세션을 열고 다시 구독합니다.

## 브라우저 클라이언트

```javascript
export class StreamClient {
  #handlers = new Map();
  #subscriptions = [];
  #closed = false;

  constructor(baseUrl, getAccessToken) {
    this.baseUrl = baseUrl;
    this.getAccessToken = getAccessToken;
  }

  async connect() {
    const { ticket } = await this.#call('POST', '/tickets');
    const source = new EventSource(`${this.baseUrl}/connect?ticket=${encodeURIComponent(ticket)}`);
    this.source = source;
    source.addEventListener('data', (event) => {
      const message = JSON.parse(event.data);
      this.#handlers.get(message.resource)?.(message.payload, message);
    });
    source.addEventListener('session_terminated', (event) => {
      this.close();
      this.onTerminated?.(JSON.parse(event.data).message);
    });
    await new Promise((resolve, reject) => {
      source.addEventListener('connected', (event) => {
        this.sessionId = JSON.parse(event.data).payload.sessionId;
        resolve();
      }, { once: true });
      source.addEventListener('error', reject, { once: true });
    });
    // A ticket works once, so a dropped connection is opened again with a new one
    source.addEventListener('error', () => {
      source.close();
      this.#reopen();
    });
    if (this.#subscriptions.length > 0) {
      await this.subscribe(this.#subscriptions);
    }
    return this.sessionId;
  }

  on(resource, handler) {
    this.#handlers.set(resource, handler);
  }

  subscribe(subscriptions) {
    this.#subscriptions = subscriptions;
    return this.#call('PUT', `/sessions/${this.sessionId}/subscriptions`, { subscriptions });
  }

  async close() {
    this.#closed = true;
    this.source?.close();
    await this.#call('DELETE', `/sessions/${this.sessionId}`).catch(() => {});
  }

  async #reopen() {
    if (this.#closed) {
      return;
    }
    try {
      await this.connect();
    } catch {
      setTimeout(() => this.#reopen(), 3000);
    }
  }

  async #call(method, path, body) {
    const response = await fetch(this.baseUrl + path, {
      method,
      headers: {
        Authorization: `Bearer ${await this.getAccessToken()}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`${method} ${path} failed: ${response.status}`);
    }
    return response.status === 204 ? null : response.json();
  }
}
```

```javascript
const client = new StreamClient('/api/stream', () => auth.accessToken());

await client.connect();
client.on('shelf-occupancy', (payload) => render(payload.shelfId, payload.free));

const result = await client.subscribe([
  { resource: 'shelf-occupancy', params: { shelfId: 's1' } },
]);
result.failed.forEach((failure) => console.warn(failure.resource, failure.reason));
```

- `subscribe`에는 항상 전체 목록을 지정합니다. 리소스를 추가하려면 새 항목을 포함한 목록을 보내세요.
- 새 세션은 구독 없이 시작되므로, 클라이언트는 마지막 목록을 보관했다가 재연결 후 다시 전송합니다.
- React 애플리케이션에서는 컨텍스트 프로바이더 등에서 클라이언트를 한 번만 생성하고, effect에서 `on`과 `subscribe`를 호출한 뒤 정리 함수에서 `close`를 호출하세요.

## 관련 문서

- [스트림 보안](./securing-streams.md)
- [WebSocket 사용](./using-websocket.md)
- [문제 해결](./troubleshooting.md)
