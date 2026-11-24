# 경로 보호

로그인이 필요한 요청의 범위, 경로 종류별 인증 방식, 경로 공개와 브라우저 출처 허용, 보안 헤더 설정 방법을 설명합니다.

## 보안 체인

| 경로 | 인증 방식 | 세션 | 자격 증명이 없는 호출자가 받는 응답 |
|---|---|---|---|
| `/auth/token/`이 포함된 경로 | 엔드포인트가 전달받은 자격 증명을 직접 검사 | 토큰을 발급할 때 생성 | JSON 형식의 상태 코드 401 |
| `/api/**` | `Authorization: Bearer` 헤더나 토큰 쿠키의 액세스 토큰 | 요청에 토큰이 없을 때 사용 | JSON 형식의 상태 코드 401 |
| 그 밖의 모든 경로 | `/login`의 로그인 폼 | 사용 | 로그인 페이지로 리다이렉트 |

체인은 애플리케이션이 `SimpliXUserDetailsService`를 제공하면 등록됩니다. `simplix.auth.security.enable-token-endpoints: false`를 지정하면 첫 번째 체인과 토큰 필터가 제외되고, `enable-web-security: false`를 지정하면 마지막 체인이 제외됩니다.

### 체인 직접 추가

Spring Security는 `@Order` 값의 순서대로 체인을 검사하고, 요청이 매처와 일치하는 첫 번째 체인을 사용합니다.

| 체인 | 빈 | 순서 |
|---|---|---|
| 토큰 엔드포인트 | `tokenSecurityFilterChain` | 50 |
| 소셜 로그인 경로(소셜 로그인을 설정한 경우) | `oauth2SecurityFilterChain` | 90 |
| `/api/**` | `apiSecurityFilterChain` | 100 |
| 리소스 서버 경로(리소스 서버를 활성화한 경우) | `resourceServerSecurityFilterChain` | 100 |
| 그 밖의 모든 경로 | `webSecurityFilterChain` | 102 |

애플리케이션의 `SecurityFilterChain` 빈에는 `securityMatcher`를 지정하고, 우선해야 하는 체인보다 작은 순서 값을 지정하세요.

```java
@Configuration
public class PartnerChainConfig {

    @Bean
    @Order(40)
    public SecurityFilterChain partnerSecurityFilterChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/api/partner/**")
                .authorizeHttpRequests(requests -> requests.anyRequest().permitAll())
                .csrf(csrf -> csrf.disable());
        return http.build();
    }
}
```

이 체인을 등록하면 토큰이 없는 `GET /api/partner/ping` 요청에 상태 코드 200으로 응답하고, `/api`의 나머지 경로에는 계속 401로 응답합니다. 순서 값이 102보다 큰 체인은 모든 요청과 일치하는 웹 체인보다 나중에 검사되어 요청을 받을 수 없습니다. Spring Security가 이 구성을 오류로 판정하므로 애플리케이션이 시작되지 않고 `UnreachableFilterChainException: A filter chain that matches any request [...] has already been configured` 예외가 발생합니다.

## 경로 공개와 규칙 조정

```yaml
simplix:
  auth:
    security:
      permit-all-patterns:
        - /api/public/**
        - /v3/api-docs/**
      csrf-ignore-patterns:
        - /webhooks/**
      require-https: true
      frame-options: DENY
    cors:
      allowed-origins:
        - https://app.example.com
      allowed-methods: GET,POST,PUT,PATCH,DELETE
      allow-credentials: true
```

### 로그인 없이 접근하는 경로

웹 체인은 로그인 페이지, 로그인과 로그아웃 URL, `/error`, `/`, 정적 자원(`/css/**`, `/js/**`, `/images/**`, `/webjars/**`, `/favicon.ico`, `/vendor/**`), `/h2-console/**`, `/actuator/**`, `/.well-known/appspecific/**`를 항상 공개합니다. `permit-all-patterns`에 지정한 패턴이 여기에 추가됩니다. `/api/`로 시작하거나 API 문서를 가리키는 패턴은 API 체인에서도 해당 경로를 공개합니다.

### 다른 출처의 브라우저 클라이언트

다른 출처에서 제공하는 브라우저 애플리케이션은 `simplix.auth.cors.allowed-origins`에 해당 출처가 있어야 합니다. `https://*.example.com` 같은 와일드카드에는 `allowed-origin-patterns`를 사용하세요. 패턴은 `allow-credentials: true`와 함께 사용할 수 있으며, 둘 다 지정하면 `allowed-origins`보다 우선합니다.

### CSRF

CSRF 보호는 세션 쿠키로 호출자를 인증하는 웹 체인에 적용됩니다. 토큰 체인과 API 체인에는 적용되지 않습니다. `csrf-ignore-patterns`로 웹 체인의 일부 경로를 제외하고, `enable-csrf: false`로 끌 수 있습니다.

### HTTPS와 헤더

| 속성 | 기본값 | 의미 |
|---|---|---|
| `require-https` | `false` | 웹 체인의 모든 요청을 HTTPS로 리다이렉트 |
| `enable-hsts`, `hsts-max-age-seconds` | `true`, 1년 | `Strict-Transport-Security` 전송. 이 헤더는 HTTPS에서만 전송합니다 |
| `frame-options` | `SAMEORIGIN` | `DENY`이면 모든 프레임을 금지 |
| `content-security-policy` | 허용 범위가 넓은 정책 | `Content-Security-Policy` 헤더. 운영 환경에서는 엄격한 정책을 지정하세요 |
| `referrer-policy`, `permissions-policy` | 전송하지 않음 | 같은 이름의 헤더 |
| `enable-http-basic` | `false` | 웹 체인에서 HTTP Basic 허용 |

## 로그인 페이지

웹 체인은 `login-page-path`(`/login`)에서 `login-page-template`(`login`)으로 지정한 Thymeleaf 템플릿으로 로그인 페이지를 제공하고, `login-processing-url`에서 폼을 처리합니다. `authenticationSuccessHandler`와 `authenticationFailureHandler`라는 이름의 빈을 등록하면 로그인 시도 후의 동작을 대체합니다.

## 메서드 단위 권한

메서드 보안이 활성화되어 있으므로 `@PreAuthorize`, `@PostAuthorize`, `@Secured`, `@RolesAllowed`를 모든 빈에 사용할 수 있습니다. `hasPermission(...)`은 애플리케이션의 `PermissionEvaluator` 빈으로 판정하며, 빈이 없으면 이 검사는 모두 실패합니다. 판정기 예제는 [애플리케이션 보안 적용](ko/securing-an-application.md)에 있습니다.

`SimpliXUserDetailsService`에는 애플리케이션이 재정의할 수 있는 기본 메서드도 있습니다: `exists`, `loadCurrentUser`, `isAccountLocked`, `isAccountExpired`, `isCredentialsExpired`, `getUserAuthorities`, `hasAuthority`, `hasRole`.

## 모듈 비활성화

`simplix.auth.enabled: false`를 지정하면 모듈의 보안 구성이 제외됩니다. 이때 [스타터](ko/starter/readme.md)가 모든 요청을 허용하는 체인을 등록합니다. 인증을 처리하는 게이트웨이 뒤에 있는 서비스에 적합합니다.

## 관련 문서

- [설정 레퍼런스](ko/auth/configuration-reference.md)
- [애플리케이션 보안 적용](ko/securing-an-application.md)
