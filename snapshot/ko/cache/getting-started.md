# simplix-cache 시작하기

이 문서는 데이터베이스 조회 결과를 캐싱하고, 레코드가 바뀌면 캐시에서 제거하는 과정을 안내합니다. 설정 없이 로컬 캐시로 실행됩니다.

## 1단계. 모듈 추가

[스타터](ko/starter/readme.md)를 사용하는 애플리케이션에는 이미 포함되어 있습니다. 그렇지 않으면 `dev.simplecore.simplix:simplix-cache`를 추가하세요.

## 2단계. 조회 결과 캐싱

```java
@Service
@RequiredArgsConstructor
public class AuthorDirectory {

    private final CacheService cache;
    private final AuthorRepository authors;

    public Author find(String authorId) {
        return cache.getOrCompute("authors", authorId,
            () -> authors.findById(authorId).orElseThrow(), Author.class, Duration.ofMinutes(10));
    }

    public void rename(String authorId, String penName) {
        Author author = authors.findById(authorId).orElseThrow();
        author.setPenName(penName);
        authors.saveAndFlush(author);
        cache.evict("authors", authorId);
    }
}
```

`getOrCompute`는 캐시된 값을 반환하고, 값이 없으면 로더를 호출해 결과를 10분간 저장합니다. `evict`로 항목을 제거하면 다음 조회에서 변경된 레코드를 다시 읽습니다.

## 3단계. 확인

`find`를 두 번 호출하고 그 사이에 작가 이름을 바꿔 보세요. `rename`이 항목을 제거했으므로 두 번째 `find`는 새 이름을 반환합니다. `cacheService.getStrategyName()`으로 사용 중인 저장소를 확인할 수 있으며, 설정이 없으면 `LocalCacheStrategy`입니다.

## 다음 단계

- [캐시 서비스 사용](ko/cache/using-the-cache-service.md)
- [메서드 결과 캐싱](ko/cache/caching-method-results.md)
- [저장소 선택](ko/cache/choosing-a-store.md)
