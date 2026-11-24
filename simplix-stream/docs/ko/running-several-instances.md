# 다중 인스턴스 실행

애플리케이션을 여러 서버에서 실행할 때 달라지는 점을 설명합니다. 세션 보관 위치, 인스턴스 간 상태 공유, 다른 인스턴스의 세션에 대한 관리 작업을 다룹니다.

## 모드

| `simplix.stream.mode` | 세션 보관 위치 | 적합한 경우 |
|---|---|---|
| `local`(`Mode`, 기본값) | 메모리(`LocalSessionRegistry`) | 인스턴스 하나 |
| `distributed` | 데이터베이스(`DbSessionRegistry`) | 로드 밸런서 뒤의 여러 인스턴스 |

어느 모드에서든 연결은 해당 연결을 수락한 인스턴스에서 유지합니다. 세션의 구독 호출이 같은 인스턴스에 도달해야 하므로, 로드 밸런서에서 `/api/stream/**`에 스티키 세션을 적용해야 합니다.

## 분산 모드 설정

```yaml
simplix:
  stream:
    mode: distributed
    instance-id: ${HOSTNAME}
    persistence:
      enabled: true
    server:
      instance-id: ${HOSTNAME}
      heartbeat-interval: 30s
      dead-threshold: 2m
```

```java
@SpringBootApplication
@EntityScan(basePackages = {
    "com.example.library",
    "dev.simplecore.simplix.stream.persistence.entity",
    "dev.simplecore.simplix.stream.admin.command"
})
@EnableJpaRepositories(
    basePackages = {"com.example.library.domain", "dev.simplecore.simplix.stream.admin.command"},
    repositoryFactoryBeanClass = SimpliXRepositoryFactoryBean.class
)
public class LibraryApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

- `mode: distributed`에는 세션 레지스트리가 필요합니다. `persistence.enabled: true`를 지정하면 `DbSessionRegistry`가 등록됩니다. 지정하지 않으면 애플리케이션이 `SessionRegistry` 빈을 직접 선언하지 않는 한 시작되지 않습니다.
- 모듈의 엔티티는 애플리케이션 패키지 밖에 있으므로, 애플리케이션 클래스의 `@EntityScan`에 애플리케이션 패키지와 함께 지정합니다.
- `instance-id`와 `server.instance-id`에는 인스턴스마다 고유한 같은 값을 지정하세요. 지정하지 않으면 모듈의 구성 요소마다 ID를 따로 생성합니다.
- 테이블은 `stream_sessions`, `stream_subscriptions`, `stream_server_instances`, `stream_admin_commands`이며 각각 `StreamSessionEntity`, `StreamSubscriptionEntity`, `StreamServerInstanceEntity`, `AdminCommand`에 매핑됩니다. 마이그레이션 도구로 생성하세요. `ddl-auto`를 사용하면 Hibernate가 생성합니다.

## 인스턴스 간 공유 정보

| 구성 요소 | 역할 |
|---|---|
| `DbSessionRegistry` | `StreamSessionRepository`와 `StreamSubscriptionRepository`로 모든 세션과 구독을 데이터베이스에 기록합니다. 어느 인스턴스에서든 세션을 조회할 수 있고, `/reconnect`로 다른 인스턴스에서 세션을 복원할 수 있습니다 |
| `StreamServerManager` | 인스턴스를 `StreamServerInstanceRepository`에 등록하고 `server.heartbeat-interval`마다 하트비트를 기록합니다. `server.cleanup-interval`마다 `server.dead-threshold` 동안 하트비트가 없는 인스턴스를 중단된 것으로 표시하고 해당 인스턴스의 세션을 종료합니다 |
| `StreamStatisticsService` | 테이블을 조회해 관리 API의 전역 엔드포인트에 응답합니다 |
| `AdminCommandProcessor` | 이 인스턴스를 대상으로 저장된 관리 명령을 실행합니다. 아래에서 설명합니다 |

데이터는 구독 세션을 유지하는 인스턴스에서 수집합니다. 같은 키의 구독자가 두 인스턴스에 있으면 각 인스턴스가 수집기를 호출합니다.

## 인스턴스 간 관리 명령

```yaml
simplix:
  stream:
    admin:
      enabled: true
      polling-interval: 2s
      command-timeout: 5m
      retention-period: 7d
```

관리자가 호출한 인스턴스와 세션을 유지하는 인스턴스는 다를 수 있습니다. `admin.enabled`를 지정하면 세션 종료와 스케줄러 중지 · 즉시 실행 요청이 `AdminCommandService`를 거쳐 `AdminCommand`로 저장되고(`DefaultAdminCommandService`가 `AdminCommandRepository`에 기록) 호출은 202를 반환합니다. 각 인스턴스는 `polling-interval`마다 자신의 명령을 조회해 실행합니다. 저장소 패키지는 위 애플리케이션 클래스처럼 `@EnableJpaRepositories`에 지정합니다. 지정하지 않으면 명령 기능이 등록되지 않고 호출은 로컬 인스턴스에만 적용됩니다.

```json
{
  "commandId" : 1,
  "commandType" : { "type" : "AdminCommandType", "value" : "TERMINATE_SESSION" },
  "targetId" : "badd656c-7790-4288-9ff2-18300a25dd8e",
  "status" : { "type" : "AdminCommandStatus", "value" : "EXECUTED" },
  "createdAt" : "2026-11-25T02:20:38.650+09:00",
  "executedAt" : "2026-11-25T02:20:39.124+09:00",
  "executedBy" : "node-a",
  "message" : "Command executed successfully"
}
```

| `AdminCommandType` | 동작 |
|---|---|
| `TERMINATE_SESSION` | 세션을 종료합니다 |
| `STOP_SCHEDULER` | 구독 키의 수집을 중지합니다 |
| `TRIGGER_SCHEDULER` | 구독 키의 수집기를 즉시 호출합니다 |

| `AdminCommandStatus` | 의미 |
|---|---|
| `PENDING` | 저장되었으며 아직 실행되지 않음 |
| `EXECUTED` | `executedBy`의 인스턴스가 실행함 |
| `FAILED` | 인스턴스가 실행하지 못함 |
| `EXPIRED` | `admin.command-timeout` 안에 실행되지 않음 |
| `NOT_FOUND` | 인스턴스에 대상이 없음 |

`admin.retention-period`보다 오래된 명령은 `admin.cleanup-cron`으로 예약된 작업에서 삭제합니다.

## 브로커를 사용한 수집 공유

`simplix.stream.distributed.broker`(`Broker`)는 인스턴스 간 데이터 전달 방식을 지정합니다.

| 값 | 설계 |
|---|---|
| `NONE`(기본값) | 인스턴스 간에 데이터를 전달하지 않습니다. 각 인스턴스가 자신의 세션을 위해 수집합니다 |
| `REDIS` | `RedisLeaderElection`(`LeaderElection`)으로 구독 키마다 인스턴스 하나만 수집하고, `RedisBroadcaster`가 `distributed.pubsub.channel-prefix` 아래의 Redis 채널로 구독자를 유지하는 인스턴스에 데이터를 발행합니다 |
| `NATS` | 같은 방식으로 동작합니다. `NatsLeaderElection`은 키-값 버킷 `distributed.nats.leader-bucket`에 리더를 보관하고, `NatsBroadcaster`는 `distributed.nats.subject-prefix` 아래의 서브젝트로 발행합니다 |

> ⚠ `broker: REDIS`로 설정한 애플리케이션은 시작되지 않습니다. 모듈의 Redis 구성은 Spring Boot의 `StringRedisTemplate`이 등록되기 전에 평가되어 건너뛰어지고, 모듈에는 `BroadcastService`가 없는 상태가 됩니다. 애플리케이션에서 `StringRedisTemplate` 빈을 선언하면 `schedulerManager`, `redisBroadcaster`, `schedulerSubscriberLookup` 빈이 서로 의존하게 되어 컨텍스트가 순환 참조로 시작을 거부합니다. NATS 구성도 브로드캐스터를 같은 방식으로 연결합니다. 다중 인스턴스는 `NONE`으로 실행하세요.

## 관련 문서

- [스트림 관리](./managing-streams.md)
- [설정 레퍼런스](./configuration-reference.md)
- [문제 해결](./troubleshooting.md)
