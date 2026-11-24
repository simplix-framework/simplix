# simplix-license 시작하기

이 페이지에서는 모듈을 추가하고, 애플리케이션의 제품 정보와 라이선스 검증 키를 지정한 뒤 첫 라이선스를 등록합니다.

## 1단계. 모듈 추가

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-license:${version}"
}
```

선택 의존성과 SDK 저장소의 인증 정보는 [소개 문서](../../../simplix-license/README.ko.md)에 있습니다.

## 2단계. 제품 지정

```java
@Configuration
public class LicenseIdentityConfig {

    @Value("${application.version}")
    private String applicationVersion;

    @Bean
    public ProductIdentity productIdentity() {
        return new ProductIdentity() {

            @Override
            public String productCode() {
                return "ACPS-PORTAL";
            }

            @Override
            public String release() {
                return applicationVersion;
            }
        };
    }
}
```

`ProductIdentity`는 애플리케이션이 반드시 선언해야 하는 빈입니다. 기본값이 없습니다. 제품을 알 수 없는 배포본은 토큰이 자신에게 발급된 것인지 판정할 수 없으므로, 이 빈이 없으면 애플리케이션이 시작되지 않습니다. `release()`는 활성화할 때 라이선스 서버에 보고되어 계약이 허용하는 최신 릴리스와 비교됩니다.

## 3단계. 검증 키 추가

발급자의 공개키를 `src/main/resources/license-verification-keys.json`에 저장하세요.

```json
[
  { "keyId": "acps-portal-2026", "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...", "compromised": false },
  { "keyId": "acps-portal-2024", "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...", "compromised": true }
]
```

| 항목 | 내용 |
|---|---|
| `keyId` | 토큰에 포함된 서명 키 이름과 대조하는 이름 |
| `publicKeyPem` | X.509 PEM 형식의 공개키 |
| `compromised` | 유출된 서명 키이면 `true`. 이 키로 서명된 토큰은 배포본이 이미 보유한 범위를 넘어서 부여할 수 없습니다 |

파일에는 키를 여러 개 포함할 수 있으므로, 발급자가 서명 키를 교체해도 이전에 서명된 라이선스가 무효화되지 않습니다. 파일이 없거나 비어 있을 때, 이름이나 키가 없는 항목이 있을 때, 같은 이름이 중복될 때는 애플리케이션이 시작되지 않습니다.

## 4단계. 설정

```yaml
api:
  version:
    prefix: /api

application:
  license:
    product-key-prefix: ACPS
    grace-period-mode: READ_ONLY
    activation:
      server-url: https://license.example.com
```

속성은 `simplix`가 아닌 `application.license` 아래에 있습니다. `api.version.prefix`는 애플리케이션의 API 접두어입니다. 모듈은 라이선스가 유효하지 않은 동안에도 로그인과 라이선스 엔드포인트에 접근할 수 있도록 이 값을 사용합니다. `product-key-prefix`는 이 제품군 제품 키의 앞부분이며 키의 체크섬 계산에 포함됩니다. 실행 중에도 라이선스를 다시 검증하도록 애플리케이션에 `@EnableScheduling`을 추가하세요.

## 5단계. 시작과 라이선스 등록

라이선스를 등록하기 전의 상태는 `NOT_ACTIVATED`입니다. 로그인, 라이선스 엔드포인트 등 [라이선스 강제 적용](./enforcing-the-license.md)에 정리된 경로를 제외하고 API는 상태 403으로 응답합니다. 로그인한 뒤 활성화하세요.

```bash
curl -X POST "http://localhost:8080/api/deployment-license/activate" \
  -H "Authorization: Bearer <access token>" \
  -H "Content-Type: application/json" \
  -d '{"productKey": "ACPS-XXXX-XXXX-XXXX-XXXX"}'
```

응답의 상태가 `VALID`이면 나머지 API도 사용할 수 있습니다. 시작 로그에는 검증 키의 지문이 기록되며, 이 값은 라이선스 서버가 서명 키에 대해 기록한 지문과 같아야 합니다.

## 다음 단계

- [라이선스 활성화](./activating-a-license.md)
- [기능 게이팅](./gating-features.md)
- [수량 제한](./limiting-quantities.md)
