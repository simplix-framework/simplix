# 설정 레퍼런스

모듈의 속성을 정리합니다. 2차 캐시 자체는 `spring.jpa.properties.hibernate` 아래의 Hibernate 속성으로 설정합니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.hibernate.cache.disabled` | `false` | `true`이면 캐시 제거 기능을 제외 |
| `simplix.hibernate.cache.query-cache-auto-eviction` | `true` | 엔티티 캐시와 함께 쿼리 캐시를 비움 |
| `simplix.hibernate.cache.scan-packages` | 없음 | `@Cache`가 지정된 엔티티를 찾을 패키지 |
| `simplix.entity-events.enabled` | `true` | 엔티티 이벤트 리스너 등록 |
| `simplix.hibernate.json-column.enabled` | `true` | hypersistence-utils의 JSON 컬럼 타입에 아래 「JSON 컬럼」의 매퍼와 복제기를 지정 |
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

## JSON 컬럼

hypersistence-utils의 `@Type(JsonType.class)`로 매핑한 컬럼은 값 객체를 JSON으로 저장합니다. Spring Boot 4 라인에서 이 컬럼 타입은 Jackson 3으로 읽고 쓰며, Hibernate의 변경 감지를 위한 값 복제는 값이 `Serializable`일 때만 수행합니다. 그래서 일반 클래스나 레코드를 저장한 컬럼은 행을 저장할 때 거부됩니다.

hypersistence-utils와 Jackson 3이 클래스패스에 있으면 `SimpliXJsonColumnAutoConfiguration`이 영속성 단위에 다음 속성을 추가합니다.

| 영속성 단위 속성 | 모듈이 추가하는 값 | 역할 |
|---|---|---|
| `hypersistence.utils.jackson.object.mapper` | `JsonColumnObjectMapperSupplier` | Spring Boot 3 라인이 저장하던 형식으로 값을 저장하는 매퍼를 제공합니다. 날짜는 타임스탬프로, `OffsetDateTime`은 ISO-8601 문자열로 저장합니다. Spring Boot 3 라인에서 저장한 행을 그대로 읽고 새 행도 같은 형식으로 저장하며, 라벨 열거형을 이름 문자열과 객체 형식 모두에서 읽습니다 |
| `hypersistence.utils.json.serializer` | `JsonColumnCloner` | `Serializable`이 아닌 값을 JSON으로 썼다가 다시 읽어 복제합니다 |

`spring.jpa.properties`에 직접 지정한 값은 그대로 유지합니다. 라벨 열거형은 `LabeledEnumJsonColumnMixIn`으로 연결한 `LabeledEnumJsonColumnDeserializer`가 읽습니다. `OffsetDateTime`은 `OffsetDateTimeJsonColumnDeserializer`가 읽으며, ISO-8601 문자열은 오프셋을 유지하고 타임스탬프도 읽습니다. 직접 구성하는 `EntityManagerFactory`는 Spring Boot의 `EntityManagerFactoryBuilder` 빈으로 만들면 이 속성을 받습니다. `@DataJpaTest` 슬라이스에도 같은 속성을 적용합니다.

Spring Boot 4 라인에서 컬럼 타입의 기본 매퍼는 모든 날짜를 ISO-8601 문자열로 저장합니다. 기본 매퍼로 저장한 행도 읽을 수 있으며, 이후에 저장하는 행은 위 표의 형식으로 저장합니다. 기본 매퍼를 계속 사용하려면 `simplix.hibernate.json-column.enabled`를 `false`로 지정하세요. 이 경우 값은 `Serializable`이어야 합니다.

## 관련 문서

- [시작하기](ko/hibernate/getting-started.md)
- [트랜잭션 커밋 방식](ko/hibernate/how-it-works.md)
