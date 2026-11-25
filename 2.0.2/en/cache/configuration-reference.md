# Configuration reference

Every property of the module, under `simplix.cache`.

| Property | Default | Meaning |
|---|---|---|
| `enabled` | `true` | switches the module on |
| `mode` | `local` | `local`, `redis` or `nats` |
| `default-ttl-seconds` | `3600` | the time to live of the Redis cache manager and of NATS buckets, for a cache that sets none |
| `cache-null-values` | `false` | lets the Redis cache manager store `null` results |
| `cache-configs.<name>.ttl-seconds` | none | declares a cache for the annotations and sets its time to live in Redis and NATS |
| `redis.key-prefix` | `cache:` | the prefix of the Redis keys the `CacheService` writes; the cache annotations write keys without it |
| `redis.use-key-prefix` | `true` | writes the prefix in front of the keys of the `CacheService` |
| `nats.bucket-prefix` | `simplix-cache-` | the prefix of the NATS bucket names |
| `nats.replicas` | `1` | the replicas of a NATS bucket |
| `metrics.enabled` | `true` | collects cache statistics |
| `metrics.collectionIntervalSeconds` | `60` | seconds between two collections |

## Beans you can replace

| Bean | Replace it to |
|---|---|
| `CacheStrategy` | keep `CacheService` values in a store of your own |
| `CacheManager` (Spring) | change where annotated values are kept |
| `CacheService` | wrap or extend the service |

## Related documents

- [Choosing a store](en/cache/choosing-a-store.md)
- [Monitoring the cache](en/cache/monitoring-the-cache.md)
