# Configuration reference

Every property of the module, under `simplix.sync`.

| Property | Default | Meaning |
|---|---|---|
| `enabled` | `true` | switches the module on |
| `mode` | `LOCAL` | `LOCAL` broadcasts nothing; `DISTRIBUTED` broadcasts through a broker |
| `distributed.broker` | `REDIS` | `REDIS` or `NATS` |
| `distributed.redis-enabled` | `true` | no effect: no code reads it |

## Brokers

| Broker | Transport | Needs |
|---|---|---|
| `REDIS` | Redis Pub/Sub | `spring-boot-starter-data-redis` and a `RedisConnectionFactory` |
| `NATS` | NATS core publish and subscribe | `io.nats:jnats` and a `Connection` bean |

When distributed mode is set and the broker's library or connection is missing, the module stays in local mode. Register a bean that implements `InstanceSyncBroadcaster` to use another transport.

## Related documents

- [Getting started](./getting-started.md)
