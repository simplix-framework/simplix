# 외부 토큰 수용

Keycloak, Okta, Microsoft Entra ID 같은 다른 인증 제공자가 발급한 토큰으로 API를 보호하는 방법을 설명합니다. 리소스 서버 모드에서는 애플리케이션이 토큰을 발급하지 않고, 요청마다 Bearer JWT를 신뢰하는 발급자 기준으로 검증합니다.

## 준비

`org.springframework.boot:spring-boot-starter-oauth2-resource-server`를 추가하세요. 이 모드는 Spring Security의 리소스 서버 클래스가 클래스패스에 있을 때만 등록됩니다.

## 발급자 설정

```yaml
simplix:
  auth:
    security:
      enable-token-endpoints: false
      enable-web-security: false
    resource-server:
      enabled: true
      path-patterns:
        - /api/**
      issuers:
        - name: workforce
          issuer-uri: https://login.example.com/realms/workforce
          audiences:
            - library-api
```

| 속성 | 기본값 | 의미 |
|---|---|---|
| `resource-server.enabled` | `false` | 리소스 서버 모드 사용 |
| `resource-server.path-patterns` | `/api/**` | 토큰이 필요한 경로 |
| `issuers[].name` | 필수 | 발급자의 이름. 변환기에 전달됩니다 |
| `issuers[].issuer-uri` | 필수 | 토큰의 `iss` 값. 이 주소에서 키를 조회합니다 |
| `issuers[].jwk-set-uri` | 자동 조회 | 자동 조회를 사용할 수 없을 때 지정하는 서명 키의 위치 |
| `issuers[].audiences` | 없음 | 토큰의 `aud`에 이 중 하나가 있어야 합니다 |

이 체인은 상태를 보관하지 않으며 세션을 사용하지 않습니다. `simplix.auth.security.permit-all-patterns`의 경로는 토큰 없이 통과합니다. 이 애플리케이션은 로그인을 처리하지 않으므로, 예제처럼 토큰 엔드포인트와 웹 체인을 끄세요.

## 토큰을 사용자로 변환

기본적으로 토큰 자체가 주체(principal)입니다. `SimpliXJwtAuthenticationConverter`를 등록해 토큰의 subject를 애플리케이션 계정으로 변환하면, 메서드 보안과 감사에서 애플리케이션의 사용자를 사용합니다. 변환기가 호출되는 시점에는 서명, 발급자, 유효 기간, audience 검사가 끝나 있습니다.

```java
@Component
@RequiredArgsConstructor
public class LibraryJwtConverter implements SimpliXJwtAuthenticationConverter {

    private final LibraryUserDetailsService users;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt, TrustedIssuer issuer) {
        UserDetails user = users.loadUserByUsername(jwt.getSubject());
        return new UsernamePasswordAuthenticationToken(user, jwt, user.getAuthorities());
    }
}
```

## 리소스 서버의 CORS 규칙

리소스 서버 체인은 다른 체인과 마찬가지로 `simplix.auth.cors`의 CORS 규칙을 사용합니다. 규칙은 이 속성으로 지정하세요. 표준 체인을 사용하는 애플리케이션에서는 `corsConfigurationSource`라는 이름으로 `CorsConfigurationSource` 빈을 선언하지 마세요. 모듈이 같은 이름의 빈을 등록하므로 애플리케이션이 시작되지 않고 `The bean 'corsConfigurationSource' [...] could not be registered. A bean with that name has already been defined` 오류가 발생합니다.

## 관련 문서

- [경로 보호](./securing-paths.md)
- [설정 레퍼런스](./configuration-reference.md)
