# Configuration reference

Every property of the module, under `simplix.scheduler`.

| Property | Default | Meaning |
|---|---|---|
| `enabled` | `true` | switches the module on |
| `aspect-enabled` | `true` | intercepts `@Scheduled` methods |
| `mode` | `database` | `database` or `in-memory` |
| `excluded-schedulers` | none | the names of jobs that are not recorded |
| `lock.lock-at-most` | 60 seconds | the longest the registry lock is held |
| `lock.lock-at-least` | 1 second | the shortest the registry lock is held |
| `lock.max-retries` | `3` | attempts to take the registry lock |
| `lock.retry-delays-ms` | `100`, `200`, `500` | the waits between those attempts |
| `retention-days` | `90` | no effect: no code reads it; write your own job for this |
| `cleanup-cron` | `0 0 3 * * ?` | no effect: no code reads it; write your own job for this |
| `stuck-threshold-minutes` | `30` | no effect: no code reads it; write your own job for this |

## Beans

| Bean | Registered when | Replace it to |
|---|---|---|
| `SchedulerExecutionAspect` | `aspect-enabled` is on | change what is intercepted |
| `InMemoryLoggingStrategy` | always | not usually replaced |
| `DatabaseLoggingStrategy` | a `SchedulerRegistryProvider` and a `SchedulerExecutionLogProvider` exist | not usually replaced |
| `SchedulerLoggingService` | no bean of that type exists | record runs in another way |

A bean that implements `SchedulerLoggingStrategy` adds a mode of your own: its `supports(mode)` decides for which `mode` value it is used.

## Related documents

- [Getting started](./getting-started.md)
- [Recording runs in a database](./recording-runs-in-a-database.md)
