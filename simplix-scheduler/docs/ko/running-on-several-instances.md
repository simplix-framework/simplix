# 여러 인스턴스에서 실행

애플리케이션을 여러 인스턴스로 실행하면 모든 인스턴스가 모든 예약 작업을 시작합니다. ShedLock을 사용하면 작업이 한 번에 한 인스턴스에서만 실행되며, 모듈은 작업이 사용하는 잠금과 실행한 호스트를 기록합니다.

## 1단계. ShedLock 설정

모듈에 `shedlock-spring`이 포함되어 있습니다. 사용하는 저장소의 잠금 프로바이더(예: `net.javacrumbs.shedlock:shedlock-provider-jdbc-template`)를 추가하고, ShedLock 문서에 따라 `shedlock` 테이블을 생성하세요.

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

## 2단계. 작업에 잠금 지정

```java
@Scheduled(cron = "0 0 7 * * *")
@SchedulerLock(name = "overdue-notices", lockAtMostFor = "PT30M")
@SchedulerName("overdue-notices")
public void send() {
    // runs on one instance at a time
}
```

`@SchedulerLock`을 지정한 작업은 잠금 이름과 함께 기록되고, 실행마다 작업을 실행한 호스트가 기록됩니다.

## 작업의 첫 실행

여러 인스턴스가 같은 시점에 작업을 처음 실행하면 인스턴스마다 작업 목록 행을 생성하려 합니다. `LockProvider` 빈이 있으면 모듈은 이 단계에서 `simplix.scheduler.lock`으로 설정한 짧은 잠금을 사용하고, 다른 인스턴스가 잠금을 사용 중이면 재시도합니다.

## 관련 문서

- [데이터베이스에 실행 기록 저장](./recording-runs-in-a-database.md)
- [simplix-sync](../../../simplix-sync/README.ko.md)
