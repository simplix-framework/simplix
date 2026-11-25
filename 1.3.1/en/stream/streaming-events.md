# Streaming events

How to send data to subscribers at the moment something happens, without a collector that asks at an interval.

## Polling or events

|  | Collector | Event source |
|---|---|---|
| Data is sent | at every interval | when an event is published |
| Cost with no change | one call per interval | none |
| A new subscriber sees | the current state within one interval | nothing until the next event |
| Fits | values that are read: a gauge, a count, a status | things that happen: a return, a message, a state change |

A resource is served by a collector or by an event source. Subscribers use the same request for both.

## Enable event sources

```yaml
simplix:
  stream:
    event-source:
      enabled: true
```

## Write an event source

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

| Method | Default | Meaning |
|---|---|---|
| `getResource()` | required | the name clients subscribe to |
| `getEventType()` | required | the event type this source listens to; one source per type |
| `extractParams(payload)` | required | the subscription parameters this event belongs to |
| `extractData(payload)` | required | the data to send; `null` sends nothing |
| `supports(eventType, payload)` | the type equals `getEventType()` | return `false` to skip an event |
| `validateParams(params)`, `getRequiredPermission()` | `true`, `null` | no effect: no code calls them |

Sources are kept in the `SimpliXStreamEventSourceRegistry`. At start the log lists the registered resources and event types.

## Publish an event

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

The `EventStreamHandler` listens for Spring application events that implement `Event` of simplix-core, such as `GenericEvent`. Publish through the `ApplicationEventPublisher`: an event sent with `EventManager.getInstance().publish(...)` does not reach the stream.

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

## Who receives an event

1. The handler builds a subscription key from the resource and the parameters `extractParams` returned.
2. Sessions subscribed with exactly that key receive the event. The `EventSubscriberRegistry` holds them.
3. When no session has that key, every session subscribed to the resource receives the event, whatever its parameters.

> ⚠ The third rule delivers an event of one branch to a subscriber of another branch when nobody subscribed to the first. A session subscribed to `loan-returns` for branch `b1` receives the returns of branch `b9` as well while nobody subscribes to `b9`. Where subscribers must not see each other's events, give each audience its own resource name, and refuse the others in a `ResourceAuthorizer`.

The message carries the key built from the event, not the key of the subscription. Route incoming messages by `resource` on the client.

## Related documents

- [Collecting data](en/stream/collecting-data.md)
- [Connecting clients](en/stream/connecting-clients.md)
- [Publishing events in simplix-core](en/core/publishing-events.md)
