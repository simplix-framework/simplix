# simplix-auth 동작 방식

모듈의 구성 요소, 각 구성 요소가 등록되는 조건, 요청이 처리되는 과정을 설명합니다. 구성 요소를 교체하기 전이나, 가이드로 설명되지 않는 응답을 받았을 때 참고하세요.

## 등록되는 구성과 조건

| 자동 구성 | 등록 대상 | 활성 조건 |
|---|---|---|
| `SimpliXAuthAutoConfiguration` | 보안 구성 `SimpliXAuthSecurityConfiguration`, `SimpliXAuthMethodSecurityConfiguration`의 메서드 보안, 토큰 프로바이더, 토큰 필터, 컨트롤러 | `simplix.auth.enabled`가 `false`가 아니고 `SimpliXUserDetailsService` 빈이 있을 때 |
| `SimpliXJweKeyAutoConfiguration` | `JweKeyProvider`. 설정한 키에는 `StaticJweKeyProvider`, 키 롤링에는 `DatabaseJweKeyProvider`와 `JweKeyRotationService` | 항상. 키 롤링에는 `key-rolling.enabled`와 `JweKeyStore` 빈이 필요합니다 |
| `SimpliXOAuth2AutoConfiguration` | `SimpliXOAuth2Configuration`의 소셜 로그인 구성: 사용자 서비스, 핸들러, 인텐트 필터, 연동 컨트롤러 | `simplix.auth.oauth2.enabled`가 `false`가 아니고, OAuth2 클라이언트 라이브러리가 클래스패스에 있으며, `OAuth2AuthenticationService` 빈이 있을 때 |
| `OAuth2ClientFilteringAutoConfiguration` | `OAuth2ClientFilteringBeanPostProcessor`. Spring이 검증하기 전에 클라이언트 ID가 비어 있는 등록 정보를 제외합니다 | OAuth2 클라이언트 라이브러리가 클래스패스에 있을 때 |
| `SimpliXResourceServerAutoConfiguration` | 신뢰하는 발급자의 Bearer 토큰을 받는 무상태 체인. `TrustedIssuerAuthenticationManagers`로 구성하고 `AudienceValidator`로 검사합니다 | `simplix.auth.resource-server.enabled`가 `true`이고 리소스 서버 라이브러리가 클래스패스에 있을 때 |
| `SimpliXStatelessTokenAutoConfiguration` | `SimpliXStatelessTokenSigner`와 `SimpliXAsymmetricTokenSigner` | 시크릿이나 키를 설정했을 때. `simplix.auth.enabled`와 무관합니다 |
| `SimpliXAuthMetricsAutoConfiguration` | `AuthenticationMetrics`와 블랙리스트 크기 게이지 | Micrometer가 클래스패스에 있을 때 |
| `SimpliXAuthOpenApiConfiguration` | API 문서의 Bearer 인증 스킴 | 토큰 엔드포인트를 등록했을 때 |

이보다 먼저 `SimpliXAuthEnvironmentPostProcessor`가 가장 낮은 우선순위로 환경에 기본값을 추가합니다. 그중 하나는 모듈 밖의 설정에 적용됩니다. 애플리케이션에서 지정하지 않으면 `server.servlet.session.timeout`이 `30m`으로 설정됩니다.

## 요청 처리 과정

| 요청 | 처리 주체 | 결과 |
|---|---|---|
| `POST /auth/token/issue` | `SimpliXAuthTokenController`. 애플리케이션의 `SimpliXUserDetailsService`로 Basic 인증 정보를 확인합니다 | 토큰과 만료 시각이 포함된 `SimpliXJweTokenProvider.TokenResponse` |
| Bearer 토큰을 포함한 `/api` 아래의 경로 | `SimpliXTokenAuthenticationFilter`. 토큰을 복호화하고 만료 여부와 블랙리스트를 확인한 뒤 인증 정보를 설정합니다 | 토큰의 사용자로 컨트롤러가 실행됩니다 |
| 유효한 인증 정보가 없는 `/api` 아래의 경로 | `SimpliXAuthenticationEntryPoint` | `AUTH_` 코드가 포함된 401 JSON 응답 |
| 사용자에게 권한이 없는 호출 | `SimpliXAccessDeniedHandler`. 메서드 보안에서 거부한 호출은 스타터의 예외 핸들러가 처리합니다 | `AUTHZ_` 코드가 포함된 403 JSON 응답 |
| 그 밖의 경로 | 폼 로그인을 사용하는 웹 체인. `SimpliXAuthLoginController`가 로그인 페이지를 제공합니다 | 로그인 페이지로 리다이렉트하거나, 로그인한 세션이면 해당 페이지를 반환합니다 |

발급 엔드포인트는 로그인 시도를 처리한 뒤 `tokenAuthenticationSuccessHandler`와 `tokenAuthenticationFailureHandler`라는 이름의 빈을 호출합니다. 기본 빈인 `SimpliXTokenAuthenticationSuccessHandler`와 `SimpliXTokenAuthenticationFailureHandler`는 로그를 기록합니다. 이 빈을 교체하는 방법은 [토큰 발급과 갱신](./issuing-and-refreshing-tokens.md)에서 설명합니다. 모든 체인은 `simplix.auth.cors`로 구성한 `SimpliXCorsConfigurations`의 CORS 규칙을 사용합니다.

## 폐기된 토큰의 보관 위치

| 저장소 | 클래스 | 적합한 환경 |
|---|---|---|
| `MEMORY` | `InMemoryTokenBlacklistService` | 개발 환경. 재시작하면 목록이 사라집니다 |
| `CAFFEINE` | `CaffeineTokenBlacklistService` | 단일 인스턴스. 항목은 토큰과 함께 만료됩니다 |
| `REDIS` | `RedisTokenBlacklistService` | Redis를 공유하는 여러 인스턴스 |
| `NATS` | `NatsTokenBlacklistService` | NATS JetStream 키-값 버킷을 공유하는 여러 인스턴스 |

`BlacklistHealthIndicator`는 헬스 엔드포인트의 `blacklist` 항목으로 저장소 상태를 보고합니다. `RedisBlacklistProbe` 같은 `BlacklistProbe`가 저장소를 직접 조회하므로, 실패 모드 설정으로 요청이 통과되는 경우에도 장애를 확인할 수 있습니다.

## 소셜 로그인 처리 과정

1. `OAuth2IntentFilter`가 `/oauth2/login/{provider}`와 `/oauth2/register/{provider}` 요청을 받아 인텐트를 세션에 저장하고 인가 엔드포인트로 리다이렉트합니다. `OAuth2UnknownRegistrationFilter`는 등록 정보가 없는 프로바이더 요청을 오류 페이지 대신 실패 URL로 보냅니다.
2. Spring Security가 프로바이더와의 교환을 처리합니다. OpenID Connect 프로바이더의 프로필은 `SimpliXOidcUserService`가, 그 밖의 프로바이더는 `SimpliXOAuth2UserService`가 불러옵니다.
3. `OAuth2UserInfoExtractor`가 프로바이더에 맞는 `OAuth2UserInfoExtractorStrategy`를 선택해 프로필을 `OAuth2UserInfo`로 변환합니다.
4. `OAuth2LoginSuccessHandler`가 애플리케이션의 `OAuth2AuthenticationService`를 호출하고 토큰을 발급해 전달합니다. `OAuth2LoginFailureHandler`는 `OAuth2AuthenticationException`의 오류 코드와 함께 실패 URL로 리다이렉트합니다.
5. 연동 요청은 `SimpliXOAuth2Controller`가 처리하며, 리다이렉트하기 전에 로그인한 사용자를 세션에 저장합니다.

보안을 직접 구성하는 애플리케이션은 구성 클래스에 `@EnableSimplixOAuth2`를 지정해 같은 빈을 가져옵니다.

## 모듈의 예외

| 예외 | 발생 조건 |
|---|---|
| `TokenValidationException` | 토큰 형식이 올바르지 않거나, 만료 · 폐기되었거나, IP 또는 User-Agent 검사에 실패했을 때 |
| `JweKeyException` | 키를 불러오거나 복호화 · 교체 · 저장하지 못했을 때 |
| `OAuth2AuthenticationException` | 소셜 로그인에 실패했을 때. 클라이언트에 전달할 오류 코드를 포함합니다 |

## 그 밖의 공개 메서드

가이드에서는 작업에 필요한 메서드를 설명합니다. 가이드에 나온 타입은 아래 공개 메서드도 제공합니다.

| 타입 | 메서드 | 동작 |
|---|---|---|
| `SimpliXAsymmetricTokenSigner` | `fromKeyFile(keyFile, keyId)` | `private-key`와 `public-key`가 있는 프로퍼티 파일로 서명기를 만듭니다. 파일이 없으면 새 키 쌍을 만들어 소유자만 읽을 수 있는 파일로 저장합니다 |
| `SimpliXAsymmetricTokenSigner` | `keyId()` | 모든 토큰에 기록하는 키 ID를 반환합니다 |
| `SimpliXStatelessTokenSigner` | `mac(value)` | 값의 키 기반 다이제스트를 URL에 안전한 문자열로 반환합니다. 민감한 입력에서 항상 같은 식별자를 만들 때 사용하며, 결과는 토큰이 아니므로 검증할 수 없습니다 |
| `OAuth2ProviderType` | `isSupported(registrationId)` | 열거형에 해당 등록 ID가 있는지 반환합니다 |
| `TokenAuditEvent` | `isSuccess()` | 이벤트의 실패 사유가 `NONE`이면 `true`를 반환합니다 |
| `JweKeyProvider` | `getCurrentKeyPair()` | 새 토큰을 암호화하는 키 쌍을 반환합니다 |
| `JweKeyProvider` | `getKeyPair(version)` | 지정한 버전의 키 쌍을 반환합니다. 토큰을 읽을 때 토큰의 `kid` 값으로 조회합니다 |
| `JweKeyProvider` | `getCurrentVersion()` | 새 토큰의 `kid`에 기록하는 버전을 반환합니다 |
| `JweKeyProvider` | `getAvailableVersions()` | 프로바이더가 보유한 모든 키 버전을 반환합니다 |
| `JweKeyProvider` | `isConfigured()` | 프로바이더가 키를 제공할 수 있는 상태인지 반환합니다 |
| `JweKeyRotationService` | `initializeIfEmpty()` | 저장소에 키가 없으면 첫 키를 만들고, 만들었는지 여부를 반환합니다 |
| `JweKeyRotationService` | `getRsaKeySize()` | 새 RSA 키의 크기를 비트 단위로 반환합니다 |
| `OAuth2UserInfoExtractor` | `extract(authentication)` | 소셜 로그인 인증 객체에서 `OAuth2UserInfo`를 추출합니다 |
| `OAuth2UserInfoExtractor` | `registerExtractor(strategy)` | `OAuth2UserInfoExtractorStrategy`를 추가합니다. 같은 제공자의 기본 추출기가 있으면 교체합니다 |
| `OAuth2UserInfoExtractor` | `hasExtractor(provider)` | 해당 제공자의 추출기가 등록되어 있는지 반환합니다 |
| `OAuth2UserInfoExtractorStrategy` | `extract(attributes, oauth2User)` | 직접 작성하는 추출기에서 구현하는 메서드입니다. 제공자의 속성을 `OAuth2UserInfo`로 변환합니다 |
| `OAuth2UserInfoExtractorStrategy` | `getString(map, key)`, `getBoolean(map, key)`, `getMap(map, key)` | 속성 맵에서 문자열, 불리언, 중첩 맵을 읽는 기본 메서드입니다 |
| `PendingSocialRegistration` | `getProviderName()` | 제공자 이름을 문자열로 반환합니다. 제공자가 없으면 `null`입니다 |
| `BlacklistProbe` | `probe()` | 직접 작성한 토큰 저장소의 상태 검사를 블랙리스트 헬스 인디케이터에 제공할 때 구현하는 메서드입니다. 저장소가 응답하면 정상 반환하고, 응답하지 않으면 런타임 예외를 던집니다 |
| `TokenAuditEvent` | `tokenType()`, `additionalDetails()` | 토큰 종류(`access` 또는 `refresh`)와 이벤트의 추가 정보를 반환합니다 |
| `OAuth2ProviderType` | `getRegistrationId()`, `getDisplayName()`, `isSupportsOidc()` | 제공자의 등록 ID, 표시 이름, OpenID Connect 지원 여부를 반환합니다 |

## 관련 문서

- [경로 보안](./securing-paths.md)
- [설정 레퍼런스](./configuration-reference.md)
- [문제 해결](./troubleshooting.md)
