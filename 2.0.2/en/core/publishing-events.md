# Publishing events

The event model of SimpliX: the event an entity publishes when it is created, changed or deleted, and the interface a module publishes its own events through without knowing who delivers them.

## Events of an entity

`@EntityEventConfig` on an entity says which events its inserts, updates and deletes become. The listener that publishes them, `EntityEventPublishingListener`, is part of [simplix-hibernate](en/hibernate/readme.md); register it on the entity with `@EntityListeners`. It publishes an `EventMessage` on Spring's event bus.

```java
@Entity
@EntityListeners(EntityEventPublishingListener.class)
@EntityEventConfig(onCreate = "AUTHOR_CREATED", onDelete = "AUTHOR_DELETED", publishUpdate = false)
public class Author extends SimpliXBaseEntity<String> {
    // ...
}
```

| Attribute | Default | Meaning |
|---|---|---|
| `onCreate`, `onUpdate`, `onDelete` | `ENTITY_CREATED`, `ENTITY_UPDATED`, `ENTITY_DELETED` | the event type of each change |
| `enabled` | `true` | switches the events of the entity on or off |
| `publishCreate`, `publishUpdate`, `publishDelete` | `true` | switches one kind of event on or off |
| `failOnError` | `true` | whether a failure to publish fails the change |
| `ignoreProperties` | none | properties whose change alone publishes no update event |
| `watchProperties` | none | when set, only a change of these properties publishes an update event |

- An entity that implements `SoftDeletable` and is deleted by an update publishes the delete event, with `softDelete` set in its metadata.
- An entity that implements `EntityEventPayloadProvider` chooses the payload of its events.

### Receive the events

```java
@Component
public class AuthorEvents {

    @EventListener
    public void on(EventMessage event) {
        if ("AUTHOR_CREATED".equals(event.eventType())) {
            String authorId = event.aggregateId();
            // ...
        }
    }
}
```

`EventMessage` is a record with the aggregate id and type, the event type, a payload, metadata and the changed properties. `payloadString(key)`, `payloadLong(key)` and `payloadList(key)` read the payload, `actor()` gives the user who made the change, and `hasChangedProperty(name)` tells whether a property changed.

### Suppress the events

A bulk import would publish one event per row. Run it inside `EventContext.suppressEvents` to publish none on the current thread.

```java
EventContext.suppressEvents(() -> importService.importAuthors(rows));
```

## Events of your own

`EventManager` publishes an `Event` through whichever `EventPublisher` is on the classpath. `GenericEvent` is a ready implementation of `Event`.

```java
GenericEvent event = GenericEvent.builder()
    .eventType("LOAN_OPENED")
    .aggregateType("Loan")
    .aggregateId(loanId)
    .userId(memberId)
    .payload(Map.of("authorId", authorId))
    .build();

EventManager.getInstance().publish(event);
```

An `EventPublisher` is found through Java's service loader: a library names its implementation in `META-INF/services/dev.simplecore.simplix.core.event.EventPublisher`. Without an implementation, `publish` does nothing, so a module can publish events whether or not anything delivers them.

| Builder method of `GenericEvent` | Sets |
|---|---|
| `eventType` | the name of what happened, such as `LOAN_OPENED` |
| `aggregateType`, `aggregateId` | the kind and the identifier of the record the event is about |
| `payload` | the data of the event |
| `userId`, `tenantId` | who caused the event, and in which tenant |
| `metadata`, `addMetadata(key, value)` | values for the delivery, such as a trace id |
| `eventId`, `occurredAt` | the identifier and the time of the event; set them only to repeat an existing event |

## Related documents

- [simplix-hibernate](en/hibernate/readme.md): the listener that publishes entity events
- [simplix-messaging](en/messaging/readme.md): delivering messages through a broker
