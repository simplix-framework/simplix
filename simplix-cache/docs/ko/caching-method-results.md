# 메서드 결과 캐싱

Spring의 캐시 어노테이션으로 메서드의 반환 값을 캐싱하는 방법을 설명합니다. 모듈이 어노테이션 캐싱을 활성화하므로 `@Cacheable`, `@CachePut`, `@CacheEvict`를 모든 빈에 사용할 수 있습니다.

## 1단계. 캐시 선언

```yaml
simplix:
  cache:
    cache-configs:
      author-names:
        ttl-seconds: 600
```

> ⚠ 로컬 모드에서는 `cache-configs`에 없는 캐시 이름을 어노테이션에 지정하면 `Cannot find cache named ...` 오류가 발생합니다. 어노테이션에서 사용하는 캐시 이름을 모두 선언하세요.

## 2단계. 메서드에 어노테이션 지정

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

`labelOf("a1")`을 연속으로 호출하면 메서드 본문은 한 번만 실행됩니다. `rename("a1", "Ursula K.")`을 호출한 뒤의 `labelOf("a1")`은 본문을 실행하지 않고 새 라벨을 반환합니다. 존재하지 않는 작가를 조회하면 `unless` 조건에 따라 `null`을 캐시에 저장하지 않으므로 매번 본문을 실행합니다. `remove`나 `reload`를 호출한 뒤에는 본문을 다시 실행합니다.

| 어노테이션 | 동작 |
|---|---|
| `@Cacheable` | 캐시된 값을 반환하고, 값이 없을 때만 메서드를 실행합니다 |
| `@CachePut` | 항상 메서드를 실행하고 결과를 저장합니다 |
| `@CacheEvict` | 항목을 제거합니다. `allEntries = true`이면 모든 항목을 제거합니다 |
| `@Caching` | 위 어노테이션 여러 개를 메서드에 함께 지정합니다 |

| 속성 | 어노테이션 | 의미 |
|---|---|---|
| `cacheNames` | 공통 | 어노테이션을 적용할 캐시 |
| `key` | 공통 | 키를 계산하는 표현식. 지정하지 않으면 모든 매개변수로 키를 구성합니다 |
| `condition` | 공통 | 호출 전에 평가하는 표현식. `false`이면 캐시를 사용하지 않습니다 |
| `unless` | `@Cacheable`, `@CachePut` | 호출 후에 `#result`로 평가하는 표현식. `true`이면 결과를 캐시에 저장하지 않습니다 |
| `sync` | `@Cacheable` | `true`이면 없는 값을 한 스레드만 불러오고 나머지 스레드는 그 결과를 기다립니다 |
| `allEntries` | `@CacheEvict` | `true`이면 캐시 전체를 비웁니다. 기본값인 `false`에서는 키 하나만 제거합니다 |
| `beforeInvocation` | `@CacheEvict` | `true`이면 메서드 실행 전에 제거하므로, 메서드에서 예외가 발생해도 항목이 제거됩니다 |

## 키와 조건

- `key = "#authorId"`는 매개변수를 지정하고, `key = "#request.code + ':' + #locale"`은 여러 값으로 키를 구성합니다.
- `condition = "#authorId != null"`은 호출 전에 캐시 사용 여부를 정하고, `unless = "#result == null"`은 호출 후에 결과 저장 여부를 정합니다.
- 같은 클래스의 메서드끼리 호출하면 캐시가 적용되지 않습니다. 어노테이션은 Spring 빈을 통해 들어온 호출에만 적용됩니다.

## 어노테이션 캐시의 저장 위치

| 모드 | Spring 캐시 매니저 | 유효 시간 |
|---|---|---|
| `local` | 선언한 캐시별 인메모리 맵 | 제거할 때까지 항목이 남습니다. `ttl-seconds`는 적용되지 않습니다 |
| `redis` | Redis 캐시 매니저 | `cache-configs.<name>.ttl-seconds`. 선언하지 않은 캐시에는 `default-ttl-seconds` |
| `nats` | `local`과 같은 인메모리 맵 | 제거할 때까지 항목이 남으며, 인스턴스 간에 공유되지 않습니다 |

`CacheManager` 빈을 직접 등록하면 이 매니저를 대체합니다. 캐시 서비스와 어노테이션은 같은 저장소를 사용하더라도 항목을 따로 보관하므로, 캐시 이름마다 한 가지 방식만 사용하세요.

## 관련 문서

- [캐시 서비스 사용](./using-the-cache-service.md)
- [저장소 선택](./choosing-a-store.md)
