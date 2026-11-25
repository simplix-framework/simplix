# Resilience utilities

Small thread-safe classes that keep a component standing under load or when something it calls fails. They hold their state in memory and have no dependencies, so they are created with `new` where they are needed.

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

| Class | Constructor | Does |
|---|---|---|
| `CircuitBreaker` | `(failureThreshold, halfOpenTimeoutMs)` | per key, stops requests after that many consecutive failures; after the timeout it lets one probe through, and a success closes the circuit again |
| `RateLimiter` | `(maxPerSecond)` | a token bucket: `tryAcquire()` is false once the operations of the second are used up |
| `BackpressureGuard` | `(maxConnections, maxEventsPerSecond)` | `tryRegister()` refuses a connection beyond the limit, and `shouldProceed()` signals throttling when the load passes 80% of it |
| `EventDeduplicator` | `(windowSeconds)` | `isDuplicate(id, timestamp, eventKey)` is true for an event already seen within the window |
| `AsyncQueryTracker` | `(timeoutMs)` | `track(queryId)` returns a future that `complete(queryId)` resolves when the answer arrives, or that times out |
| `RoundRobinSelector` | `()` | `selectBatch(items, batchSize)` returns the next batch, continuing where the last call stopped |

## Circuit breaker

A `CircuitBreaker` keeps one circuit per key, so a failing gateway does not stop the calls to a healthy one. With `new CircuitBreaker(2, 200)`: after one failure `allowRequest` still answers true; after the second it answers false; 200 ms later it lets one probe through and refuses the next call until the probe reports. `recordSuccess` closes the circuit and calls are allowed again. A probe that fails keeps the circuit open: calls are refused for another 200 ms, and then the next probe is let through. `getStatus(key)` returns a `CircuitBreaker.Status`, `CLOSED`, `OPEN` or `HALF_OPEN`, and `reset(key)` closes a circuit by hand.

## Rate limiter

A `RateLimiter` is a bucket of tokens refilled at a fixed rate. With `new RateLimiter(3)`, ten calls to `tryAcquire` in a row are allowed three times and refused seven times; a second later three more are allowed. It does not wait: a refused caller decides whether to drop the work or try later.

## Deduplicator

An `EventDeduplicator` remembers the events of the last `windowSeconds` by id, timestamp and key. The first `isDuplicate("d1", 1000L, "open")` answers false, the same call again answers true, and a call with another timestamp answers false. Old entries are removed as calls come in; `getTrackedCount()` tells how many are held.

## Backpressure guard

A `BackpressureGuard` counts open connections. `tryRegister()` answers false once `maxConnections` are open, and `unregister()` gives a place back when a connection closes. `shouldProceed()` answers false while the open connections are at or above 80% of the limit: with a limit of 5 it is true for up to three connections and false from the fourth. Use it as a signal to skip optional work such as extra pushes. `getActiveConnections()`, `getMaxConnections()` and `getMaxEventsPerSecond()` read the state and the limits.

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

## Query tracker and round-robin selector

An `AsyncQueryTracker` pairs a request sent over a channel with the answer that arrives later: `track(queryId)` returns a `CompletableFuture`, and the code that receives the answer calls `complete(queryId)`. A future that is not completed within `timeoutMs` fails with a `TimeoutException`, and `getPendingCount()` tells how many are still waiting.

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

A `RoundRobinSelector` walks a list in batches: with five items and a batch of two, three calls return `[a, b]`, `[c, d]` and `[e, a]`. `resetCursor()` starts over. Use it to poll a large set of devices a few at a time.

The state belongs to one instance in one process. Limits that have to hold across instances need a shared store, which these classes do not use.

## Related documents

- [simplix-stream](en/stream/readme.md)
- [simplix-sync](en/sync/readme.md)
