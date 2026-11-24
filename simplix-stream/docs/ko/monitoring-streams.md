# 스트림 모니터링

모듈이 Spring Boot Actuator와 Micrometer에 보고하는 항목과 확인할 수치를 설명합니다.

## 헬스 체크

```bash
curl http://localhost:8080/actuator/health/stream
```

Actuator가 클래스패스에 있으면 `StreamHealthIndicator`가 세션 레지스트리와 브로드캐스트 서비스를 사용할 수 있는 동안 `UP`을, 둘 중 하나라도 사용할 수 없으면 `DOWN`을 보고합니다.

| 상세 항목 | 의미 |
|---|---|
| `mode` | `LOCAL` 또는 `DISTRIBUTED` |
| `sessionRegistry`, `broadcastService` | `UP` 또는 `DOWN` |
| `activeSessions`, `activeSchedulers` | 현재 건수 |
| `schedulerUtilization` | `scheduler.max-total-schedulers` 대비 실행 중인 수집의 비율 |
| `schedulerWarning` | 90퍼센트를 넘으면 `Scheduler limit nearly reached`로 표시됩니다 |

## 메트릭

Micrometer가 클래스패스에 있으면 `StreamMetrics`가 `simplix.stream.monitoring.metrics-prefix`(기본값 `simplix.stream`) 아래에 게이지를 등록합니다. `simplix.stream.monitoring.metrics-enabled: false`를 지정하면 등록하지 않습니다.

| 메트릭 | 내용 |
|---|---|
| `simplix.stream.sessions.active` | 레지스트리의 세션 수 |
| `simplix.stream.schedulers.active` | 수집 중인 구독 키 수 |
| `simplix.stream.messages.delivered`, `simplix.stream.messages.failed` | 등록되지만 항상 0입니다. 집계하는 코드가 없습니다 |
| `simplix.stream.connections.established`, `simplix.stream.connections.closed` | 등록되지만 항상 0입니다 |
| `simplix.stream.subscriptions.added`, `simplix.stream.subscriptions.removed` | 등록되지만 항상 0입니다 |

값이 갱신되는 게이지에 알림을 설정하세요. 대상은 인스턴스의 수용 한도에 가까워지는 세션 수와, `scheduler.max-total-schedulers`에 가까워지는 스케줄러 수입니다. 이 한도를 넘으면 새 구독 키는 수집되지 않습니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.stream.monitoring.metrics-enabled` | `true` | `StreamMetrics`를 등록합니다 |
| `simplix.stream.monitoring.metrics-prefix` | `simplix.stream` | 메트릭 이름의 접두어 |
| `simplix.stream.monitoring.health-check-interval` | 10초 | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

의존성에 `micrometer-registry-prometheus`를 추가하고 엔드포인트를 노출하면, Spring Boot 애플리케이션의 다른 메트릭과 같이 Prometheus가 `/actuator/prometheus`에서 게이지를 수집합니다.

## 알림 규칙

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

Prometheus에서는 게이지 이름의 점이 밑줄로 바뀝니다. 이 규칙은 기본 한도 500의 90퍼센트에서 발생합니다. 수치는 사용하는 `scheduler.max-total-schedulers`에 맞게 지정하세요.

## 수집별 수치

구독 키별 수치(실행 횟수, 오류 횟수, 구독자 수)는 메트릭으로 제공되지 않습니다. `GET /api/stream/admin/schedulers`로 조회하세요. [스트림 관리](./managing-streams.md)에서 설명합니다.

## 로그

로거 `dev.simplecore.simplix.stream`은 세션 생성 · 종료와 스케줄러 생성을 `INFO`로, 수집기에서 발생한 예외를 `ERROR`로 기록합니다. `DEBUG`에서는 등록, 구독자, 권한 판정이 추가로 기록됩니다.

## 관련 문서

- [스트림 관리](./managing-streams.md)
- [문제 해결](./troubleshooting.md)
