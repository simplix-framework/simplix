# simplix-hibernate 문제 해결

엔티티 캐시, 엔티티 이벤트, 트랜잭션 매니저를 사용할 때 발생하는 증상과 원인, 조치를 정리합니다.

## 엔티티 캐시

| 증상 | 원인 | 조치 |
|---|---|---|
| 일괄 수정 후에도 식별자로 읽은 레코드가 이전 값을 반환함 | `@Modifying` 쿼리는 엔티티를 거치지 않으므로 캐시가 갱신되지 않습니다 | 저장소 메서드에 `@EvictCache`를 추가하세요 |
| MyBatis, JDBC, 다른 애플리케이션에서 변경한 내용이 반영되지 않음 | Hibernate가 해당 변경을 알지 못합니다 | 변경 후 `HibernateCacheManager`를 호출하거나 해당 엔티티를 캐시하지 마세요 |
| 인스턴스마다 다른 값을 반환함 | 캐시 제거는 실행한 인스턴스의 캐시에만 적용됩니다 | Hibernate의 분산 캐시 프로바이더를 사용하세요 |
| 조회 직후에도 `contains`가 false를 반환함 | 2차 캐시가 꺼져 있거나 엔티티에 `@Cache`가 없습니다 | `use_second_level_cache: true`와 리전 팩토리를 지정하고 엔티티에 어노테이션을 지정하세요 |
| Hibernate가 캐시를 즉석에서 생성했다는 경고를 기록함 | 캐시 구성 파일에 해당 리전의 항목이 없습니다 | 리전의 `cache` 요소를 추가하세요 |
| 캐시된 쿼리가 일괄 변경으로 삭제된 행을 반환함 | `query-cache-auto-eviction`이 꺼져 있거나 변경이 `@EvictCache`를 거치지 않았습니다 | 속성을 켠 상태로 유지하고 변경 후 캐시를 제거하세요 |

## 엔티티 이벤트와 트랜잭션

| 증상 | 원인 | 조치 |
|---|---|---|
| `BEFORE_COMMIT` 리스너가 엔티티 이벤트를 받지 못함 | 다른 JPA 트랜잭션 매니저가 활성화되어 플러시가 늦게 실행됩니다 | 애플리케이션의 트랜잭션 매니저 빈을 제거하거나 `SimpliXJpaTransactionManager`를 상속하세요. 시작 로그에서 활성 매니저를 확인할 수 있습니다 |
| 애플리케이션이 시작되지 않고 로그에 트랜잭션 매니저가 언급됨 | `simplix.transaction.fail-fast`가 켜져 있고 다른 JPA 매니저가 활성화되어 있습니다 | 매니저를 바로잡거나, `fail-fast`를 꺼서 오류만 기록하고 시작하세요 |
| 엔티티에서 이벤트가 발행되지 않음 | 엔티티에 `@EntityListeners(EntityEventPublishingListener.class)`나 `@EntityEventConfig`가 없거나 `simplix.entity-events.enabled`가 `false`입니다 | 어노테이션을 모두 지정하고 속성을 켠 상태로 유지하세요 |
| 대량 가져오기에서 행마다 이벤트가 발행됨 | 저장하는 엔티티마다 이벤트를 발행합니다 | `EventContext.suppressEvents` 안에서 가져오기를 실행하세요 |
| 한 번의 호출에서 메서드가 여러 번 실행됨 | 쓰기 락이 거부되어 트랜잭션을 처음부터 다시 실행했습니다 | 메일 발송처럼 반복되면 안 되는 작업은 트랜잭션 밖이나 커밋 후에 실행하세요 |

## 관련 문서

- [트랜잭션 커밋 방식](ko/hibernate/how-it-works.md)
- [엔티티 캐시 제거](ko/hibernate/evicting-the-entity-cache.md)
