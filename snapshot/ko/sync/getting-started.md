# simplix-sync 시작하기

이 문서는 한 인스턴스에서 서가의 변경을 브로드캐스트하고 다른 인스턴스에서 반영하는 과정을 안내합니다.

## 1단계. 모듈 추가

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-sync:${version}"
}
```

## 2단계. 메시지와 채널 정의

```java
public record ShelfChanged(String shelfId, int freeSlots) {
}

@Configuration
public class ShelfSyncConfig {

    @Bean
    public SyncChannel<ShelfChanged> shelfChannel(InstanceSyncBroadcaster broadcaster, ObjectMapper objectMapper) {
        PayloadCodec<ShelfChanged> codec = PayloadCodec.of(
            message -> {
                try {
                    return objectMapper.writeValueAsBytes(message);
                } catch (JsonProcessingException e) {
                    throw new IllegalStateException("Failed to encode the message", e);
                }
            },
            bytes -> objectMapper.readValue(bytes, ShelfChanged.class)
        );
        return new SyncChannel<>("shelf-changed", codec, broadcaster);
    }
}
```

`SyncChannel`은 이름, 메시지를 바이트로 변환하고 복원하는 코덱, 모듈이 제공하는 브로드캐스터로 구성됩니다.

## 3단계. 브로드캐스트와 구독

```java
@Service
@RequiredArgsConstructor
public class ShelfBoard {

    private final SyncChannel<ShelfChanged> channel;
    private final Map<String, Integer> freeSlots = new ConcurrentHashMap<>();

    @PostConstruct
    void listen() {
        channel.subscribe(change -> freeSlots.put(change.shelfId(), change.freeSlots()));
    }

    public void update(String shelfId, int slots) {
        freeSlots.put(shelfId, slots);
        channel.broadcast(new ShelfChanged(shelfId, slots));
    }

    public int freeSlotsOf(String shelfId) {
        return freeSlots.getOrDefault(shelfId, 0);
    }
}
```

`update`를 호출한 인스턴스는 자신의 상태를 직접 변경합니다. 보낸 인스턴스는 자신의 브로드캐스트를 받지 않습니다. `subscribe`에 전달한 핸들러는 다른 인스턴스에서 실행됩니다.

## 4단계. 인스턴스 연결

설정이 없으면 모듈은 로컬 모드로 실행됩니다. `broadcast`는 아무 동작도 하지 않으며, 인스턴스가 하나일 때나 테스트에 적합합니다. 로그에는 `SimpliX Sync: local mode (NoOp broadcaster)`가 기록됩니다. 인스턴스가 여러 개이면 분산 모드로 전환하세요.

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379

simplix:
  sync:
    mode: DISTRIBUTED
    distributed:
      broker: REDIS
```

NATS를 사용하려면 `broker: NATS`를 지정하세요. 모듈은 애플리케이션의 `Connection` 빈을 사용하며, NATS로 실행하는 [simplix-messaging](ko/messaging/readme.md)이 이 빈을 제공합니다.

## 다음 단계

- [상태 일관성 유지](ko/sync/keeping-state-consistent.md)
- [설정 레퍼런스](ko/sync/configuration-reference.md)
