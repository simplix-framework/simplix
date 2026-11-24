# simplix-sync 동작 방식

채널이 전송하는 내용, 메시지가 인스턴스 사이에서 전달되는 과정, 전송 수단이 선택되는 방식, 전송 수단을 직접 작성하는 방법을 설명합니다.

## 구성 요소

| 구성 요소 | 클래스 | 역할 |
|---|---|---|
| 채널 | `SyncChannel<T>` | 애플리케이션이 사용하는 API. 채널 이름 하나에서 한 가지 메시지 타입을 `broadcast(message)`와 `subscribe(handler)`로 처리합니다 |
| 코덱 | `PayloadCodec<T>` | 메시지를 바이트로 변환하고 다시 복원합니다 |
| 전송 수단 | `InstanceSyncBroadcaster` | 이름으로 지정한 채널의 바이트를 다른 인스턴스에 전달합니다 |
| 상태 도우미 | `InMemoryStateStore`, `ReconciliationScheduler` | 키별로 상태를 보관하고 유실된 메시지로 어긋난 상태를 복구합니다 |

## 메시지 전달 과정

1. `broadcast`가 코덱으로 메시지를 인코딩해 바이트를 전송 수단에 전달합니다.
2. 전송 수단이 바이트 앞에 이 인스턴스의 16바이트 식별자를 추가해 채널에 발행합니다.
3. 구독 중인 모든 인스턴스가 바이트를 받습니다. 앞부분의 식별자가 자신의 값이면 메시지를 버리므로, 발신 인스턴스는 자신이 보낸 메시지를 처리하지 않습니다.
4. 나머지 수신 인스턴스는 식별자를 제거하고 코덱으로 디코딩한 뒤 핸들러를 호출합니다.

전달 과정에서 메시지를 저장하지 않습니다. Redis Pub/Sub과 NATS 코어 서브젝트는 그 시점에 연결된 구독자에게만 전달하므로, 재시작 중인 인스턴스는 그동안 전송된 메시지를 받지 못합니다. 복구 방법은 [상태 일관성 유지](ko/sync/keeping-state-consistent.md)에 있습니다.

## 전송 수단 선택 방식

`SimpliXSyncAutoConfiguration`이 `InstanceSyncBroadcaster` 하나를 등록하고 `simplix.sync`를 `SyncProperties`에 바인딩합니다.

| 조건 | 전송 수단 |
|---|---|
| 애플리케이션에 `InstanceSyncBroadcaster` 빈이 있음 | 해당 빈 |
| `mode: DISTRIBUTED`, `broker: REDIS` 또는 미지정, Redis 라이브러리와 `RedisConnectionFactory`가 있음 | `RedisInstanceSyncBroadcaster` |
| `mode: DISTRIBUTED`, `broker: NATS`, NATS 클라이언트와 `Connection` 빈이 있음 | `NatsInstanceSyncBroadcaster` |
| 그 밖의 경우. `mode: LOCAL` 포함 | `NoOpInstanceSyncBroadcaster`. 아무것도 전송하지 않습니다 |

모드는 `SyncProperties.Mode`, 브로커는 `SyncProperties.Broker` 값이며, 설정에서는 `SyncProperties.Distributed` 아래에 지정합니다. 분산 모드를 지정했는데 라이브러리나 연결이 없으면 오류 없이 무동작 전송 수단이 선택되므로, 시작 로그에서 사용 중인 전송 수단을 확인하세요.

## 채널 이름

- 메시지 타입마다 `SyncChannel`을 하나씩 사용하세요. 같은 이름에 여러 타입을 사용하면 다른 코덱으로 디코딩됩니다.
- NATS에서는 채널 이름을 서브젝트로 그대로 사용합니다. 공백이 없고 `.`과 `-`를 구분자로 사용하는 유효한 서브젝트 이름을 지정하세요.
- 브로커를 공유하는 애플리케이션은 채널도 공유합니다. `library.shelf-changed`처럼 애플리케이션 이름으로 시작하세요.

## 전송 수단 직접 작성

다른 브로커로 바이트를 전달하려면 `InstanceSyncBroadcaster`를 구현하세요. 아래 예시는 JVM 하나 안에서 전달하며, 핸들러 실행을 확인하는 테스트에 사용할 수 있습니다. 실제 전송 수단은 `broadcast`에서 브로커에 발행하고 `subscribe`에서 컨슈머를 등록합니다.

```java
public class InProcessBroadcaster implements InstanceSyncBroadcaster {

    private final Map<String, List<InboundPayloadListener>> listeners = new ConcurrentHashMap<>();

    @Override
    public void broadcast(String channel, byte[] payload) {
        listeners.getOrDefault(channel, List.of()).forEach(listener -> listener.onPayload(payload));
    }

    @Override
    public void subscribe(String channel, InboundPayloadListener listener) {
        listeners.computeIfAbsent(channel, name -> new CopyOnWriteArrayList<>()).add(listener);
    }
}
```

```java
@Bean
public InstanceSyncBroadcaster instanceSyncBroadcaster() {
    return new InProcessBroadcaster();
}
```

내장 전송 수단은 인스턴스 식별자를 직접 추가하고 검사합니다. 직접 작성한 전송 수단에서 발신 인스턴스를 제외하려면 같은 방식으로 처리하세요. `broadcast`에서 식별자를 앞에 추가하고, 리스너에서 해당 식별자가 있는 페이로드를 버립니다.

## 로그

```text
SimpliX Sync: local mode (NoOp broadcaster)
SimpliX Sync: distributed mode (Redis Pub/Sub broadcaster)
SimpliX Sync: distributed mode (NATS core pub/sub broadcaster)
NATS instance sync broadcaster initialized [instanceId=447b4a68-3928-42aa-aa43-cbae1557b2c7]
Subscribed to NATS sync channel: shelf-changed
```

모듈은 애플리케이션이 시작될 때 선택한 모드와 구독한 채널을 `INFO`로 기록합니다. 설정을 변경한 뒤에는 첫 줄을 확인하세요. 분산 모드여야 하는 애플리케이션에서 `local mode`가 기록되면 전송 계층이 선택되지 않은 것입니다. 로거는 `dev.simplecore.simplix.sync`입니다.

## 관련 문서

- [상태 일관성 유지](ko/sync/keeping-state-consistent.md)
- [설정 레퍼런스](ko/sync/configuration-reference.md)
- [문제 해결](ko/sync/troubleshooting.md)
