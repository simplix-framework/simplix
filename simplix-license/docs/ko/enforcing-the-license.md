# 라이선스 강제 적용

라이선스 상태에 따라 요청이 처리되는 방식, 라이선스와 관계없이 열려 있는 경로, 애플리케이션 코드에서 직접 판정하는 방법을 설명합니다.

## 강제 적용 지점

| 지점 | 판정 대상 | 가이드 |
|---|---|---|
| 요청 필터 | 애플리케이션 사용 가능 여부 | 이 페이지 |
| 기능 게이트 | 유료 기능 사용 가능 여부 | [기능 게이팅](./gating-features.md) |
| 수량 가드 | 항목 추가 등록 가능 여부 | [수량 제한](./limiting-quantities.md) |

## 상태별 허용 범위

`LicenseEnforcementFilter`가 `/api` 아래의 모든 요청을 판정합니다. 모듈이 등록하므로 따로 선언할 필요가 없습니다.

| 상태 | 요청 처리 |
|---|---|
| `VALID` | 모두 허용 |
| `RELEASE_NOT_ENTITLED` | 모두 허용. 유료 기능은 기능 게이트에서 거부합니다 |
| `GRACE_PERIOD`이고 `grace-period-mode: READ_ONLY` | `GET`, `HEAD`, `OPTIONS`만 허용 |
| `GRACE_PERIOD`이고 `grace-period-mode: RESTRICTED` | 모두 허용. 기능 제한만 적용합니다 |
| `SIGNING_KEY_COMPROMISED`, `REVOKED`, 만료 등 그 밖의 상태 | 열려 있는 경로를 제외하고 상태 403으로 거부 |

## 항상 열려 있는 경로

| 경로 | 이유 |
|---|---|
| `/auth/token/issue`, `/auth/token/refresh`, `/auth/token/revoke` | 로그인하지 않으면 라이선스 화면에 접근할 수 없습니다 |
| `/deployment-license/` | 라이선스 화면 |
| `/system/setup`, `/install` | 최초 설치 마법사 |
| `/public/` | 공개 엔드포인트 |
| `/actuator/health`, `/backend/login`, `/backend/logout` | 헬스 체크와 로그인 페이지 |
| `/css/`, `/js/`, `/images/`, `/fonts/`, `/favicon` | 정적 리소스 |

이 경로에는 API 접두어가 적용되며, 필터는 `api.version.prefix`(기본값 `/api/v1`)에서 접두어를 읽습니다. 애플리케이션이 실제로 사용하는 접두어로 지정하세요. 로그인 경로가 열려 있어도 추가 권한이 생기지는 않습니다. 로그인한 운영자도 나머지 엔드포인트에서는 이 필터에 차단되며 라이선스 화면에만 접근할 수 있습니다. 토큰 경로는 접두어가 아닌 정확한 경로로 지정되어 있으므로, 이후 `/auth/token` 아래에 추가되는 엔드포인트는 명시적으로 추가하기 전까지 차단됩니다.

## 거부 응답

```json
{
  "type" : "ERROR",
  "message" : "The license has expired",
  "timestamp" : "<time with zone>",
  "errorCode" : "LICENSE_EXPIRED"
}
```

오류 코드는 `LICENSE_` 뒤에 상태가 이어지는 형식입니다. 클라이언트는 이 접두어를 확인해 권한 부족 안내 대신 라이선스 화면을 표시합니다.

## 메시지

거부 응답은 메시지 키로 발생하며 요청 언어로 번역됩니다. 애플리케이션의 번들에는 제공하는 모든 언어에 대해 다음 키가 있어야 합니다.

| 키 | 사용 위치 |
|---|---|
| `error.license.notValid` | 필터의 일반 거부 |
| `error.license.gracePeriodReadOnly` | 읽기 전용 유예 기간의 쓰기 요청 |
| `error.license.signingKeyCompromised` | 유출로 표시된 키로 서명된 토큰 |
| `error.license.quotaReached` | 수량 상한 초과 |
| `error.license.serverError` | 전용 키가 없는 라이선스 서버 오류 |
| `error.system.featureNotLicensed` | 라이선스가 부여하지 않은 기능 |
| `error.system.featureNotActive` | 관리자가 비활성화한 기능 |

라이선스 SDK의 판정에는 상태별 사유를 나타내는 키가 추가로 포함됩니다. 전체 목록은 SDK 매뉴얼에 있습니다.

## 코드에서 직접 판정

고객에게 라이선스를 발급하는 제품은 자체 라이선스가 만료되었다는 이유로 고객 서비스를 중단하면 안 됩니다. 이런 제품에서는 필터를 끄고 필요한 지점에서 라이선스를 확인하세요.

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

| `LicenseState`의 메서드 | 반환 |
|---|---|
| `status()` | 현재 `LicenseStatus` |
| `isUsable()` | 애플리케이션 사용 가능 여부 |
| `isValid()`, `isGracePeriod()` | 상태가 `VALID`인지, `GRACE_PERIOD`인지 여부 |
| `hasFeature(feature)` | 라이선스가 해당 기능을 부여했는지 여부 |
| `payload()`, `tierLabel()` | 라이선스 내용과 에디션 이름 |
| `snapshot()` | `LicenseState.Snapshot`. 상태, 라이선스 내용, 마지막 검증 시각을 묶은 값입니다 |

필터를 꺼도 라이선스는 같은 주기로 검증됩니다. 판정 요청을 필터 대신 애플리케이션 코드에서 실행한다는 점만 다릅니다.

## 관련 문서

- [기능 게이팅](./gating-features.md)
- [수량 제한](./limiting-quantities.md)
- [라이선스 활성화](./activating-a-license.md)
