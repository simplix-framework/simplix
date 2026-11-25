# Configuration reference

Every property of the module, under `simplix.stream`.

## Module and mode

| Property | Default | Meaning |
|---|---|---|
| `enabled` | `true` | registers the module |
| `mode` | `local` | `local` or `distributed`, a `StreamProperties.Mode` |
| `instance-id` | generated | the name of this instance in distributed mode and in admin commands |
| `persistence.enabled` | `false` | keeps sessions, subscriptions and instances in the database |
| `event-source.enabled` | `false` | registers event sources |

## Sessions

| Property | Default | Meaning |
|---|---|---|
| `session.timeout` | 5 minutes | how long a connection lasts before the server ends it |
| `session.heartbeat-interval` | 30 seconds | how often a session is validated and a heartbeat is sent |
| `session.grace-period` | 30 seconds | how long a disconnected session keeps its subscriptions |
| `session.cleanup-interval` | 30 seconds | how often sessions past their timeout are looked for |
| `session.max-per-user` | `5` | sessions per user; a further one ends the oldest. 0 is unlimited |
| `session.validation-timeout` | 5 seconds | the time a `SessionValidator` is given |

## Collection

| Property | Default | Meaning |
|---|---|---|
| `scheduler.thread-pool-size` | `10` | threads for collectors and heartbeats |
| `scheduler.default-interval` | 1 second | the interval of a subscription whose resource has no collector |
| `scheduler.min-interval` | 100 milliseconds | the shortest interval of any subscription |
| `scheduler.max-interval` | 60 seconds | the longest interval of any subscription |
| `scheduler.max-consecutive-errors` | `5` | failures in a row after which a collection is reported as `ERROR` |
| `scheduler.max-total-schedulers` | `500` | subscription keys collected at once. 0 is unlimited |
| `subscription.max-per-session` | `20` | subscriptions per session. 0 is unlimited |
| `subscription.partial-success` | `true` | whether a request with refused entries reports `success` true |

## Sending

| Property | Default | Meaning |
|---|---|---|
| `send.queue-capacity` | `256` | messages that may wait for one client; beyond it the session is closed |
| `send.writer-threads` | `0` | threads that write to connections; 0 means the number of processors, at least 4 |
| `broadcast.timeout` | 5 seconds | no effect: no code reads it |
| `broadcast.batch-size` | `0` | no effect: no code reads it |

## Security

| Property | Default | Meaning |
|---|---|---|
| `security.enforce-authorization` | `false` | refuses subscriptions to a resource without a `ResourceAuthorizer` |
| `security.connect-ticket-validity` | 30 seconds | how long a connect ticket can be redeemed |
| `security.require-authentication` | `false` | no effect: no code reads it |

## WebSocket

| Property | Default | Meaning |
|---|---|---|
| `websocket.enabled` | `false` | registers the WebSocket transport |
| `websocket.endpoint` | `/ws/stream` | no effect: no code reads it |
| `websocket.allowed-origins` | `*` | no effect: no code reads it |
| `websocket.sockjs-enabled` | `true` | no effect: no code reads it |

## Several instances

| Property | Default | Meaning |
|---|---|---|
| `server.instance-id` | generated | the name of this instance in the server and session tables |
| `server.heartbeat-interval` | 30 seconds | how often the instance writes its heartbeat |
| `server.dead-threshold` | 2 minutes | how long an instance may be silent before its sessions are terminated |
| `server.cleanup-interval` | 60 seconds | how often silent instances are looked for |
| `distributed.broker` | `NONE` | `NONE`, `REDIS` or `NATS`, a `StreamProperties.Broker` |
| `distributed.leader-election.ttl` | 30 seconds | the lifetime of a leadership |
| `distributed.leader-election.renew-interval` | 10 seconds | how often a leader renews it |
| `distributed.leader-election.retry-interval` | 5 seconds | no effect: no code reads it |
| `distributed.pubsub.channel-prefix` | `stream:data:` | the prefix of the Redis channels |
| `distributed.registry.key-prefix` | `stream:` | the prefix of the Redis leader keys |
| `distributed.registry.ttl` | 1 hour | no effect: no code reads it |
| `distributed.nats.subject-prefix` | `stream.data.` | the prefix of the NATS subjects |
| `distributed.nats.broadcast-subject-segment` | `broadcast` | the subject of keyed messages, after the prefix |
| `distributed.nats.direct-subject-segment` | `direct` | the subject of messages to one session, after the prefix |
| `distributed.nats.leader-bucket` | `simplix-stream-leaders` | the key-value bucket of the leaders |

## Admin commands

| Property | Default | Meaning |
|---|---|---|
| `admin.enabled` | `false` | stores changing admin calls as commands in distributed mode |
| `admin.polling-interval` | 2 seconds | how often an instance looks for its commands |
| `admin.command-timeout` | 5 minutes | after which a command that was not carried out expires |
| `admin.retention-period` | 7 days | how long finished commands are kept |
| `admin.cleanup-cron` | `0 0 3 * * ?` | when old commands are deleted |

## Monitoring

| Property | Default | Meaning |
|---|---|---|
| `monitoring.metrics-enabled` | `true` | registers the metrics |
| `monitoring.metrics-prefix` | `simplix.stream` | the prefix of the metric names |
| `monitoring.health-check-interval` | 10 seconds | no effect: no code reads it |

## Event publishing

| Property | Default | Meaning |
|---|---|---|
| `event-publishing.enabled` | `false` | no effect: no code reads it |
| `event-publishing.events.session-connected` | `true` | no effect: no code reads it |
| `event-publishing.events.session-disconnected` | `true` | no effect: no code reads it |
| `event-publishing.events.subscription-changed` | `false` | no effect: no code reads it |

## Related documents

- [How simplix-stream works](en/stream/how-it-works.md)
- [Troubleshooting](en/stream/troubleshooting.md)
