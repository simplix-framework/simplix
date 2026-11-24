# 설정 레퍼런스

`simplix.scheduler` 아래에 있는 모듈의 모든 속성을 정리합니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `enabled` | `true` | 모듈 사용 |
| `aspect-enabled` | `true` | `@Scheduled` 메서드 가로채기 |
| `mode` | `database` | `database` 또는 `in-memory` |
| `excluded-schedulers` | 없음 | 기록하지 않을 작업 이름 |
| `lock.lock-at-most` | 60초 | 작업 목록 잠금의 최대 보유 시간 |
| `lock.lock-at-least` | 1초 | 작업 목록 잠금의 최소 보유 시간 |
| `lock.max-retries` | `3` | 작업 목록 잠금 획득 시도 횟수 |
| `lock.retry-delays-ms` | `100`, `200`, `500` | 시도 사이의 대기 시간 |
| `retention-days` | `90` | 효과가 없습니다. 이 값을 읽는 코드가 없으므로 해당 작업을 직접 작성하세요 |
| `cleanup-cron` | `0 0 3 * * ?` | 효과가 없습니다. 이 값을 읽는 코드가 없으므로 해당 작업을 직접 작성하세요 |
| `stuck-threshold-minutes` | `30` | 효과가 없습니다. 이 값을 읽는 코드가 없으므로 해당 작업을 직접 작성하세요 |

## 빈

| 빈 | 등록 조건 | 대체하는 목적 |
|---|---|---|
| `SchedulerExecutionAspect` | `aspect-enabled`가 켜져 있음 | 가로채는 대상 변경 |
| `InMemoryLoggingStrategy` | 항상 | 일반적으로 대체하지 않음 |
| `DatabaseLoggingStrategy` | `SchedulerRegistryProvider`와 `SchedulerExecutionLogProvider`가 있음 | 일반적으로 대체하지 않음 |
| `SchedulerLoggingService` | 같은 타입의 빈이 없음 | 다른 방식으로 실행 기록 |

`SchedulerLoggingStrategy`를 구현한 빈을 등록하면 모드를 추가할 수 있습니다. `supports(mode)`로 어떤 `mode` 값에 사용할지 정합니다.

### `SchedulerLoggingStrategy`의 메서드

| 메서드 | 역할 |
|---|---|
| `getName()`, `supports(mode)` | 전략의 이름을 반환하고, 설정된 `mode`를 처리하는지 판정합니다 |
| `ensureRegistryEntry(metadata)` | 작업의 레지스트리 항목을 조회하거나 생성합니다 |
| `createExecutionContext(...)` | 실행 한 건의 기록을 시작하고, 결과를 저장할 때 사용할 컨텍스트를 반환합니다 |
| `saveExecutionResult(context, result)` | 실행 결과를 저장합니다 |
| `initialize()`, `shutdown()`, `isReady()`, `clearCache()` | 선택 구현. 리소스 준비와 해제, 준비 상태 보고, 전략이 캐시한 값 삭제에 사용합니다 |

## 관련 문서

- [시작하기](./getting-started.md)
- [데이터베이스에 실행 기록 저장](./recording-runs-in-a-database.md)
