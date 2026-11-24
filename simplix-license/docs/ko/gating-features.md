# 기능 게이팅

엔드포인트, 작업, 메뉴 항목을 라이선스가 부여한 기능에 연결하는 방법과, 부여된 기능을 관리자가 비활성화할 수 있게 하는 방법을 설명합니다.

## 엔드포인트 게이팅

```java
public final class PortalFeatures {

    public static final String ANALYTICS = "analytics";
    public static final String ADVANCED_EXPORT = "advanced-export";

    private PortalFeatures() {
    }
}

@RestController
@RequestMapping("/visitor-analytics")
@RequiresFeature(PortalFeatures.ANALYTICS)
public class VisitorAnalyticsRestController {

    // Needs the analytics feature, like every endpoint of the class
    @GetMapping
    public SimpliXApiResponse<AnalyticsDTO> overview() {
        // ...
    }

    // Needs the advanced export feature instead
    @GetMapping("/export")
    @RequiresFeature(PortalFeatures.ADVANCED_EXPORT)
    public SimpliXApiResponse<ExportResultDTO> export() {
        // ...
    }
}
```

- `@RequiresFeature`는 라이선스 SDK(`dev.accesscore.license.sdk.adapter`)의 어노테이션입니다. 모듈의 `FeatureGateAspect`가 메서드 실행 전에 검사합니다.
- 메서드의 어노테이션이 클래스의 어노테이션보다 우선합니다.
- 기능이 없는 호출은 메시지 키 `error.system.featureNotLicensed`로 거부합니다.
- 기능 키는 상수로 관리하세요. 오타가 있는 키는 판매하지 않는 기능을 가리키며, 실제 기능을 구매한 고객이 거부될 때에야 오류가 확인됩니다.

## 코드에서 확인

```java
@Component
@RequiredArgsConstructor
public class AnalyticsAggregationScheduler {

    private final FeatureAccess featureAccess;
    private final AnalyticsService analyticsService;

    @Scheduled(cron = "0 0 2 * * ?")
    public void aggregateDaily() {
        if (!featureAccess.isAllowed(PortalFeatures.ANALYTICS)) {
            return;
        }
        analyticsService.aggregate();
    }
}
```

| `FeatureAccess`의 메서드 | 판정 내용 |
|---|---|
| `isAllowed(feature)` | 라이선스가 부여했고 관리자가 비활성화하지 않았는지 여부 |
| `isLicensed(feature)` | 라이선스가 부여했는지 여부 |
| `isActivated(feature)` | 관리자가 비활성화하지 않았는지 여부 |
| `effectiveFeatures()` | 현재 허용된 모든 기능 |

스케줄 작업, 이벤트 리스너, 메시지 컨슈머처럼 요청을 거치지 않는 코드에서 사용하세요.

## 화면에 같은 기능 표시

```bash
curl "http://localhost:8080/api/deployment-license/features" -H "Authorization: Bearer <access token>"
```

```json
{
  "type" : "SUCCESS",
  "body" : [ "analytics", "reporting" ],
  "timestamp" : "<time with zone>"
}
```

이 목록은 `FeatureAccess.effectiveFeatures()`의 값이므로, 이 목록으로 구성한 메뉴는 서버의 허용 범위와 일치합니다. 로그인한 모든 사용자가 조회할 수 있습니다.

## 관리자의 기능 비활성화

```java
@Component
@RequiredArgsConstructor
public class ModuleActivationChecker implements FeatureActivationChecker {

    private final ModuleSettingRepository moduleSettingRepository;

    @Override
    public boolean isEffectivelyActive(String feature) {
        return moduleSettingRepository.findByFeatureKey(feature)
            .map(ModuleSetting::isActive)
            .orElse(true);
    }
}
```

`FeatureActivationChecker` 빈이 있으면 모듈이 `FeatureActivationAspect`도 등록하며, 모든 `@RequiresFeature` 지점에서 이 체커를 호출합니다.

| 라이선스 부여 | 활성화 | 결과 |
|---|---|---|
| 예 | 예 | 허용 |
| 예 | 아니요 | `error.system.featureNotActive`로 거부 |
| 아니요 | 무관 | `error.system.featureNotLicensed`로 거부 |

## 게이팅하는 기능 보고

```java
@Component
public class PortalFeatureCatalogue implements FeatureCatalogue {

    @Override
    public List<String> gatedFeatures() {
        return List.of(PortalFeatures.ANALYTICS, PortalFeatures.ADVANCED_EXPORT);
    }
}
```

`FeatureCatalogue` 빈으로 이 빌드가 검사하는 기능 키를 라이선스 서버에 알립니다. 발급 측에서는 판매했지만 어느 배포본에서도 검사하지 않는 기능을 확인할 수 있습니다.

## 관련 문서

- [라이선스 강제 적용](./enforcing-the-license.md)
- [수량 제한](./limiting-quantities.md)
