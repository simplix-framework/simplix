# How simplix-cache works

The beans the module registers, how it picks a store, and why the cache service and the cache annotations keep separate entries.

## The beans

| Bean | Class | Role |
|---|---|---|
| the store | `LocalCacheStrategy`, `RedisCacheStrategy` or `NatsCacheStrategy`, each a `CacheStrategy` | keeps the values of the cache service |
| the service | `CacheService` | the API applications call; it passes every call to the store |
| the provider | `CoreCacheProviderImpl` | offers the service as the `CacheProvider` of simplix-core, for modules that do not depend on simplix-cache |
| the Spring cache manager | an in-memory manager, or a Redis one in `redis` mode | keeps the values of `@Cacheable` and the other annotations |
| the collector | `CacheMetricsCollector` | logs the statistics of the declared caches on a schedule |
| the health indicator | `CacheHealthIndicator` | reports the store to Spring Boot Actuator |

`SimpliXCacheAutoConfiguration` registers all of them, with `simplix.cache.enabled` as its switch, and binds `simplix.cache` to `CacheProperties`. Its nested configurations add the Redis beans, the NATS beans, the health indicator and the collector when their library is on the classpath.

## How the store is picked

1. A `CacheStrategy` bean of the application wins over everything else.
2. With `mode: redis`, the Redis library on the classpath and a Redis connection factory, the store is `RedisCacheStrategy`.
3. With `mode: nats`, the NATS client on the classpath and a `Connection` bean, the store is `NatsCacheStrategy`.
4. Otherwise the store is `LocalCacheStrategy`. A mode whose library or connection is missing ends here too, without an error: check `cacheService.getStrategyName()` or the health endpoint to see which store is in use.

## The service and the annotations are separate

A value stored with `cacheService.put("authors", ...)` is not what `@Cacheable(cacheNames = "authors")` reads. The service writes to the `CacheStrategy`; the annotations write to the Spring `CacheManager`. The two are different beans, with different rules:

|  | Cache service | Cache annotations |
|---|---|---|
| Cache names | created on first use | in local and NATS mode, only the names under `cache-configs` |
| Time to live, local mode | that of the call that created the cache; one hour by default | none: entries stay until evicted |
| Time to live, Redis mode | that of each call | `cache-configs.<name>.ttl-seconds`, or `default-ttl-seconds` |
| Shared between instances | in Redis and NATS mode | in Redis mode only |
| Statistics | `getStatistics(cacheName)` | not included |

Use one of the two for a given cache name, so nobody expects an eviction through one to clear the other.

## Related documents

- [Choosing a store](./choosing-a-store.md)
- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
