# Issuing and refreshing tokens

How a client obtains tokens, sends them, and keeps a session going. The tokens are JWE: their content is encrypted, so a client cannot read or change the claims.

## The endpoints

| Endpoint | Send | Answers |
|---|---|---|
| `POST /auth/token/issue` | user name and password as HTTP Basic | an access token and a refresh token |
| `POST /auth/token/refresh` | the refresh token in `X-Refresh-Token` | a new access token and refresh token |
| `POST /auth/token/revoke` | the access token as `Bearer`, the refresh token in `X-Refresh-Token`, or both | a `SimpliXApiResponse` |

```json
{
  "accessToken" : "<token>",
  "refreshToken" : "<token>",
  "accessTokenExpiry" : "<time with zone>",
  "refreshTokenExpiry" : "<time with zone>"
}
```

The endpoints are registered under whatever prefix the application gives its controllers: the token chain matches every path that contains `/auth/token/`, so `/api/v1/auth/token/issue` works the same way.

## Send the access token

```bash
curl -H "Authorization: Bearer <access token>" http://localhost:8080/api/catalog/author/search
```

The token filter also reads the access token from the cookie named by `simplix.auth.oauth2.cookie.access-token-name` (`access_token`), which is how a browser sends it after a social login.

## What a token holds

| Claim | Holds |
|---|---|
| `sub` | the user name |
| `jti` | the id of the token, used to revoke it |
| `iat`, `exp` | when it was issued and when it expires |
| `type` | `access` or `refresh` |
| `clientIp`, `userAgent` | where it was issued, for the optional checks below |

The header carries `alg` `RSA-OAEP-256`, `enc` `A256GCM` and, as `kid`, the version of the key that encrypted it.

## Renew before the access token expires

A refresh answers with a new pair. With rotation on, which is the default, and the blacklist on, the refresh token that was used is revoked: sending it a second time is answered with status 401. The access token issued before stays valid until it expires.

```json
{
  "type" : "ERROR",
  "message" : "You have been logged out",
  "timestamp" : "<time with zone>",
  "errorCode" : "AUTH_TOKEN_INVALID",
  "errorDetail" : "Your authentication has been revoked. Please log in again"
}
```

## Options

| Property | Default | Meaning |
|---|---|---|
| `simplix.auth.token.access-token-lifetime` | `1800` | seconds an access token is valid |
| `simplix.auth.token.refresh-token-lifetime` | `604800` | seconds a refresh token is valid |
| `simplix.auth.token.enable-token-rotation` | `true` | issues a new refresh token on every refresh |
| `simplix.auth.token.enable-ip-validation` | `false` | refuses a token sent from another IP address than it was issued to |
| `simplix.auth.token.enable-user-agent-validation` | `false` | refuses a token sent by another user agent |
| `simplix.auth.token.create-session-on-token-issue` | `true` | starts an HTTP session when tokens are issued, so the same browser can also open web pages |
| `simplix.auth.security.prefer-token-over-session` | `true` | when a request carries both a token and a session, authenticates by the token |

## React to a login attempt

After the issue endpoint checked the credentials, it calls the bean named `tokenAuthenticationSuccessHandler` or the bean named `tokenAuthenticationFailureHandler`. Declare beans with these names to record the last login of a member or to count failed attempts.

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

- The `response` argument is `null`. The controller writes the answer, so a handler only records.
- The failure handler receives the `AuthenticationException` of the attempt: a `BadCredentialsException` for a wrong password and for a request without the Basic header.
- Only the issue endpoint calls these beans. The refresh and revoke endpoints do not.
- Without beans of your own, `SimpliXTokenAuthenticationSuccessHandler` and `SimpliXTokenAuthenticationFailureHandler` log the user name, the address and the user agent of the attempt.
- The form login of the web chain uses other beans, named `authenticationSuccessHandler` and `authenticationFailureHandler`; see [Securing paths](./securing-paths.md).

## Work with tokens in code

`SimpliXJweTokenProvider` is a bean: `createTokenPair(username, clientIp, userAgent)`, `refreshTokens(refreshToken, remoteAddr, userAgent)`, `validateToken(token, remoteAddr, userAgent)`, `parseToken(token)` and `revokeToken(token)`. Use it to issue tokens from a login flow of your own.

## Related documents

- [Revoking tokens](./revoking-tokens.md)
- [Rotating keys](./rotating-keys.md)
- [Securing an application](../../../docs/en/securing-an-application.md)
