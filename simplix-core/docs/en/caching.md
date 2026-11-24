# Caching

A cache interface that any module can call without depending on a cache product. The implementation comes from [simplix-cache](../../../simplix-cache/README.md).

## Use the cache

Inject `CacheProvider`. With [simplix-cache](../../../simplix-cache/README.md) in the application the bean is its provider, and the values go to the store that module configures.

```java
@Service
@RequiredArgsConstructor
public class GenreLabels {

    private final CacheProvider cache;

    public String labelOf(String code) throws Exception {
        return cache.getOrCompute("genres", code, () -> loadLabel(code), String.class);
    }
}
```

| Method | Does |
|---|---|
| `get(cacheName, key, type)` | reads a value; empty when the key is absent |
| `put(cacheName, key, value)` | stores a value |
| `put(cacheName, key, value, ttl)` | stores a value that expires after `ttl` |
| `getOrCompute(cacheName, key, loader, type)` | reads a value, and on a miss calls `loader` and stores its result |
| `evict(cacheName, key)` | removes one value |
| `clear(cacheName)` | removes every value of the cache |
| `exists(cacheName, key)` | tells whether the key is present |
| `isAvailable()`, `getProviderName()` | tell whether a provider is in use and which |

## The static manager

`CacheManager.getInstance()` offers the same operations to code that is not a Spring bean. It finds its provider through Java's service loader only. The provider of simplix-cache is a Spring bean and is not registered that way, so with simplix-cache alone the static manager stores nothing: `get` is always empty and `getOrCompute` calls the loader every time.

```java
CacheManager cache = CacheManager.getInstance();

cache.put("authors", authorId, author, Duration.ofMinutes(10));
Optional<Author> cached = cache.get("authors", authorId, Author.class);

Author loaded = cache.getOrCompute("authors", authorId, () -> repository.findById(authorId).orElseThrow(), Author.class);

cache.evict("authors", authorId);
cache.clear("authors");
```

## Write a provider

A provider connects the interface to a store. Write one when the application keeps its cache in a product simplix-cache does not cover, or when code outside Spring has to cache through the static manager.

```java
public class InMemoryCacheProvider implements CacheProvider {

    private final Map<String, Map<Object, Object>> caches = new ConcurrentHashMap<>();

    @Override
    public <T> Optional<T> get(String cacheName, Object key, Class<T> type) {
        return Optional.ofNullable(type.cast(cache(cacheName).get(key)));
    }

    @Override
    public <T> void put(String cacheName, Object key, T value) {
        cache(cacheName).put(key, value);
    }

    @Override
    public <T> void put(String cacheName, Object key, T value, Duration ttl) {
        cache(cacheName).put(key, value);
    }

    @Override
    public <T> T getOrCompute(String cacheName, Object key, Callable<T> valueLoader, Class<T> type) {
        return get(cacheName, key, type).orElseGet(() -> {
            try {
                T loaded = valueLoader.call();
                put(cacheName, key, loaded);
                return loaded;
            } catch (Exception e) {
                throw new IllegalStateException("Could not load " + key, e);
            }
        });
    }

    @Override
    public void evict(String cacheName, Object key) {
        cache(cacheName).remove(key);
    }

    @Override
    public void clear(String cacheName) {
        cache(cacheName).clear();
    }

    @Override
    public boolean exists(String cacheName, Object key) {
        return cache(cacheName).containsKey(key);
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public String getName() {
        return "in-memory";
    }

    @Override
    public int getPriority() {
        return 10;
    }

    private Map<Object, Object> cache(String cacheName) {
        return caches.computeIfAbsent(cacheName, name -> new ConcurrentHashMap<>());
    }
}
```

Name the class in `src/main/resources/META-INF/services/dev.simplecore.simplix.core.cache.CacheProvider`, one fully qualified class name per line. The static manager loads every provider named that way, drops those whose `isAvailable()` is false and uses the one with the highest `getPriority()`. To use the provider through injection as well, declare it as a Spring bean.

```text
com.example.library.cache.InMemoryCacheProvider
```

## Related documents

- [simplix-cache](../../../simplix-cache/README.md)
- [simplix-hibernate](../../../simplix-hibernate/README.md): the second-level cache of entities
