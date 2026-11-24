# simplix-scheduler 문제 해결

스케줄 작업을 기록할 때 발생하는 증상과 원인, 조치를 정리합니다.

| 증상 | 원인 | 조치 |
|---|---|---|
| 로그에 `No strategy found for mode 'database', falling back to first available`이 기록되고 테이블에 아무것도 저장되지 않음 | 프로바이더 중 하나가 없습니다 | `SchedulerRegistryProvider`와 `SchedulerExecutionLogProvider`를 선언하거나 `mode: in-memory`를 지정하세요 |
| 작업이 전혀 기록되지 않음 | 메서드가 Spring 스케줄러로 호출되지 않거나, 애스펙트가 꺼져 있거나, 이름이 `excluded-schedulers`에 있습니다 | `aspect-enabled`와 제외 목록을 확인하고, 클래스가 Spring 빈이며 애플리케이션에 `@EnableScheduling`이 있는지 확인하세요 |
| `CacheMetricsCollector_collectMetrics`처럼 라이브러리의 작업이 레지스트리에 등록됨 | 모든 `@Scheduled` 메서드를 기록합니다 | `excluded-schedulers`에 이름을 지정하세요 |
| 모든 실행 기록의 서비스 이름이 `unknown-service`임 | `spring.application.name`이 설정되어 있지 않습니다 | 이 값을 지정하세요. 공유 테이블에서 애플리케이션별 실행 기록을 구분하는 데 사용합니다 |
| 같은 작업의 레지스트리 행이 여러 개임 | 여러 인스턴스가 동시에 삽입했습니다 | 작업 이름에 유일 제약을 지정하고 ShedLock `LockProvider`를 제공하세요 |
| 실행 기록이 계속 `RUNNING` 상태로 남음 | 메서드가 끝나기 전에 인스턴스가 중단되었습니다 | 직접 작성한 작업에서 해당 행을 종료하세요. 모듈에는 이 상태를 점검하는 기능이 없습니다 |
| 실행 기록 테이블이 계속 커짐 | 모듈은 아무것도 삭제하지 않으며 `retention-days`와 `cleanup-cron`은 효과가 없습니다 | 직접 작성한 작업에서 오래된 행을 삭제하세요 |
| 이름을 바꾼 작업이 새 작업으로 등록됨 | 이름이 레지스트리의 키입니다 | `@SchedulerName`으로 이름을 지정하세요. 클래스나 메서드 이름을 바꿔도 작업 이름이 유지됩니다 |

## 관련 문서

- [simplix-scheduler 동작 방식](./how-it-works.md)
- [설정 레퍼런스](./configuration-reference.md)
