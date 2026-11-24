# 캐시 서비스 사용

`CacheService`는 캐시를 직접 호출할 때 사용하는 빈입니다. 값은 이름이 지정된 캐시와 키에 속하며, 저장한 타입으로 다시 조회합니다.

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

## 연산

| 메서드 | 동작 |
|---|---|
| `get(cacheName, key, type)` | 값을 조회합니다. 없으면 빈 값을 반환합니다 |
| `put(cacheName, key, value)`, `put(..., ttl)` | 값을 저장합니다. 유효 시간을 지정할 수 있습니다 |
| `getOrCompute(cacheName, key, loader, type)`, `getOrCompute(..., ttl)` | 값을 조회하고, 없으면 로더를 호출해 결과를 저장합니다 |
| `putAll(cacheName, entries)`, `putAll(..., ttl)` | 여러 값을 저장합니다 |
| `getAll(cacheName, type)` | 캐시의 모든 항목을 조회합니다 |
| `getKeys(cacheName)` | 캐시의 키 목록을 조회합니다 |
| `exists(cacheName, key)` | 키가 있는지 확인합니다 |
| `evict(cacheName, key)`, `evictAll(cacheName, keys)` | 항목을 한 건 또는 여러 건 제거합니다 |
| `clear(cacheName)`, `clearAll()` | 캐시 한 개 또는 전체를 비웁니다 |
| `getStatistics(cacheName)` | 캐시의 적중, 미스, 저장, 제거, 축출 횟수와 적중률, 크기를 반환합니다 |
| `getStrategyName()`, `isAvailable()` | 사용 중인 저장소와 응답 여부를 확인합니다 |

## 캐시를 거친 조회와 변경

일반적인 구조는 서비스 하나가 캐시 이름 하나를 전담하는 방식입니다. 조회는 `getOrCompute`로 처리하고, 레코드를 변경하는 모든 메서드에서 해당 레코드의 항목을 교체하거나 제거합니다.

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

- `getOrCompute`는 로더를 한 번만 호출합니다. 같은 키로 세 번 호출하면 값을 한 번 불러오고 나머지는 캐시의 값을 반환합니다.
- 로더가 `null`을 반환하면 아무것도 저장하지 않으므로, 존재하지 않는 레코드는 호출할 때마다 다시 조회합니다. 이런 조회가 잦다면 작은 표식 값을 반환하세요.
- 로더에서 예외가 발생해도 호출은 실패하지 않습니다. 예외를 로그에 기록하고 `getOrCompute`가 `null`을 반환합니다. 호출자가 실패를 알아야 한다면 로더 안에서 처리하세요.

## 키

키는 `toString` 결과가 일정한 객체이면 됩니다. `"ko:b1"`처럼 구성 요소를 연결한 문자열 키는 Redis와 로그에서 읽기 쉽습니다. `List.of("ko", "b2")` 같은 `List`도 사용할 수 있으며 `[ko, b2]`로 저장됩니다.

## 여러 항목 일괄 처리

```java
cache.putAll("shelves", Map.of("s2", new ShelfInfo("s2", 2), "s3", new ShelfInfo("s3", 6)));

cache.getAll("shelves", ShelfInfo.class).keySet();   // s1, s2, s3
cache.evictAll("shelves", List.of("s2", "s3"));
cache.getKeys("shelves");                            // s1
```

## 타입 인자

값은 저장할 때의 클래스로 읽으세요. 로컬 저장소는 저장된 객체를 호출의 클래스와 대조하지 않고 그대로 반환하므로, 클래스를 잘못 지정하면 값을 사용하는 위치에서 `ClassCastException`이 발생합니다.

## 유효 시간

`ttl` 인자가 적용되는 방식은 저장소마다 다르며, 규칙은 [저장소 선택](./choosing-a-store.md)에 있습니다. 로컬 저장소에서는 캐시를 생성한 호출의 유효 시간이 유지되고, 그 호출에서 지정하지 않으면 1시간입니다. 캐시 이름마다 같은 유효 시간을 사용하세요.

## 저장하는 값

- Redis와 NATS는 값을 JSON으로 저장합니다. Jackson으로 쓰고 읽을 수 있는 클래스를 저장하세요. 지연 로딩 연관 관계가 있는 엔티티 대신 DTO와 레코드를 사용합니다.
- `simplix.cache.cache-null-values`는 어노테이션을 지정한 메서드가 반환한 `null`을 Redis 캐시 매니저가 저장할지를 정하며, 기본값은 `false`입니다.
- 데이터가 바뀌는 위치에서 캐시를 갱신하세요. 레코드를 수정하는 메서드에서 항목을 제거하거나 교체합니다.

## simplix-cache에 의존하지 않는 모듈에서 사용

이 모듈은 simplix-core의 캐시 인터페이스인 `CacheProvider` 빈도 등록하며, 같은 서비스를 사용합니다. 라이브러리 코드는 이 인터페이스를 주입해 사용합니다. [캐싱](../../../simplix-core/docs/ko/caching.md)을 참고하세요.

## 관련 문서

- [메서드 결과 캐싱](./caching-method-results.md)
- [저장소 선택](./choosing-a-store.md)
