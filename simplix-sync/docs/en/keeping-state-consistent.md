# Keeping state consistent

A broadcast can be lost: an instance that was restarting, a network gap, a broker that dropped the connection. This page shows how to hold shared state safely in each instance and how to repair what a lost message left behind.

## What delivery guarantees

- A message reaches the instances that are subscribed at that moment. Nothing is stored for an instance that is away.
- The sender does not receive its own message. Each message starts with the 16-byte id of the sending instance, and a receiver drops the messages that carry its own id.
- Messages of one sender on one channel arrive in the order they were sent. Between senders there is no order.

## Hold the state per key

```java
InMemoryStateStore<ShelfState> shelves = new InMemoryStateStore<>(ShelfState::new);

// one thread at a time changes the state of a key
shelves.mutate("s1", state -> state.setFreeSlots(4));

// a change that also answers
boolean applied = shelves.compute("s1", state -> state.applyIfNewer(change));
```

`InMemoryStateStore` creates the state of a key on first use with the factory it was given, and runs `mutate` and `compute` for one key one at a time. A handler that receives broadcasts and a request thread that reads the same key do not see a half-applied change.

## Make messages safe to apply twice

Send the new value, or a version with it, and not an instruction such as "add one". A message that carries the value can be applied again, or skipped when a newer one has arrived, without harm.

## Repair what was missed

`ReconciliationScheduler` walks the resources an instance knows in batches and reloads each from the source of truth. Call it from a scheduled method of your own.

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

- Each call handles the next `batchSize` resources and continues where the last call stopped, so every resource is visited in turn.
- With a `CircuitBreaker`, a resource that keeps failing is skipped for a while; with a `RateLimiter`, the calls to the source stay under a limit. Both are in [simplix-core](../../../simplix-core/docs/en/resilience-utilities.md).
- On several instances, lock the scheduled method so that one of them reconciles at a time; see [simplix-scheduler](../../../simplix-scheduler/docs/en/running-on-several-instances.md).

| Method of the builder | Sets |
|---|---|
| `resourceProvider(supplier)` | the resources to walk; it is called on every `reconcile`, so keep it cheap |
| `keyExtractor(function)` | the key of a resource, which is the key of its circuit |
| `batchSize(n)` | how many resources one call handles |
| `circuitBreaker(breaker)` | skips a resource whose reloads keep failing |
| `rateLimiter(limiter)` | caps the reloads per second; a cycle ends when the limiter refuses |

`getCursorPosition()` tells where the next call continues. A processor that throws counts as a failure of that resource for the circuit breaker; let exceptions through instead of swallowing them, or a broken source is never noticed.

## Related documents

- [Getting started](./getting-started.md)
- [Resilience utilities](../../../simplix-core/docs/en/resilience-utilities.md)
