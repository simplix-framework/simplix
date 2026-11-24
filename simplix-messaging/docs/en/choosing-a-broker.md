# Choosing a broker

Which broker carries the messages, what each can do, and how to configure it. Publishers and handlers are the same code on all of them.

| `simplix.messaging.broker` | Carries messages through | Needs | Fits |
|---|---|---|---|
| `local` | memory, inside one process | nothing | tests and development |
| `nats` | NATS JetStream | `io.nats:jnats` | the recommended default: duplicates are dropped by the server, and every feature is available |
| `redis` | Redis Streams | `spring-boot-starter-data-redis` | a Redis server that is already there |
| `kafka` | Kafka topics | the Kafka starter of your line (below) | very large volumes and long retention |
| `rabbit` | RabbitMQ | `spring-boot-starter-amqp` | a RabbitMQ installation that is already there |

## What each broker can do

The table is what each broker reports through `BrokerStrategy.capabilities()`, a `BrokerCapabilities`.

| Capability | `local` | `nats` | `redis` | `kafka` | `rabbit` |
|---|---|---|---|---|---|
| `consumerGroups`: a group shares the messages | ✔ | ✔ | ✔ | ✔ | ✖ |
| `replay`: old messages can be read again | ✔ | ✔ | ✔ | ✔ | ✖ |
| `ordering`: messages arrive in the order they were sent | ✔ | ✔ | ✔ | ✔ | ✖ |
| `deadLetter`: the broker has dead letter handling of its own | ✖ | ✔ | ✖ | ✔ | ✔ |
| `scheduledDelivery`: a message can be delivered later | ✔ | ✔ | ✔ | ✖ | ✖ |
| `nativeDedup`: the broker drops a repeated message id | ✖ | ✔ | ✔ | ✖ | ✖ |
| `nativeRequestReply`: the broker answers requests itself | ✖ | ✔ | ✖ | ✖ | ✖ |

## NATS JetStream

```yaml
simplix:
  messaging:
    broker: nats
    nats:
      servers: nats://nats-1:4222,nats://nats-2:4222
      stream-prefix: "library-"
      subject-prefix: "library."
      replicas: 3
      max-age: 7d
      duplicate-window: 2m
```

- A channel becomes a stream named `<stream-prefix><channel>` with the subject `<subject-prefix><channel>`. Use prefixes of your own, so that applications on one server do not share streams.
- The stream of a channel is created when a handler subscribes to it. Publishing to a channel that has no stream fails with `Failed to publish message to subject <subject>`: start the application that handles the channel first, or create the stream beforehand.
- Consumers pull messages in batches and acknowledge each one. A message whose handler throws is delivered again at once, and one that is not acknowledged within `ack-wait` after that time, up to `max-deliver` times in all.
- A message id that repeats within `duplicate-window` is dropped by the server, and the publish answers with `duplicate` true.
- Credentials go into `username` and `password`, `token`, or `creds-file`. `nkey-file` is not supported yet: setting it logs a warning.
- With `auto-create-streams: false` and `auto-update-streams: false` the module leaves the streams to whoever manages them, for example Terraform. A channel whose stream is missing then fails with `Stream <name> is not provisioned`.

## Redis Streams

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379

simplix:
  messaging:
    broker: redis
    redis:
      key-prefix: "library:"
      batch-size: 20
      poll-timeout: 3s
      claim-min-idle-time: 5m
      payload-encoding: BASE64
```

- A channel is a stream under the key `<key-prefix><channel>`, and a group is a consumer group of that stream.
- A consumer that stopped while it held messages leaves them pending. The others claim what was idle longer than `claim-min-idle-time`; keep that time well above the longest a handler runs, or a slow message is processed twice.
- `payload-encoding` is a `PayloadEncoding`: `BASE64` stores the payload as text, and `RAW` stores the bytes as they are, which tools that inspect the stream can decode.
- The length of every stream is capped by the smallest `channels.<name>.max-length` that is configured, 50,000 messages without one.

## Kafka

```yaml
spring:
  kafka:
    bootstrap-servers: kafka:9092
    producer:
      value-serializer: org.apache.kafka.common.serialization.ByteArraySerializer
    consumer:
      value-deserializer: org.apache.kafka.common.serialization.ByteArrayDeserializer

simplix:
  messaging:
    broker: kafka
```

| SimpliX line | Dependency |
|---|---|
| 2.x | `org.springframework.boot:spring-boot-starter-kafka` |
| 1.x | `org.springframework.kafka:spring-kafka` |

The module sends and receives bytes, so the producer and the consumer are configured with the byte array serializers above. With the default serializers a publish fails with `Failed to send Kafka message to topic: <topic>`.

A channel is a topic and a group is a Kafka consumer group. Order holds inside a partition: set the `x-partition-key` header to keep the messages of one key together. Kafka has no delayed delivery, and duplicates are not dropped by the broker, so handlers that must not repeat use `idempotent = true` with a store of your own, or idempotent work.

## RabbitMQ

```yaml
spring:
  rabbitmq:
    host: rabbitmq
    port: 5672

simplix:
  messaging:
    broker: rabbit
```

A channel is a durable queue of the same name, bound to the topic exchange `simplix.messaging` with the channel as routing key. Each queue is declared with the dead letter exchange `simplix.messaging.dlx` and the dead letter queue `<channel>.dlq`. RabbitMQ reports no consumer groups, no replay and no ordering: use it for work that each message does once and that needs no history.

## Channel settings

```yaml
simplix:
  messaging:
    channels:
      audit-events:
        max-length: 1000000
        duplicate-window: 5m
        deliver-policy: new
```

| Property | Default | Meaning |
|---|---|---|
| `channels.<name>.max-length` | `50000` | the most messages kept: on NATS for the stream of this channel; on Redis the smallest value among all channels, applied to every stream |
| `channels.<name>.duplicate-window` | that of the broker | on NATS, how long a message id is recognised in this channel |
| `channels.<name>.deliver-policy` | that of the broker | on NATS, where a new consumer of this channel starts: `all` or `new` |
| `channels.<name>.content-type` | `application/json` | no effect: no code reads it |

## Change the broker

1. Replace the client library among the dependencies.
2. Set `simplix.messaging.broker` and the settings of the new broker.
3. Check what the new broker cannot do in the capability table: a replay, delayed delivery or native duplicate handling your code relies on.
4. Messages that are still in the old broker are not moved. Let the consumers empty it before the switch.

## Related documents

- [Configuration reference](./configuration-reference.md)
- [Handling failures](./handling-failures.md)
- [Troubleshooting](./troubleshooting.md)
