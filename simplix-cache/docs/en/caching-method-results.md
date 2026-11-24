# Caching method results

How to cache what a method returns with Spring's cache annotations. The module switches annotation caching on, so `@Cacheable`, `@CachePut` and `@CacheEvict` work on any bean.

## Step 1. Declare the cache

```yaml
simplix:
  cache:
    cache-configs:
      author-names:
        ttl-seconds: 600
```

> ⚠ In local mode an annotation that names a cache not listed under `cache-configs` fails with `Cannot find cache named ...`. Declare every cache name the annotations use.

## Step 2. Annotate the methods

```java
@Service
public class AuthorLabels {

    private final AtomicInteger loads = new AtomicInteger();
    private final Map<String, String> table = new ConcurrentHashMap<>(Map.of("a1", "Ursula", "a2", "Octavia"));

    // Read: the method body runs only on a miss
    @Cacheable(cacheNames = "authors", key = "#authorId", unless = "#result == null")
    public String labelOf(String authorId) {
        loads.incrementAndGet();
        return table.get(authorId);
    }

    // Update: always runs, and replaces the cached value with the result
    @CachePut(cacheNames = "authors", key = "#authorId")
    public String rename(String authorId, String label) {
        table.put(authorId, label);
        return label;
    }

    // Delete: removes the entry
    @CacheEvict(cacheNames = "authors", key = "#authorId")
    public void remove(String authorId) {
        table.remove(authorId);
    }

    // Reload: empties the whole cache
    @CacheEvict(cacheNames = "authors", allEntries = true)
    public void reload() {
    }

    // Several caches in one call
    @Caching(evict = {
        @CacheEvict(cacheNames = "authors", key = "#authorId"),
        @CacheEvict(cacheNames = "author-names", key = "#authorId")
    })
    public void forgetEverywhere(String authorId) {
    }

    public int loads() {
        return loads.get();
    }
}
```

Two calls of `labelOf("a1")` run the body once. After `rename("a1", "Ursula K.")` the next `labelOf("a1")` returns the new label without running the body. A call for an author that does not exist runs the body every time, because `unless` keeps `null` out of the cache. After `remove` or `reload` the body runs again.

| Annotation | Does |
|---|---|
| `@Cacheable` | returns the cached value, and runs the method only on a miss |
| `@CachePut` | always runs the method and stores its result |
| `@CacheEvict` | removes an entry, or every entry with `allEntries = true` |
| `@Caching` | groups several of the above on one method |

| Attribute | Of | Meaning |
|---|---|---|
| `cacheNames` | all | the caches the annotation works on |
| `key` | all | an expression for the key; without it the key is built from all parameters |
| `condition` | all | an expression checked before the call; `false` leaves the cache out |
| `unless` | `@Cacheable`, `@CachePut` | an expression checked after the call, with `#result`; `true` keeps the result out of the cache |
| `sync` | `@Cacheable` | `true` lets one thread load a missing value while the others wait for it |
| `allEntries` | `@CacheEvict` | `true` empties the cache instead of removing one key |
| `beforeInvocation` | `@CacheEvict` | `true` evicts before the method runs, so the entry is gone even when the method throws |

## Keys and conditions

- `key = "#authorId"` names a parameter; `key = "#request.code + ':' + #locale"` builds a key from several values.
- `condition = "#authorId != null"` decides before the call whether to use the cache; `unless = "#result == null"` decides afterwards whether to store the result.
- A call from one method of a class to another method of the same class does not pass the cache: the annotations work on calls that come through the Spring bean.

## Where annotated values are kept

| Mode | Spring cache manager | Time to live |
|---|---|---|
| `local` | an in-memory map per declared cache | entries stay until they are evicted; `ttl-seconds` is not applied |
| `redis` | a Redis cache manager | `cache-configs.<name>.ttl-seconds`, or `default-ttl-seconds` for a cache that is not declared |
| `nats` | the same in-memory map as `local` | entries stay until they are evicted, and are not shared between instances |

Register a `CacheManager` bean of your own to replace either. The cache service and the annotations keep separate entries, also in the same store, so use one of them for a given cache name.

## Related documents

- [Using the cache service](./using-the-cache-service.md)
- [Choosing a store](./choosing-a-store.md)
