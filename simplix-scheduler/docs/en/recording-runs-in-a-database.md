# Recording runs in a database

How to keep the job registry and the run history in tables of your own. The module does not bring entities: you write the tables in the shape your application wants and tell the module how to fill them.

## Step 1. Write the entities

```java
@Entity
@Table(name = "scheduler_jobs")
@Getter
@Setter
@NoArgsConstructor
public class SchedulerJob {

    @Id
    @UuidV7Generator
    private String id;

    @Column(nullable = false, unique = true)
    private String schedulerName;

    private String className;
    private String methodName;
    private String cronExpression;
    private String shedlockName;
    private Instant lastExecutionAt;
    private Long lastDurationMs;
}

@Entity
@Table(name = "scheduler_runs")
@Getter
@Setter
@NoArgsConstructor
public class SchedulerRun {

    @Id
    @UuidV7Generator
    private String id;

    private String jobId;
    private String schedulerName;
    private String serverHost;
    private Instant startedAt;
    private Instant endedAt;
    private Long durationMs;

    @Enumerated(EnumType.STRING)
    private ExecutionStatus status;

    private String errorMessage;
}
```

## Step 2. Provide the registry

A `SchedulerRegistryProvider` finds and creates the row of a job. The module calls `save` the first time it meets a job and `updateLastExecution` after every run.

```java
@Component
@RequiredArgsConstructor
public class SchedulerJobProvider implements SchedulerRegistryProvider<SchedulerJob> {

    private final SchedulerJobRepository repository;

    @Override
    public Optional<SchedulerJob> findBySchedulerName(String schedulerName) {
        return repository.findBySchedulerName(schedulerName);
    }

    @Override
    public SchedulerJob save(SchedulerRegistryEntry entry) {
        SchedulerJob job = new SchedulerJob();
        job.setSchedulerName(entry.getSchedulerName());
        job.setClassName(entry.getClassName());
        job.setMethodName(entry.getMethodName());
        job.setCronExpression(entry.getCronExpression());
        job.setShedlockName(entry.getShedlockName());
        return repository.save(job);
    }

    @Override
    @Transactional
    public int updateLastExecution(String registryId, Instant executionAt, Long durationMs) {
        return repository.updateLastExecution(registryId, executionAt, durationMs);
    }

    @Override
    public SchedulerRegistryEntry toRegistryEntry(SchedulerJob job) {
        return SchedulerRegistryEntry.builder()
            .registryId(job.getId())
            .schedulerName(job.getSchedulerName())
            .className(job.getClassName())
            .methodName(job.getMethodName())
            .cronExpression(job.getCronExpression())
            .shedlockName(job.getShedlockName())
            .enabled(true)
            .build();
    }

    @Override
    public String getRegistryId(SchedulerJob job) {
        return job.getId();
    }
}
```

## Step 3. Provide the run log

A `SchedulerExecutionLogProvider` creates the row of a run when it starts and applies the result when it ends.

```java
@Component
@RequiredArgsConstructor
public class SchedulerRunProvider implements SchedulerExecutionLogProvider<SchedulerRun> {

    private final SchedulerRunRepository repository;

    @Override
    public SchedulerRun createFromContext(SchedulerExecutionContext context) {
        SchedulerRun run = new SchedulerRun();
        run.setJobId(context.getRegistryId());
        run.setSchedulerName(context.getSchedulerName());
        run.setServerHost(context.getServerHost());
        run.setStartedAt(context.getStartTime());
        run.setStatus(ExecutionStatus.RUNNING);
        return run;
    }

    @Override
    public void applyResult(SchedulerRun run, SchedulerExecutionResult result) {
        run.setStatus(result.getStatus());
        run.setEndedAt(result.getEndTime());
        run.setDurationMs(result.getDurationMs());
        run.setErrorMessage(result.getErrorMessage());
    }

    @Override
    public SchedulerRun save(SchedulerRun run) {
        return repository.save(run);
    }
}
```

With both beans in place the `database` mode is active. After `overdue-notices` has run, `scheduler_jobs` holds its row with the class, the method and the schedule, and `scheduler_runs` holds a row per run with the status `SUCCESS`. A run that throws is stored as `FAILED` with the message of the exception.

## What the module passes

| Object | Holds |
|---|---|
| `SchedulerRegistryEntry` | the name of the job, its class and method, the cron expression, the ShedLock name, and the time and duration of the last run |
| `SchedulerExecutionContext` | the registry id, the job name, the start time, the service name (`spring.application.name`) and the host that ran it |
| `SchedulerExecutionResult` | the status (`SUCCESS` or `FAILED`), the end time, the duration and the error message |

A failure to write a record is logged and does not stop the job.

## Old records

The module adds rows and does not delete them. Delete old runs with a job of your own; the properties `retention-days`, `cleanup-cron` and `stuck-threshold-minutes` are there for such a job to read and are not acted on by the module.

## Related documents

- [Running on several instances](./running-on-several-instances.md)
- [Configuration reference](./configuration-reference.md)
