# Running on several instances

When an application runs on several instances, every instance starts every scheduled job. ShedLock makes a job run on one of them at a time, and the module records which lock a job uses and which host ran it.

## Step 1. Configure ShedLock

The module brings `shedlock-spring`. Add a lock provider for your store, for example `net.javacrumbs.shedlock:shedlock-provider-jdbc-template`, and create its `shedlock` table as the ShedLock documentation describes.

```java
@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "PT10M")
public class SchedulerLockConfig {

    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(dataSource);
    }
}
```

## Step 2. Lock the job

```java
@Scheduled(cron = "0 0 7 * * *")
@SchedulerLock(name = "overdue-notices", lockAtMostFor = "PT30M")
@SchedulerName("overdue-notices")
public void send() {
    // runs on one instance at a time
}
```

A job with `@SchedulerLock` is recorded with the name of its lock, and each run with the host that ran it.

## The first run of a job

When several instances meet a job for the first time at the same moment, each would create its registry row. With a `LockProvider` bean the module takes a short lock around that step, set by `simplix.scheduler.lock`, and retries when another instance holds it.

## Related documents

- [Recording runs in a database](./recording-runs-in-a-database.md)
- [simplix-sync](../../../simplix-sync/README.md)
