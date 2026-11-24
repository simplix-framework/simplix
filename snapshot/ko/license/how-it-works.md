# simplix-license 동작 방식

판정이 내려지고 공유되는 방식, 검증 키와 유출 키 허용 상한의 동작, 등록 정보의 보관 위치, 라이선스의 상태 전이를 설명합니다.

## 판정 공유 구조

1. `LicenseManager`가 배포본의 라이선스 처리를 담당합니다. 시작할 때 토큰 파일을 가져오고, 저장된 등록 정보를 검증하고, 판정 결과를 공개합니다. 판정 자체는 라이선스 SDK가 계산합니다.
2. 판정 결과는 SDK의 게이트에 캐시되며 `LicenseState`로 읽습니다.
3. `LicenseEnforcementFilter`, 기능 애스펙트, `LicenseQuotaGuard`, 헬스 인디케이터, 라이선스 엔드포인트는 모두 이 상태 하나를 읽으므로 서로 다른 결과를 반환하지 않습니다.
4. 첫 검증은 애플리케이션이 준비된 시점에 실행하며, 빈을 생성하는 시점에는 실행하지 않습니다. 데이터베이스 저장소는 이 시점에야 사용할 수 있습니다. 첫 검증 전의 상태는 `NOT_ACTIVATED`입니다.

## 설정할 수 없는 항목

온프레미스 배포본은 라이선스로 제한되는 당사자가 직접 운영합니다. 그래서 다음 값은 빌드에 고정되어 있습니다.

| 항목 | 고정 방식 | 이유 |
|---|---|---|
| 강제 적용 여부 | 항상 적용 | 고객이 변경할 수 있는 전환 값을 두지 않습니다 |
| 검증 키 위치 | `classpath:license-verification-keys.json` | 배포본이 직접 만든 키로 토큰을 검증할 수 없습니다 |
| 검증 키의 이름, 공개키, 유출 표시 | 해당 파일의 항목 하나 | 이름과 키가 서로 어긋나지 않고, 설정 파일로 변경할 수 없습니다 |
| 제품 코드 | `ProductIdentity` 빈 | 배포본은 자신이 어떤 제품인지 알아야 합니다 |

개발 환경도 같은 검증 경로를 사용하며, 개발 채널로 발급된 라이선스를 등록합니다.

## 검증 키

`VerificationKeys`는 빌드에 포함된 모든 `VerificationKey`를 보관합니다. 토큰에는 서명에 사용한 키의 이름이 있으며 SDK가 해당 키로 검증합니다. 키를 여러 개 포함하면 발급자가 서명 키를 교체해도 이전 키로 서명된 라이선스가 유효하게 유지됩니다.

## 유출 키 허용 상한

`compromised`로 표시된 키도 검증에는 사용하지만, 이 키로 서명된 토큰은 배포본이 이미 보유한 범위를 넘어서 부여할 수 없습니다. `CompromiseCeiling`은 유출 표시를 처음 읽은 시점에 배포본이 보유한 내용을 기록한 값이며 이후 변경되지 않습니다.

| 기준 | 토큰을 거부하는 조건 |
|---|---|
| 기능 | 보유하지 않았던 기능을 요구함 |
| 수량 한도 | 더 높은 한도를 요구하거나 한도 코드를 생략함 |
| 만료 | 더 늦은 만료일을 지정함 |
| 릴리스 상한 | 더 높은 릴리스를 요구하거나 상한을 생략함 |

- 기준 하나라도 높아지면 토큰 전체를 거부하고 상태가 `SIGNING_KEY_COMPROMISED`가 됩니다.
- 등록된 것이 없는 배포본은 토큰 파일을 읽기 전에 허용 상한을 「보유한 것 없음」으로 고정합니다. 따라서 유출된 키로 서명한 위조 토큰으로는 새로 설치한 배포본에 아무것도 등록할 수 없습니다.
- 유출 표시가 없는 키에는 제한이 적용되지 않습니다. 서명에 더 이상 사용하지 않는 키는 이전과 같은 범위를 계속 부여합니다.

## 등록 정보 보관 위치

|  | `JpaLicenseStore` | `FileLicenseStore` |
|---|---|---|
| 선택 조건 | JPA가 클래스패스에 있을 때 | JPA가 없을 때 |
| 등록 정보 보관 위치 | `LicenseRegistration`으로 매핑한 `license_registration` 테이블 | `state-path`에 지정한 파일 |
| 허용 상한 보관 위치 | 같은 행의 `compromise_ceiling` 컬럼 | 같은 파일의 `compromiseCeiling` 항목 |
| 컨테이너 교체 | 볼륨 없이 라이선스를 유지합니다 | 파일을 볼륨에 보관해야 합니다 |

저장소를 직접 작성할 때는 SDK의 `LicenseStore`와 `CompromiseCeilingStore`를 함께 구현하세요. 한쪽만 구현하면 애플리케이션이 시작되지 않습니다. 허용 상한을 보관하지 못하는 배포본은 오류 없이 제한이 해제되기 때문입니다. 등록 정보와 허용 상한은 같은 위치에 보관해야 하며, 그래야 양쪽의 유지 기간이 어긋나지 않습니다. `LicenseStorePackage`는 엔티티 패키지를 직접 지정하는 애플리케이션에서 엔티티의 패키지를 가리키는 데 사용합니다.

## 상태

| 이전 상태 | 다음 상태 | 조건 |
|---|---|---|
| 시작 | `NOT_ACTIVATED` | 등록된 정보가 없음 |
| `NOT_ACTIVATED` | `VALID` | 활성화 성공 |
| `VALID` | `GRACE_PERIOD` | 만료일 경과 |
| `GRACE_PERIOD` | `VALID` | 하트비트로 갱신된 토큰 수령 |
| `GRACE_PERIOD` | `EXPIRED` | 유예 기간 경과 |
| `VALID` | `HEARTBEAT_OVERDUE` | 하트비트 주기 초과 |
| `VALID` | `REVOKED` | 서버에서 활성화 폐기 |
| `VALID` | `RELEASE_NOT_ENTITLED` | 계약이 허용하는 릴리스보다 높은 버전으로 업그레이드 |
| `VALID` | `SIGNING_KEY_COMPROMISED` | 유출 키로 서명된 토큰이 허용 상한보다 많이 요구 |
| 거부 상태 | `VALID` | 유효한 토큰 등록 또는 계약 갱신 |

`RELEASE_NOT_ENTITLED` 상태에서는 요청을 차단하지 않습니다. 릴리스 상한은 판매 범위를 제어하는 수단이며, 요청을 차단하면 애플리케이션이 제어하는 장비까지 중단됩니다. 그 대신 유료 기능 목록이 비어 있으므로 기능 게이트가 유료 기능을 거부합니다.

## 모듈이 등록하는 구성

| 구성 요소 | 등록 조건 |
|---|---|
| `LicenseAutoConfiguration`: 매니저, 상태, 저장소, `FeatureAccess`, `FeatureGateAspect`, `LicenseQuotaGuard`, `LicenseAuditTrail`, `LicenseActivationClient`를 사용하는 `LicenseActivationService`, 스케줄러 `LicenseReVerificationScheduler`와 `LicenseHeartbeatScheduler`, `DeploymentLicenseRestController` | 항상 |
| `LicenseEnforcementFilter`(순서 50) | `application.license.enforcement.http-filter-enabled`가 `false`가 아닐 때 |
| `FeatureActivationAspect` | `FeatureActivationChecker` 빈이 있을 때 |
| `LicenseSetupController`, `EnvProfileService`를 사용하는 `EnvSetupController`, `InitializationGateFilter`(순서 40) | `SetupState` 빈이 있을 때 |
| `LicenseActuatorAutoConfiguration`: `LicenseHealthIndicator`와 `LicenseMetrics` | Spring Boot Actuator가 클래스패스에 있을 때. 메트릭에는 Micrometer도 필요합니다 |

설치 게이트는 라이선스 필터보다 먼저 실행됩니다. 설치되지 않은 배포본에는 판정할 라이선스가 없고, 설치 마법사에는 계속 접근할 수 있어야 합니다. `LicenseRuntimeHints`는 네이티브 이미지에서 모듈에 필요한 리플렉션을 선언하고, `RuntimeIntegrityChecker`는 애플리케이션 바이너리를 기준 해시와 비교해 변조를 감지합니다. `ActivationServerProbe`는 라이선스 서버 주소를 저장하기 전에 서버에 식별 정보를 요청해 서명 키의 지문을 비교하고, `ActivationFailures`는 서버 오류를 메시지 키로 변환합니다.

## 관련 문서

- [라이선스 강제 적용](ko/license/enforcing-the-license.md)
- [설정 레퍼런스](ko/license/configuration-reference.md)
- [문제 해결](ko/license/troubleshooting.md)
