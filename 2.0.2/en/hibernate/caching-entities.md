# Caching entities

How to keep entities and query results in Hibernate's second-level cache, so that reading a record by its id, or running the same query again, does not reach the database.

## Mark an entity

```java
@Entity
@Table(name = "branches")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Branch extends SimpliXBaseEntity<String> {

    @Id
    @UuidV7Generator
    private String branchId;

    private String name;

    private boolean open = true;

    // A collection is cached only when it carries the annotation too
    @OneToMany(mappedBy = "branch")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    private List<Shelf> shelves = new ArrayList<>();
}
```

| `CacheConcurrencyStrategy` | Use it for |
|---|---|
| `READ_ONLY` | data that never changes, such as code tables; an update fails |
| `NONSTRICT_READ_WRITE` | data that changes rarely and tolerates a short stale read |
| `READ_WRITE` | data that changes and must be read consistently |
| `TRANSACTIONAL` | JTA transactions |

An entity is cached under a region named after its class, such as `com.example.library.domain.member.entity.Branch`. `@Cache(region = "branches")` gives it a name of your own, which several entities may share.

## Cache the result of a query

Reading by id uses the entity cache. A query uses the cache only when `hibernate.cache.use_query_cache` is on and the query is marked cacheable.

```java
public interface OpenBranchRepository extends SimpliXBaseRepository<Branch, String> {

    @Query("SELECT b FROM Branch b WHERE b.open = true ORDER BY b.name")
    @QueryHints(@QueryHint(name = "org.hibernate.cacheable", value = "true"))
    List<Branch> findOpen();
}
```

The query cache keeps the identifiers of the result, and the entities themselves come from the entity cache, so cache the entity as well. A change to any `Branch` invalidates the cached results of queries over that table.

## Size the caches

The module ships an `ehcache.xml` with three templates. Copy it into your resources, add a `cache` element per region, and point `spring.jpa.properties.hibernate.javax.cache.uri` at the copy.

```xml
<cache alias="com.example.library.domain.member.entity.Branch" uses-template="small"/>
<cache alias="branches" uses-template="large"/>
```

```yaml
spring:
  jpa:
    properties:
      hibernate:
        javax:
          cache:
            uri: classpath:library-ehcache.xml
```

| Template | Entries on the heap | Off-heap | Time to live |
|---|---|---|---|
| `default` | 1,000 | 10 MB | 1 hour |
| `small` | 500 | 5 MB | 30 minutes |
| `large` | 5,000 | 50 MB | 2 hours |

A region without an entry of its own uses no template. With `hibernate.javax.cache.missing_cache_strategy: create` it is created when it is first needed, with the default configuration of the cache provider, and Hibernate logs a warning that names the region. Give every region you rely on an entry.

The module also ships `application-hibernate-cache.yml`, which switches the second-level cache and the query cache on with Ehcache and this file. Activate the profile `hibernate-cache` to apply it instead of writing the properties yourself.

## See whether the cache is used

```java
Branch branch = branchRepository.findById(branchId).orElseThrow();   // reads the database, fills the cache
cacheManager.contains(Branch.class, branchId);                       // true
cacheManager.getActiveRegions();                                     // the regions that exist
```

```yaml
spring:
  jpa:
    properties:
      hibernate:
        generate_statistics: true

logging:
  level:
    org.hibernate.stat: DEBUG
```

With `spring.jpa.properties.hibernate.generate_statistics` on, Hibernate counts the hits, misses and puts of the second-level cache and logs them at the end of each session. Switch it on to check a change and off again in production: counting costs time on every query.

## What not to cache

- entities that are written more often than they are read: every write invalidates the entry
- entities with large values, such as documents or images
- entities another application changes in the same database, unless every such change is followed by an eviction; see [Evicting the entity cache](en/hibernate/evicting-the-entity-cache.md)

## Related documents

- [Evicting the entity cache](en/hibernate/evicting-the-entity-cache.md)
- [Configuration reference](en/hibernate/configuration-reference.md)
- [simplix-cache](en/cache/readme.md): caching values of your own
