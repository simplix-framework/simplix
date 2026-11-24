# Troubleshooting simplix-hibernate

Symptoms an application meets with the entity cache, entity events and the transaction manager, the cause of each and what to change.

## Entity cache

| Symptom | Cause | What to do |
|---|---|---|
| A record read by id still shows the old value after a bulk update | a `@Modifying` query goes around the entities and leaves the cache stale | add `@EvictCache` to the repository method |
| A change made by MyBatis, JDBC or another application is not seen | Hibernate does not know about the change | call `HibernateCacheManager` after the change, or do not cache that entity |
| Instances return different values | an eviction reaches only the cache of the instance that ran it | use a distributed cache provider of Hibernate |
| `contains` answers false right after a read | the second-level cache is off, or the entity has no `@Cache` | set `use_second_level_cache: true` and the region factory, and mark the entity |
| Hibernate warns that a cache was created on the fly | the region has no entry in the cache configuration file | add a `cache` element for the region |
| A cached query returns rows a bulk change removed | `query-cache-auto-eviction` is off, or the change did not pass `@EvictCache` | keep the property on and evict after the change |

## Entity events and transactions

| Symptom | Cause | What to do |
|---|---|---|
| A `BEFORE_COMMIT` listener never receives an entity event | another JPA transaction manager is active, so the flush comes too late | remove the transaction manager bean of the application or extend `SimpliXJpaTransactionManager`; the start log names the active manager |
| The application does not start and the log names the transaction manager | `simplix.transaction.fail-fast` is on and another JPA manager is active | fix the manager, or switch `fail-fast` off to start with the error logged |
| An entity publishes no event | the entity lacks `@EntityListeners(EntityEventPublishingListener.class)` or `@EntityEventConfig`, or `simplix.entity-events.enabled` is `false` | add both annotations and keep the property on |
| A bulk import publishes an event per row | every saved entity publishes | run the import inside `EventContext.suppressEvents` |
| A method runs more than once in one call | the write lock was refused and the transaction was started over | keep work that must not repeat, such as sending mail, out of the transaction or after the commit |

## Related documents

- [How transactions are committed](./how-it-works.md)
- [Evicting the entity cache](./evicting-the-entity-cache.md)
