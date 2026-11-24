# 설정 레퍼런스

`simplix.sync` 아래에 있는 모듈의 모든 속성을 정리합니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `enabled` | `true` | 모듈 사용 |
| `mode` | `LOCAL` | `LOCAL`은 브로드캐스트하지 않고, `DISTRIBUTED`는 브로커를 통해 브로드캐스트 |
| `distributed.broker` | `REDIS` | `REDIS` 또는 `NATS` |
| `distributed.redis-enabled` | `true` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

## 브로커

| 브로커 | 전송 방식 | 필요한 구성 |
|---|---|---|
| `REDIS` | Redis Pub/Sub | `spring-boot-starter-data-redis`와 `RedisConnectionFactory` |
| `NATS` | NATS 코어 발행 · 구독 | `io.nats:jnats`와 `Connection` 빈 |

분산 모드를 지정했지만 브로커의 라이브러리나 연결이 없으면 모듈은 로컬 모드로 동작합니다. 다른 전송 방식을 사용하려면 `InstanceSyncBroadcaster`를 구현한 빈을 등록하세요.

## 관련 문서

- [시작하기](./getting-started.md)
