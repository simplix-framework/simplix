# 설정 레퍼런스

`application.license` 아래에 있는 모듈의 속성과, 애플리케이션이 제공하는 빈을 정리합니다.

## 속성

| 속성 | 기본값 | 의미 |
|---|---|---|
| `token-path` | `./license.key` | 등록된 정보가 없을 때 시작 시 읽는 토큰 파일 |
| `state-path` | `./license-state.json` | 파일 저장소의 파일 |
| `re-verification-interval-minutes` | `30` | 저장된 등록 정보를 다시 검증하는 주기(분) |
| `grace-period-mode` | `READ_ONLY` | `LicenseProperties.GracePeriodMode` 값. `READ_ONLY`는 유예 기간에 조회만 허용하고, `RESTRICTED`는 모든 요청을 허용합니다 |
| `product-key-prefix` | 없음 | 제품 키의 앞부분. 체크섬 계산에 포함됩니다 |
| `activation.server-url` | 없음 | 라이선스 서버. 비워 두면 파일과 오프라인 등록만 사용할 수 있습니다 |
| `activation.heartbeat-enabled` | `true` | 하트비트가 필요한 라이선스에 하트비트를 전송합니다 |
| `activation.heartbeat-check-interval` | 5분 | 하트비트 전송 시점이 되었는지 확인하는 주기 |
| `activation.heartbeat-retry-interval` | 10분 | 하트비트 실패 후 대기 시간 |
| `enforcement.http-filter-enabled` | `true` | `false`이면 요청 필터를 등록하지 않습니다 |

활성화 설정의 중첩 클래스는 `LicenseProperties.Activation`입니다.

### `application.license` 외부 속성

| 속성 | 기본값 | 의미 |
|---|---|---|
| `api.version.prefix` | `/api/v1` | API 접두어. 필터의 열려 있는 경로를 이 값으로 계산합니다 |
| `simplix.license.setup.token` | 없음 | 최초 설치 마법사에서 상태를 변경하는 요청에 필요한 토큰. 루프백에서 온 요청에는 필요하지 않습니다 |

## 애플리케이션이 제공하는 빈

| 빈 | 필수 | 없을 때 |
|---|---|---|
| `ProductIdentity` | 예 | 애플리케이션이 시작되지 않습니다 |
| `QuotaCounter` | 아니요 | 수량 상한을 적용하지 않습니다. 시작할 때 경고를 기록합니다 |
| `FeatureCatalogue` | 아니요 | 게이팅하는 기능을 서버에 보고하지 않습니다 |
| `FeatureActivationChecker` | 아니요 | 관리자가 기능을 비활성화할 수 없습니다 |
| `AuditRecorder` | 아니요 | 아무것도 기록하지 않습니다 |
| `ActivationServerDirectory` | 아니요 | `activation.server-url`을 사용합니다 |
| `ContactIdentity` | 아니요 | 활성화할 때 담당자 주소를 보고하지 않습니다. 이 빈이 있으면 서버가 주소를 고객 정보와 비교합니다 |
| `InstallationDiscriminator` | 아니요 | 같은 호스트의 여러 설치본을 서버에서 구분할 수 없습니다 |
| `SetupState` | 아니요 | 최초 설치 마법사 엔드포인트와 설치 게이트를 사용하지 않습니다 |
| `CompromiseCeilingStore`를 함께 구현한 `LicenseStore` | 아니요 | JPA 저장소나 파일 저장소가 선택됩니다 |

리소스 `src/main/resources/license-verification-keys.json`도 필수입니다. [시작하기](ko/license/getting-started.md)를 참고하세요.

## 예시

```yaml
# Online
application:
  license:
    product-key-prefix: ACPS
    activation:
      server-url: https://license.example.com
      heartbeat-enabled: true
```

```yaml
# Closed network
application:
  license:
    token-path: /opt/app/license.key
    state-path: /opt/app/data/license-state.json
    activation:
      server-url: ""
      heartbeat-enabled: false
```

## 관련 문서

- [시작하기](ko/license/getting-started.md)
- [simplix-license 동작 방식](ko/license/how-it-works.md)
