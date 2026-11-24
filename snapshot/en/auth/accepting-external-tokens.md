# Accepting external tokens

How to protect the API with tokens another identity provider issues, such as Keycloak, Okta or Microsoft Entra ID. In resource-server mode the application issues no tokens of its own: it verifies the bearer JWT of each request against the issuers you trust.

## Before you begin

Add `org.springframework.boot:spring-boot-starter-oauth2-resource-server`: the mode is registered only when Spring Security's resource-server classes are on the classpath.

## Configure the issuers

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

| Property | Default | Meaning |
|---|---|---|
| `resource-server.enabled` | `false` | switches the mode on |
| `resource-server.path-patterns` | `/api/**` | the paths that need a token |
| `issuers[].name` | required | a name for the issuer, passed to your converter |
| `issuers[].issuer-uri` | required | the `iss` of its tokens; the keys are discovered from it |
| `issuers[].jwk-set-uri` | discovered | where the signing keys are, when discovery is not available |
| `issuers[].audiences` | none | the `aud` values a token must carry one of |

The chain is stateless and holds no session. Paths in `simplix.auth.security.permit-all-patterns` pass without a token. Switch the token endpoints and the web chain off, as the example does, since this application signs nobody in.

## Map the token to your user

By default the token itself is the principal. Register a `SimpliXJwtAuthenticationConverter` to resolve its subject to a local account, so that method security and auditing see your user. The signature, issuer, lifetime and audience are already checked when it runs.

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

## CORS rules of the resource server

The chain of the resource server takes its CORS rules from the bean named `corsConfigurationSource`. When no bean of that name exists, the module builds one from `simplix.auth.cors`. Declare a `CorsConfigurationSource` bean with that name to supply rules of your own.

## Related documents

- [Securing paths](en/auth/securing-paths.md)
- [Configuration reference](en/auth/configuration-reference.md)
