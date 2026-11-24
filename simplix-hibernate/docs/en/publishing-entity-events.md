# Publishing entity events

How to react when a record is created, changed or deleted, without calling the reacting code from every service. The entity declares its events; listeners anywhere in the application receive them, inside the transaction or after it.

## Step 1. Declare the events

```java
@Entity
@Table(name = "branches")
@EntityListeners(EntityEventPublishingListener.class)
@EntityEventConfig(onCreate = "BRANCH_OPENED", onUpdate = "BRANCH_CHANGED", onDelete = "BRANCH_CLOSED")
@Getter
@Setter
@NoArgsConstructor
public class Branch extends SimpliXBaseEntity<String> implements EntityEventPayloadProvider {

    @Id
    @UuidV7Generator
    private String branchId;

    private String name;
    private boolean open = true;

    @Override
    public Map<String, Object> getEventPayloadData() {
        return Map.of("name", name);
    }

    @Override
    public String getId() {
        return branchId;
    }

    @Override
    public void setId(String id) {
        this.branchId = id;
    }
}
```

`@EntityListeners` registers the listener and `@EntityEventConfig` names the events. `EntityEventPayloadProvider` is optional: it adds data to the payload beside the `id` and the `className` every event carries.

## Step 2. Receive the events

```java
@Component
public class BranchEvents {

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void record(EventMessage event) {
        // runs in the same transaction, before the commit
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void notify(EventMessage event) {
        // runs once the change is committed
    }
}
```

| Listener | Runs | Use it for |
|---|---|---|
| `@EventListener` | at once, when the event is published | work that does not depend on the outcome of the transaction |
| `@TransactionalEventListener(BEFORE_COMMIT)` | before the commit, in the same transaction | writes that must succeed or fail with the change, such as an outbox row |
| `@TransactionalEventListener(AFTER_COMMIT)` | after a successful commit | notifications and calls to other systems |

## What an event holds

Creating a branch named Central, renaming it and deleting it publishes these events.

| Event type | Payload | Changed properties |
|---|---|---|
| `BRANCH_OPENED` | `{name=Central, className=Branch, id=<id>}` | none |
| `BRANCH_CHANGED` | `{name=Central Library, className=Branch, id=<id>}` | `name` |
| `BRANCH_CLOSED` | `{name=Central Library, className=Branch, id=<id>}` | none |

- An update is published only when a property changed; `ignoreProperties` and `watchProperties` narrow which changes count.
- The delete event is published before the row is removed, so its payload can still read the entity.
- An entity that implements `SoftDeletable` and is deleted by an update publishes the delete event.
- `event.actor()` is the authenticated user who made the change.
- A `@Modifying` query publishes no events: it changes rows without loading entities.

## When publishing fails

| `failOnError` | A failure while building the payload or in an immediate listener | Use it for |
|---|---|---|
| `true` (default) | rolls the transaction back | events that must be stored with the change |
| `false` | is logged, and the transaction commits | audit trails and notifications whose loss must not break the operation |

An exception thrown in the body of a `BEFORE_COMMIT` listener always rolls the transaction back, whatever the flag says.

## Skip the events of a bulk operation

```java
EventContext.suppressEvents(() -> importService.importAuthors(rows));
```

## Related documents

- [How transactions are committed](./how-it-works.md)
- [Publishing events](../../../simplix-core/docs/en/publishing-events.md): the attributes of `@EntityEventConfig`
