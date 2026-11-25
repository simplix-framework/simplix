# 데이터베이스에 실행 기록 저장

작업 목록과 실행 이력을 애플리케이션의 테이블에 보관하는 방법을 설명합니다. 모듈은 엔티티를 제공하지 않습니다. 애플리케이션에 맞는 형태로 테이블을 작성하고, 모듈이 값을 기록하는 방법을 구현합니다.

## 1단계. 엔티티 작성

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

## 2단계. 작업 목록 프로바이더

`SchedulerRegistryProvider`는 작업의 행을 조회하고 생성합니다. 모듈은 작업을 처음 실행할 때 `save`를 호출하고, 실행이 끝날 때마다 `updateLastExecution`을 호출합니다.

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

## 3단계. 실행 이력 프로바이더

`SchedulerExecutionLogProvider`는 실행이 시작될 때 행을 생성하고 끝날 때 결과를 반영합니다.

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

프로바이더 빈을 모두 등록하면 `database` 모드가 활성화됩니다. `overdue-notices`가 실행된 뒤에는 `scheduler_jobs`에 클래스, 메서드, 일정이 기록된 행이 저장되고, `scheduler_runs`에는 실행마다 `SUCCESS` 상태의 행이 저장됩니다. 예외가 발생한 실행은 예외 메시지와 함께 `FAILED`로 저장됩니다.

## 모듈이 전달하는 값

| 객체 | 내용 |
|---|---|
| `SchedulerRegistryEntry` | 작업 이름, 클래스와 메서드, cron 표현식, ShedLock 이름, 마지막 실행 시각과 소요 시간 |
| `SchedulerExecutionContext` | 작업 목록 식별자, 작업 이름, 시작 시각, 서비스 이름(`spring.application.name`), 실행한 호스트 |
| `SchedulerExecutionResult` | 상태(`SUCCESS` 또는 `FAILED`), 종료 시각, 소요 시간, 오류 메시지 |

기록에 실패하면 로그만 남기고 작업은 중단하지 않습니다.

## 오래된 기록

모듈은 행을 추가하기만 하고 삭제하지 않습니다. 오래된 실행 이력은 별도 작업으로 삭제하세요. `retention-days`, `cleanup-cron`, `stuck-threshold-minutes` 속성은 이런 작업에서 읽어 사용하도록 제공하며, 모듈은 이 값으로 동작하지 않습니다.

## 관련 문서

- [여러 인스턴스에서 실행](ko/scheduler/running-on-several-instances.md)
- [설정 레퍼런스](ko/scheduler/configuration-reference.md)
