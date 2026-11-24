# Running several instances

What changes when the application runs on more than one server: where sessions are kept, how an instance knows about the others, and how an administrator reaches a session on another instance.

## The modes

| `simplix.stream.mode` | Sessions are kept | Fits |
|---|---|---|
| `local`, a `Mode`, the default | in memory, by `LocalSessionRegistry` | one instance |
| `distributed` | in the database, by `DbSessionRegistry` | several instances behind a load balancer |

A connection is held by the instance that accepted it, in either mode. The subscription calls of a session have to reach that instance, so the load balancer needs sticky sessions for `/api/stream/**`.

## Configure distributed mode

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

- `mode: distributed` needs a session registry. `persistence.enabled: true` registers `DbSessionRegistry`; without it the application does not start, unless it declares a `SessionRegistry` bean of its own.
- The entities of the module are outside the packages of the application, so the application class names them in `@EntityScan`, together with its own package.
- Give `instance-id` and `server.instance-id` the same value, a name that is unique per instance. When they are not set, each part of the module generates an id of its own.
- The tables are `stream_sessions`, `stream_subscriptions`, `stream_server_instances` and `stream_admin_commands`, mapped by `StreamSessionEntity`, `StreamSubscriptionEntity`, `StreamServerInstanceEntity` and `AdminCommand`. Create them with your migration tool; with `ddl-auto` Hibernate creates them.

## What the instances share

| Part | Does |
|---|---|
| `DbSessionRegistry` | writes every session and its subscriptions to the database through `StreamSessionRepository` and `StreamSubscriptionRepository`, so that a session can be found from any instance and restored on another one by `/reconnect` |
| `StreamServerManager` | registers the instance in `StreamServerInstanceRepository`, writes a heartbeat every `server.heartbeat-interval`, and every `server.cleanup-interval` marks instances without a heartbeat for `server.dead-threshold` as dead and terminates their sessions |
| `StreamStatisticsService` | answers the global endpoints of the admin API from the tables |
| `AdminCommandProcessor` | carries out admin commands that were stored for this instance; see below |

Data is collected by the instance that holds the subscribing sessions. Two instances with subscribers to the same key each call the collector.

## Admin commands across instances

```yaml
simplix:
  stream:
    admin:
      enabled: true
      polling-interval: 2s
      command-timeout: 5m
      retention-period: 7d
```

An administrator calls any instance, and the session may live on another one. With `admin.enabled`, the ending of a session and the stopping or triggering of a scheduler are stored as an `AdminCommand` through `AdminCommandService` (the `DefaultAdminCommandService` writes to `AdminCommandRepository`), and the call answers 202. Every instance looks for its commands each `polling-interval` and carries them out. The repository package is named in `@EnableJpaRepositories`, as in the application class above; without it the commands are not registered and the calls act on the local instance only.

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

| `AdminCommandType` | Does |
|---|---|
| `TERMINATE_SESSION` | ends a session |
| `STOP_SCHEDULER` | stops the collection of a subscription key |
| `TRIGGER_SCHEDULER` | calls the collector of a subscription key at once |

| `AdminCommandStatus` | Meaning |
|---|---|
| `PENDING` | stored, not carried out yet |
| `EXECUTED` | carried out by the instance named in `executedBy` |
| `FAILED` | the instance could not carry it out |
| `EXPIRED` | not carried out within `admin.command-timeout` |
| `NOT_FOUND` | the target did not exist on the instance |

Commands older than `admin.retention-period` are deleted by the job `admin.cleanup-cron` schedules.

## Sharing collection through a broker

`simplix.stream.distributed.broker`, a `Broker`, names how instances pass data to one another.

| Value | Design |
|---|---|
| `NONE`, the default | no data crosses instances; every instance collects for its own sessions |
| `REDIS` | `RedisLeaderElection` (a `LeaderElection`) lets one instance per subscription key collect, and `RedisBroadcaster` publishes the data on Redis channels under `distributed.pubsub.channel-prefix` to the instances that hold subscribers |
| `NATS` | the same with `NatsLeaderElection`, which keeps leaders in the key-value bucket `distributed.nats.leader-bucket`, and `NatsBroadcaster`, which publishes on subjects under `distributed.nats.subject-prefix` |

> ⚠ An application configured with `broker: REDIS` does not start. The Redis configuration of the module is evaluated before the `StringRedisTemplate` of Spring Boot exists and is skipped, which leaves the module without a `BroadcastService`; with a `StringRedisTemplate` bean declared by the application, the beans `schedulerManager`, `redisBroadcaster` and `schedulerSubscriberLookup` depend on one another and the context refuses the cycle. The NATS configuration wires its broadcaster in the same way. Run several instances with `NONE`.

## Related documents

- [Managing streams](./managing-streams.md)
- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
