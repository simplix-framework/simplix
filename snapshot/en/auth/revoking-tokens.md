# Revoking tokens

How to make a token stop working before it expires. A token is valid by itself until its expiry time; to refuse it earlier the application keeps a blacklist of revoked token ids.

## Switch the blacklist on

```yaml
simplix:
  auth:
    token:
      enable-blacklist: true
```

Without it `POST /auth/token/revoke` answers success and the tokens keep working. With it, a revoked access token and refresh token are both answered with status 401 and `AUTH_TOKEN_INVALID`.

```bash
curl -X POST \
  -H "Authorization: Bearer <access token>" \
  -H "X-Refresh-Token: <refresh token>" \
  http://localhost:8080/auth/token/revoke
```

## Where the blacklist is kept

| `blacklist-store` | Store | Use it when |
|---|---|---|
| `AUTO` | Redis when a Redis connection exists, otherwise Caffeine, otherwise memory | the default |
| `REDIS` | Redis | several instances share the blacklist |
| `NATS` | a NATS key-value bucket, `simplix-auth-blacklist` by default | the instances already share NATS; needs a `Connection` bean |
| `CAFFEINE` | a local Caffeine cache | one instance |
| `MEMORY` | a map in memory | tests |

> ⚠ A local store is not shared: a token revoked on one instance keeps working on the others. Use Redis or NATS when more than one instance runs.

An entry is kept until the token would have expired, so the blacklist does not grow without bound. To keep it elsewhere, register a bean that implements `TokenBlacklistService` (`blacklist(jti, ttl)` and `isBlacklisted(jti)`).

## When the store cannot be reached

| `blacklist-failure-mode` | Behaviour |
|---|---|
| `FAIL_CLOSED` (default) | refuses every token: nobody uses a revoked token, and nobody can call the API until the store returns |
| `FAIL_OPEN` | accepts tokens and logs a warning: the API stays available, and a revoked token works meanwhile |

## Logout

The revoke endpoint calls a `LogoutHandler` bean when the application has one, for example to write an audit record. The web logout at `/logout` ends the session, deletes the token cookies and calls the same handler; a `LogoutSuccessHandler` bean replaces its redirect to the login page.

## Related documents

- [Issuing and refreshing tokens](en/auth/issuing-and-refreshing-tokens.md)
- [Monitoring authentication](en/auth/monitoring-authentication.md)
