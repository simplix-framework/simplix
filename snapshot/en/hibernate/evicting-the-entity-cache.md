# Evicting the entity cache

When the second-level cache has to be told that data changed, and how to tell it. Changes through an entity need nothing; changes that go around the entities do.

| Change | Cache |
|---|---|
| `save`, `delete` and changes to a managed entity | kept correct by Hibernate |
| a `@Modifying` JPQL or native query | stale until evicted: use `@EvictCache` |
| a change by MyBatis, JDBC or another application | stale until evicted: use `HibernateCacheManager` |

## After a modifying query

```java
public interface BranchRepository extends SimpliXBaseRepository<Branch, String> {

    @Modifying
    @Query("UPDATE Branch b SET b.open = false WHERE b.name = :name")
    @EvictCache(Branch.class)
    int closeByName(@Param("name") String name);
}
```

| Attribute | Default | Meaning |
|---|---|---|
| `value` | required | the entities whose cached records are removed |
| `regions` | none | further cache regions to clear, by name |
| `evictQueryCache` | `true` | also clears the query cache |

The eviction happens after the method returns. Inside a transaction it waits for the commit, so a transaction that rolls back evicts nothing.

## From code

Inject `HibernateCacheManager`.

```java
cacheManager.evictEntity(Branch.class, branchId);   // one record
cacheManager.evictEntityCache(Branch.class);        // every record of the entity
cacheManager.evictRegion("branches");               // a named region
cacheManager.evictQueryRegion("default-query-results-region");
cacheManager.evictAll();

cacheManager.contains(Branch.class, branchId);      // whether the record is cached
```

| Method of `HibernateCacheManager` | Does |
|---|---|
| `evictEntity(entityClass, id)` | removes one record |
| `evictEntityCache(entityClass)` | removes every record of an entity |
| `evictRegion(regionName)` | clears a named region |
| `evictQueryRegion(queryRegion)` | clears the cached results of a query region |
| `evictAll()` | clears every region |
| `contains(entityClass, id)` | tells whether a record is cached |
| `registerRegion(regionName)`, `getActiveRegions()` | adds a region to the list the manager knows, and reads that list |

### Which entities are cached

`EntityCacheScanner` knows the entities marked `@Cache` in the packages under `simplix.hibernate.cache.scan-packages`. The module fills it at start by calling `scanForCachedEntities(packages...)`; an application may call the method again with further packages, and the entities found there are added. Use it to evict by a name that arrives from outside, such as the table a batch job touched.

```java
Class<?> entity = entityCacheScanner.findBySimpleName("Branch");
if (entity != null && entityCacheScanner.isCached(entity)) {
    cacheManager.evictEntityCache(entity);
}

entityCacheScanner.getCachedEntities();   // every cached entity class
entityCacheScanner.getCacheRegions();     // their regions
```

### Know when an eviction happened

After a commit the module publishes a `PendingEvictionCompletedEvent` with the evictions of that transaction. Each `PendingEviction` names the entity class, the id when one record was meant, the region, and a `PendingEviction.EvictionOperation`: `INSERT`, `UPDATE`, `DELETE`, `BULK_UPDATE` or `BULK_DELETE`.

```java
@Component
@Slf4j
public class EvictionLog {

    @EventListener
    public void on(PendingEvictionCompletedEvent event) {
        for (PendingEviction eviction : event.getPendingEvictions()) {
            log.info("evicted {} {} by {}", eviction.getEntityClassName(), eviction.getEntityId(), eviction.getOperation());
        }
    }
}
```

### See what is waiting for the commit

Evictions asked for inside a transaction are held until it commits. `TransactionAwareCacheEvictionCollector`, a bean, answers `getPendingCount()` and `hasPendingEvictions()` for the transaction of the calling thread, and 0 and `false` outside a transaction. Use them in a test or a debug log to see that a change registered its evictions.

## Cached queries

With `use_query_cache` on, a query marked cacheable keeps its result. `simplix.hibernate.cache.query-cache-auto-eviction` (on by default) clears the query cache together with the entity cache, so a cached query does not return rows a bulk change removed.

## Several instances

An eviction reaches the cache of the instance that ran it. For a cache shared by several instances, use a distributed provider of Hibernate (Hazelcast or Infinispan through JCache, or Redisson for Redis), which carries invalidations across the cluster.

## Related documents

- [Getting started](en/hibernate/getting-started.md)
- [simplix-cache](en/cache/readme.md): caching values of your own
