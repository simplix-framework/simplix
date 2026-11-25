# Entities and repositories

How to write entities and repositories on the SimpliX base classes: identifiers, composite keys, soft delete, and columns that hold JSON.

## Write an entity

`SimpliXBaseEntity<K>` asks for `getId` and `setId`. The services and controllers SimpliX generates read the identifier through them, so the field itself may have any name.

```java
@Entity
@Table(name = "articles")
@SQLDelete(sql = "UPDATE articles SET deleted = true WHERE article_id = ?")
@SQLRestriction("deleted = false")
@Getter
@Setter
@NoArgsConstructor
public class Article extends SimpliXBaseEntity<String> implements SoftDeletable {

    @Id
    @UuidV7Generator
    @Column(name = "article_id")
    private String articleId;

    @Column(nullable = false)
    private String title;

    @Convert(converter = JsonListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> tags = new ArrayList<>();

    @Column(nullable = false)
    private boolean deleted = false;

    @Override
    public String getId() {
        return articleId;
    }

    @Override
    public void setId(String id) {
        this.articleId = id;
    }
}
```

### Time-ordered identifiers

`@UuidV7Generator` fills a `String` identifier with a UUID version 7, whose leading bits are the creation time, so new rows sort after older ones and index pages fill in order. `UuidUtils.generateUuidV7()` gives the same value outside an entity.

| `UuidUtils` method | Returns |
|---|---|
| `generateUuidV7()`, `generateUuidV7Object()` | a version 7 UUID as 36 characters of text, or as a `UUID` |
| `generateShortUuid()` | 8 characters, for a value that only has to be unique nearby |
| `generateTraceId()` | 13 characters that sort by time, such as `01a20e3c695a7` |
| `extractTimestamp(uuid)` | the creation time of a version 7 UUID, in milliseconds |
| `isUuidV7(uuid)` | whether a UUID is version 7 |
| `generateUuidV4()`, `generateUuidV4Object()` | a random UUID, for a value that must not reveal its creation time |

### Lists and maps in one column

`JsonListConverter` stores a `List<String>` as a JSON array in a text column, and `JsonMapConverter` stores a `Map<String, String>` as a JSON object. A value that cannot be parsed is read as an empty list.

## Write a repository

```java
public interface AuthorRepository extends SimpliXBaseRepository<Author, String> {
}
```

`SimpliXBaseRepository` is a `JpaRepository` with `JpaSpecificationExecutor`. Register the repositories with `SimpliXRepositoryFactoryBean`, as [Getting started](en/getting-started.md) shows.

## Soft delete

The `Article` above is deleted by an update: `@SQLDelete` sets the flag and `@SQLRestriction` hides flagged rows from every read. After `repository.delete(article)` the row stays in the table, and `existsById` and `findById` no longer find it.

`SoftDeletable` tells SimpliX that such an update is a deletion. An entity that publishes lifecycle events then reports a delete event instead of an update event; see [Publishing events](en/core/publishing-events.md).

An application that hides rows with a Hibernate `@Filter` instead gets the same result from `findById`: the repository base class answers a read by id only when the row passes the filters enabled in the session.

## Composite keys

A key class implements `SimpliXCompositeKey` and provides the static factories `fromUrlPath` and `fromString`. `toCompositeKeyString` joins the fields with `__`, which is the form the key takes in a URL.

```java
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class LoanId implements SimpliXCompositeKey {

    private Long memberId;
    private String authorId;

    public static LoanId fromUrlPath(String... pathVariables) {
        if (pathVariables.length != 2) {
            throw new IllegalArgumentException("Expected the member id and the author id");
        }
        return new LoanId(Long.parseLong(pathVariables[0]), pathVariables[1]);
    }

    public static LoanId fromString(String compositeId) {
        return fromUrlPath(compositeId.split("__"));
    }

    @Override
    public SimpliXCompositeKey fromPathVariables(String... pathVariables) {
        return fromUrlPath(pathVariables);
    }

    @Override
    public SimpliXCompositeKey fromCompositeId(String compositeId) {
        return fromString(compositeId);
    }

    @Override
    public void validate() {
        if (memberId == null || authorId == null) {
            throw new IllegalArgumentException("Both parts of the loan id are required");
        }
    }

    @Override
    public String toString() {
        return toCompositeKeyString();
    }
}
```

`new LoanId(7L, "a1").toString()` gives `7__a1`, and `LoanId.fromString("7__a1")` reads it back.

## Convert between entities and DTOs

| Method | Does |
|---|---|
| `DtoUtils.toDto(entity, Dto.class)` | maps one entity to a DTO |
| `DtoUtils.toDtoList(entities, Dto.class)` | maps a list |
| `DtoUtils.toDtoPage(page, Dto.class)` | maps a page and keeps its paging data |
| `EntityUtils.convertToEntity(source, Entity.class)` | maps an object to an entity by exact field names, skipping null values |
| `EntityUtils.getEntityId(entity)` | reads the value of the `@Id` field |

## Related documents

- [Tree structures](en/core/tree-structures.md)
- [Describing entities for screens](en/core/describing-entities-for-screens.md)
- [Building a CRUD API](en/building-a-crud-api.md)
