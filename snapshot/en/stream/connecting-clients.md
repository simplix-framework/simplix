# Connecting clients

The Server-Sent Events protocol of the module: the endpoints, the messages, how a browser authenticates, and a client that reconnects.

## Endpoints

`SseStreamController` serves them under `/api/stream`.

| Request | Does | Answers |
|---|---|---|
| `POST /tickets` | issues a connect ticket for the authenticated user | `{"ticket": "..."}` |
| `GET /connect` | opens a session; the query parameters become parameters of every subscription | an event stream that starts with `connected` |
| `PUT /sessions/{sessionId}/subscriptions` | replaces the subscriptions of the session with the list in the body, a `SubscriptionRequest` of at most 100 `SubscriptionItem` entries | a `SubscriptionResponse` |
| `GET /sessions/{sessionId}/subscriptions` | lists the subscriptions of the session | a list of `SubscribedResource` |
| `GET /reconnect?sessionId=` | opens a new connection for a session that lost its connection, with its subscriptions | an event stream that starts with `reconnected` |
| `DELETE /sessions/{sessionId}` | ends the session | 204 |

Every call on a session checks that the caller is the user the session belongs to. Another user receives 401, and an unknown session id receives 404 with `GEN_NOT_FOUND`.

## Subscribing

A `PUT` states the whole list. The module compares it with the current subscriptions as a `SubscriptionDiff`, starts what is new and stops what is gone; an empty list removes everything.

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

| Field | Meaning |
|---|---|
| `subscribed` | the subscriptions now in force, each a `SubscribedResource` with its `subscriptionKey` and `intervalMs` |
| `failed` | the refused entries, each a `FailedSubscription` with a `reason`: `Resource not found`, or the reason of the authorizer |
| `success` | `true` when nothing failed, or when `simplix.stream.subscription.partial-success` is `true`, the default |
| `totalCount` | the number of subscriptions in force |

## Messages

Every event is a `StreamMessage`. The name of the SSE event is the message type in lower case, so a client listens by type.

| Event | `MessageType` | Sent | Carries |
|---|---|---|---|
| `connected` | `CONNECTED` | first on a new connection | `payload`, a `ConnectedPayload`: `sessionId`, `serverTime` |
| `reconnected` | `RECONNECTED` | first after `/reconnect` | `payload`, a `ReconnectedPayload`: `sessionId`, `restoredSubscriptions`, `serverTime` |
| `data` | `DATA` | per interval, or per event | `subscriptionKey`, `resource`, `payload` |
| `heartbeat` | `HEARTBEAT` | every `session.heartbeat-interval` | only the timestamp |
| `error` | `ERROR` | when a collector failed | `subscriptionKey`, `resource`, `errorCode`, `message` |
| `subscription_removed` | `SUBSCRIPTION_REMOVED` | when the server removed a subscription | `subscriptionKey`, `resource`, `message` |
| `session_terminated` | `SESSION_TERMINATED` | when a `SessionValidator` refused the session | `message`, the reason |

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

With the starter, enums are written as an object, so the type inside the JSON is `type.value`. The event name is the simpler thing to switch on.

## Authenticating a browser

The `EventSource` of a browser cannot send an `Authorization` header. The client therefore asks for a ticket on an ordinary authenticated request and puts it into the connect URL. `ConnectTicketService` issues a random ticket that works once and expires after `simplix.stream.security.connect-ticket-validity`, 30 seconds by default.

```bash
curl -X POST -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:8080/api/stream/tickets
# {"ticket":"E_koSXW_wd6mCYce3L6O9AfTxVpcrJUWtIzqkTe3WDI"}

curl -N "http://localhost:8080/api/stream/connect?ticket=E_koSXW_wd6mCYce3L6O9AfTxVpcrJUWtIzqkTe3WDI"
```

With [simplix-auth](en/auth/readme.md) the connect path has to be reachable without a token, or the request is answered 401 before the ticket is read.

```yaml
simplix:
  auth:
    security:
      permit-all-patterns:
        - /api/stream/connect
```

> ⚠ On a permitted path the token of the request is not evaluated. Once `/api/stream/connect` is permitted, a connection is authenticated by its ticket alone: a connect with an `Authorization` header and no ticket opens an anonymous session, and so does a ticket that was used before. Choose one way for an application, the header or the ticket, and read [Securing streams](en/stream/securing-streams.md) for what an anonymous session may do.

## How long a connection lasts

| Moment | What happens |
|---|---|
| every `session.heartbeat-interval` (30 seconds) | the session is checked by the `SessionValidator`, then a `heartbeat` is sent |
| `session.timeout` (5 minutes) after the connection opened | the server ends the connection, whether or not data flowed |
| the connection is lost | the session becomes `DISCONNECTED` and keeps its subscriptions for `session.grace-period` (30 seconds) |
| `/reconnect` within the grace period | the session is `CONNECTED` again, with its subscriptions |
| the grace period passes | the session is `TERMINATED`, and collectors nobody else subscribes to stop |
| a client falls behind by `send.queue-capacity` messages (256) | the session is closed; the client connects again and receives current data |

A client has to expect the connection to end and to open it again. `/reconnect` authenticates with the `Authorization` header only; a client that connects with tickets opens a new session with a new ticket and subscribes again, as the client below does.

## A browser client

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

- `subscribe` always states the whole list. To add a resource, send the list with the new entry.
- The client keeps the last list and sends it again after a reconnection, because a new session starts without subscriptions.
- In a React application, create the client once, for example in a context provider, and call `on` and `subscribe` from an effect that calls `close` on cleanup.

## Related documents

- [Securing streams](en/stream/securing-streams.md)
- [Using WebSocket](en/stream/using-websocket.md)
- [Troubleshooting](en/stream/troubleshooting.md)
