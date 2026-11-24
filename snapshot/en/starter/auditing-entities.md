# Auditing entities

How to record who created and last changed a row, and when. The starter switches Spring Data JPA auditing on and supplies the current user and the current time.

## Write a base class with the audit fields

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class AuditedEntity<K> extends SimpliXBaseEntity<K> {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;
}
```

Entities that extend it need nothing more. A note saved by the user `alice` is stored as follows.

```json
{
  "createdAt" : "2026-11-24T23:40:11.824+09:00",
  "updatedAt" : "2026-11-24T23:40:11.824+09:00",
  "createdBy" : "alice",
  "updatedBy" : "alice",
  "noteId" : "<id>",
  "text" : "Return by Friday",
  "id" : "<id>"
}
```

## Where the values come from

| Value | Bean | Gives |
|---|---|---|
| `@CreatedBy`, `@LastModifiedBy` | `auditorProvider` (`AuditorAware<String>`) | the name of the authenticated user, or `SYSTEM` when nobody is signed in |
| `@CreatedDate`, `@LastModifiedDate` | `dateTimeProvider` (`DateTimeProvider`) | the current time |

Register a bean of either type to replace it, for example an `AuditorAware` that returns the user's id instead of the name. Do not add `@EnableJpaAuditing` to the application: the starter declares it.

> ℹ The service test the CLI generates sets `createdAt` and `updatedAt` when the entity yml lists them, so a base class of this shape is what generated code expects.

## Related documents

- [Entities and repositories](en/core/entities-and-repositories.md)
- [Working with dates and time zones](en/starter/working-with-dates-and-time-zones.md)
