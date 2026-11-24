# Collecting data

How to write a collector, how often it is called, what its parameters are, and what happens when it fails.

## The collector interface

Every Spring bean that implements `SimpliXStreamDataCollector` is registered in the `SimpliXStreamDataCollectorRegistry` under the name of its resource.

| Method | Default | Meaning |
|---|---|---|
| `getResource()` | required | the name clients subscribe to; one collector per name |
| `collect(params)` | required | returns the data to send; it is serialised as the `payload` of a `data` message |
| `getDefaultIntervalMs()` | `1000` | how often `collect` is called, in milliseconds |
| `getMinIntervalMs()` | `100` | the shortest interval the collector accepts |
| `validateParams(params)` | `true` | no effect: no code calls it. Check parameters in a `ResourceAuthorizer` instead |
| `getRequiredPermission()` | `null` | no effect: no code calls it. Check permissions in a `ResourceAuthorizer` instead |

[Securing streams](./securing-streams.md) shows the authorizer that takes the place of the unused methods.

## The interval

The interval of a subscription is the largest of `getDefaultIntervalMs()`, `getMinIntervalMs()` and `simplix.stream.scheduler.min-interval`. It is then held between `scheduler.min-interval` and `scheduler.max-interval`. A client cannot choose it; the response to a subscription reports it as `intervalMs`.

## Parameters and the subscription key

A subscription is a resource with parameters. The module turns the pair into a `SubscriptionKey`, the resource followed by a hash of the parameters: `shelf-occupancy:3b02a4c3`. Sessions that subscribe with the same resource and the same parameters share one key, and the collector is called once per interval for all of them.

The parameters `collect` receives are the query parameters of the connect request, overlaid by the `params` of the subscription. A session connected with `/connect?branchId=b1` carries `branchId` into every subscription it makes. A connect ticket is a query parameter as well, so a session that connected with a ticket has the parameter `ticket` in every key, and its keys are shared with no other session.

> ⚠ A subscription without `params` has the key `<resource>:empty`. Read each parameter defensively in `collect`: a missing one arrives as `null`.

## When collection fails

An exception from `collect` is logged, and the subscribers receive an `error` message with the code `SCHEDULER_ERROR` and the message of the exception. The next interval calls the collector again. Failures in a row are counted against `scheduler.max-consecutive-errors`; the scheduler state reported by the [admin API](./managing-streams.md) turns to `ERROR` when the count is reached.

## Limits

| Property | Default | Meaning |
|---|---|---|
| `simplix.stream.scheduler.max-total-schedulers` | `500` | distinct subscription keys collected at once; a key beyond the limit is not collected, and a warning is logged |
| `simplix.stream.scheduler.thread-pool-size` | `10` | threads that run collectors and heartbeats |
| `simplix.stream.subscription.max-per-session` | `20` | subscriptions one session may hold; a longer list is refused with `BIZ_QUOTA_EXCEEDED` |

Keep `collect` short. A collector that waits on a slow service holds one of the scheduler threads for that time; cache what is expensive, or publish changes as events instead ([Streaming events](./streaming-events.md)).

## Related documents

- [Streaming events](./streaming-events.md)
- [Securing streams](./securing-streams.md)
- [Configuration reference](./configuration-reference.md)
