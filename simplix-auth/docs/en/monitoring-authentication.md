# Monitoring authentication

What the module reports about logins and tokens: audit events for your own log or table, Micrometer metrics, a health indicator, and request ids in the log.

## Audit events

Register a bean that implements `TokenAuditEventPublisher` to receive the events.

```java
@Component
@Slf4j
public class TokenAuditLog implements TokenAuditEventPublisher {

    @Override
    public void publishTokenValidationFailed(TokenAuditEvent event) {
        log.warn("token refused: {} from {}", event.failureReason(), event.clientIp());
    }

    @Override
    public void publishTokenRevoked(TokenAuditEvent event) {
        log.info("token revoked by {}", event.username());
    }

    @Override
    public void publishBlacklistedTokenUsed(String jti, String username, String clientIp) {
        log.warn("revoked token used by {} from {}", username, clientIp);
    }

    // The remaining methods of the interface are implemented the same way.
}
```

| Method | Called when |
|---|---|
| `publishTokenValidationFailed` | a token is refused; `failureReason()` says why |
| `publishTokenRefreshSuccess`, `publishTokenRefreshFailed` | a refresh succeeds or fails |
| `publishTokenRevoked` | a token is revoked |
| `publishTokenBlacklisted` | a token id is added to the blacklist |
| `publishBlacklistedTokenUsed` | a revoked token is sent again |
| `publishTokenIssueSuccess`, `publishTokenIssueFailed` | declared for token issue; the token endpoint does not call them |

A `TokenAuditEvent` holds the user name, the token id, the failure reason, the client IP, the user agent and the token type. The reasons are `TOKEN_EXPIRED`, `TOKEN_REVOKED`, `INVALID_SIGNATURE`, `MALFORMED_TOKEN`, `IP_MISMATCH`, `USER_AGENT_MISMATCH` and others listed in `TokenFailureReason`.

## Metrics

With a `MeterRegistry` in the application, `AuthenticationMetrics` records these meters.

| Meter | Type | Counts |
|---|---|---|
| `simplix.auth.token.issued` | counter | tokens issued |
| `simplix.auth.token.validation` | timer | token validations and how long they take |
| `simplix.auth.token.validation.failure` | counter | tokens refused |
| `simplix.auth.login.attempts` | counter | login attempts |
| `simplix.auth.key.rotation` | counter | key rotations |

## Health of the blacklist

With the blacklist on and Spring Boot Actuator present, `/actuator/health` includes a `blacklist` component that reports which store is in use and whether it answers. For Redis the indicator asks the connection directly, so a failure is reported even in `FAIL_OPEN` mode.

## Request ids in the log

`AuthRequestCorrelationFilter` puts `requestId`, `sessionId` and, once the request is authenticated, `username` into the logging context (MDC). Add them to the log pattern, for example `%X{requestId} %X{username}`.

## Log

The module writes its log under the logger `dev.simplecore.simplix.auth`. The default handlers of the issue endpoint write `Token authentication successful - username: ..., IP: ..., User-Agent: ...` at `INFO` and `Token authentication failed - username: ..., IP: ..., User-Agent: ..., reason: ...` at `WARN`. Set the level of the logger to see more:

```yaml
logging:
  level:
    dev.simplecore.simplix.auth: DEBUG
```

## Related documents

- [Revoking tokens](./revoking-tokens.md)
- [Handling errors](../../../spring-boot-starter-simplix/docs/en/handling-errors.md)
