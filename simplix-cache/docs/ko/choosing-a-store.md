# 저장소 선택

캐시된 값이 저장되는 위치를 설명합니다. 인스턴스가 하나이면 자체 메모리에 보관할 수 있습니다. 인스턴스가 여러 개이면 공유 저장소가 필요하며, 그렇지 않으면 인스턴스마다 다른 값으로 응답하게 됩니다.

| `simplix.cache.mode` | 저장소 | 공유 | 필요한 구성 |
|---|---|---|---|
| `local`(기본값) | 인스턴스 메모리의 Caffeine | 아니요 | 없음 |
| `redis` | Redis | 예 | `spring-boot-starter-data-redis`와 Redis 연결 |
| `nats` | NATS JetStream 키-값 버킷 | 예 | `io.nats:jnats`와 `Connection` 빈 |

모드에 지정한 저장소의 라이브러리나 연결이 없으면 로컬 저장소를 사용합니다.

## 로컬

캐시 이름마다 최대 10,000개 항목의 Caffeine 캐시가 만들어집니다. 캐시를 생성한 호출의 유효 시간이 유지됩니다. 첫 호출에서 `ttl`을 전달하지 않으면 1시간이며, 이후 호출에서 다른 `ttl`을 전달해도 바뀌지 않습니다.

## Redis

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379

simplix:
  cache:
    mode: redis
    default-ttl-seconds: 3600
    redis:
      key-prefix: "library:cache:"
```

`CacheService`는 접두어, 캐시 이름, `::`, 키 순서로 키를 기록하며(`library:cache:authors::a1`), 항목은 호출할 때 지정한 `ttl`에 따라 만료됩니다. Spring 캐시 어노테이션은 접두어 없이 `authors::a1`로 기록하며, 항목은 `cache-configs.<name>.ttl-seconds` 또는 `default-ttl-seconds`에 따라 만료됩니다. `redis.key-prefix`는 `CacheService`에만 적용됩니다. 같은 캐시 이름을 양쪽에서 사용하면 키 집합이 따로 생깁니다. Redis 서버를 공유하는 애플리케이션은 서로 다른 접두어를 지정하고, 어노테이션으로 캐시하는 경우에는 캐시 이름도 다르게 지정하세요.

## NATS

```yaml
simplix:
  cache:
    mode: nats
    default-ttl-seconds: 3600
    cache-configs:
      authors:
        ttl-seconds: 600
    nats:
      bucket-prefix: library-cache-
      replicas: 3
```

캐시 이름마다 접두어와 캐시 이름으로 된 키-값 버킷이 처음 사용할 때 만들어집니다. 버킷의 모든 항목에는 같은 보관 시간이 적용됩니다. `cache-configs.<name>.ttl-seconds`를 사용하고, 없으면 `default-ttl-seconds`를 사용합니다. 호출에 전달한 `ttl`은 무시되며, 이미 있는 버킷의 보관 시간은 바뀌지 않습니다. 키는 NATS에서 허용하지 않는 문자를 `_`로 바꿔 저장하며, `getKeys`는 저장된 형식을 반환합니다. 예를 들어 키 `ko:b1`은 `ko_b1`로 조회됩니다.

## 직접 구현하는 저장소

`CacheStrategy`를 구현한 빈을 등록하세요. 모듈은 설정한 모드 대신 이 빈을 `CacheService`에 사용합니다.

## 관련 문서

- [설정 레퍼런스](./configuration-reference.md)
- [simplix-hibernate](../../../simplix-hibernate/README.ko.md): 엔티티의 2차 캐시
