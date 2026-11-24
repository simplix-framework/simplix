# Securing paths

Which requests need a login, how a caller proves who they are on each kind of path, and how to open paths, allow browser origins and set the security headers.

## The security chains

| Paths | Authentication | Session | A caller without credentials receives |
|---|---|---|---|
| paths containing `/auth/token/` | the endpoint checks the credentials it is sent | created when tokens are issued | status 401 as JSON |
| `/api/**` | the access token, as `Authorization: Bearer` or the token cookie | used when the request has no token | status 401 as JSON |
| every other path | the login form at `/login` | yes | a redirect to the login page |

The chains are registered once the application provides a `SimpliXUserDetailsService`. `simplix.auth.security.enable-token-endpoints: false` removes the first and the token filter, and `enable-web-security: false` removes the last.

### Add a chain of your own

Spring Security asks the chains in the order of their `@Order` value and uses the first one whose matcher accepts the request.

| Chain | Bean | Order |
|---|---|---|
| token endpoints | `tokenSecurityFilterChain` | 50 |
| social login paths, when social login is configured | `oauth2SecurityFilterChain` | 90 |
| `/api/**` | `apiSecurityFilterChain` | 100 |
| paths of the resource server, when it is enabled | `resourceServerSecurityFilterChain` | 100 |
| every other path | `webSecurityFilterChain` | 102 |

A `SecurityFilterChain` bean of your application needs a `securityMatcher` and an order below the chain it should precede.

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

With this chain, `GET /api/partner/ping` without a token is answered with status 200, while the other paths under `/api` still answer 401. A chain with an order above 102 comes after the web chain, which accepts every request, and the application does not start: `UnreachableFilterChainException: A filter chain that matches any request [...] has already been configured`.

## Open paths and adjust the rules

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

### Paths open without a login

The web chain always opens the login page, the login and logout URLs, `/error`, `/`, static resources (`/css/**`, `/js/**`, `/images/**`, `/webjars/**`, `/favicon.ico`, `/vendor/**`), `/h2-console/**`, `/actuator/**` and `/.well-known/appspecific/**`. `permit-all-patterns` adds to them. A pattern that starts with `/api/` or names the API document also opens the path on the API chain.

### Browser clients from another origin

A browser application served from another origin needs that origin in `simplix.auth.cors.allowed-origins`. Use `allowed-origin-patterns` for wildcards such as `https://*.example.com`; patterns work together with `allow-credentials: true`, and take precedence over `allowed-origins` when both are set.

### CSRF

CSRF protection applies to the web chain, where a session cookie authenticates the caller. The token and API chains do not use it. `csrf-ignore-patterns` exempts paths of the web chain, and `enable-csrf: false` switches it off.

### HTTPS and headers

| Property | Default | Meaning |
|---|---|---|
| `require-https` | `false` | redirects every request of the web chain to HTTPS |
| `enable-hsts`, `hsts-max-age-seconds` | `true`, one year | sends `Strict-Transport-Security`; the header is sent over HTTPS only |
| `frame-options` | `SAMEORIGIN` | `DENY` forbids every frame |
| `content-security-policy` | a permissive policy | the `Content-Security-Policy` header; set a strict one in production |
| `referrer-policy`, `permissions-policy` | not sent | the headers of the same names |
| `enable-http-basic` | `false` | accepts HTTP Basic on the web chain |

## The login page

The web chain serves a login page at `login-page-path` (`/login`) from the Thymeleaf template named by `login-page-template` (`login`), and processes the form at `login-processing-url`. Beans named `authenticationSuccessHandler` and `authenticationFailureHandler` replace what happens after a login attempt.

## Permissions on methods

Method security is on: `@PreAuthorize`, `@PostAuthorize`, `@Secured` and `@RolesAllowed` work on any bean. A `PermissionEvaluator` bean of the application answers `hasPermission(...)`; without one every such check fails. [Securing an application](../../../docs/en/securing-an-application.md) shows an evaluator.

`SimpliXUserDetailsService` also has default methods an application can override: `exists`, `loadCurrentUser`, `isAccountLocked`, `isAccountExpired`, `isCredentialsExpired`, `getUserAuthorities`, `hasAuthority` and `hasRole`.

## Switch the module off

`simplix.auth.enabled: false` removes the module's security configuration. The [starter](../../../spring-boot-starter-simplix/README.md) then registers a chain that permits every request, which suits a service that sits behind a gateway that authenticates.

## Related documents

- [Configuration reference](./configuration-reference.md)
- [Securing an application](../../../docs/en/securing-an-application.md)
