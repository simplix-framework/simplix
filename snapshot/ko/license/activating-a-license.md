# 라이선스 활성화

배포본에 라이선스를 등록하는 방법을 설명합니다. 라이선스 서버에 직접 접속하는 온라인 활성화, 요청 파일을 사용하는 오프라인 활성화, 애플리케이션 옆에 토큰 파일을 두는 방식이 있습니다. 아래 경로는 컨트롤러를 `/api` 아래에서 제공하는 애플리케이션을 기준으로 합니다.

## 등록 방식 선택

|  | 온라인 | 오프라인 | 토큰 파일 |
|---|---|---|---|
| 라이선스 서버 접속 주체 | 배포본 | 운영자가 대신 접속 | 접속하지 않음 |
| 좌석 확보 시점 | 자동 | 서버가 토큰을 발급할 때 | 토큰을 발급했을 때 |
| 하트비트 | 가능 | 불가 | 불가 |
| 폐기 반영 시점 | 다음 하트비트 | 새 토큰을 등록할 때 | 새 토큰을 등록할 때 |
| 적합한 환경 | 일반 운영 | 폐쇄망 | 개발과 사전 구성 설치 |

네트워크가 허용하면 온라인 활성화를 선택하세요. 하트비트로 폐기, 만료, 계약 변경이 운영자의 작업 없이 배포본에 반영됩니다.

## 온라인 활성화

```bash
curl -X POST "http://localhost:8080/api/deployment-license/activate" \
  -H "Authorization: Bearer <access token>" \
  -H "Content-Type: application/json" \
  -d '{"productKey": "ACPS-XXXX-XXXX-XXXX-XXXX", "replaceExisting": false}'
```

1. 제품 키를 전송하기 전에 키 자체의 체크섬으로 검사하므로, 입력 오류는 즉시 응답합니다.
2. 배포본이 제품 키와 머신 지문을 라이선스 서버에 전송합니다.
3. 서버가 서명된 라이선스 토큰을 반환합니다.
4. 토큰을 저장하고 서명, 머신, 만료를 검증합니다.
5. 라이선스 상태를 응답합니다.

| 요청 필드 | 필수 | 의미 |
|---|---|---|
| `productKey` | 예 | 고객에게 발급된 제품 키 |
| `replaceExisting` | 아니요 | `true`이면 다른 키로 등록된 정상 라이선스를 교체합니다. 지정하지 않으면 이런 활성화는 거부됩니다 |

### 라이선스 상태

활성화, 하트비트, 반납, `GET /api/deployment-license/status`는 모두 같은 본문(`LicenseDTOs.LicenseStatusDTO`)으로 응답합니다.

| 필드 | 내용 |
|---|---|
| `status`, `usable` | 판정 결과와 애플리케이션 사용 가능 여부 |
| `licenseId`, `activationId`, `customer`, `channel` | 라이선스 식별 정보, 고객, 등록 방식 |
| `productCode`, `tierLabel`, `maxRelease` | 제품, 에디션, 라이선스가 허용하는 최신 릴리스 |
| `issuedAt`, `activatedAt`, `expiresAt`, `graceExpiresAt`, `gracePeriodDays` | 라이선스와 유예 기간의 날짜 |
| `features` | 라이선스가 부여한 기능 |
| `limits`, `usage` | 집계 항목별 상한과 사용량 |
| `heartbeatRequired`, `lastHeartbeatAt`, `lastChecked` | 하트비트 필요 여부, 마지막 갱신 시각과 검증 시각 |
| `maskedProductKey` | 가운데 부분을 가린 제품 키 |
| `onlineActivationAvailable` | 라이선스 서버 설정 여부 |
| `machineFingerprints`, `machineFingerprintAvailable`, `machineIdentifierSources`, `machineIdentifierSourcesUnavailable` | 이 머신의 식별 정보와 읽지 못한 식별 소스 |
| `publicKeyFingerprint` | 이 빌드가 토큰 검증에 사용하는 키의 지문 |

## 오프라인 활성화

라이선스 서버에 접속할 수 없는 배포본에서는 운영자가 요청 파일을 외부로 전달하고 서명된 토큰을 받아 등록합니다.

```bash
# 1. Create the request
curl "http://localhost:8080/api/deployment-license/activation-request?productKey=ACPS-XXXX-XXXX-XXXX-XXXX" \
  -H "Authorization: Bearer <access token>"

# 2. Register the token the license server issued for it
curl -X POST "http://localhost:8080/api/deployment-license/activation-response" \
  -H "Authorization: Bearer <access token>" \
  -H "Content-Type: application/json" \
  -d '{"productKey": "ACPS-XXXX-XXXX-XXXX-XXXX", "licenseToken": "<signed token>", "replaceExisting": false}'
```

- 1단계는 `body`, `nonce`, `requestedAt`으로 구성된 `LicenseDTOs.ActivationRequestFileDTO`를 반환합니다. `body`를 파일로 저장해 라이선스 서버에 제출하세요. 키 형식과 머신 지문을 먼저 검사하므로, 파일을 외부로 전달하기 전에 오류를 확인할 수 있습니다.
- `nonce`로 응답을 이 요청과 연결합니다. 이 요청에 대해 발급된 토큰만 허용합니다.
- 2단계는 서명과 머신 바인딩을 검증한 뒤 토큰을 등록합니다. 다른 머신에 발급된 토큰은 `MACHINE_MISMATCH`로 거부합니다.
- 폐기된 활성화는 오프라인 등록으로 복구할 수 없습니다. 새 활성화를 발급받으세요.

## 토큰 파일 제공

```yaml
application:
  license:
    token-path: ./license.key
```

발급받은 토큰을 `token-path`에 지정한 파일에 저장하세요. 등록 정보가 없는 상태로 시작하면 애플리케이션이 이 파일을 읽습니다.

| 저장된 등록 정보 | 파일 처리 |
|---|---|
| 없음 | 읽어서 등록합니다 |
| 정상 | 무시합니다 |
| 거부 상태이고 파일에 다른 토큰이 있음 | 파일의 토큰으로 다시 등록합니다 |
| 폐기 상태 | 무시합니다 |

## 하트비트와 재검증

| 작업 | 실행 주기 | 동작 |
|---|---|---|
| 재검증 | `re-verification-interval-minutes`마다(기본 30분). 모든 배포본에서 실행합니다 | 저장된 등록 정보를 다시 판정합니다. 만료가 재시작 없이 반영됩니다 |
| 하트비트 | 라이선스에 지정된 주기. 하트비트가 필요한 라이선스에서 실행합니다 | 라이선스 서버에서 새로 서명된 토큰을 받습니다 |

하트비트 작업은 `activation.heartbeat-check-interval`(기본 5분)마다 라이선스의 주기가 지났는지 확인하고, 지난 경우에만 서버를 호출합니다. 주기는 시간 단위로 토큰에 서명되어 있으며, 값이 없으면 1시간입니다. 실패하면 `activation.heartbeat-retry-interval`(기본 10분)이 지난 뒤 다시 시도합니다. 재검증과 하트비트 작업은 Spring 스케줄링을 사용하므로 애플리케이션에 `@EnableScheduling`이 필요합니다.

```bash
# Renew now, for example right after the contract changed
curl -X POST "http://localhost:8080/api/deployment-license/heartbeat" -H "Authorization: Bearer <access token>"
```

## 다른 머신으로 라이선스 이전

```bash
curl -X POST "http://localhost:8080/api/deployment-license/deactivate" -H "Authorization: Bearer <access token>"
```

반납하면 라이선스 서버의 좌석이 해제되고 로컬 등록 정보가 삭제됩니다. 이후 새 머신에서 같은 키로 활성화하세요. 반납하지 않고 새 머신에서 활성화하면 좌석이 사용 중이므로 거부됩니다. 이전 머신에 접근할 수 없으면 라이선스 서버에서 좌석을 해제하세요.

## 엔드포인트 호출 권한

| 엔드포인트 | 필요 권한 |
|---|---|
| `GET /deployment-license/status` | `hasPermission('LICENSE', 'view')` |
| `GET /deployment-license/features` | 로그인한 모든 사용자 |
| `POST /deployment-license/activate`, `GET /activation-request`, `POST /activation-response`, `POST /heartbeat`, `POST /deactivate` | `hasPermission('LICENSE', 'manage')` |

이 검사는 생성한 다른 컨트롤러와 마찬가지로 애플리케이션의 `PermissionEvaluator`가 판정합니다.

## 최초 설치 단계

최초 설치 마법사가 있는 애플리케이션은 `SetupState` 빈을 선언합니다. 이 경우 모듈이 `/system/setup/license` 아래에 같은 등록 절차를 제공하며, 설치가 끝나기 전에는 로그인 없이 접근할 수 있고 설치 후에는 접근할 수 없습니다.

```java
@Component
@RequiredArgsConstructor
public class ApplicationSetupState implements SetupState {

    private final SystemSettingRepository settingRepository;

    @Override
    public boolean isInitialized() {
        return settingRepository.findSetting().map(SystemSetting::isInitialized).orElse(false);
    }

    @Override
    public Optional<String> licenseServerUrl() {
        return settingRepository.findSetting().map(SystemSetting::getLicenseServerUrl);
    }

    @Override
    public void saveLicenseServerUrl(String serverUrl) {
        settingRepository.updateLicenseServerUrl(serverUrl);
    }
}
```

| 운영 단계 | 설치 단계 |
|---|---|
| `POST /deployment-license/activate` | `POST /system/setup/license/activate` |
| `GET /deployment-license/activation-request` | `GET /system/setup/license/activation-request` |
| `POST /deployment-license/activation-response` | `POST /system/setup/license/activation-response` |
| 설정으로 지정 | `POST /system/setup/license/server`로 라이선스 서버 주소를 저장합니다 |

```yaml
simplix:
  license:
    setup:
      token: ${SETUP_TOKEN}
```

> ⚠ 설치 단계에서 상태를 변경하는 엔드포인트는 이 토큰이 포함된 요청이나 루프백 주소에서 온 요청만 허용합니다. 같은 호스트의 리버스 프록시 뒤에서는 모든 요청이 루프백으로 인식되므로, 프록시 뒤에 배포할 때는 토큰을 반드시 설정하세요.

## 관련 문서

- [라이선스 강제 적용](ko/license/enforcing-the-license.md)
- [설정 레퍼런스](ko/license/configuration-reference.md)
- [문제 해결](ko/license/troubleshooting.md)
