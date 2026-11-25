# Designing caches

What to decide before a value goes into a cache: what is worth caching, how it is keyed, how long it lives and how it stays right. The rules apply to `CacheService` and to the annotations alike.

## What is worth caching

| Cache it | Leave it |
|---|---|
| read often and changed seldom: codes, settings, labels, permission sets | changed on almost every read: counters, balances, stock |
| costly to produce: a join over several tables, a call to another service | cheap to read: a row found by its primary key in a table that is already in the database cache |
| the same for many callers | different for every caller and seldom asked for twice |

## Name the cache and the key

- Give each kind of value its own cache name, such as `authors` and `author-names`. One name means one time to live, one set of statistics and one `clear`.
- Build the key from everything the value depends on. A label that depends on the language has the language in its key: `ko:a1`, not `a1`.
- Keep keys short and readable. A key is stored with every entry and shows up in logs and in Redis.
- Do not put personal data into a key: keys are listed by `getKeys` and by the tools of the store.

## Choose a time to live

| Kind of value | Time to live | Why |
|---|---|---|
| codes and labels changed by a deployment or by an administrator | hours | a stale value is harmless and the change is rare |
| records users edit | minutes, and replaced or evicted on every write | the eviction keeps the cache right; the time to live only bounds a missed eviction |
| results of another service | as long as that service allows | the owner of the data decides how stale it may be |
| one-time values such as verification codes | their own validity, in seconds or minutes | the cache is the store; the entry must be gone when the value expires |

In the local store a cache name keeps the time to live of the call that created it, so give each lifetime its own cache name. [Choosing a store](en/cache/choosing-a-store.md) has the rule of each store.

## Keep the cache right

- Change the cache in the method that changes the data, after the write succeeded: `put` the new value, or `evict` and let the next read load it.
- Evict rather than update when the cached value is built from several records; rebuilding it on the next read is simpler than patching it.
- A write in a transaction that rolls back leaves a cache entry that is ahead of the database. Change the cache after the commit when that matters, for example in a `@TransactionalEventListener`.
- With several instances, use a shared store. With the local store each instance has its own copy, and an eviction on one does not reach the others.

## Fill a cache at startup

```java
@Component
@RequiredArgsConstructor
public class GenreCacheWarmer implements ApplicationRunner {

    private final GenreRepository repository;
    private final CacheService cache;

    @Override
    public void run(ApplicationArguments args) {
        Map<Object, String> labels = repository.findAll().stream()
            .collect(Collectors.toMap(Genre::getCode, Genre::getName));
        cache.putAll("genres", labels, Duration.ofHours(6));
    }
}
```

Warm only small, complete sets every request needs. A cache that fills as it is read needs no warming.

## Check that it pays off

Read `getStatistics(cacheName)` after a day of use. A hit rate near zero means the keys are too specific or the entries expire before they are read again; a cache whose size keeps growing means the keys never repeat. See [Monitoring the cache](en/cache/monitoring-the-cache.md).

## Related documents

- [Using the cache service](en/cache/using-the-cache-service.md)
- [Caching method results](en/cache/caching-method-results.md)
- [Choosing a store](en/cache/choosing-a-store.md)
