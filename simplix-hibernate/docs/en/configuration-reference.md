# Configuration reference

The properties of the module. The second-level cache itself is configured with Hibernate's own properties under `spring.jpa.properties.hibernate`.

| Property | Default | Meaning |
|---|---|---|
| `simplix.hibernate.cache.disabled` | `false` | `true` leaves the cache eviction support out |
| `simplix.hibernate.cache.query-cache-auto-eviction` | `true` | clears the query cache together with the entity cache |
| `simplix.hibernate.cache.scan-packages` | none | the packages scanned for entities marked `@Cache` |
| `simplix.entity-events.enabled` | `true` | registers the entity event listener |
| `simplix.hibernate.json-column.enabled` | `true` | hands the JSON column type of hypersistence-utils the mapper and the copy described under "JSON columns" |
| `simplix.transaction.enabled` | `true` | registers `SimpliXJpaTransactionManager` and checks it at start |
| `simplix.transaction.fail-fast` | `false` | fails the start when another JPA transaction manager is active |
| `simplix.transaction.write-lock-retry.enabled` | `true` | retries a transaction that was refused the write lock |
| `simplix.transaction.write-lock-retry.attempts` | `6` | the attempts, the first included |
| `simplix.transaction.write-lock-retry.initial-backoff` | 25 ms | the wait before the second attempt |

## Second-level cache

```yaml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          use_query_cache: true
          region:
            factory_class: jcache
        javax:
          cache:
            provider: org.ehcache.jsr107.EhcacheCachingProvider
```

The module ships an `ehcache.xml` template on the classpath. To size the caches, copy it, name a cache per entity class or region, and point `hibernate.javax.cache.uri` at your file.

| `CacheConcurrencyStrategy` | Use it for |
|---|---|
| `READ_ONLY` | data that never changes, such as code tables |
| `NONSTRICT_READ_WRITE` | data that changes rarely and tolerates a short stale read |
| `READ_WRITE` | data that changes and must be read consistently |
| `TRANSACTIONAL` | JTA transactions |

## JSON columns

A column mapped with `@Type(JsonType.class)` of hypersistence-utils holds a value object as JSON. On the Spring Boot 4 line that column type writes and reads with Jackson 3, and it copies a value for Hibernate's dirty check only when the value is `Serializable`. A plain class or a record kept in such a column is then refused when its row is saved.

With hypersistence-utils and Jackson 3 on the classpath, `SimpliXJsonColumnAutoConfiguration` adds two properties to the persistence unit.

| Persistence unit property | Value the module adds | What it does |
|---|---|---|
| `hypersistence.utils.jackson.object.mapper` | `JsonColumnObjectMapperSupplier` | supplies a mapper that stores a value in the form the Spring Boot 3 line stored it in: dates as timestamps, an `OffsetDateTime` as ISO-8601 text. Rows written there stay readable and new rows have the same form. It reads a labeled enum stored as its name or as an object |
| `hypersistence.utils.json.serializer` | `JsonColumnCloner` | copies a value that is not `Serializable` by writing it as JSON and reading it back |

A value you set for either property under `spring.jpa.properties` is kept. The labeled enum is read by `LabeledEnumJsonColumnDeserializer`, attached through `LabeledEnumJsonColumnMixIn`. An `OffsetDateTime` is read by `OffsetDateTimeJsonColumnDeserializer`, from ISO-8601 text with its offset and from a timestamp. An `EntityManagerFactory` you build yourself receives the two properties when it is built with the `EntityManagerFactoryBuilder` bean of Spring Boot. A `@DataJpaTest` slice applies them as well.

The default mapper of the column type on the Spring Boot 4 line writes every date as ISO-8601 text. Rows it stored are read as well, and a row saved afterwards takes the form above. To keep the default mapper, set `simplix.hibernate.json-column.enabled` to `false`; the values then have to be `Serializable`.

## Related documents

- [Getting started](./getting-started.md)
- [How transactions are committed](./how-it-works.md)
