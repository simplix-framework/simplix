# 토큰 발급과 갱신

클라이언트가 토큰을 받고, 전송하고, 세션을 유지하는 방법을 설명합니다. 토큰은 JWE 형식이며 내용이 암호화되어 있어 클라이언트가 클레임을 읽거나 바꿀 수 없습니다.

## 엔드포인트

| 엔드포인트 | 보내는 값 | 응답 |
|---|---|---|
| `POST /auth/token/issue` | 사용자 이름과 비밀번호(HTTP Basic) | 액세스 토큰과 리프레시 토큰 |
| `POST /auth/token/refresh` | `X-Refresh-Token` 헤더의 리프레시 토큰 | 새 액세스 토큰과 리프레시 토큰 |
| `POST /auth/token/revoke` | `Bearer` 액세스 토큰, `X-Refresh-Token` 헤더의 리프레시 토큰, 또는 둘 다 | `SimpliXApiResponse` |

```json
{
  "accessToken" : "<token>",
  "refreshToken" : "<token>",
  "accessTokenExpiry" : "<time with zone>",
  "refreshTokenExpiry" : "<time with zone>"
}
```

엔드포인트는 애플리케이션이 컨트롤러에 지정한 접두 경로 아래에 등록됩니다. 토큰 체인은 `/auth/token/`이 포함된 모든 경로와 일치하므로 `/api/v1/auth/token/issue`도 같게 동작합니다.

## 액세스 토큰 전송

```bash
curl -H "Authorization: Bearer <access token>" http://localhost:8080/api/catalog/author/search
```

토큰 필터는 `simplix.auth.oauth2.cookie.access-token-name`(`access_token`)으로 지정한 쿠키에서도 액세스 토큰을 읽습니다. 소셜 로그인 후 브라우저가 이 방식으로 토큰을 보냅니다.

## 토큰의 내용

| 클레임 | 내용 |
|---|---|
| `sub` | 사용자 이름 |
| `jti` | 토큰의 식별자. 폐기할 때 사용합니다 |
| `iat`, `exp` | 발급 시각과 만료 시각 |
| `type` | `access` 또는 `refresh` |
| `clientIp`, `userAgent` | 발급 위치. 아래의 선택 검사에 사용합니다 |

헤더에는 `alg` `RSA-OAEP-256`, `enc` `A256GCM`과 토큰을 암호화한 키의 버전인 `kid`가 들어 있습니다.

## 액세스 토큰 만료 전 갱신

갱신하면 새 토큰 쌍을 받습니다. 기본값인 토큰 교체가 켜져 있고 블랙리스트도 켜져 있으면, 사용한 리프레시 토큰은 폐기됩니다. 같은 토큰을 다시 보내면 상태 코드 401로 응답합니다. 이전에 발급한 액세스 토큰은 만료될 때까지 유효합니다.

```json
{
  "type" : "ERROR",
  "message" : "You have been logged out",
  "timestamp" : "<time with zone>",
  "errorCode" : "AUTH_TOKEN_INVALID",
  "errorDetail" : "Your authentication has been revoked. Please log in again"
}
```

## 옵션

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.auth.token.access-token-lifetime` | `1800` | 액세스 토큰의 유효 시간(초) |
| `simplix.auth.token.refresh-token-lifetime` | `604800` | 리프레시 토큰의 유효 시간(초) |
| `simplix.auth.token.enable-token-rotation` | `true` | 갱신할 때마다 새 리프레시 토큰 발급 |
| `simplix.auth.token.enable-ip-validation` | `false` | 발급받은 IP 주소와 다른 주소에서 보낸 토큰 거부 |
| `simplix.auth.token.enable-user-agent-validation` | `false` | 다른 사용자 에이전트가 보낸 토큰 거부 |
| `simplix.auth.token.create-session-on-token-issue` | `true` | 토큰을 발급할 때 HTTP 세션을 시작합니다. 같은 브라우저에서 웹 페이지도 열 수 있습니다 |
| `simplix.auth.security.prefer-token-over-session` | `true` | 요청에 토큰과 세션이 모두 있으면 토큰으로 인증 |

## 로그인 시도 후속 처리

발급 엔드포인트는 자격 증명을 검사한 뒤 `tokenAuthenticationSuccessHandler` 또는 `tokenAuthenticationFailureHandler`라는 이름의 빈을 호출합니다. 회원의 마지막 로그인 시각을 기록하거나 실패 횟수를 집계하려면 같은 이름의 빈을 선언하세요.

```java
@Configuration
@Slf4j
public class LoginAuditConfig {

    @Bean(name = "tokenAuthenticationSuccessHandler")
    public AuthenticationSuccessHandler tokenAuthenticationSuccessHandler() {
        return (request, response, authentication) ->
                log.info("token issued to {} from {}", authentication.getName(), request.getRemoteAddr());
    }

    @Bean(name = "tokenAuthenticationFailureHandler")
    public AuthenticationFailureHandler tokenAuthenticationFailureHandler() {
        return (request, response, exception) ->
                log.warn("token refused: {}", exception.getMessage());
    }
}
```

- `response` 인자는 `null`입니다. 응답은 컨트롤러가 작성하므로 핸들러에서는 기록만 수행하세요.
- 실패 핸들러는 해당 시도의 `AuthenticationException`을 받습니다. 비밀번호가 틀린 요청과 Basic 헤더가 없는 요청에는 `BadCredentialsException`이 전달됩니다.
- 이 빈은 발급 엔드포인트에서만 호출됩니다. 갱신 엔드포인트와 폐기 엔드포인트는 호출하지 않습니다.
- 애플리케이션에서 빈을 선언하지 않으면 `SimpliXTokenAuthenticationSuccessHandler`와 `SimpliXTokenAuthenticationFailureHandler`가 해당 시도의 사용자 이름, 주소, 사용자 에이전트를 로그에 기록합니다.
- 웹 체인의 폼 로그인은 `authenticationSuccessHandler`와 `authenticationFailureHandler`라는 이름의 다른 빈을 사용합니다. [경로 보호](./securing-paths.md)를 참고하세요.

## 코드에서 토큰 다루기

`SimpliXJweTokenProvider`는 빈으로 등록되어 있습니다. `createTokenPair(username, clientIp, userAgent)`, `refreshTokens(refreshToken, remoteAddr, userAgent)`, `validateToken(token, remoteAddr, userAgent)`, `parseToken(token)`, `revokeToken(token)`을 제공합니다. 직접 구현한 로그인 흐름에서 토큰을 발급할 때 사용하세요.

## 관련 문서

- [토큰 폐기](./revoking-tokens.md)
- [키 교체](./rotating-keys.md)
- [애플리케이션 보안 적용](../../../docs/ko/securing-an-application.md)
