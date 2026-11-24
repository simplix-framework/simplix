# Gating features

How to tie an endpoint, a job or a menu entry to a feature the license grants, and how to let an administrator switch a granted feature off.

## Gate an endpoint

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

- `@RequiresFeature` comes from the license SDK (`dev.accesscore.license.sdk.adapter`). `FeatureGateAspect` of the module checks it before the method runs.
- An annotation on a method wins over the one on its class.
- A call without the feature is refused with the message key `error.system.featureNotLicensed`.
- Keep the feature keys in constants. A key with a typing error names a feature nobody sells, and the mistake shows only when a customer who bought the real feature is refused.

## Check in code

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

| Method of `FeatureAccess` | Answers |
|---|---|
| `isAllowed(feature)` | granted by the license and not switched off by an administrator |
| `isLicensed(feature)` | granted by the license |
| `isActivated(feature)` | not switched off by an administrator |
| `effectiveFeatures()` | every feature that is allowed now |

Use it where no request passes: scheduled jobs, event listeners, message consumers.

## Show the same features on screen

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

The list is `FeatureAccess.effectiveFeatures()`, so a menu built from it agrees with what the server allows. Any signed-in user may read it.

## Let an administrator switch a feature off

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

With a `FeatureActivationChecker` bean the module also registers `FeatureActivationAspect`, which asks the checker at every `@RequiresFeature`.

| Granted by the license | Active | Result |
|---|---|---|
| yes | yes | allowed |
| yes | no | refused with `error.system.featureNotActive` |
| no | either | refused with `error.system.featureNotLicensed` |

## Report the features you gate

```java
@Component
public class PortalFeatureCatalogue implements FeatureCatalogue {

    @Override
    public List<String> gatedFeatures() {
        return List.of(PortalFeatures.ANALYTICS, PortalFeatures.ADVANCED_EXPORT);
    }
}
```

A `FeatureCatalogue` bean tells the license server which feature keys this build checks. The issuer can then find a feature that is sold and that no deployment enforces.

## Related documents

- [Enforcing the license](./enforcing-the-license.md)
- [Limiting quantities](./limiting-quantities.md)
