# Getting started with simplix-cache

This page caches the result of a database read and removes it when the record changes. It runs with no configuration, on a local cache.

## Step 1. Add the module

An application that uses the [starter](../../../spring-boot-starter-simplix/README.md) has it. Otherwise add `dev.simplecore.simplix:simplix-cache`.

## Step 2. Cache a read

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

`getOrCompute` returns the cached value, and on a miss calls the loader and stores what it returns for ten minutes. `evict` removes the entry so that the next read loads the changed record.

## Step 3. Check it

Call `find` twice and rename the author in between: the second `find` returns the new name, because `rename` evicted the entry. `cacheService.getStrategyName()` tells which store is in use; with no configuration it is `LocalCacheStrategy`.

## Next steps

- [Using the cache service](./using-the-cache-service.md)
- [Caching method results](./caching-method-results.md)
- [Choosing a store](./choosing-a-store.md)
