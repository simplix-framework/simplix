# simplix-scheduler 시작하기

이 문서는 예약 작업에 이름을 지정하고 모듈이 남긴 기록을 확인하는 과정을 안내합니다.

## 1단계. 작업 작성

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

`@SchedulerName`을 지정하지 않으면 클래스와 메서드 이름으로 `OverdueNotices_send`가 됩니다.

`@SchedulerName`의 `value`는 레지스트리에서 작업을 식별하는 키입니다. 작업의 역할을 알 수 있는 이름을 지정하고, 클래스나 패키지를 변경하더라도 이름을 유지하세요. 이름이 바뀌면 이력이 새로 시작됩니다. 여러 애플리케이션이 같은 테이블에 기록한다면 `library-overdue-notices`처럼 애플리케이션 이름으로 시작하세요.

## 2단계. 기록 위치 선택

```yaml
simplix:
  scheduler:
    mode: in-memory
```

메모리 모드의 기록은 재시작하면 사라지므로 개발 환경에 적합합니다. 기본 모드는 `database`이며 [데이터베이스에 실행 기록 저장](./recording-runs-in-a-database.md)의 프로바이더가 필요합니다. 프로바이더가 없으면 모듈은 메모리 모드로 전환하고 `No strategy found for mode 'database', falling back to first available`을 기록합니다.

## 3단계. 로그 확인

로거 `dev.simplecore.simplix.scheduler`를 `DEBUG`로 설정하면 실행마다 결과가 기록됩니다.

```
Logging execution for scheduler [overdue-notices]
Saved execution result for overdue-notices: SUCCESS in 4ms
```

예외가 발생한 작업은 예외 메시지와 함께 `FAILED`로 기록하며, 예외는 기존과 같게 전달됩니다.

## 작업 제외

```yaml
simplix:
  scheduler:
    excluded-schedulers:
      - CacheMetricsCollector_collectMetrics
```

모듈은 라이브러리의 메서드를 포함해 모든 `@Scheduled` 메서드를 기록합니다. 제외할 작업의 이름을 지정하세요.

## 다음 단계

- [데이터베이스에 실행 기록 저장](./recording-runs-in-a-database.md)
- [여러 인스턴스에서 실행](./running-on-several-instances.md)
