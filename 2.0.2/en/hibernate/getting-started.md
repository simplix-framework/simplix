# Getting started with simplix-hibernate

This page switches the second-level cache on, caches an entity, and keeps the cache correct when a bulk query changes the table.

## Step 1. Switch the second-level cache on

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

The module brings Ehcache and the JCache bridge of Hibernate, so no further dependency is needed for a cache in the memory of the instance.

## Step 2. Mark the entity

```java
@Entity
@Table(name = "branches")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Branch extends SimpliXBaseEntity<String> {
    // ...
}
```

A record read by id is now kept, and a second read does not query the database. Hibernate keeps the cache correct for changes made through the entity: `save` and `delete` update or remove the cached record.

## Step 3. Evict after a bulk query

```java
public interface BranchRepository extends SimpliXBaseRepository<Branch, String> {

    @Modifying
    @Query("UPDATE Branch b SET b.open = false WHERE b.name = :name")
    @EvictCache(Branch.class)
    int closeByName(@Param("name") String name);
}
```

A `@Modifying` query changes rows without loading the entities, so Hibernate does not know which cached records are stale. `@EvictCache` removes the cached records of the named entity once the transaction commits. After `closeByName` the record is no longer cached, and the next read returns the changed row.

## Next steps

- [Evicting the entity cache](en/hibernate/evicting-the-entity-cache.md)
- [Publishing entity events](en/hibernate/publishing-entity-events.md)
