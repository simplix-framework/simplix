# Getting started with simplix-sync

This page broadcasts a change of a shelf from one instance and applies it on the others.

## Step 1. Add the module

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-sync:${version}"
}
```

## Step 2. Define the message and its channel

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

A `SyncChannel` has a name, a codec that turns the message into bytes and back, and the broadcaster the module provides.

## Step 3. Broadcast and subscribe

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

The instance that calls `update` changes its own state itself: a sender does not receive its own broadcast. The handler given to `subscribe` runs on the other instances.

## Step 4. Connect the instances

With no configuration the module runs in local mode: `broadcast` does nothing, which is right for one instance and for tests. The log says `SimpliX Sync: local mode (NoOp broadcaster)`. For several instances, switch to distributed mode.

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

For NATS set `broker: NATS`. The module uses the `Connection` bean of the application, which [simplix-messaging](../../../simplix-messaging/README.md) provides when it runs on NATS.

## Next steps

- [Keeping state consistent](./keeping-state-consistent.md)
- [Configuration reference](./configuration-reference.md)
