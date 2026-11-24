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

Keys are written as the prefix, the cache name and the key, and each entry expires by the `ttl` of its call. Give applications that share a Redis server different prefixes.

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

Each cache name is a key-value bucket named by the prefix and the cache name, created on first use. A bucket has one retention time for all its entries: `cache-configs.<name>.ttl-seconds`, or `default-ttl-seconds`. A `ttl` passed to a call is ignored, and the retention of a bucket that already exists is not changed.

## A store of your own

Register a bean that implements `CacheStrategy`. The module then uses it for `CacheService` instead of the configured mode.

## Related documents

- [Configuration reference](en/cache/configuration-reference.md)
- [simplix-hibernate](en/hibernate/readme.md): the second-level cache of entities
