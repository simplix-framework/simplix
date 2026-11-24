# Troubleshooting

Failures of a login or a token, by what you see.

## The application does not start

| Message | Cause | Fix |
|---|---|---|
| `Security key is not configured. Please set simplix.auth.jwt.secret-key` | no encryption key; the property the message names does not exist | set `simplix.auth.jwe.encryption-key-location`, or switch key rolling on |
| `Failed to load security key from ...` | the key file is not at that location | check the path and that the file is on the classpath |
| `NoClassDefFoundError: org/springframework/security/oauth2/client/...` | an `OAuth2AuthenticationService` bean without the OAuth2 client library | add `spring-boot-starter-oauth2-client` |
| `No qualifying bean of type 'ClientRegistrationRepository'` | social login is active and no provider is registered | configure at least one `spring.security.oauth2.client.registration` |

## A call is refused

| Symptom | Cause | Fix |
|---|---|---|
| every path answers 401 with an empty body | no `SimpliXUserDetailsService` bean, so the module is not active | register the bean |
| issue answers 401 with `AUTH_INVALID_CREDENTIALS` | wrong credentials, or a hash the `PasswordEncoder` bean did not make | store hashes made by the registered encoder |
| an API call with a valid token is redirected to `/login` | the path is outside `/api/` | serve the controller under `/api` |
| 401 with `AUTH_TOKEN_INVALID` and "Token authentication failed" | the token is malformed, or was encrypted with a key this instance does not have | check that every instance uses the same key; in key rolling mode remove the static key |
| 401 with `AUTH_TOKEN_INVALID` and "You have been logged out" | the token was revoked, or a refresh token was used a second time | sign in again; keep only the newest refresh token |
| 403 with `AUTHZ_INSUFFICIENT_PERMISSIONS` for every user | no `PermissionEvaluator` bean | register one |
| a token stops working when the user changes network | `enable-ip-validation` is on | switch it off for mobile clients |

## A browser client fails

| Symptom | Cause | Fix |
|---|---|---|
| a missing `Access-Control-Allow-Origin` | the origin is not allowed | add it to `simplix.auth.cors.allowed-origins` |
| a logout does not stop the token | the blacklist is off | set `simplix.auth.token.enable-blacklist: true` |
| a revoked token still works on another instance | the blacklist is kept locally | use `blacklist-store: REDIS` or `NATS` |
| a social login returns to `/login?error=social` | the provider in the link has no registration, or the provider refused the login | check the registration id and the redirect URI entered at the provider |

## Related documents

- [Getting started](./getting-started.md)
- [Monitoring authentication](./monitoring-authentication.md)
