# 엔티티 캐싱

엔티티와 쿼리 결과를 Hibernate 2차 캐시에 보관하는 방법을 설명합니다. 식별자로 레코드를 읽거나 같은 쿼리를 다시 실행할 때 데이터베이스에 접근하지 않습니다.

## 엔티티 지정

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

| `CacheConcurrencyStrategy` | 용도 |
|---|---|
| `READ_ONLY` | 코드 테이블처럼 변경되지 않는 데이터. 수정하면 실패합니다 |
| `NONSTRICT_READ_WRITE` | 드물게 변경되고 짧은 시간의 오래된 조회를 허용하는 데이터 |
| `READ_WRITE` | 변경되며 일관되게 조회해야 하는 데이터 |
| `TRANSACTIONAL` | JTA 트랜잭션 |

엔티티는 `com.example.library.domain.member.entity.Branch`처럼 클래스 이름으로 된 리전에 캐시됩니다. `@Cache(region = "branches")`로 이름을 직접 지정할 수 있으며, 여러 엔티티가 같은 리전을 공유할 수 있습니다.

## 쿼리 결과 캐싱

식별자 조회는 엔티티 캐시를 사용합니다. 쿼리는 `hibernate.cache.use_query_cache`가 켜져 있고 쿼리를 캐시 대상으로 지정한 경우에만 캐시를 사용합니다.

```java
public interface OpenBranchRepository extends SimpliXBaseRepository<Branch, String> {

    @Query("SELECT b FROM Branch b WHERE b.open = true ORDER BY b.name")
    @QueryHints(@QueryHint(name = "org.hibernate.cacheable", value = "true"))
    List<Branch> findOpen();
}
```

쿼리 캐시에는 결과의 식별자를 보관하고 엔티티는 엔티티 캐시에서 읽으므로, 엔티티도 함께 캐시하세요. `Branch`가 하나라도 변경되면 해당 테이블을 조회하는 쿼리의 캐시 결과가 무효화됩니다.

## 캐시 크기 지정

모듈에는 템플릿이 정의된 `ehcache.xml`이 포함되어 있습니다. 이 파일을 애플리케이션의 리소스로 복사해 리전마다 `cache` 요소를 추가하고, `spring.jpa.properties.hibernate.javax.cache.uri`에 복사한 파일을 지정하세요.

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

| 템플릿 | 힙 항목 수 | 오프힙 | 유효 시간 |
|---|---|---|---|
| `default` | 1,000 | 10 MB | 1시간 |
| `small` | 500 | 5 MB | 30분 |
| `large` | 5,000 | 50 MB | 2시간 |

전용 항목이 없는 리전에는 템플릿이 적용되지 않습니다. `hibernate.javax.cache.missing_cache_strategy: create`이면 처음 필요할 때 캐시 프로바이더의 기본 구성으로 생성되고, Hibernate가 리전 이름이 포함된 경고를 로그에 기록합니다. 사용하는 리전에는 모두 항목을 지정하세요.

모듈에는 Ehcache와 이 파일로 2차 캐시와 쿼리 캐시를 켜는 `application-hibernate-cache.yml`도 포함되어 있습니다. 속성을 직접 작성하는 대신 `hibernate-cache` 프로파일을 활성화하면 이 설정이 적용됩니다.

## 캐시 사용 여부 확인

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

`spring.jpa.properties.hibernate.generate_statistics`를 켜면 Hibernate가 2차 캐시의 적중, 미스, 저장 횟수를 집계해 세션이 끝날 때 로그에 기록합니다. 변경 사항을 확인할 때만 켜고 운영 환경에서는 끄세요. 집계는 쿼리마다 시간을 소모합니다.

## 캐시하지 않을 대상

- 조회보다 쓰기가 잦은 엔티티. 쓸 때마다 항목이 무효화됩니다
- 문서나 이미지처럼 큰 값이 포함된 엔티티
- 다른 애플리케이션이 같은 데이터베이스에서 변경하는 엔티티. 변경할 때마다 캐시를 제거하는 경우는 예외입니다. [엔티티 캐시 제거](./evicting-the-entity-cache.md)를 참고하세요

## 관련 문서

- [엔티티 캐시 제거](./evicting-the-entity-cache.md)
- [설정 레퍼런스](./configuration-reference.md)
- [simplix-cache](../../../simplix-cache/README.ko.md): 직접 정의한 값의 캐싱
