# simplix-cache 문제 해결

캐시를 사용할 때 발생하는 증상과 원인, 조치를 정리합니다.

| 증상 | 원인 | 조치 |
|---|---|---|
| 어노테이션을 지정한 메서드가 `Cannot find cache named ...`로 실패함 | 로컬 모드에서 어노테이션은 `cache-configs`에 선언한 캐시만 사용할 수 있습니다 | `simplix.cache.cache-configs`에 캐시 이름을 선언하세요 |
| 어노테이션을 지정한 메서드가 매번 본문을 실행함 | 같은 클래스의 다른 메서드에서 호출했거나, `unless` 또는 `condition`에 따라 결과가 저장되지 않습니다 | Spring 빈을 거쳐 호출하고 표현식을 확인하세요 |
| 로컬 모드에서 어노테이션으로 저장한 값이 만료되지 않음 | 인메모리 캐시 매니저는 유효 시간을 적용하지 않습니다 | 변경 시 제거하거나, `ttl-seconds`가 적용되는 Redis 모드를 사용하세요 |
| `put`에 전달한 `ttl`이 적용되지 않음 | 로컬 저장소에서는 캐시를 생성한 호출의 유효 시간을 계속 사용하고, NATS에서는 버킷마다 보존 시간이 하나입니다 | 유효 시간마다 캐시 이름을 따로 사용하세요 |
| `getOrCompute`가 `null`을 반환하고 로그에 로더의 예외가 기록됨 | 로더가 실패하면 로그에 기록하고 `null`을 반환합니다 | 로더 안에서 실패를 처리하거나 결과가 `null`인지 확인하세요 |
| 클래스를 잘못 지정해 읽은 값이 나중에 `ClassCastException`으로 실패함 | 로컬 저장소는 호출의 타입을 확인하지 않습니다 | 저장할 때의 클래스로 읽으세요 |
| 인스턴스마다 다른 값을 응답함 | 로컬 저장소는 인스턴스마다 사본을 따로 유지합니다 | `mode: redis` 또는 `mode: nats`를 지정하세요 |
| `mode: redis`를 지정했는데 `getStrategyName()`이 `LocalCacheStrategy`를 반환함 | Redis 라이브러리나 연결 팩토리가 없어 로컬 저장소가 선택되었습니다 | `spring-boot-starter-data-redis`와 연결 설정을 추가하세요 |
| Redis나 NATS에 값을 기록하지 못함 | 지연 로딩 연관이 있는 엔티티처럼 JSON으로 기록할 수 없는 클래스입니다 | DTO나 레코드를 저장하세요 |
| simplix-core의 `CacheManager.getInstance()`에 값이 저장되지 않음 | 정적 매니저는 이 모듈의 프로바이더를 사용하지 않습니다 | `CacheService`나 `CacheProvider`를 주입하세요 |
| 통계의 `removals`가 계속 0임 | 로컬 저장소는 호출로 제거한 항목을 집계하지 않습니다 | `puts`, `hits`, `size`를 확인하세요 |

## 관련 문서

- [simplix-cache 동작 방식](ko/cache/how-it-works.md)
- [캐시 모니터링](ko/cache/monitoring-the-cache.md)
