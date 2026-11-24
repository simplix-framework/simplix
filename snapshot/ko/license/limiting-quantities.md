# 수량 제한

장치, 사용자 등 집계 대상 항목의 수를 라이선스가 허용하는 범위로 제한하는 방법을 설명합니다.

## 1단계. 설치된 수량 집계

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

`QuotaCounter` 빈은 집계하는 상한 코드를 지정하고 코드별 현재 수량을 반환합니다. 카운터가 없는 코드에는 상한이 적용되지 않으며, 카운터가 하나도 없는 빌드는 시작할 때 경고를 로그에 기록합니다.

## 2단계. 등록 전 확인

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

| 상황 | 결과 |
|---|---|
| 라이선스에 해당 코드가 없음 | 제한 없음 |
| 상한이 0 | 등록할 수 없음 |
| 해당 코드의 카운터가 없음 | 상한을 적용하지 않음 |
| 요청 수량이 0 이하 | 항상 허용 |
| 현재 수량과 요청 수량의 합이 상한을 초과 | 상태 409와 `error.license.quotaReached`로 거부하고 감사 기록에 남깁니다 |

| `LicenseQuotaGuard`의 메서드 | 동작 |
|---|---|
| `require(quotaCode)`, `require(quotaCode, additional)` | 항목 하나 또는 `additional`개를 추가하면 상한을 넘는 경우 예외를 발생시킵니다 |
| `currentCount(quotaCode)` | 카운터가 반환한 현재 수량 |
| `currentUsage()` | 집계하는 모든 코드의 현재 수량 |
| `countedQuotaCodes()` | 카운터가 있는 코드 목록 |

## 계약 수량이 줄어든 경우

```json
{
  "limits" : { "devices" : 300 },
  "usage" : { "devices" : 412 }
}
```

상한이 이미 설치된 수량보다 낮아져도 실행 중인 항목은 중단하지 않습니다. 신규 등록만 거부하며, 초과분은 라이선스 상태의 사용량과 감사 기록에 표시됩니다. 출입문을 제어하는 장비는 계약 변경과 관계없이 계속 동작해야 합니다.

## 관련 문서

- [라이선스 강제 적용](ko/license/enforcing-the-license.md)
- [라이선스 모니터링](ko/license/monitoring-the-license.md)
