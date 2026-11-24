# Configuration reference

Every property of the module, under `simplix.auth`.

## Module

| Property | Default | Meaning |
|---|---|---|
| `enabled` | `true` | switches the module's security configuration on |

## Encryption key

| Property | Default | Meaning |
|---|---|---|
| `jwe.encryption-key-location` | none | the location of the RSA key in JSON Web Key format, such as `classpath:keys/jwe-key.json` |
| `jwe.encryption-key` | none | the same key given inline |
| `jwe.algorithm` | `RSA-OAEP-256` | the key encryption algorithm |
| `jwe.encryption-method` | `A256GCM` | the content encryption method |
| `jwe.key-rolling.enabled` | `false` | keeps the keys in a `JweKeyStore` and rotates them |
| `jwe.key-rolling.key-size` | `2048` | the size of a generated RSA key, in bits |
| `jwe.key-rolling.auto-initialize` | `true` | creates the first key when the store is empty |
| `jwe.key-rolling.retention.buffer-seconds` | `86400` | added to the refresh token lifetime to set when a key expires |
| `jwe.key-rolling.retention.auto-cleanup` | `false` | deletes expired keys during a rotation |

## Tokens

| Property | Default | Meaning |
|---|---|---|
| `token.access-token-lifetime` | `1800` | seconds an access token is valid |
| `token.refresh-token-lifetime` | `604800` | seconds a refresh token is valid |
| `token.enable-token-rotation` | `true` | issues a new refresh token on every refresh |
| `token.enable-ip-validation` | `false` | refuses a token sent from another IP address |
| `token.enable-user-agent-validation` | `false` | refuses a token sent by another user agent |
| `token.create-session-on-token-issue` | `true` | starts an HTTP session when tokens are issued |
| `token.enable-blacklist` | `false` | refuses revoked tokens |
| `token.blacklist-store` | `AUTO` | `AUTO`, `REDIS`, `NATS`, `CAFFEINE` or `MEMORY` |
| `token.blacklist-nats-bucket` | `simplix-auth-blacklist` | the NATS key-value bucket |
| `token.blacklist-nats-max-retention` | 7 days | the longest an entry stays in the NATS bucket |
| `token.blacklist-failure-mode` | `FAIL_CLOSED` | `FAIL_CLOSED` or `FAIL_OPEN` when the store cannot be reached |

## Security

| Property | Default | Meaning |
|---|---|---|
| `security.enable-token-endpoints` | `true` | registers the token endpoints, the token filter and the token provider |
| `security.enable-web-security` | `true` | registers the web chain and the login page |
| `security.permit-all-patterns` | none | paths open without a login |
| `security.prefer-token-over-session` | `true` | authenticates by the token when a request carries a token and a session |
| `security.enable-cors` | `true` | applies the CORS settings |
| `security.enable-csrf` | `true` | CSRF protection on the web chain |
| `security.csrf-ignore-patterns` | `/api/token/**`, `/h2-console/**` | paths of the web chain exempt from CSRF |
| `security.enable-http-basic` | `false` | accepts HTTP Basic on the web chain |
| `security.require-https` | `false` | redirects the web chain to HTTPS |
| `security.enable-hsts` | `true` | sends `Strict-Transport-Security` |
| `security.hsts-max-age-seconds` | `31536000` | the `max-age` of that header |
| `security.login-page-template` | `login` | the Thymeleaf template of the login page |
| `security.login-page-path` | `/login` | the path of the login page |
| `security.login-processing-url` | `/login` | where the login form is posted |
| `security.logout-url` | `/logout` | the logout path |
| `security.content-security-policy` | a permissive policy | the `Content-Security-Policy` header |
| `security.frame-options` | `SAMEORIGIN` | `SAMEORIGIN` or `DENY` |
| `security.referrer-policy` | not sent | the `Referrer-Policy` header |
| `security.permissions-policy` | not sent | the `Permissions-Policy` header |

## CORS

| Property | Default | Meaning |
|---|---|---|
| `cors.allowed-origins` | none | exact origins a browser may call from |
| `cors.allowed-origin-patterns` | none | origin patterns such as `https://*.example.com`; take precedence over `allowed-origins` |
| `cors.allowed-methods` | none | the HTTP methods allowed |
| `cors.allowed-headers` | none | the request headers allowed |
| `cors.exposed-headers` | none | the response headers a script may read |
| `cors.allow-credentials` | none | whether cookies and authorization headers are allowed |
| `cors.max-age` | none | seconds a browser may cache the preflight answer |

## Social login

| Property | Default | Meaning |
|---|---|---|
| `oauth2.enabled` | `true` | social login, once an `OAuth2AuthenticationService` bean exists |
| `oauth2.success-url` | `/` | where a successful login is sent |
| `oauth2.failure-url` | `/login?error=social` | where a failed login is sent |
| `oauth2.link-success-url` | `/settings/social?linked=true` | where a successful link is sent |
| `oauth2.link-failure-url` | `/settings/social?error=link_failed` | where a failed link is sent |
| `oauth2.authorization-base-url` | `/oauth2/authorize` | the base of the sign-in links |
| `oauth2.login-base-url` | `/oauth2/login` | the base of the login-only links |
| `oauth2.register-base-url` | `/oauth2/register` | the base of the register-only links |
| `oauth2.link-base-url` | `/oauth2/link` | the base of the link-account links |
| `oauth2.callback-base-url` | `/oauth2/callback` | the base of the callback |
| `oauth2.email-conflict-policy` | `REJECT` | `REJECT` or `AUTO_LINK` |
| `oauth2.token-delivery-method` | `COOKIE` | `COOKIE`, `POST_MESSAGE` or `REDIRECT` |
| `oauth2.allowed-origins` | none | the origins that may receive tokens by `postMessage` |
| `oauth2.pending-registration-ttl-seconds` | `600` | how long a pending registration is kept |
| `oauth2.cookie.access-token-name` | `access_token` | the cookie of the access token |
| `oauth2.cookie.refresh-token-name` | `refresh_token` | the cookie of the refresh token |
| `oauth2.cookie.path` | `/` | the path of the cookies |
| `oauth2.cookie.http-only` | `true` | hides the cookies from scripts |
| `oauth2.cookie.secure` | `true` | sends the cookies over HTTPS only |
| `oauth2.cookie.same-site` | `Lax` | the `SameSite` attribute |

## Resource server

| Property | Default | Meaning |
|---|---|---|
| `resource-server.enabled` | `false` | accepts bearer JWTs of external issuers |
| `resource-server.path-patterns` | `/api/**` | the paths that need a token |
| `resource-server.issuers[].name` | required | a name for the issuer |
| `resource-server.issuers[].issuer-uri` | required | the `iss` of its tokens |
| `resource-server.issuers[].jwk-set-uri` | discovered | where the signing keys are |
| `resource-server.issuers[].audiences` | none | the accepted `aud` values |

## Signers

| Property | Default | Meaning |
|---|---|---|
| `stateless-token.secret` | a random key per start | the HMAC secret of `SimpliXStatelessTokenSigner` |
| `asymmetric-token.key-file` | none | the key file of `SimpliXAsymmetricTokenSigner` |
| `asymmetric-token.private-key`, `asymmetric-token.public-key` | none | the Ed25519 key pair as base64 DER |
| `asymmetric-token.key-id` | `default` | the key id written into tokens |

## Related documents

- [Securing paths](./securing-paths.md)
- [Issuing and refreshing tokens](./issuing-and-refreshing-tokens.md)
