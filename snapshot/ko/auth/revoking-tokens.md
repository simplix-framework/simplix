# 토큰 폐기

토큰이 만료되기 전에 사용할 수 없게 하는 방법을 설명합니다. 토큰은 만료 시각까지 자체적으로 유효하므로, 그 전에 거부하려면 폐기한 토큰 식별자의 블랙리스트를 유지해야 합니다.

## 블랙리스트 활성화

```yaml
simplix:
  auth:
    token:
      enable-blacklist: true
```

블랙리스트가 꺼져 있으면 `POST /auth/token/revoke`가 성공으로 응답해도 토큰을 계속 사용할 수 있습니다. 켜져 있으면 폐기한 액세스 토큰과 리프레시 토큰에 모두 상태 코드 401과 `AUTH_TOKEN_INVALID`로 응답합니다.

```bash
curl -X POST \
  -H "Authorization: Bearer <access token>" \
  -H "X-Refresh-Token: <refresh token>" \
  http://localhost:8080/auth/token/revoke
```

## 블랙리스트 저장 위치

| `blacklist-store` | 저장소 | 사용하는 경우 |
|---|---|---|
| `AUTO` | Redis 연결이 있으면 Redis, 없으면 Caffeine, 그것도 없으면 메모리 | 기본값 |
| `REDIS` | Redis | 여러 인스턴스가 블랙리스트를 공유할 때 |
| `NATS` | NATS 키-값 버킷(기본 이름 `simplix-auth-blacklist`) | 인스턴스가 이미 NATS를 공유할 때. `Connection` 빈이 필요합니다 |
| `CAFFEINE` | 로컬 Caffeine 캐시 | 인스턴스가 하나일 때 |
| `MEMORY` | 메모리의 맵 | 테스트 |

> ⚠ 로컬 저장소는 공유되지 않습니다. 한 인스턴스에서 폐기한 토큰을 다른 인스턴스에서는 계속 사용할 수 있습니다. 인스턴스가 여러 개이면 Redis나 NATS를 사용하세요.

항목은 토큰의 원래 만료 시각까지만 보관하므로 블랙리스트가 계속 커지지 않습니다. 다른 저장소를 사용하려면 `TokenBlacklistService`(`blacklist(jti, ttl)`, `isBlacklisted(jti)`)를 구현한 빈을 등록하세요.

## 저장소에 연결할 수 없을 때

| `blacklist-failure-mode` | 동작 |
|---|---|
| `FAIL_CLOSED`(기본값) | 모든 토큰을 거부합니다. 폐기한 토큰은 사용할 수 없지만, 저장소가 복구될 때까지 API를 호출할 수 없습니다 |
| `FAIL_OPEN` | 토큰을 허용하고 경고를 기록합니다. API는 계속 사용할 수 있지만, 그동안 폐기한 토큰도 사용할 수 있습니다 |

## 로그아웃

애플리케이션에 `LogoutHandler` 빈이 있으면 폐기 엔드포인트가 이 빈을 호출합니다. 감사 기록을 남길 때 사용할 수 있습니다. `/logout`의 웹 로그아웃은 세션을 종료하고 토큰 쿠키를 삭제한 뒤 같은 핸들러를 호출합니다. `LogoutSuccessHandler` 빈을 등록하면 로그인 페이지로의 리다이렉트를 대체합니다.

## 관련 문서

- [토큰 발급과 갱신](ko/auth/issuing-and-refreshing-tokens.md)
- [인증 모니터링](ko/auth/monitoring-authentication.md)
