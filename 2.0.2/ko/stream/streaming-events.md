# 이벤트 스트리밍

주기적으로 조회하는 수집기 없이, 변경이 발생한 시점에 구독자에게 데이터를 전송하는 방법을 설명합니다.

## 폴링과 이벤트

|  | 수집기 | 이벤트 소스 |
|---|---|---|
| 전송 시점 | 주기마다 | 이벤트가 발행될 때 |
| 변경이 없을 때의 비용 | 주기마다 호출 1회 | 없음 |
| 새 구독자가 받는 데이터 | 한 주기 안에 현재 상태 | 다음 이벤트가 발생할 때까지 없음 |
| 적합한 데이터 | 조회하는 값: 게이지, 건수, 상태 | 발생하는 사건: 반납, 메시지, 상태 변경 |

리소스는 수집기 또는 이벤트 소스 중 하나로 제공합니다. 구독 요청 방식은 양쪽이 같습니다.

## 이벤트 소스 활성화

```yaml
simplix:
  stream:
    event-source:
      enabled: true
```

## 이벤트 소스 작성

```java
@Component
public class LoanReturnEventSource implements SimpliXStreamEventSource {

    @Override
    public String getResource() {
        return "loan-returns";
    }

    @Override
    public String getEventType() {
        return "LOAN_RETURNED";
    }

    @Override
    public Map<String, Object> extractParams(Object payload) {
        return Map.of("branchId", ((Map<?, ?>) payload).get("branchId"));
    }

    @Override
    public Object extractData(Object payload) {
        return payload;
    }
}
```

| 메서드 | 기본값 | 의미 |
|---|---|---|
| `getResource()` | 필수 | 클라이언트가 구독하는 이름 |
| `getEventType()` | 필수 | 이 소스가 수신하는 이벤트 타입. 타입마다 소스는 하나입니다 |
| `extractParams(payload)` | 필수 | 이 이벤트에 해당하는 구독 매개변수 |
| `extractData(payload)` | 필수 | 전송할 데이터. `null`이면 전송하지 않습니다 |
| `supports(eventType, payload)` | 타입이 `getEventType()`과 같음 | `false`를 반환하면 이벤트를 건너뜁니다 |
| `validateParams(params)`, `getRequiredPermission()` | `true`, `null` | 효과가 없습니다. 호출하는 코드가 없습니다 |

소스는 `SimpliXStreamEventSourceRegistry`에 보관됩니다. 시작할 때 등록된 리소스와 이벤트 타입이 로그에 기록됩니다.

## 이벤트 발행

```java
@Service
@RequiredArgsConstructor
public class ReturnDesk {

    private final ApplicationEventPublisher events;

    public void returned(String loanId, String branchId) {
        events.publishEvent(GenericEvent.builder()
            .eventType("LOAN_RETURNED")
            .aggregateType("Loan")
            .aggregateId(loanId)
            .payload(Map.of("loanId", loanId, "branchId", branchId))
            .build());
    }
}
```

`EventStreamHandler`는 simplix-core의 `Event`를 구현한 Spring 애플리케이션 이벤트(예: `GenericEvent`)를 수신합니다. `ApplicationEventPublisher`로 발행하세요. `EventManager.getInstance().publish(...)`로 보낸 이벤트는 스트림에 전달되지 않습니다.

```text
id:loan-returns:a802d84e-1795540578675
event:data
data:{
data:  "type" : {
data:    "type" : "MessageType",
data:    "value" : "DATA"
data:  },
data:  "subscriptionKey" : "loan-returns:a802d84e",
data:  "resource" : "loan-returns",
data:  "payload" : {
data:    "loanId" : "l-1",
data:    "branchId" : "b1"
data:  },
data:  "timestamp" : "2026-11-25T02:16:18.675+09:00"
data:}
```

## 이벤트 수신 대상

1. 핸들러가 리소스와 `extractParams`의 반환값으로 구독 키를 생성합니다.
2. 정확히 같은 키로 구독한 세션이 이벤트를 받습니다. 해당 세션은 `EventSubscriberRegistry`에 보관됩니다.
3. 같은 키의 세션이 없으면 매개변수와 관계없이 해당 리소스를 구독한 모든 세션이 이벤트를 받습니다.

> ⚠ 세 번째 규칙 때문에, 특정 지점의 구독자가 없으면 해당 지점의 이벤트가 다른 지점의 구독자에게 전달됩니다. 지점 `b1`로 `loan-returns`를 구독한 세션은 `b9`의 구독자가 없는 동안 `b9`의 반납도 받습니다. 구독자 간에 이벤트가 노출되면 안 되는 경우에는 대상별로 리소스 이름을 구분하고 `ResourceAuthorizer`에서 다른 대상의 구독을 거부하세요.

메시지에는 구독의 키가 아닌, 이벤트에서 생성한 키가 포함됩니다. 클라이언트에서는 `resource`를 기준으로 수신 메시지를 분류하세요.

## 관련 문서

- [데이터 수집](ko/stream/collecting-data.md)
- [클라이언트 연결](ko/stream/connecting-clients.md)
- [simplix-core의 이벤트 발행](ko/core/publishing-events.md)
