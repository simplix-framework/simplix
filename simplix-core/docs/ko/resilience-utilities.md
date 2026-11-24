# 복원력 유틸리티

부하가 높거나 호출 대상에 장애가 발생했을 때 구성 요소가 계속 동작하도록 하는 작은 스레드 안전 클래스를 설명합니다. 상태를 메모리에 보관하고 의존성이 없으므로, 필요한 위치에서 `new`로 생성합니다.

```java
CircuitBreaker breaker = new CircuitBreaker(3, 30_000);
if (breaker.allowRequest("payment-gateway")) {
    try {
        gateway.charge(order);
        breaker.recordSuccess("payment-gateway");
    } catch (IOException e) {
        breaker.recordFailure("payment-gateway");
        throw e;
    }
}

RateLimiter limiter = new RateLimiter(50);
if (!limiter.tryAcquire()) {
    return;
}

EventDeduplicator deduplicator = new EventDeduplicator(60);
if (deduplicator.isDuplicate(deviceId, eventTime, "door-open")) {
    return;
}
```

| 클래스 | 생성자 | 동작 |
|---|---|---|
| `CircuitBreaker` | `(failureThreshold, halfOpenTimeoutMs)` | 키별로 지정한 횟수만큼 연속 실패하면 요청을 차단합니다. 타임아웃이 지나면 확인 요청 한 건을 허용하고, 성공하면 다시 요청을 허용합니다 |
| `RateLimiter` | `(maxPerSecond)` | 토큰 버킷 방식입니다. 초당 허용량을 모두 사용하면 `tryAcquire()`가 false를 반환합니다 |
| `BackpressureGuard` | `(maxConnections, maxEventsPerSecond)` | `tryRegister()`는 한도를 넘는 연결을 거부하고, `shouldProceed()`는 부하가 한도의 80%를 넘으면 처리 속도를 낮추도록 알립니다 |
| `EventDeduplicator` | `(windowSeconds)` | `isDuplicate(id, timestamp, eventKey)`는 윈도 안에서 이미 처리한 이벤트이면 true를 반환합니다 |
| `AsyncQueryTracker` | `(timeoutMs)` | `track(queryId)`가 반환한 future는 응답이 도착해 `complete(queryId)`가 호출되면 완료되고, 그렇지 않으면 타임아웃됩니다 |
| `RoundRobinSelector` | `()` | `selectBatch(items, batchSize)`는 이전 호출이 끝난 위치부터 다음 배치를 반환합니다 |

## 서킷 브레이커

`CircuitBreaker`는 키별로 회로를 유지하므로, 장애가 난 게이트웨이 때문에 정상 게이트웨이의 호출이 중단되지 않습니다. `new CircuitBreaker(2, 200)`인 경우, 한 번 실패한 뒤에는 `allowRequest`가 true를 반환하고 두 번째 실패 뒤에는 false를 반환합니다. 200ms가 지나면 확인 호출 한 건을 허용하고, 그 결과가 보고될 때까지 다음 호출을 거부합니다. `recordSuccess`를 호출하면 회로가 닫혀 다시 호출을 허용합니다. 확인 호출이 실패하면 회로는 열린 상태를 유지합니다. 200ms 동안 호출을 다시 거부한 뒤 다음 확인 호출을 허용합니다. `getStatus(key)`는 `CircuitBreaker.Status`(`CLOSED`, `OPEN`, `HALF_OPEN`)를 반환하고, `reset(key)`로 회로를 직접 닫을 수 있습니다.

## 레이트 리미터

`RateLimiter`는 일정한 속도로 채워지는 토큰 버킷입니다. `new RateLimiter(3)`에서 `tryAcquire`를 연속으로 열 번 호출하면 세 번 허용하고 일곱 번 거부하며, 1초 뒤에 다시 세 번을 허용합니다. 대기하지 않으므로, 거부된 호출자가 작업을 버릴지 나중에 다시 시도할지 결정합니다.

## 중복 제거

`EventDeduplicator`는 최근 `windowSeconds` 동안의 이벤트를 식별자, 타임스탬프, 키 단위로 보관합니다. 첫 번째 `isDuplicate("d1", 1000L, "open")`은 false를, 같은 호출을 반복하면 true를, 타임스탬프가 다른 호출은 false를 반환합니다. 오래된 항목은 호출이 들어올 때 정리하며, `getTrackedCount()`로 보관 중인 항목 수를 확인합니다.

## 백프레셔 가드

`BackpressureGuard`는 열려 있는 연결 수를 집계합니다. `maxConnections`만큼 연결이 열려 있으면 `tryRegister()`가 false를 반환하고, 연결이 닫힐 때 `unregister()`로 수를 줄입니다. 열려 있는 연결이 한도의 80% 이상이면 `shouldProceed()`가 false를 반환합니다. 한도가 5이면 연결 세 개까지는 true, 네 번째부터는 false입니다. 추가 전송 같은 선택적 작업을 건너뛰라는 신호로 사용하세요. `getActiveConnections()`, `getMaxConnections()`, `getMaxEventsPerSecond()`로 현재 상태와 한도를 읽습니다.

```java
BackpressureGuard guard = new BackpressureGuard(1000, 5000);

public SseEmitter open() {
    if (!guard.tryRegister()) {
        throw new SimpliXGeneralException(ErrorCode.GEN_SERVICE_UNAVAILABLE, "Too many connections", null);
    }
    SseEmitter emitter = new SseEmitter();
    emitter.onCompletion(guard::unregister);
    emitter.onTimeout(guard::unregister);
    return emitter;
}

public void pushStatistics() {
    if (guard.shouldProceed()) {
        broadcast(statistics());
    }
}
```

## 쿼리 트래커와 라운드 로빈 선택기

`AsyncQueryTracker`는 채널로 보낸 요청과 나중에 도착하는 응답을 연결합니다. `track(queryId)`가 `CompletableFuture`를 반환하고, 응답을 받은 코드가 `complete(queryId)`를 호출합니다. `timeoutMs` 안에 완료되지 않은 future는 `TimeoutException`으로 실패하며, `getPendingCount()`로 대기 중인 요청 수를 확인합니다.

```java
AsyncQueryTracker tracker = new AsyncQueryTracker(3_000);

public CompletableFuture<Void> askDevice(String deviceId) {
    String queryId = UuidUtils.generateShortUuid();
    CompletableFuture<Void> answered = tracker.track(queryId);
    channel.send(deviceId, queryId);
    return answered;
}

public void onAnswer(String queryId) {
    tracker.complete(queryId);
}
```

`RoundRobinSelector`는 목록을 배치 단위로 순회합니다. 항목이 다섯 개이고 배치 크기가 2이면 세 번의 호출이 `[a, b]`, `[c, d]`, `[e, a]`를 반환합니다. `resetCursor()`로 처음부터 다시 시작합니다. 많은 장치를 몇 대씩 나누어 폴링할 때 사용하세요.

상태는 프로세스 안의 인스턴스 단위로 유지됩니다. 여러 인스턴스에 걸쳐 적용해야 하는 제한에는 공유 저장소가 필요하며, 이 클래스들은 공유 저장소를 사용하지 않습니다.

## 관련 문서

- [simplix-stream](../../../simplix-stream/README.ko.md)
- [simplix-sync](../../../simplix-sync/README.ko.md)
