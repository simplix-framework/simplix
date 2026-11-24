# WebSocket 사용

WebSocket 연결의 STOMP로 스트림을 제공하는 방법, 클라이언트가 전송하는 메시지와 수신 위치, Server-Sent Events 대신 선택하기 전에 확인할 사항을 설명합니다.

## 전송 방식 활성화

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

의존성과 속성을 지정하면 `SimpliXStreamWebSocketConfiguration`이 `/ws/stream`에 STOMP 엔드포인트(SockJS 포함과 미포함), `/queue`와 `/topic`용 인메모리 브로커, 애플리케이션 접두어 `/app`, `WebSocketStreamHandler`를 등록합니다. Server-Sent Events 엔드포인트도 함께 제공됩니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.stream.websocket.enabled` | `false` | WebSocket 전송 방식을 등록합니다 |
| `simplix.stream.websocket.endpoint` | `/ws/stream` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다. 엔드포인트는 항상 `/ws/stream`입니다 |
| `simplix.stream.websocket.allowed-origins` | `*` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다. 모든 출처를 허용합니다 |
| `simplix.stream.websocket.sockjs-enabled` | `true` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다. 엔드포인트는 항상 SockJS 포함과 미포함 형식으로 등록됩니다 |

엔드포인트를 변경하거나 출처를 제한하려면 `WebSocketMessageBrokerConfigurer` 빈을 직접 선언하세요. 이 경우 모듈은 브로커 구성을 해당 빈에 맡기고 핸들러만 등록합니다.

## 경로 허용

[simplix-auth](ko/auth/readme.md)를 사용하면 로그인 세션 없이 `/ws/stream`에 보낸 요청은 로그인 페이지로 리다이렉트되어 WebSocket 핸드셰이크가 실패합니다. 경로를 허용하거나, 페이지가 연결하기 전에 웹 로그인으로 사용자를 인증하세요.

```yaml
simplix:
  auth:
    security:
      permit-all-patterns:
        - /ws/stream
        - /ws/stream/**
```

WebSocket 세션의 사용자는 핸드셰이크 요청의 principal입니다. 허용한 경로에는 principal이 없으므로 세션은 익명이고 권한 검사기는 사용자로 `null`을 받습니다. 예제의 권한 검사기는 이런 구독을 `Shelf s1 is not open to null` 사유로 거부합니다.

## 목적지

| 방향 | 목적지 | 내용 |
|---|---|---|
| 클라이언트 전송 | `/app/stream/subscribe` | JSON 형식의 `SubscriptionRequest`. 세션의 구독을 교체합니다 |
| 클라이언트 전송 | `/app/stream/unsubscribe-all` | 본문이 없습니다. 모든 구독을 해제합니다 |
| 클라이언트 구독 | `/user/queue/stream/subscriptions` | 구독 메시지에 대한 `SubscriptionResponse` |
| 클라이언트 구독 | `/queue/stream/{sessionId}` | 세션의 `StreamMessage`: `CONNECTED`, `DATA`, `HEARTBEAT` 등 |

```json
{"errorCode":null,"message":null,"payload":null,"resource":null,"subscriptionKey":null,"timestamp":"2026-11-24T17:22:50.925405Z","type":"HEARTBEAT"}
```

이 하트비트 프레임의 목적지는 `/queue/stream/703b5fd1-63d5-4fa3-a071-4e42b72146ee`입니다. WebSocket에서는 Server-Sent Events 형식과 달리 타입이 문자열이고 빈 필드가 `null`로 기록됩니다.

## 먼저 확인할 사항

> ⚠ 스트림 세션 ID는 STOMP 세션이 연결될 때 서버에서 생성하며, 이 ID가 포함된 `CONNECTED` 메시지는 클라이언트가 구독하기 전에 `/queue/stream/{sessionId}`로 전송됩니다. 따라서 클라이언트는 프로토콜만으로 자신의 목적지를 알 수 없습니다. `/queue/stream/*` 패턴으로 구독하면 메시지를 받을 수 있지만, 인메모리 브로커는 구독자를 제한하지 않으므로 다른 모든 세션의 메시지도 함께 받습니다.

WebSocket 전송 방식은 연결된 모든 클라이언트가 모든 스트림을 조회해도 되는 경우에만 사용하세요. 그렇지 않으면 직접 선언한 `WebSocketMessageBrokerConfigurer`의 인바운드 채널 인터셉터에서 다른 세션의 목적지 구독을 거부해야 합니다. 사용자별로 다른 데이터에는 Server-Sent Events를 사용하세요. [클라이언트 연결](ko/stream/connecting-clients.md)에서 설명합니다.

## STOMP 클라이언트

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

하트비트와 `SessionValidator`는 Server-Sent Events와 같게 동작합니다. WebSocket 세션은 STOMP 세션의 연결이 끊기면 종료됩니다. 핸들러는 세션마다 전송을 담당하는 `WebSocketStreamSession`을 보관합니다.

## 관련 문서

- [클라이언트 연결](ko/stream/connecting-clients.md)
- [스트림 보안](ko/stream/securing-streams.md)
- [문제 해결](ko/stream/troubleshooting.md)
