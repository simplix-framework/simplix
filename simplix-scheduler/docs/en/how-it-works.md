# How simplix-scheduler works

What happens around a scheduled method, which class does each step, and what the module leaves to the application.

## Around every run

1. `SchedulerExecutionAspect` intercepts every method annotated with `@Scheduled`, also those of libraries.
2. It builds a `SchedulerMetadata` for the method: the name (`@SchedulerName`, or class and method), the class, the method, the cron expression, the ShedLock name and a `SchedulerMetadata.SchedulerType`, `DISTRIBUTED` for a method with `@SchedulerLock` and `LOCAL` otherwise.
3. A name listed under `excluded-schedulers` is run without any record.
4. `SchedulerLoggingService`, by default `DefaultSchedulerLoggingService`, makes sure the job is in the registry and opens a run in the state `RUNNING`.
5. The method runs.
6. The service closes the run with a `SchedulerExecutionResult`: `SUCCESS` with the duration, or `FAILED` with the message of the exception. The exception is thrown on to Spring as before.

## Where the records go

The service passes the work to a `SchedulerLoggingStrategy` chosen by `simplix.scheduler.mode`.

| Mode | Strategy | Keeps |
|---|---|---|
| `in-memory` | `InMemoryLoggingStrategy` | the registry and the runs in maps of the instance; lost at a restart |
| `database` | `DatabaseLoggingStrategy` | whatever your `SchedulerRegistryProvider` and `SchedulerExecutionLogProvider` store |

`SchedulerAutoConfiguration` registers the aspect, the service and the in-memory strategy, and binds `simplix.scheduler` to `SchedulerProperties`. Its nested `SchedulerAutoConfiguration.DatabaseStrategyConfiguration` adds the database strategy when both providers exist. With `mode: database` and no providers, the first available strategy, the in-memory one, is used and a warning is logged.

## What the providers receive

| Object | Fields |
|---|---|
| `SchedulerRegistryEntry` | `registryId`, `schedulerName`, `className`, `methodName`, `cronExpression`, `shedlockName`, `enabled` |
| `SchedulerExecutionContext` | `registryId`, `schedulerName`, `shedlockName`, `startTime`, `status`, `serviceName`, `serverHost`, and `getDurationMs()` for the time since the start |
| `SchedulerExecutionResult` | `status`, `endTime`, `durationMs`, `errorMessage`, `itemsProcessed` |
| `ExecutionStatus` | `RUNNING`, `SUCCESS`, `FAILED`, `TIMEOUT` |

## The registry lock

When several instances meet a job for the first time at the same moment, each would insert its registry row. With a ShedLock `LockProvider` bean the database strategy takes a lock for that insert; `lock.lock-at-most`, `lock.lock-at-least`, `lock.max-retries` and `lock.retry-delays-ms` of `SchedulerProperties.LockConfig` shape it. A unique constraint on the job name is the second line of defence. See [Running on several instances](./running-on-several-instances.md).

## What the module does not do

- It does not delete old records. `retention-days` and `cleanup-cron` are read by no code; write a cleanup job against your own tables.
- It does not close runs that never ended, for example after a crash. `stuck-threshold-minutes` is read by no code; a row left in `RUNNING` stays that way until your own check changes it.
- It does not schedule or lock jobs. Spring schedules them, and ShedLock keeps instances from running the same job at once.

## Other public methods

The guides show the methods a task needs. The types they name also have these public methods.

| Type | Method | Does |
|---|---|---|
| `SchedulerExecutionResult` | `success(durationMs)`, `success(durationMs, itemsProcessed)`, `timeout(durationMs)` | create the result of a successful run and of a run that timed out |
| `SchedulerExecutionResult` | `isSuccess()`, `isFailed()`, `isTimeout()` | say how the run ended |
| `SchedulerLoggingService` | `isEnabled()`, `isExcluded(schedulerName)` | say whether runs are recorded at all, and whether a scheduler is left out |
| `DefaultSchedulerLoggingService` | `getActiveStrategy()` | returns the `SchedulerLoggingStrategy` in use |
| `SchedulerRegistryProvider` | `existsBySchedulerName(schedulerName)` | default method: says whether the registry has an entry of that name |
| `SchedulerRegistryProvider` | `updateMetadata(registryId, metadata)` | default method, called when the class name, the cron expression or the lock name of a registered scheduler changed; returns the number of updated entries |
| `SchedulerRegistryEntry` | `fromMetadata(metadata)`, `needsMetadataUpdate(metadata)` | create an entry with a new registry id from the metadata, and say whether an entry differs from the metadata |
| `InMemoryLoggingStrategy` | `getRegistryCount()`, `getExecutionCount()` | return the number of registered schedulers and of runs kept in memory |

## Related documents

- [Recording runs in a database](./recording-runs-in-a-database.md)
- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
