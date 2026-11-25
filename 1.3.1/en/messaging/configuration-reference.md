# Configuration reference

Every property of the module, under `simplix.messaging`.

## Broker and handlers

| Property | Default | Meaning |
|---|---|---|
| `broker` | `local` | `local`, `nats`, `redis`, `kafka` or `rabbit` |
| `instance-id` | derived from the host | the name of this instance, used in consumer names and in leader election |
| `subscriber-startup-delay` | `0` | how long handlers wait after the application is ready before they consume |
| `publisher.auto-message-id` | `false` | on NATS, gives a message without an id header a generated one, so the server can drop duplicates |
| `idempotent.ttl` | 24 hours | how long the ids of processed messages are remembered |
| `error.max-retries` | `3` | the retries of the `RetryPolicy` bean; on NATS also the deliveries of a message, this value + 1 |
| `error.retry-backoff` | 1 second | the first wait of the `RetryPolicy` bean |
| `error.dead-letter.enabled` | `false` | registers the `DeadLetterStrategy` bean |

## Channels

| Property | Default | Meaning |
|---|---|---|
| `channels.<name>.max-length` | `50000` | the most messages kept: on NATS for the stream of this channel; on Redis the smallest value among all channels, applied to every stream |
| `channels.<name>.duplicate-window` | that of the broker | on NATS, how long a message id is recognised in this channel |
| `channels.<name>.deliver-policy` | that of the broker | on NATS, where a new consumer of this channel starts: `all` or `new` |
| `channels.<name>.content-type` | `application/json` | no effect: no code reads it |

## Redis

| Property | Default | Meaning |
|---|---|---|
| `redis.key-prefix` | empty | put in front of every stream key |
| `redis.batch-size` | `10` | messages read per poll |
| `redis.poll-timeout` | 2 seconds | how long a poll waits for messages |
| `redis.pending-check-interval` | 30 seconds | how often consumers look for messages that were left pending |
| `redis.claim-min-idle-time` | 5 minutes | how long a pending message has to be idle before another consumer takes it |
| `redis.payload-encoding` | `BASE64` | `BASE64` or `RAW` |
| `redis.scheduler.enabled` | `false` | registers the deprecated delayed-delivery scheduler |

## NATS connection

| Property | Default | Meaning |
|---|---|---|
| `nats.servers` | `nats://localhost:4222` | the servers, separated by commas |
| `nats.username`, `nats.password` | empty | user and password |
| `nats.token` | empty | a token |
| `nats.creds-file` | empty | a credentials file |
| `nats.nkey-file` | empty | not supported yet; a warning is logged |
| `nats.tls.enabled` | `false` | connects with TLS |
| `nats.tls.trust-store`, `nats.tls.trust-store-password` | empty | the certificates the client trusts |
| `nats.tls.key-store`, `nats.tls.key-store-password` | empty | the certificate of the client, for mutual TLS |
| `nats.connection-name` | `simplix-messaging` | the name the server shows for the connection |
| `nats.connection-timeout` | 5 seconds | the wait for a connection |
| `nats.reconnect-wait` | 2 seconds | the wait between reconnection attempts |
| `nats.max-reconnects` | `-1` | reconnection attempts; `-1` is unlimited |

## NATS streams and consumers

| Property | Default | Meaning |
|---|---|---|
| `nats.stream-prefix` | `simplix-` | put in front of stream names |
| `nats.subject-prefix` | `simplix.` | put in front of subjects |
| `nats.auto-create-streams` | `true` | creates a missing stream; `false` fails at start instead |
| `nats.auto-update-streams` | `true` | changes an existing stream to match the settings |
| `nats.retention` | `limits` | the retention policy of a stream |
| `nats.storage` | `file` | `file` or `memory` |
| `nats.discard-policy` | `old` | what a full stream drops |
| `nats.max-msgs`, `nats.max-bytes` | `-1` | the size limits of a stream. A negative `max-msgs` applies 50,000 messages unless the channel sets `max-length`; `max-bytes` `-1` is unlimited |
| `nats.max-age` | 7 days | how long a message is kept |
| `nats.duplicate-window` | 2 minutes | how long a message id is recognised |
| `nats.replicas` | `1` | copies of a stream in a cluster |
| `nats.ack-policy` | `explicit` | the acknowledgment policy of consumers |
| `nats.ack-wait` | 30 seconds | how long the server waits for an acknowledgment before it delivers again |
| `nats.max-deliver` | `error.max-retries` + 1 | the most deliveries of one message |
| `nats.deliver-policy` | `all` | where a new consumer starts: `all` or `new` |
| `nats.batch-size` | `10` | messages pulled per request |
| `nats.poll-timeout` | 2 seconds | how long a pull waits |
| `nats.pending-check-interval` | 30 seconds | how often pending counts are read for the metrics |
| `nats.scheduler.enabled` | `false` | registers the deprecated delayed-delivery scheduler |
| `nats.scheduler.kv-bucket` | `simplix-scheduled` | the key-value bucket of the scheduler |
| `nats.scheduler.poll-interval` | 5 seconds | how often due messages are looked for |
| `nats.scheduler.leader-lock-ttl` | 30 seconds | no effect: no code reads it |

## Local broker

| Property | Default | Meaning |
|---|---|---|
| `local.scheduler.enabled` | `false` | registers the deprecated delayed-delivery scheduler of the local broker |

## Kafka and RabbitMQ

These brokers take their connection from Spring Boot: `spring.kafka.*` and `spring.rabbitmq.*`. The module adds no properties of its own for them.

## Related documents

- [Choosing a broker](en/messaging/choosing-a-broker.md)
- [Handling failures](en/messaging/handling-failures.md)
