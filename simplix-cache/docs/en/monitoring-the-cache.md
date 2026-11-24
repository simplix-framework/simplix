# Monitoring the cache

How to see whether a cache is used and whether its store answers.

## Statistics of a cache

`cacheService.getStatistics("genres")` gives a snapshot.

```
CacheStatistics[hits=4, misses=3, evictions=0, puts=1, removals=0, hitRate=0.5714285714285714, size=3, memoryUsage=0]
```

A low hit rate means the keys are too specific or the time to live too short for the cache to pay off.

| Field of `CacheStatistics` | Counts |
|---|---|
| `hits`, `misses` | reads answered from the cache, and reads that found nothing |
| `hitRate` | `hits` divided by all reads, between 0 and 1 |
| `puts` | values stored |
| `evictions` | entries the store dropped by itself: expired, or over the size limit |
| `removals` | entries removed by a call; the local store does not count them and reports 0 |
| `size` | entries in the cache now |
| `memoryUsage` | memory in use; the local store reports 0 |

A cache that was never used answers with zeros in every field.

## Statistics in the log

Every 60 seconds the module logs, at `DEBUG`, the hits, misses, hit rate, size and evictions of each cache declared under `cache-configs` that was used. Set the logger `dev.simplecore.simplix.cache` to `DEBUG` to see them.

| Property | Default | Meaning |
|---|---|---|
| `simplix.cache.metrics.enabled` | `true` | collects the statistics |
| `simplix.cache.metrics.collectionIntervalSeconds` | `60` | seconds between two collections |

## Health

With Spring Boot Actuator, `/actuator/health` includes a `cache` component with the name of the store and whether it is available. It reports `DOWN` when the store does not answer.

## Related documents

- [Choosing a store](./choosing-a-store.md)
- [Configuration reference](./configuration-reference.md)
