# 설정 레퍼런스

`simplix.cache` 아래에 있는 모듈의 모든 속성을 정리합니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `enabled` | `true` | 모듈 사용 |
| `mode` | `local` | `local`, `redis`, `nats` 중 하나 |
| `default-ttl-seconds` | `3600` | 유효 시간을 지정하지 않은 캐시에 적용하는 Redis 캐시 매니저와 NATS 버킷의 유효 시간 |
| `cache-null-values` | `false` | Redis 캐시 매니저의 `null` 결과 저장 여부 |
| `cache-configs.<name>.ttl-seconds` | 없음 | 어노테이션에서 사용할 캐시를 선언하고, Redis와 NATS에 적용할 유효 시간을 지정 |
| `redis.key-prefix` | `cache:` | `CacheService`가 기록하는 Redis 키의 접두어. 캐시 어노테이션은 접두어 없이 키를 기록합니다 |
| `redis.use-key-prefix` | `true` | `CacheService`의 키 앞에 접두어를 기록합니다 |
| `nats.bucket-prefix` | `simplix-cache-` | NATS 버킷 이름의 접두어 |
| `nats.replicas` | `1` | NATS 버킷의 복제본 수 |
| `metrics.enabled` | `true` | 캐시 통계 수집 |
| `metrics.collectionIntervalSeconds` | `60` | 수집 간격(초) |

## 대체할 수 있는 빈

| 빈 | 대체하는 목적 |
|---|---|
| `CacheStrategy` | `CacheService`의 값을 직접 구현한 저장소에 보관 |
| `CacheManager`(Spring) | 어노테이션 캐시의 저장 위치 변경 |
| `CacheService` | 서비스를 감싸거나 확장 |

## 관련 문서

- [저장소 선택](ko/cache/choosing-a-store.md)
- [캐시 모니터링](ko/cache/monitoring-the-cache.md)
