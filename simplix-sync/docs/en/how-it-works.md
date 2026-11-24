# How simplix-sync works

What a channel sends, how a message travels between instances, how the transport is chosen and how to write one of your own.

## The parts

| Part | Class | Role |
|---|---|---|
| the channel | `SyncChannel<T>` | what the application uses: `broadcast(message)` and `subscribe(handler)` for one message type under one channel name |
| the codec | `PayloadCodec<T>` | turns a message into bytes and back |
| the transport | an `InstanceSyncBroadcaster` | carries bytes on a named channel to the other instances |
| the state helpers | `InMemoryStateStore`, `ReconciliationScheduler` | hold state per key and repair what a lost message left behind |

## How a message travels

1. `broadcast` encodes the message with the codec and hands the bytes to the transport.
2. The transport puts the 16-byte id of this instance in front of the bytes and publishes them on the channel.
3. Every subscribed instance receives the bytes. A receiver that finds its own id in front drops the message, which is why a sender never handles its own broadcast.
4. The other receivers strip the id, decode the rest with the codec and call the handler.

Nothing is stored on the way. Redis Pub/Sub and NATS core subjects deliver to the subscribers that are connected at that moment, so an instance that restarts misses what was sent meanwhile; [Keeping state consistent](./keeping-state-consistent.md) shows how to repair that.

## How the transport is chosen

`SimpliXSyncAutoConfiguration` registers one `InstanceSyncBroadcaster` and binds `simplix.sync` to `SyncProperties`.

| Condition | Transport |
|---|---|
| the application declares an `InstanceSyncBroadcaster` bean | that bean |
| `mode: DISTRIBUTED`, `broker: REDIS` or no broker, the Redis library and a `RedisConnectionFactory` | `RedisInstanceSyncBroadcaster` |
| `mode: DISTRIBUTED`, `broker: NATS`, the NATS client and a `Connection` bean | `NatsInstanceSyncBroadcaster` |
| anything else, including `mode: LOCAL` | `NoOpInstanceSyncBroadcaster`, which sends nothing |

The mode is a `SyncProperties.Mode` and the broker a `SyncProperties.Broker`, both under `SyncProperties.Distributed` in configuration. A distributed mode whose library or connection is missing ends at the no-op transport without an error, so check the start log: it names the transport in use.

## Channel names

- Use one `SyncChannel` per message type. Two types on one name would be decoded with the wrong codec.
- With NATS the channel name is the subject, as it is written. Use names that are valid subjects: no spaces, with `.` and `-` as separators.
- Applications that share a broker share its channels. Begin the name with the application, such as `library.shelf-changed`.

## A transport of your own

Implement `InstanceSyncBroadcaster` to carry the bytes over another broker. The example delivers inside one JVM, which is enough for a test that wants to see a handler run; a real transport publishes to its broker in `broadcast` and registers a consumer in `subscribe`.

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

The built-in transports add and check the instance id themselves. A transport of your own that has to leave out the sender does the same: put an id in front in `broadcast`, and drop the payloads that carry it in the listener.

## Log lines

```text
SimpliX Sync: local mode (NoOp broadcaster)
SimpliX Sync: distributed mode (Redis Pub/Sub broadcaster)
SimpliX Sync: distributed mode (NATS core pub/sub broadcaster)
NATS instance sync broadcaster initialized [instanceId=447b4a68-3928-42aa-aa43-cbae1557b2c7]
Subscribed to NATS sync channel: shelf-changed
```

The module logs the mode it chose at `INFO` when the application starts, and each subscribed channel. Read the first line after a configuration change: `local mode` in an application that should be distributed means the transport was not selected. The logger is `dev.simplecore.simplix.sync`.

## Related documents

- [Keeping state consistent](./keeping-state-consistent.md)
- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
