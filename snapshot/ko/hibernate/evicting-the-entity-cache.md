# 엔티티 캐시 제거

2차 캐시에 데이터 변경을 알려야 하는 경우와 그 방법을 설명합니다. 엔티티를 통한 변경에는 별도 작업이 필요 없고, 엔티티를 거치지 않는 변경에는 필요합니다.

| 변경 방식 | 캐시 |
|---|---|
| `save`, `delete`, 관리 중인 엔티티의 변경 | Hibernate가 정확하게 유지 |
| `@Modifying` JPQL 또는 네이티브 쿼리 | 제거할 때까지 오래된 값이 남습니다. `@EvictCache`를 사용합니다 |
| MyBatis, JDBC, 다른 애플리케이션이 실행한 변경 | 제거할 때까지 오래된 값이 남습니다. `HibernateCacheManager`를 사용합니다 |

## 수정 쿼리 실행 후

```java
public interface BranchRepository extends SimpliXBaseRepository<Branch, String> {

    @Modifying
    @Query("UPDATE Branch b SET b.open = false WHERE b.name = :name")
    @EvictCache(Branch.class)
    int closeByName(@Param("name") String name);
}
```

| 속성 | 기본값 | 의미 |
|---|---|---|
| `value` | 필수 | 캐시 레코드를 제거할 엔티티 |
| `regions` | 없음 | 추가로 비울 캐시 리전 이름 |
| `evictQueryCache` | `true` | 쿼리 캐시도 함께 비움 |

캐시 제거는 메서드가 반환된 뒤에 실행됩니다. 트랜잭션 안에서는 커밋을 기다리므로, 롤백된 트랜잭션은 캐시를 제거하지 않습니다.

## 코드에서 제거

`HibernateCacheManager`를 주입하세요.

```java
cacheManager.evictEntity(Branch.class, branchId);   // one record
cacheManager.evictEntityCache(Branch.class);        // every record of the entity
cacheManager.evictRegion("branches");               // a named region
cacheManager.evictQueryRegion("default-query-results-region");
cacheManager.evictAll();

cacheManager.contains(Branch.class, branchId);      // whether the record is cached
```

| `HibernateCacheManager`의 메서드 | 동작 |
|---|---|
| `evictEntity(entityClass, id)` | 레코드 한 건을 제거합니다 |
| `evictEntityCache(entityClass)` | 엔티티의 모든 레코드를 제거합니다 |
| `evictRegion(regionName)` | 이름으로 지정한 리전을 비웁니다 |
| `evictQueryRegion(queryRegion)` | 쿼리 리전의 캐시 결과를 비웁니다 |
| `evictAll()` | 모든 리전을 비웁니다 |
| `contains(entityClass, id)` | 레코드가 캐시되어 있는지 반환합니다 |
| `registerRegion(regionName)`, `getActiveRegions()` | 매니저가 관리하는 리전 목록에 리전을 추가하고, 목록을 조회합니다 |

### 캐시 대상 엔티티 조회

`EntityCacheScanner`는 `simplix.hibernate.cache.scan-packages`의 패키지에서 `@Cache`를 지정한 엔티티를 찾아 보관합니다. 배치 작업이 변경한 테이블처럼 외부에서 전달된 이름으로 캐시를 제거할 때 사용하세요.

```java
Class<?> entity = entityCacheScanner.findBySimpleName("Branch");
if (entity != null && entityCacheScanner.isCached(entity)) {
    cacheManager.evictEntityCache(entity);
}

entityCacheScanner.getCachedEntities();   // every cached entity class
entityCacheScanner.getCacheRegions();     // their regions
```

### 제거 시점 확인

커밋 후 모듈은 해당 트랜잭션의 제거 목록이 포함된 `PendingEvictionCompletedEvent`를 발행합니다. 각 `PendingEviction`에는 엔티티 클래스, 레코드 한 건이 대상이면 식별자, 리전, `PendingEviction.EvictionOperation`(`INSERT`, `UPDATE`, `DELETE`, `BULK_UPDATE`, `BULK_DELETE`)이 포함됩니다.

```java
@Component
@Slf4j
public class EvictionLog {

    @EventListener
    public void on(PendingEvictionCompletedEvent event) {
        for (PendingEviction eviction : event.getPendingEvictions()) {
            log.info("evicted {} {} by {}", eviction.getEntityClassName(), eviction.getEntityId(), eviction.getOperation());
        }
    }
}
```

## 쿼리 캐시

`use_query_cache`가 켜져 있으면 캐시 가능으로 지정한 쿼리의 결과가 보관됩니다. `simplix.hibernate.cache.query-cache-auto-eviction`(기본값 켜짐)은 엔티티 캐시와 함께 쿼리 캐시를 비우므로, 캐시된 쿼리가 일괄 변경으로 삭제된 행을 반환하지 않습니다.

## 여러 인스턴스

캐시 제거는 실행한 인스턴스의 캐시에만 적용됩니다. 여러 인스턴스가 캐시를 공유하려면 Hibernate의 분산 프로바이더(JCache 기반 Hazelcast나 Infinispan, Redis용 Redisson)를 사용하세요. 이 프로바이더가 클러스터 전체에 무효화를 전달합니다.

## 관련 문서

- [시작하기](ko/hibernate/getting-started.md)
- [simplix-cache](ko/cache/readme.md): 애플리케이션 값의 캐싱
