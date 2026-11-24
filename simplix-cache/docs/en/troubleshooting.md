# Troubleshooting simplix-cache

Symptoms an application meets with the cache, the cause of each and what to change.

| Symptom | Cause | What to do |
|---|---|---|
| An annotated method fails with `Cannot find cache named ...` | in local mode the annotations know only the caches under `cache-configs` | declare the cache name under `simplix.cache.cache-configs` |
| An annotated method always runs its body | the call comes from another method of the same class, or `unless` or `condition` keeps the result out | call through the Spring bean, and check the two expressions |
| An annotated value never expires in local mode | the in-memory cache manager applies no time to live | evict on change, or use Redis mode, where `ttl-seconds` applies |
| A `ttl` passed to `put` has no effect | in the local store the cache keeps the time to live of the call that created it; in NATS a bucket has one retention time | use one cache name per time to live |
| `getOrCompute` returns `null` and the log shows an exception of the loader | a failing loader is logged and answered with `null` | handle the failure inside the loader, or check the result for `null` |
| A value is read with the wrong class and fails later with `ClassCastException` | the local store does not check the type of the call | read with the class the value was stored as |
| Instances answer with different values | the local store keeps one copy per instance | set `mode: redis` or `mode: nats` |
| `mode: redis` is set and `getStrategyName()` answers `LocalCacheStrategy` | the Redis library or the connection factory is missing, so the local store was chosen | add `spring-boot-starter-data-redis` and the connection settings |
| A value cannot be written to Redis or NATS | the class cannot be written as JSON, for example an entity with lazy associations | store a DTO or a record |
| `CacheManager.getInstance()` of simplix-core stores nothing | the static manager does not see the provider of this module | inject `CacheService` or `CacheProvider` |
| `removals` stays 0 in the statistics | the local store does not count removals by a call | read `puts`, `hits` and `size` instead |

## Related documents

- [How simplix-cache works](./how-it-works.md)
- [Monitoring the cache](./monitoring-the-cache.md)
