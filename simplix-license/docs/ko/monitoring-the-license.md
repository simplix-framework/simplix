# 라이선스 모니터링

애플리케이션 외부에서 라이선스 상태를 확인하는 방법과 라이선스 관련 사건을 기록하는 방법을 설명합니다.

## 헬스 체크

```bash
curl http://localhost:8080/actuator/health/license
```

```json
{
  "status" : "UP",
  "details" : {
    "status" : "VALID",
    "lastChecked" : "2026-07-29T02:10:00Z",
    "licenseId" : "LIC-0001",
    "productCode" : "ACPS-PORTAL",
    "tierLabel" : "Enterprise",
    "customer" : "Example Corp",
    "expiresAt" : "2027-07-29T00:00:00Z",
    "features" : [ "analytics", "reporting" ]
  }
}
```

| 라이선스 상태 | 헬스 상태 |
|---|---|
| `VALID` | `UP` |
| `GRACE_PERIOD` | `GRACE_PERIOD` |
| 그 밖의 상태 | `DOWN` |

Spring Boot Actuator를 사용하면 모듈이 `LicenseHealthIndicator`를 등록합니다. `GRACE_PERIOD`에 알림을 설정하세요. 이 기간에 갱신하면 서비스 중단을 막을 수 있습니다.

## 메트릭

| 메트릭 | 값 |
|---|---|
| `license.valid` | 배포본을 계속 운영할 수 있으면 1, 아니면 0 |
| `license.days.remaining` | 라이선스 만료까지 남은 일수 |
| `license.grace.period` | 유예 기간이면 1, 아니면 0 |

Micrometer가 클래스패스에 있으면 `LicenseMetrics`가 이 메트릭을 등록합니다.

## 로그

| 레벨 | `dev.simplecore.simplix.license`에 기록되는 내용 |
|---|---|
| `INFO` | 검증 키 지문, 검증 성공, 토큰 파일 가져오기, 복구 등록 |
| `WARN` | 요청 거부, 기능 거부, 상한 도달, 수량 카운터가 없는 빌드 |
| `ERROR` | 읽을 수 없는 토큰 파일, 복구 토큰까지 거부된 경우 |

## 감사 기록

```java
@Component
@RequiredArgsConstructor
public class LicenseAuditRecorder implements AuditRecorder {

    private final AuditEventService auditEventService;

    @Override
    public void recordStatusChange(LicenseStatus previous, LicenseStatus current, String licenseId) {
        auditEventService.record("LICENSE_STATUS_CHANGED",
            Map.of("previous", previous.name(), "current", current.name(), "licenseId", String.valueOf(licenseId)));
    }

    @Override
    public void recordLifecycle(LifecycleEvent event, String licenseId, String detail) {
        auditEventService.record("LICENSE_" + event.name(),
            Map.of("licenseId", String.valueOf(licenseId), "detail", detail));
    }

    @Override
    public void recordLimitReached(String quotaCode, long current, long limit) {
        auditEventService.record("LICENSE_LIMIT_REACHED",
            Map.of("quotaCode", quotaCode, "current", current, "limit", limit));
    }
}
```

`AuditRecorder` 빈에는 모든 상태 변경, 활성화와 반납 같은 수명 주기 이벤트, 상한에서 거부된 등록이 전달됩니다. `LicenseAuditTrail`이 이를 전달하며, 레코더가 없으면 아무것도 기록하지 않습니다. 레코더가 실패해도 이를 호출한 검증은 중단되지 않습니다.

## 관련 문서

- [라이선스 강제 적용](./enforcing-the-license.md)
- [문제 해결](./troubleshooting.md)
