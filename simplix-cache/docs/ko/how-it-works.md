# simplix-cache 동작 방식

모듈이 등록하는 빈, 저장소를 선택하는 방식, 캐시 서비스와 캐시 어노테이션의 항목이 분리되는 이유를 설명합니다.

## 빈

| 빈 | 클래스 | 역할 |
|---|---|---|
| 저장소 | `LocalCacheStrategy`, `RedisCacheStrategy`, `NatsCacheStrategy`. 모두 `CacheStrategy`입니다 | 캐시 서비스의 값을 보관합니다 |
| 서비스 | `CacheService` | 애플리케이션이 호출하는 API. 모든 호출을 저장소에 전달합니다 |
| 프로바이더 | `CoreCacheProviderImpl` | 서비스를 simplix-core의 `CacheProvider`로 제공합니다. simplix-cache에 의존하지 않는 모듈에서 사용합니다 |
| Spring 캐시 매니저 | 인메모리 매니저. `redis` 모드에서는 Redis 매니저입니다 | `@Cacheable` 등 어노테이션의 값을 보관합니다 |
| 수집기 | `CacheMetricsCollector` | 선언한 캐시의 통계를 주기적으로 로그에 기록합니다 |
| 헬스 인디케이터 | `CacheHealthIndicator` | 저장소 상태를 Spring Boot Actuator에 보고합니다 |

`SimpliXCacheAutoConfiguration`이 `simplix.cache.enabled`를 전환 속성으로 사용해 이 빈을 모두 등록하고, `simplix.cache`를 `CacheProperties`에 바인딩합니다. 중첩 구성은 해당 라이브러리가 클래스패스에 있을 때 Redis 빈, NATS 빈, 헬스 인디케이터, 수집기를 추가합니다.

## 저장소 선택 방식

1. 애플리케이션에 `CacheStrategy` 빈이 있으면 다른 조건보다 우선합니다.
2. `mode: redis`이고 Redis 라이브러리가 클래스패스에 있으며 Redis 연결 팩토리가 있으면 `RedisCacheStrategy`를 사용합니다.
3. `mode: nats`이고 NATS 클라이언트가 클래스패스에 있으며 `Connection` 빈이 있으면 `NatsCacheStrategy`를 사용합니다.
4. 그 밖에는 `LocalCacheStrategy`를 사용합니다. 라이브러리나 연결이 없는 모드를 지정한 경우에도 오류 없이 로컬 저장소를 사용하므로, `cacheService.getStrategyName()`이나 헬스 엔드포인트로 사용 중인 저장소를 확인하세요.

## 서비스와 어노테이션의 분리

`cacheService.put("authors", ...)`로 저장한 값은 `@Cacheable(cacheNames = "authors")`가 읽는 값과 다릅니다. 서비스는 `CacheStrategy`에 기록하고, 어노테이션은 Spring `CacheManager`에 기록합니다. 양쪽은 서로 다른 빈이며 규칙도 다릅니다.

|  | 캐시 서비스 | 캐시 어노테이션 |
|---|---|---|
| 캐시 이름 | 처음 사용할 때 생성 | 로컬과 NATS 모드에서는 `cache-configs`에 선언한 이름만 사용 |
| 로컬 모드의 유효 시간 | 캐시를 생성한 호출의 값. 기본 1시간 | 적용하지 않습니다. 제거할 때까지 유지합니다 |
| Redis 모드의 유효 시간 | 호출마다 지정한 값 | `cache-configs.<name>.ttl-seconds` 또는 `default-ttl-seconds` |
| 인스턴스 간 공유 | Redis와 NATS 모드 | Redis 모드만 |
| 통계 | `getStatistics(cacheName)` | 포함되지 않음 |

캐시 이름 하나에는 한쪽만 사용하세요. 한쪽에서 제거한 항목이 다른 쪽에서도 제거된다고 오해하는 일을 막을 수 있습니다.

## 관련 문서

- [저장소 선택](./choosing-a-store.md)
- [설정 레퍼런스](./configuration-reference.md)
- [문제 해결](./troubleshooting.md)
