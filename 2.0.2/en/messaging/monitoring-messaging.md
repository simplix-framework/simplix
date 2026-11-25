# Monitoring messaging

How to see whether the broker answers and how many messages are published, consumed and failing.

## Health

```bash
curl http://localhost:8080/actuator/health/messaging
```

With Spring Boot Actuator, `MessagingHealthIndicator` reports `UP` while the broker is ready and `DOWN` otherwise. The details name the broker and its `consumerGroups`, `replay`, `ordering` and `deadLetter` capabilities.

## Metrics

| Metric | Tags | Counts |
|---|---|---|
| `simplix.messaging.published` | `channel` | messages published |
| `simplix.messaging.consumed` | `channel`, `group` | messages handled |
| `simplix.messaging.failed` | `channel`, `errorType` | messages whose handling failed |
| `simplix.messaging.publish.time` | `channel` | the time a publish takes |
| `simplix.messaging.consume.time` | `channel`, `group` | the time a handler takes |
| `simplix.messaging.pending.count` | `channel`, `group` | messages delivered and not acknowledged yet |

`MessagingMetrics` registers them when Micrometer is on the classpath. A pending count that keeps rising means handlers fail or are too slow for the load; a rising failure count with one `errorType` points at one cause.

## Log

Set the logger `dev.simplecore.simplix.messaging` to `DEBUG` to see subscriptions, skipped duplicates and reclaimed messages. A handler that throws is logged at `ERROR` with the class and the method.

## Related documents

- [Handling failures](en/messaging/handling-failures.md)
- [Troubleshooting](en/messaging/troubleshooting.md)
