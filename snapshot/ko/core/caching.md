# 캐싱

캐시 제품에 의존하지 않고 모든 모듈에서 호출할 수 있는 캐시 인터페이스를 설명합니다. 구현은 [simplix-cache](ko/cache/readme.md)가 제공합니다.

## 캐시 사용

`CacheProvider`를 주입하세요. 애플리케이션에 [simplix-cache](ko/cache/readme.md)가 있으면 이 모듈의 프로바이더가 빈으로 등록되며, 값은 이 모듈이 구성한 저장소에 저장됩니다.

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

| 메서드 | 동작 |
|---|---|
| `get(cacheName, key, type)` | 값을 조회합니다. 키가 없으면 빈 값을 반환합니다 |
| `put(cacheName, key, value)` | 값을 저장합니다 |
| `put(cacheName, key, value, ttl)` | `ttl` 후에 만료되는 값을 저장합니다 |
| `getOrCompute(cacheName, key, loader, type)` | 값을 조회하고, 없으면 `loader`를 호출해 결과를 저장합니다 |
| `evict(cacheName, key)` | 값 한 건을 제거합니다 |
| `clear(cacheName)` | 캐시의 모든 값을 제거합니다 |
| `exists(cacheName, key)` | 키가 있는지 확인합니다 |
| `isAvailable()`, `getProviderName()` | 사용 중인 프로바이더의 유무와 이름을 확인합니다 |

## 정적 매니저

`CacheManager.getInstance()`는 Spring 빈이 아닌 코드에서 같은 연산을 사용할 수 있게 합니다. 이 매니저는 Java 서비스 로더로만 프로바이더를 찾습니다. simplix-cache의 프로바이더는 Spring 빈이며 서비스 로더로 등록되지 않으므로, simplix-cache만 있을 때 정적 매니저는 값을 저장하지 않습니다. `get`은 항상 빈 값을 반환하고 `getOrCompute`는 매번 로더를 호출합니다.

```java
CacheManager cache = CacheManager.getInstance();

cache.put("authors", authorId, author, Duration.ofMinutes(10));
Optional<Author> cached = cache.get("authors", authorId, Author.class);

Author loaded = cache.getOrCompute("authors", authorId, () -> repository.findById(authorId).orElseThrow(), Author.class);

cache.evict("authors", authorId);
cache.clear("authors");
```

## 프로바이더 작성

프로바이더는 인터페이스를 저장소에 연결합니다. simplix-cache에서 지원하지 않는 제품에 캐시를 보관하거나, Spring 밖의 코드가 정적 매니저로 캐시를 사용해야 할 때 작성하세요.

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

`src/main/resources/META-INF/services/dev.simplecore.simplix.core.cache.CacheProvider` 파일에 클래스의 전체 이름을 한 줄에 하나씩 기재하세요. 정적 매니저는 이 방식으로 등록된 프로바이더를 모두 불러온 뒤 `isAvailable()`이 false인 프로바이더를 제외하고 `getPriority()`가 가장 높은 프로바이더를 사용합니다. 주입 방식으로도 사용하려면 프로바이더를 Spring 빈으로 선언하세요.

```text
com.example.library.cache.InMemoryCacheProvider
```

## 관련 문서

- [simplix-cache](ko/cache/readme.md)
- [simplix-hibernate](ko/hibernate/readme.md): 엔티티의 2차 캐시
