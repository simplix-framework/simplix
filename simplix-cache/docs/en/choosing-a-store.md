# Choosing a store

Where cached values are kept. One instance can keep them in its own memory; several instances need a store they share, or each would answer from a different copy.

| `simplix.cache.mode` | Store | Shared | Needs |
|---|---|---|---|
| `local` (default) | Caffeine, in the memory of the instance | no | nothing |
| `redis` | Redis | yes | `spring-boot-starter-data-redis` and a Redis connection |
| `nats` | NATS JetStream key-value buckets | yes | `io.nats:jnats` and a `Connection` bean |

When the mode names a store whose library or connection is missing, the local store is used.

## Local

Each cache name is a Caffeine cache of at most 10,000 entries. A cache keeps the time to live of the call that created it: one hour, unless that first call passed a `ttl`. A different `ttl` on a later call does not change it.

## Redis

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379

simplix:
  cache:
    mode: redis
    default-ttl-seconds: 3600
    redis:
      key-prefix: "library:cache:"
```

The `CacheService` writes a key as the prefix, the cache name, `::` and the key (`library:cache:authors::a1`), and the entry expires by the `ttl` of its call. The Spring cache annotations write `authors::a1`, without the prefix, and the entry expires by `cache-configs.<name>.ttl-seconds` or `default-ttl-seconds`: `redis.key-prefix` applies to the `CacheService` only. A cache name used through both is two sets of keys. Applications that share a Redis server use different prefixes, and different cache names where they cache with annotations.

## NATS

```yaml
simplix:
  cache:
    mode: nats
    default-ttl-seconds: 3600
    cache-configs:
      authors:
        ttl-seconds: 600
    nats:
      bucket-prefix: library-cache-
      replicas: 3
```

Each cache name is a key-value bucket named by the prefix and the cache name, created on first use. A bucket has one retention time for all its entries: `cache-configs.<name>.ttl-seconds`, or `default-ttl-seconds`. A `ttl` passed to a call is ignored, and the retention of a bucket that already exists is not changed. A key is stored with every character NATS does not accept replaced by `_`, and `getKeys` returns the stored form: the key `ko:b1` is listed as `ko_b1`.

## A store of your own

Register a bean that implements `CacheStrategy`. The module then uses it for `CacheService` instead of the configured mode.

## Related documents

- [Configuration reference](./configuration-reference.md)
- [simplix-hibernate](../../../simplix-hibernate/README.md): the second-level cache of entities
