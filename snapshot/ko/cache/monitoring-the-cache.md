# 캐시 모니터링

캐시가 사용되고 있는지와 저장소가 응답하는지 확인하는 방법을 설명합니다.

## 캐시 통계

`cacheService.getStatistics("genres")`는 현재 시점의 통계를 반환합니다.

```
CacheStatistics[hits=4, misses=3, evictions=0, puts=1, removals=0, hitRate=0.5714285714285714, size=3, memoryUsage=0]
```

적중률이 낮으면 키가 지나치게 세분화되어 있거나 유효 시간이 너무 짧아 캐시의 효과가 없다는 뜻입니다.

| `CacheStatistics`의 필드 | 집계 대상 |
|---|---|
| `hits`, `misses` | 캐시에서 응답한 조회 수와 값을 찾지 못한 조회 수 |
| `hitRate` | 전체 조회 대비 `hits`의 비율. 0과 1 사이의 값입니다 |
| `puts` | 저장한 값의 수 |
| `evictions` | 저장소가 자체적으로 제거한 항목 수. 만료되었거나 크기 한도를 넘은 항목입니다 |
| `removals` | 호출로 제거한 항목 수. 로컬 저장소는 집계하지 않아 0으로 보고합니다 |
| `size` | 현재 캐시에 있는 항목 수 |
| `memoryUsage` | 사용 중인 메모리. 로컬 저장소는 0으로 보고합니다 |

사용한 적이 없는 캐시는 모든 필드가 0인 값을 반환합니다.

## 로그의 통계

모듈은 60초마다 `cache-configs`에 선언한 캐시 중 사용된 캐시의 적중, 미스, 적중률, 크기, 축출 횟수를 `DEBUG` 수준으로 기록합니다. 로거 `dev.simplecore.simplix.cache`를 `DEBUG`로 설정하면 확인할 수 있습니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.cache.metrics.enabled` | `true` | 통계 수집 |
| `simplix.cache.metrics.collectionIntervalSeconds` | `60` | 수집 간격(초) |

## 상태

Spring Boot Actuator가 있으면 `/actuator/health`에 저장소의 이름과 사용 가능 여부를 보고하는 `cache` 컴포넌트가 포함됩니다. 저장소가 응답하지 않으면 `DOWN`으로 보고합니다.

## 관련 문서

- [저장소 선택](ko/cache/choosing-a-store.md)
- [설정 레퍼런스](ko/cache/configuration-reference.md)
