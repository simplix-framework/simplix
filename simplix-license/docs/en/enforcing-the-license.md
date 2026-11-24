# Enforcing the license

What the license decides about a request, which paths stay open whatever the license says, and how to move the decision into your own code.

## Where the license is enforced

| Place | Decides | Guide |
|---|---|---|
| the request filter | whether the application may be used at all | this page |
| the feature gate | whether a paid feature may be used | [Gating features](./gating-features.md) |
| the quota guard | whether one more item may be registered | [Limiting quantities](./limiting-quantities.md) |

## What each status allows

`LicenseEnforcementFilter` judges every request under `/api`. It is registered by the module; nothing has to be declared.

| Status | Requests |
|---|---|
| `VALID` | all allowed |
| `RELEASE_NOT_ENTITLED` | all allowed; paid features are refused by the feature gate |
| `GRACE_PERIOD` with `grace-period-mode: READ_ONLY` | `GET`, `HEAD` and `OPTIONS` only |
| `GRACE_PERIOD` with `grace-period-mode: RESTRICTED` | all allowed; only the feature restrictions apply |
| `SIGNING_KEY_COMPROMISED`, `REVOKED`, expired and every other status | refused with status 403, except the open paths |

## Paths that stay open

| Path | Why |
|---|---|
| `/auth/token/issue`, `/auth/token/refresh`, `/auth/token/revoke` | without a login nobody reaches the license screen |
| `/deployment-license/` | the license screen itself |
| `/system/setup`, `/install` | the first-run wizard |
| `/public/` | public endpoints |
| `/actuator/health`, `/backend/login`, `/backend/logout` | health checks and the login page |
| `/css/`, `/js/`, `/images/`, `/fonts/`, `/favicon` | static resources |

The paths are taken under the API prefix, which the filter reads from `api.version.prefix`, `/api/v1` by default; set it to the prefix your application really serves under. An open login grants nothing by itself: an operator who signs in is still stopped by this filter on every other endpoint, and reaches only the license screen. The three token paths are exact paths, not a prefix, so an endpoint added under `/auth/token` later stays closed until it is added here on purpose.

## The refusal

```json
{
  "type" : "ERROR",
  "message" : "The license has expired",
  "timestamp" : "<time with zone>",
  "errorCode" : "LICENSE_EXPIRED"
}
```

The error code is `LICENSE_` followed by the status. A client that sees the prefix shows the license screen instead of a message about missing rights.

## Messages

A refusal is thrown with a message key and translated in the language of the request. The bundles of the application need these keys in every language it offers.

| Key | Used for |
|---|---|
| `error.license.notValid` | the general refusal of the filter |
| `error.license.gracePeriodReadOnly` | a write during a read-only grace period |
| `error.license.signingKeyCompromised` | a token signed with a key marked as leaked |
| `error.license.quotaReached` | a quota that is used up |
| `error.license.serverError` | an error of the license server without a key of its own |
| `error.license.malformedProductKey` | a product key that fails its own checksum, answered before anything is sent |
| `error.license.fingerprintUnavailable` | an offline activation request that cannot be built because no machine fingerprint could be read |
| `error.license.activationServerUnconfirmed` | during the first installation, a license server address that does not answer as a license server |
| `error.license.activationServerKeyMismatch` | during the first installation, a license server that signs with a key this build does not verify against |
| `error.system.featureNotLicensed` | a feature the license does not grant |
| `error.system.featureNotActive` | a feature an administrator switched off |

The verdict of the license SDK brings further keys for the reasons of each status; the manual of the SDK lists them.

## Decide in your own code instead

A product that issues licenses to its own customers must not stop serving them because its own license lapsed. Switch the filter off and ask the license where it matters.

```yaml
application:
  license:
    enforcement:
      http-filter-enabled: false
```

```java
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final LicenseState licenseState;
    private final SubscriptionRepository subscriptionRepository;

    public Subscription issue(SubscriptionCreateDTO dto) {
        if (!licenseState.isUsable()) {
            throw new SimpliXGeneralException(ErrorCode.AUTHZ_ACCESS_DENIED, "{error.license.notValid}", null);
        }
        return subscriptionRepository.save(dto.toEntity());
    }
}
```

| Method of `LicenseState` | Returns |
|---|---|
| `status()` | the current `LicenseStatus` |
| `isUsable()` | whether the application may be used |
| `isValid()`, `isGracePeriod()` | whether the status is `VALID`, or `GRACE_PERIOD` |
| `hasFeature(feature)` | whether the license grants a feature |
| `payload()`, `tierLabel()` | the content of the license, and the name of its edition |
| `snapshot()` | a `LicenseState.Snapshot`: the status, the payload and the time of the last check in one value |

With the filter off the license is still verified on the same schedule; only the question is asked by your code instead of the filter.

## Related documents

- [Gating features](./gating-features.md)
- [Limiting quantities](./limiting-quantities.md)
- [Activating a license](./activating-a-license.md)
