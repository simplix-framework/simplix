# 설정 레퍼런스

모듈의 속성을 정리합니다. 2차 캐시 자체는 `spring.jpa.properties.hibernate` 아래의 Hibernate 속성으로 설정합니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.hibernate.cache.disabled` | `false` | `true`이면 캐시 제거 기능을 제외 |
| `simplix.hibernate.cache.query-cache-auto-eviction` | `true` | 엔티티 캐시와 함께 쿼리 캐시를 비움 |
| `simplix.hibernate.cache.scan-packages` | 없음 | `@Cache`가 지정된 엔티티를 찾을 패키지 |
| `simplix.entity-events.enabled` | `true` | 엔티티 이벤트 리스너 등록 |
| `simplix.transaction.enabled` | `true` | `SimpliXJpaTransactionManager`를 등록하고 시작할 때 확인 |
| `simplix.transaction.fail-fast` | `false` | 다른 JPA 트랜잭션 매니저가 활성이면 시작 실패 |
| `simplix.transaction.write-lock-retry.enabled` | `true` | 쓰기 잠금이 거부된 트랜잭션 재시도 |
| `simplix.transaction.write-lock-retry.attempts` | `6` | 첫 시도를 포함한 시도 횟수 |
| `simplix.transaction.write-lock-retry.initial-backoff` | 25ms | 두 번째 시도 전 대기 시간 |

## 2차 캐시

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

모듈은 클래스패스에 `ehcache.xml` 템플릿을 제공합니다. 캐시 크기를 조정하려면 이 파일을 복사해 엔티티 클래스나 리전별로 캐시를 정의하고, `hibernate.javax.cache.uri`에 파일 위치를 지정하세요.

| `CacheConcurrencyStrategy` | 용도 |
|---|---|
| `READ_ONLY` | 코드 테이블처럼 변경되지 않는 데이터 |
| `NONSTRICT_READ_WRITE` | 드물게 변경되며 잠시 오래된 값을 읽어도 되는 데이터 |
| `READ_WRITE` | 변경되며 일관되게 읽어야 하는 데이터 |
| `TRANSACTIONAL` | JTA 트랜잭션 |

## 관련 문서

- [시작하기](ko/hibernate/getting-started.md)
- [트랜잭션 커밋 방식](ko/hibernate/how-it-works.md)
