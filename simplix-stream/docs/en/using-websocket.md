# Using WebSocket

How to offer the stream over STOMP on a WebSocket connection, what a client sends and where the messages arrive, and what to settle before choosing it over Server-Sent Events.

## Enable the transport

```groovy
dependencies {
    implementation "org.springframework.boot:spring-boot-starter-websocket"
}
```

```yaml
simplix:
  stream:
    websocket:
      enabled: true
```

With the dependency and the property in place `SimpliXStreamWebSocketConfiguration` registers a STOMP endpoint at `/ws/stream`, with and without SockJS, a simple in-memory broker for `/queue` and `/topic`, the application prefix `/app`, and the `WebSocketStreamHandler`. The Server-Sent Events endpoints stay available beside it.

| Property | Default | Meaning |
|---|---|---|
| `simplix.stream.websocket.enabled` | `false` | registers the WebSocket transport |
| `simplix.stream.websocket.endpoint` | `/ws/stream` | no effect: no code reads it; the endpoint is always `/ws/stream` |
| `simplix.stream.websocket.allowed-origins` | `*` | no effect: no code reads it; every origin is allowed |
| `simplix.stream.websocket.sockjs-enabled` | `true` | no effect: no code reads it; the endpoint is always registered with and without SockJS |

To choose the endpoint or to restrict the origins, declare a `WebSocketMessageBrokerConfigurer` bean of your own. The module then leaves the broker configuration to it and still registers the handler.

## Open the path

With [simplix-auth](../../../simplix-auth/README.md) a request to `/ws/stream` without a login session is redirected to the login page, and the WebSocket handshake fails. Permit the path, or log the user in through the web login before the page connects.

```yaml
simplix:
  auth:
    security:
      permit-all-patterns:
        - /ws/stream
        - /ws/stream/**
```

The user of a WebSocket session is the principal of the handshake request. On a permitted path there is none, the session is anonymous, and an authorizer receives `null` as the user; the authorizer of the sample refuses such a subscription with `Shelf s1 is not open to null`.

## Destinations

| Direction | Destination | Carries |
|---|---|---|
| client sends | `/app/stream/subscribe` | a `SubscriptionRequest` as JSON; replaces the subscriptions of the session |
| client sends | `/app/stream/unsubscribe-all` | nothing; removes every subscription |
| client subscribes | `/user/queue/stream/subscriptions` | the `SubscriptionResponse` to each subscribe message |
| client subscribes | `/queue/stream/{sessionId}` | the `StreamMessage` objects of the session: `CONNECTED`, `DATA`, `HEARTBEAT` and the others |

```json
{"errorCode":null,"message":null,"payload":null,"resource":null,"subscriptionKey":null,"timestamp":"2026-11-24T17:22:50.925405Z","type":"HEARTBEAT"}
```

This heartbeat frame belongs to the destination `/queue/stream/703b5fd1-63d5-4fa3-a071-4e42b72146ee`. Over WebSocket the type is a plain string and empty fields are written as `null`, unlike the Server-Sent Events form.

## What to settle first

> ⚠ The stream session id is created by the server when the STOMP session connects, and the `CONNECTED` message that carries it is sent to `/queue/stream/{sessionId}` before a client can subscribe there. A client therefore cannot learn its destination from the protocol. A subscription to the pattern `/queue/stream/*` receives the messages, and it receives those of every other session as well, because the simple broker does not restrict who subscribes.

Use the WebSocket transport only where every connected client may see every stream, or behind a `WebSocketMessageBrokerConfigurer` of your own whose inbound channel interceptor refuses subscriptions to destinations of other sessions. For data that differs per user, Server-Sent Events is the transport to use: [Connecting clients](./connecting-clients.md).

## A STOMP client

```javascript
import { Client } from '@stomp/stompjs';

const client = new Client({ brokerURL: 'wss://library.example.com/ws/stream' });

client.onConnect = () => {
  client.subscribe('/user/queue/stream/subscriptions', (frame) => {
    const result = JSON.parse(frame.body);
    result.failed.forEach((failure) => console.warn(failure.resource, failure.reason));
  });

  client.publish({
    destination: '/app/stream/subscribe',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      subscriptions: [{ resource: 'shelf-occupancy', params: { shelfId: 's1' } }],
    }),
  });
};

client.activate();
```

Heartbeats and the `SessionValidator` work as they do for Server-Sent Events. A WebSocket session ends when the STOMP session disconnects; `WebSocketStreamSession` is the sender the handler keeps for it.

## Related documents

- [Connecting clients](./connecting-clients.md)
- [Securing streams](./securing-streams.md)
- [Troubleshooting](./troubleshooting.md)
