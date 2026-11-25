# simplix-hibernate 시작하기

이 문서는 2차 캐시를 켜고 엔티티를 캐싱한 뒤, 일괄 쿼리로 테이블을 변경해도 캐시가 정확하게 유지되도록 구성하는 과정을 안내합니다.

## 1단계. 2차 캐시 활성화

```yaml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          use_query_cache: true
          region:
            factory_class: jcache
        javax:
          cache:
            provider: org.ehcache.jsr107.EhcacheCachingProvider
```

모듈에 Ehcache와 Hibernate의 JCache 브리지가 포함되어 있으므로, 인스턴스 메모리의 캐시에는 추가 의존성이 필요 없습니다.

## 2단계. 엔티티에 캐시 지정

```java
@Entity
@Table(name = "branches")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Branch extends SimpliXBaseEntity<String> {
    // ...
}
```

식별자로 조회한 레코드가 캐시에 보관되며, 두 번째 조회는 데이터베이스를 쿼리하지 않습니다. 엔티티를 통해 변경하면 Hibernate가 캐시를 갱신합니다. `save`와 `delete`는 캐시된 레코드를 갱신하거나 제거합니다.

## 3단계. 일괄 쿼리 후 캐시 제거

```java
public interface BranchRepository extends SimpliXBaseRepository<Branch, String> {

    @Modifying
    @Query("UPDATE Branch b SET b.open = false WHERE b.name = :name")
    @EvictCache(Branch.class)
    int closeByName(@Param("name") String name);
}
```

`@Modifying` 쿼리는 엔티티를 불러오지 않고 행을 변경하므로, Hibernate는 캐시의 어느 레코드가 오래되었는지 알 수 없습니다. `@EvictCache`는 트랜잭션이 커밋되면 지정한 엔티티의 캐시 레코드를 제거합니다. `closeByName`을 실행한 뒤에는 레코드가 캐시에 없으며, 다음 조회에서 변경된 행을 반환합니다.

## 다음 단계

- [엔티티 캐시 제거](ko/hibernate/evicting-the-entity-cache.md)
- [엔티티 이벤트 발행](ko/hibernate/publishing-entity-events.md)
