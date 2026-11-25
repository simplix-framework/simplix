# Monitoring the license

How to see the status of the license from outside the application, and how to record what happens to it.

## Health

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

| License status | Health status |
|---|---|
| `VALID` | `UP` |
| `GRACE_PERIOD` | `GRACE_PERIOD` |
| any other | `DOWN` |

With Spring Boot Actuator the module registers `LicenseHealthIndicator`. Alert on `GRACE_PERIOD`: it is the window in which a renewal still prevents an outage.

## Metrics

| Metric | Value |
|---|---|
| `license.valid` | 1 while the deployment may keep running, 0 otherwise |
| `license.days.remaining` | days until the license expires |
| `license.grace.period` | 1 during the grace period, 0 otherwise |

`LicenseMetrics` registers them when Micrometer is on the classpath.

## Log

| Level | What is logged under `dev.simplecore.simplix.license` |
|---|---|
| `INFO` | the fingerprint of the verification key, a successful verification, the import of a token file, a recovery registration |
| `WARN` | a refused request, a refused feature, a quota that was reached, a build without quota counters |
| `ERROR` | a token file that cannot be read, a recovery token that was refused as well |

## Audit trail

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

An `AuditRecorder` bean receives every change of status, every lifecycle event such as an activation or a deactivation, and every refused registration at a quota. `LicenseAuditTrail` passes them on; without a recorder nothing is recorded, and a recorder that fails does not stop the verification that called it.

## Related documents

- [Enforcing the license](en/license/enforcing-the-license.md)
- [Troubleshooting](en/license/troubleshooting.md)
