# Getting started with simplix-scheduler

This page names a scheduled job and reads what the module records about it.

## Step 1. Write a job

```java
@Component
public class OverdueNotices {

    @Scheduled(cron = "0 0 7 * * *")
    @SchedulerName("overdue-notices")
    public void send() {
        // find overdue loans and notify their readers
    }
}
```

Without `@SchedulerName` the job is called by its class and method: `OverdueNotices_send`.

The `value` of `@SchedulerName` is the key of the job in the registry. Choose a name that says what the job does and keep it when the code moves: a changed name starts a new history. When several applications write to the same tables, begin the name with the application, such as `library-overdue-notices`.

## Step 2. Choose where the records go

```yaml
simplix:
  scheduler:
    mode: in-memory
```

In memory the records are lost at a restart, which suits development. The default mode is `database`; it needs the providers of [Recording runs in a database](./recording-runs-in-a-database.md), and without them the module falls back to memory and logs `No strategy found for mode 'database', falling back to first available`.

## Step 3. Read the log

With the logger `dev.simplecore.simplix.scheduler` at `DEBUG`, every run is logged with its result.

```
Logging execution for scheduler [overdue-notices]
Saved execution result for overdue-notices: SUCCESS in 4ms
```

A job that throws is recorded as `FAILED` with the message of the exception, and the exception is passed on as before.

## Leave a job out

```yaml
simplix:
  scheduler:
    excluded-schedulers:
      - CacheMetricsCollector_collectMetrics
```

The module records every `@Scheduled` method, including those of libraries. List the names to leave out.

## Next steps

- [Recording runs in a database](./recording-runs-in-a-database.md)
- [Running on several instances](./running-on-several-instances.md)
