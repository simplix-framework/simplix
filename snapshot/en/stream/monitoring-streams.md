# Monitoring streams

What the module reports to Spring Boot Actuator and Micrometer, and which numbers to watch.

## Health

```bash
curl http://localhost:8080/actuator/health/stream
```

With Actuator on the classpath, `StreamHealthIndicator` reports `UP` while the session registry and the broadcast service are available, and `DOWN` when one of them is not.

| Detail | Meaning |
|---|---|
| `mode` | `LOCAL` or `DISTRIBUTED` |
| `sessionRegistry`, `broadcastService` | `UP` or `DOWN` |
| `activeSessions`, `activeSchedulers` | the current counts |
| `schedulerUtilization` | running collections as a share of `scheduler.max-total-schedulers` |
| `schedulerWarning` | present above 90 percent: `Scheduler limit nearly reached` |

## Metrics

With Micrometer on the classpath, `StreamMetrics` registers gauges under `simplix.stream.monitoring.metrics-prefix`, `simplix.stream` by default. `simplix.stream.monitoring.metrics-enabled: false` leaves them out.

| Metric | Shows |
|---|---|
| `simplix.stream.sessions.active` | sessions in the registry |
| `simplix.stream.schedulers.active` | subscription keys that are collected |
| `simplix.stream.messages.delivered`, `simplix.stream.messages.failed` | registered, and always 0: no code counts them |
| `simplix.stream.connections.established`, `simplix.stream.connections.closed` | registered, and always 0 |
| `simplix.stream.subscriptions.added`, `simplix.stream.subscriptions.removed` | registered, and always 0 |

Alert on the gauges that move: sessions that approach what the instance can hold, and schedulers that approach `scheduler.max-total-schedulers`, beyond which new subscription keys are not collected.

| Property | Default | Meaning |
|---|---|---|
| `simplix.stream.monitoring.metrics-enabled` | `true` | registers `StreamMetrics` |
| `simplix.stream.monitoring.metrics-prefix` | `simplix.stream` | the prefix of the metric names |
| `simplix.stream.monitoring.health-check-interval` | 10 seconds | no effect: no code reads it |

## Alert rules

```yaml
groups:
  - name: simplix-stream
    rules:
      - alert: StreamSchedulersNearLimit
        expr: simplix_stream_schedulers_active > 450
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Stream collections approach scheduler.max-total-schedulers
```

Prometheus reads the gauges with underscores in place of the dots. The rule fires at 90 percent of the default limit of 500; set the number from your own `scheduler.max-total-schedulers`.

## Per-collection numbers

Counts per subscription key (executions, errors, subscribers) are not metrics. Read them from `GET /api/stream/admin/schedulers`: [Managing streams](en/stream/managing-streams.md).

## Log

The logger `dev.simplecore.simplix.stream` writes a line at `INFO` for every session that is created or terminated and for every scheduler that is created, and at `ERROR` for a collector that throws. `DEBUG` adds registrations, subscribers and authorization decisions.

## Related documents

- [Managing streams](en/stream/managing-streams.md)
- [Troubleshooting](en/stream/troubleshooting.md)
