# Using the cache service

`CacheService` is the bean for explicit cache calls. A value belongs to a named cache and a key, and is read back with the type it was stored as.

```java
cache.put("genres", "f", "Fantasy");
cache.get("genres", "f", String.class);      // Optional[Fantasy]
cache.get("genres", "x", String.class);      // Optional.empty
cache.exists("genres", "f");                 // true

// The loader runs once; later calls return the cached value
cache.getOrCompute("genres", "s", () -> "Science fiction", String.class);

cache.putAll("genres", Map.of("h", "History", "p", "Poetry"));
cache.getKeys("genres");                     // f, h, p, s
cache.getAll("genres", String.class);        // every entry of the cache

cache.evict("genres", "f");
cache.evictAll("genres", List.of("h", "p"));
cache.clear("genres");
```

## Operations

| Method | Does |
|---|---|
| `get(cacheName, key, type)` | reads a value; empty on a miss |
| `put(cacheName, key, value)`, `put(..., ttl)` | stores a value, optionally with its time to live |
| `getOrCompute(cacheName, key, loader, type)`, `getOrCompute(..., ttl)` | reads a value, and on a miss calls the loader and stores its result |
| `putAll(cacheName, entries)`, `putAll(..., ttl)` | stores several values |
| `getAll(cacheName, type)` | reads every entry of a cache |
| `getKeys(cacheName)` | lists the keys of a cache |
| `exists(cacheName, key)` | tells whether a key is present |
| `evict(cacheName, key)`, `evictAll(cacheName, keys)` | removes one entry or several |
| `clear(cacheName)`, `clearAll()` | empties one cache or all of them |
| `getStatistics(cacheName)` | gives the hits, misses, puts, removals, evictions, hit rate and size of a cache |
| `getStrategyName()`, `isAvailable()` | tell which store is in use and whether it answers |

## Read and write through the cache

The usual shape is a service that owns one cache name: it reads through `getOrCompute`, and every method that changes a record replaces or removes the entry of that record.

```java
@Service
@RequiredArgsConstructor
public class ShelfDirectory {

    private static final String CACHE = "shelves";

    private final ShelfRepository repository;
    private final CacheService cache;

    // Read through the cache: the repository is asked only on a miss
    public ShelfInfo find(String code) throws Exception {
        return cache.getOrCompute(CACHE, code, () -> load(code), ShelfInfo.class, Duration.ofMinutes(10));
    }

    // Write, then replace the cached value with what was stored
    @Transactional
    public ShelfInfo resize(String code, int rows) {
        Shelf shelf = repository.findById(code).orElseThrow();
        shelf.setRows(rows);
        ShelfInfo info = ShelfInfo.of(repository.save(shelf));
        cache.put(CACHE, code, info, Duration.ofMinutes(10));
        return info;
    }

    // Delete, then remove the cached value
    @Transactional
    public void remove(String code) {
        repository.deleteById(code);
        cache.evict(CACHE, code);
    }

    private ShelfInfo load(String code) {
        return repository.findById(code).map(ShelfInfo::of).orElse(null);
    }
}
```

- `getOrCompute` calls the loader once: three calls for the same key load the value one time and answer the other two from the cache.
- A loader that returns `null` stores nothing, so a record that does not exist is looked up again on every call. Return a small marker value when such lookups are frequent.
- A loader that throws does not fail the call: the exception is logged and `getOrCompute` returns `null`. Handle the failure inside the loader when the caller has to see it.

## Keys

A key is any object with a stable `toString`. A text key that joins the parts, such as `"ko:b1"`, reads well in Redis and in logs; a `List` such as `List.of("ko", "b2")` works too and is stored as `[ko, b2]`.

## Several entries at once

```java
cache.putAll("shelves", Map.of("s2", new ShelfInfo("s2", 2), "s3", new ShelfInfo("s3", 6)));

cache.getAll("shelves", ShelfInfo.class).keySet();   // s1, s2, s3
cache.evictAll("shelves", List.of("s2", "s3"));
cache.getKeys("shelves");                            // s1
```

## The type argument

Read a value with the class it was stored as. The local store returns the stored object without checking it against the class of the call, so a wrong class shows up later as a `ClassCastException` where the value is used.

## Time to live

How a `ttl` argument is applied depends on the store; [Choosing a store](en/cache/choosing-a-store.md) has the rules. In the local store a cache keeps the time to live of the call that created it, one hour when that call names none, so use one time to live per cache name.

## What to store

- Redis and NATS store values as JSON, so store classes Jackson can write and read: DTOs and records, not entities with lazy associations.
- `simplix.cache.cache-null-values` decides whether the Redis cache manager stores a `null` an annotated method returns; it is `false` by default.
- Change the cache where the data changes: evict or replace the entry in the method that writes the record.

## From a module that does not depend on simplix-cache

The module also registers a `CacheProvider` bean, the cache interface of simplix-core, backed by the same service. Library code injects that interface; see [Caching](en/core/caching.md).

## Related documents

- [Caching method results](en/cache/caching-method-results.md)
- [Choosing a store](en/cache/choosing-a-store.md)
