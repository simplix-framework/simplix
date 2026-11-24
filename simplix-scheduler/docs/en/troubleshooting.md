# Troubleshooting simplix-scheduler

Symptoms an application meets when it records scheduled jobs, the cause of each and what to change.

| Symptom | Cause | What to do |
|---|---|---|
| The log shows `No strategy found for mode 'database', falling back to first available` and nothing reaches the tables | a provider is missing | declare a `SchedulerRegistryProvider` and a `SchedulerExecutionLogProvider`, or set `mode: in-memory` |
| A job is not recorded at all | the method is not called through Spring's scheduler, the aspect is off, or the name is under `excluded-schedulers` | check `aspect-enabled` and the excluded names, and that the class is a Spring bean with `@EnableScheduling` on the application |
| Jobs of libraries appear in the registry, such as `CacheMetricsCollector_collectMetrics` | every `@Scheduled` method is recorded | list the names under `excluded-schedulers` |
| The service name of every run is `unknown-service` | `spring.application.name` is not set | set it; it tells the runs of different applications apart in a shared table |
| The same job has several registry rows | several instances inserted it at the same moment | put a unique constraint on the job name and provide a ShedLock `LockProvider` |
| A run stays in `RUNNING` for ever | the instance stopped before the method returned | close such rows in a job of your own; the module has no check for them |
| The run table keeps growing | the module deletes nothing; `retention-days` and `cleanup-cron` have no effect | delete old rows in a job of your own |
| A renamed job shows up as a new job | the name is the key of the registry | name jobs with `@SchedulerName`, so that renaming a class or a method does not change the name |

## Related documents

- [How simplix-scheduler works](./how-it-works.md)
- [Configuration reference](./configuration-reference.md)
