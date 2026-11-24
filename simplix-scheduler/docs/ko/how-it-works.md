# simplix-scheduler 동작 방식

스케줄 메서드가 실행될 때 일어나는 처리, 각 단계를 담당하는 클래스, 애플리케이션이 직접 처리해야 하는 범위를 설명합니다.

## 실행 전후의 처리

1. `SchedulerExecutionAspect`가 `@Scheduled`를 지정한 모든 메서드를 가로챕니다. 라이브러리의 메서드도 포함됩니다.
2. 메서드의 `SchedulerMetadata`를 구성합니다. 이름(`@SchedulerName` 또는 클래스와 메서드), 클래스, 메서드, 크론 표현식, ShedLock 이름, `SchedulerMetadata.SchedulerType`으로 구성되며, 타입은 `@SchedulerLock`이 있는 메서드이면 `DISTRIBUTED`, 없으면 `LOCAL`입니다.
3. `excluded-schedulers`에 있는 이름은 기록 없이 실행합니다.
4. `SchedulerLoggingService`(기본 구현은 `DefaultSchedulerLoggingService`)가 작업을 레지스트리에 등록하고 `RUNNING` 상태의 실행 기록을 생성합니다.
5. 메서드가 실행됩니다.
6. 서비스가 `SchedulerExecutionResult`로 실행 기록을 종료합니다. 성공하면 소요 시간과 함께 `SUCCESS`, 실패하면 예외 메시지와 함께 `FAILED`로 기록합니다. 예외는 이전과 같이 Spring으로 전달됩니다.

## 기록 위치

서비스는 `simplix.scheduler.mode`로 선택한 `SchedulerLoggingStrategy`에 작업을 전달합니다.

| 모드 | 전략 | 보관 위치 |
|---|---|---|
| `in-memory` | `InMemoryLoggingStrategy` | 인스턴스의 맵에 레지스트리와 실행 기록을 보관합니다. 재시작하면 사라집니다 |
| `database` | `DatabaseLoggingStrategy` | 애플리케이션의 `SchedulerRegistryProvider`와 `SchedulerExecutionLogProvider`가 저장하는 위치 |

`SchedulerAutoConfiguration`이 애스펙트, 서비스, 인메모리 전략을 등록하고 `simplix.scheduler`를 `SchedulerProperties`에 바인딩합니다. 중첩 구성 `SchedulerAutoConfiguration.DatabaseStrategyConfiguration`은 프로바이더가 모두 있을 때 데이터베이스 전략을 추가합니다. `mode: database`인데 프로바이더가 없으면 처음 사용할 수 있는 전략인 인메모리 전략을 사용하고 경고를 로그에 기록합니다.

## 프로바이더에 전달되는 값

| 객체 | 필드 |
|---|---|
| `SchedulerRegistryEntry` | `registryId`, `schedulerName`, `className`, `methodName`, `cronExpression`, `shedlockName`, `enabled` |
| `SchedulerExecutionContext` | `registryId`, `schedulerName`, `shedlockName`, `startTime`, `status`, `serviceName`, `serverHost`. `getDurationMs()`는 시작 이후 경과 시간을 반환합니다 |
| `SchedulerExecutionResult` | `status`, `endTime`, `durationMs`, `errorMessage`, `itemsProcessed` |
| `ExecutionStatus` | `RUNNING`, `SUCCESS`, `FAILED`, `TIMEOUT` |

## 레지스트리 락

여러 인스턴스가 같은 작업을 동시에 처음 실행하면 각 인스턴스가 레지스트리 행을 삽입하려고 합니다. ShedLock `LockProvider` 빈이 있으면 데이터베이스 전략이 이 삽입에 락을 사용하며, `SchedulerProperties.LockConfig`의 `lock.lock-at-most`, `lock.lock-at-least`, `lock.max-retries`, `lock.retry-delays-ms`로 동작을 조정합니다. 작업 이름의 유일 제약이 두 번째 방어 수단입니다. [여러 인스턴스에서 실행](./running-on-several-instances.md)을 참고하세요.

## 모듈이 처리하지 않는 범위

- 오래된 기록을 삭제하지 않습니다. `retention-days`와 `cleanup-cron`을 읽는 코드가 없으므로, 애플리케이션의 테이블을 정리하는 작업을 직접 작성하세요.
- 비정상 종료 등으로 끝나지 않은 실행 기록을 종료하지 않습니다. `stuck-threshold-minutes`를 읽는 코드가 없으므로, `RUNNING` 상태로 남은 행은 직접 작성한 점검 작업에서 변경해야 합니다.
- 작업을 예약하거나 잠그지 않습니다. 예약은 Spring이 처리하고, 여러 인스턴스의 동시 실행은 ShedLock으로 방지합니다.

## 그 밖의 공개 메서드

가이드에서는 작업에 필요한 메서드를 설명합니다. 가이드에 나온 타입은 아래 공개 메서드도 제공합니다.

| 타입 | 메서드 | 동작 |
|---|---|---|
| `SchedulerExecutionResult` | `success(durationMs)`, `success(durationMs, itemsProcessed)`, `timeout(durationMs)` | 성공한 실행의 결과와 시간이 초과된 실행의 결과를 만듭니다 |
| `SchedulerExecutionResult` | `isSuccess()`, `isFailed()`, `isTimeout()` | 실행이 성공, 실패, 시간 초과 중 어느 상태로 끝났는지 반환합니다 |
| `SchedulerLoggingService` | `isEnabled()`, `isExcluded(schedulerName)` | 실행 기록 기능이 활성화되어 있는지, 지정한 스케줄러가 기록 대상에서 제외되어 있는지 반환합니다 |
| `DefaultSchedulerLoggingService` | `getActiveStrategy()` | 사용 중인 `SchedulerLoggingStrategy`를 반환합니다 |
| `SchedulerRegistryProvider` | `existsBySchedulerName(schedulerName)` | 기본 메서드입니다. 레지스트리에 해당 이름의 항목이 있는지 반환합니다 |
| `SchedulerRegistryProvider` | `updateMetadata(registryId, metadata)` | 기본 메서드입니다. 등록된 스케줄러의 클래스 이름, 크론 식, 잠금 이름이 바뀌면 호출되며 갱신한 항목 수를 반환합니다. 기본 구현은 아무것도 갱신하지 않고 0을 반환합니다 |
| `SchedulerRegistryEntry` | `fromMetadata(metadata)`, `needsMetadataUpdate(metadata)` | 메타데이터로 새 레지스트리 ID의 항목을 만들고, 항목이 메타데이터와 다른지 반환합니다 |
| `InMemoryLoggingStrategy` | `getRegistryCount()`, `getExecutionCount()` | 등록된 스케줄러 수와 메모리에 보관 중인 실행 기록 수를 반환합니다 |
| `SchedulerMetadata`, `SchedulerRegistryEntry` | `getSchedulerType()` | 스케줄러의 `SchedulerMetadata.SchedulerType`을 반환합니다. 값은 `LOCAL` 또는 `DISTRIBUTED`입니다 |
| `SchedulerRegistryEntry` | `getDisplayName()` | 스케줄러의 표시 이름을 반환합니다. `fromMetadata`는 스케줄러 이름을 표시 이름으로 지정합니다 |

## 관련 문서

- [데이터베이스에 실행 기록 저장](./recording-runs-in-a-database.md)
- [설정 레퍼런스](./configuration-reference.md)
- [문제 해결](./troubleshooting.md)
