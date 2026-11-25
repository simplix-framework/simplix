# Configuration reference

The properties of the module. The second-level cache itself is configured with Hibernate's own properties under `spring.jpa.properties.hibernate`.

| Property | Default | Meaning |
|---|---|---|
| `simplix.hibernate.cache.disabled` | `false` | `true` leaves the cache eviction support out |
| `simplix.hibernate.cache.query-cache-auto-eviction` | `true` | clears the query cache together with the entity cache |
| `simplix.hibernate.cache.scan-packages` | none | the packages scanned for entities marked `@Cache` |
| `simplix.entity-events.enabled` | `true` | registers the entity event listener |
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

## Related documents

- [Getting started](en/hibernate/getting-started.md)
- [How transactions are committed](en/hibernate/how-it-works.md)
