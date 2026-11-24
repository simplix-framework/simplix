# Limiting quantities

How to hold the number of devices, users or other counted items to what the license allows.

## Step 1. Count what is installed

```java
@Component
@RequiredArgsConstructor
public class DeviceQuotaCounter implements QuotaCounter {

    private final DeviceRepository deviceRepository;
    private final GatewayRepository gatewayRepository;

    @Override
    public List<String> countedQuotaCodes() {
        return List.of("devices", "gateways");
    }

    @Override
    public long count(String quotaCode) {
        return switch (quotaCode) {
            case "devices" -> deviceRepository.countByDeletedFalse();
            case "gateways" -> gatewayRepository.countByDeletedFalse();
            default -> 0L;
        };
    }
}
```

A `QuotaCounter` bean names the quota codes it counts and returns the current number of each. A code no counter covers is not limited, and a build without any counter logs a warning at start.

## Step 2. Ask before registering

```java
@Service
@RequiredArgsConstructor
public class DeviceService {

    private final LicenseQuotaGuard quotaGuard;
    private final DeviceRepository deviceRepository;

    @Transactional
    public Device create(DeviceCreateDTO dto) {
        quotaGuard.require("devices");
        return deviceRepository.save(dto.toEntity());
    }

    @Transactional
    public List<Device> createFromModel(ControllerModel model) {
        // A controller with eight reader ports needs eight places, not one
        quotaGuard.require("devices", model.getPortCount());
        return deviceRepository.saveAll(model.buildDevices());
    }
}
```

| Situation | Outcome |
|---|---|
| the license does not name the code | unlimited |
| the limit is 0 | nothing can be registered |
| no counter covers the code | not enforced |
| the number asked for is 0 or less | always allowed |
| current count plus the number asked for exceeds the limit | refused with status 409 and `error.license.quotaReached`, and written to the audit trail |

| Method of `LicenseQuotaGuard` | Does |
|---|---|
| `require(quotaCode)`, `require(quotaCode, additional)` | throws when one more item, or `additional` more, would exceed the limit |
| `currentCount(quotaCode)` | the number the counter reports now |
| `currentUsage()` | the current number of every counted code |
| `countedQuotaCodes()` | the codes a counter exists for |

## When a contract shrinks

```json
{
  "limits" : { "devices" : 300 },
  "usage" : { "devices" : 412 }
}
```

A limit that falls below what is already installed stops nothing that runs. Only new registrations are refused, and the excess shows in the usage of the license status and in the audit trail. Equipment that controls doors must keep working whatever happens to a contract.

## Related documents

- [Enforcing the license](en/license/enforcing-the-license.md)
- [Monitoring the license](en/license/monitoring-the-license.md)
