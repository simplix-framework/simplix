# How simplix-auth works

The parts of the module, when each is registered and what happens to a request. Read it before replacing a part or when a request is answered in a way the guides do not explain.

## What is registered, and when

| Auto-configuration | Registers | Active when |
|---|---|---|
| `SimpliXAuthAutoConfiguration` | the security configuration `SimpliXAuthSecurityConfiguration`, method security through `SimpliXAuthMethodSecurityConfiguration`, the token provider, the token filter and the controllers | `simplix.auth.enabled` is not `false` and a `SimpliXUserDetailsService` bean exists |
| `SimpliXJweKeyAutoConfiguration` | the `JweKeyProvider`: `StaticJweKeyProvider` for a configured key, `DatabaseJweKeyProvider` with `JweKeyRotationService` for key rolling | always; key rolling needs `key-rolling.enabled` and a `JweKeyStore` bean |
| `SimpliXOAuth2AutoConfiguration` | social login through `SimpliXOAuth2Configuration`: the user services, the handlers, the intent filter and the linking controller | `simplix.auth.oauth2.enabled` is not `false`, the OAuth2 client library is on the classpath and an `OAuth2AuthenticationService` bean exists |
| `OAuth2ClientFilteringAutoConfiguration` | `OAuth2ClientFilteringBeanPostProcessor`, which drops registrations whose client id is empty before Spring validates them | the OAuth2 client library is on the classpath |
| `SimpliXResourceServerAutoConfiguration` | a stateless chain that accepts bearer tokens of the trusted issuers, built by `TrustedIssuerAuthenticationManagers` and checked by `AudienceValidator` | `simplix.auth.resource-server.enabled` is `true` and the resource server library is on the classpath |
| `SimpliXStatelessTokenAutoConfiguration` | `SimpliXStatelessTokenSigner` and `SimpliXAsymmetricTokenSigner` | their secret or key is configured, whether or not `simplix.auth.enabled` is on |
| `SimpliXAuthMetricsAutoConfiguration` | `AuthenticationMetrics` and the gauge of the blacklist size | Micrometer is on the classpath |
| `SimpliXAuthOpenApiConfiguration` | the bearer scheme of the API document | the token endpoints are registered |

Before any of this, `SimpliXAuthEnvironmentPostProcessor` adds defaults to the environment with the lowest precedence. One of them reaches outside the module: `server.servlet.session.timeout` becomes `30m` unless the application sets it.

## What happens to a request

| Request | Handled by | Outcome |
|---|---|---|
| `POST /auth/token/issue` | `SimpliXAuthTokenController`, which checks the Basic credentials through your `SimpliXUserDetailsService` | a `SimpliXJweTokenProvider.TokenResponse` with the tokens and their expiry times |
| a path under `/api` with a bearer token | `SimpliXTokenAuthenticationFilter`, which decrypts the token, checks its expiry and the blacklist, and sets the authentication | the controller runs as the user of the token |
| a path under `/api` without valid credentials | `SimpliXAuthenticationEntryPoint` | a 401 JSON answer with an `AUTH_` code |
| a call the user may not make | `SimpliXAccessDeniedHandler`, or the exception handler of the starter for method security | a 403 JSON answer with an `AUTHZ_` code |
| any other path | the web chain with form login; `SimpliXAuthLoginController` serves the login page | a redirect to the login page, or the page for a signed-in session |

After a login attempt, the issue endpoint calls the beans named `tokenAuthenticationSuccessHandler` and `tokenAuthenticationFailureHandler`. The defaults, `SimpliXTokenAuthenticationSuccessHandler` and `SimpliXTokenAuthenticationFailureHandler`, write a log entry; [Issuing and refreshing tokens](en/auth/issuing-and-refreshing-tokens.md) shows how to replace them. Every chain takes its CORS rules from `SimpliXCorsConfigurations`, built from `simplix.auth.cors`.

## Where revoked tokens are kept

| Store | Class | Fits |
|---|---|---|
| `MEMORY` | `InMemoryTokenBlacklistService` | development; the list is lost on restart |
| `CAFFEINE` | `CaffeineTokenBlacklistService` | one instance; entries expire with their tokens |
| `REDIS` | `RedisTokenBlacklistService` | several instances that share Redis |
| `NATS` | `NatsTokenBlacklistService` | several instances that share a NATS JetStream key-value bucket |

`BlacklistHealthIndicator` reports the store under `blacklist` in the health endpoint. A `BlacklistProbe`, such as `RedisBlacklistProbe`, asks the store directly, so an outage shows up even when the failure mode lets requests through.

## How a social login runs

1. `OAuth2IntentFilter` takes `/oauth2/login/{provider}` and `/oauth2/register/{provider}`, stores the intent in the session and redirects to the authorization endpoint. `OAuth2UnknownRegistrationFilter` sends a provider without a registration to the failure URL instead of an error page.
2. Spring Security runs the exchange with the provider. `SimpliXOidcUserService` loads the profile of an OpenID Connect provider and `SimpliXOAuth2UserService` that of the others.
3. `OAuth2UserInfoExtractor` picks the `OAuth2UserInfoExtractorStrategy` of the provider and turns the profile into an `OAuth2UserInfo`.
4. `OAuth2LoginSuccessHandler` calls your `OAuth2AuthenticationService`, issues tokens and delivers them; `OAuth2LoginFailureHandler` redirects to the failure URL with an error code taken from the `OAuth2AuthenticationException`.
5. A link request goes through `SimpliXOAuth2Controller`, which remembers the signed-in user before the redirect.

An application that configures security by hand imports the same beans with `@EnableSimplixOAuth2` on a configuration class.

## Exceptions of the module

| Exception | Thrown when |
|---|---|
| `TokenValidationException` | a token is malformed, expired, revoked or fails the IP or User-Agent check |
| `JweKeyException` | a key cannot be loaded, decrypted, rotated or stored |
| `OAuth2AuthenticationException` | a social login fails; it carries an error code for the client |

## Related documents

- [Securing paths](en/auth/securing-paths.md)
- [Configuration reference](en/auth/configuration-reference.md)
- [Troubleshooting](en/auth/troubleshooting.md)
