# 상태 일관성 유지

브로드캐스트는 유실될 수 있습니다. 재시작 중인 인스턴스, 네트워크 단절, 연결이 끊긴 브로커가 그 원인입니다. 이 문서는 인스턴스에서 공유 상태를 안전하게 보관하는 방법과, 메시지 유실로 어긋난 상태를 복구하는 방법을 설명합니다.

## 전달 보장

- 메시지는 그 시점에 구독 중인 인스턴스에 전달됩니다. 연결되어 있지 않은 인스턴스를 위해 저장하지 않습니다.
- 보낸 인스턴스는 자신의 메시지를 받지 않습니다. 메시지 앞에 보낸 인스턴스의 16바이트 식별자가 있으며, 받는 쪽은 자신의 식별자가 있는 메시지를 버립니다.
- 같은 인스턴스가 같은 채널로 보낸 메시지는 보낸 순서대로 도착합니다. 서로 다른 인스턴스가 보낸 메시지 사이에는 순서가 보장되지 않습니다.

## 키별 상태 보관

```java
InMemoryStateStore<ShelfState> shelves = new InMemoryStateStore<>(ShelfState::new);

// one thread at a time changes the state of a key
shelves.mutate("s1", state -> state.setFreeSlots(4));

// a change that also answers
boolean applied = shelves.compute("s1", state -> state.applyIfNewer(change));
```

`InMemoryStateStore`는 키를 처음 사용할 때 전달받은 팩토리로 상태를 생성하고, 같은 키의 `mutate`와 `compute`를 한 번에 하나씩 실행합니다. 브로드캐스트를 받는 핸들러와 같은 키를 읽는 요청 스레드는 일부만 반영된 변경을 읽지 않습니다.

## 중복 적용에 안전한 메시지

「1 증가」 같은 명령 대신 새 값이나 버전을 포함한 값을 보내세요. 값을 담은 메시지는 다시 적용하거나, 더 새로운 메시지가 도착했을 때 건너뛰어도 문제가 없습니다.

## 유실된 변경 복구

`ReconciliationScheduler`는 인스턴스가 보유한 리소스를 배치 단위로 순회하며 원본에서 다시 불러옵니다. 직접 작성한 예약 메서드에서 호출하세요.

```java
ReconciliationScheduler<ShelfState> reconciliation = ReconciliationScheduler.<ShelfState>builder()
    .resourceProvider(this::allShelves)
    .keyExtractor(ShelfState::getShelfId)
    .batchSize(10)
    .circuitBreaker(new CircuitBreaker(3, 30_000))
    .rateLimiter(new RateLimiter(20))
    .build();

@Scheduled(fixedDelay = 30_000)
public void reconcile() {
    reconciliation.reconcile(shelf -> reloadFromSource(shelf));
}
```

- 호출할 때마다 다음 `batchSize`개의 리소스를 처리하고 이전 호출이 끝난 위치에서 이어 가므로, 모든 리소스를 차례로 처리합니다.
- `CircuitBreaker`를 지정하면 계속 실패하는 리소스를 일정 시간 건너뛰고, `RateLimiter`를 지정하면 원본 호출 횟수를 제한합니다. 이 클래스는 [simplix-core](../../../simplix-core/docs/ko/resilience-utilities.md)에 있습니다.
- 인스턴스가 여러 개이면 예약 메서드에 잠금을 지정해 한 번에 한 인스턴스만 재조정하도록 하세요. [simplix-scheduler](../../../simplix-scheduler/docs/ko/running-on-several-instances.md)를 참고하세요.

| 빌더 메서드 | 설정하는 값 |
|---|---|
| `resourceProvider(supplier)` | 순회할 리소스. `reconcile`을 호출할 때마다 실행되므로 비용이 낮아야 합니다 |
| `keyExtractor(function)` | 리소스의 키. 서킷 브레이커의 키로 사용합니다 |
| `batchSize(n)` | 한 번의 호출에서 처리하는 리소스 수 |
| `circuitBreaker(breaker)` | 다시 불러오기가 계속 실패하는 리소스를 건너뜁니다 |
| `rateLimiter(limiter)` | 초당 다시 불러오는 횟수를 제한합니다. 리미터가 거부하면 해당 주기를 종료합니다 |

`getCursorPosition()`은 다음 호출이 이어서 시작할 위치를 반환합니다. 프로세서에서 예외가 발생하면 서킷 브레이커가 해당 리소스의 실패로 집계합니다. 예외를 삼키지 말고 그대로 전달하세요. 그렇지 않으면 원본 저장소의 장애를 감지하지 못합니다.

## 관련 문서

- [시작하기](./getting-started.md)
- [복원력 유틸리티](../../../simplix-core/docs/ko/resilience-utilities.md)
