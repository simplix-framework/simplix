# 인증 모니터링

모듈이 로그인과 토큰에 관해 제공하는 정보를 설명합니다. 자체 로그나 테이블에 기록할 감사 이벤트, Micrometer 지표, 상태 지표, 로그의 요청 ID를 다룹니다.

## 감사 이벤트

`TokenAuditEventPublisher`를 구현한 빈을 등록하면 이벤트를 받습니다.

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

| 메서드 | 호출 시점 |
|---|---|
| `publishTokenValidationFailed` | 토큰을 거부했을 때. `failureReason()`으로 사유를 확인합니다 |
| `publishTokenRefreshSuccess`, `publishTokenRefreshFailed` | 갱신에 성공하거나 실패했을 때 |
| `publishTokenRevoked` | 토큰을 폐기했을 때 |
| `publishTokenBlacklisted` | 토큰 식별자를 블랙리스트에 추가했을 때 |
| `publishBlacklistedTokenUsed` | 폐기한 토큰이 다시 전송되었을 때 |
| `publishTokenIssueSuccess`, `publishTokenIssueFailed` | 토큰 발급용으로 선언되어 있으나, 토큰 엔드포인트는 호출하지 않습니다 |

`TokenAuditEvent`에는 사용자 이름, 토큰 식별자, 실패 사유, 클라이언트 IP, 사용자 에이전트, 토큰 타입이 들어 있습니다. 사유는 `TOKEN_EXPIRED`, `TOKEN_REVOKED`, `INVALID_SIGNATURE`, `MALFORMED_TOKEN`, `IP_MISMATCH`, `USER_AGENT_MISMATCH` 등이며, 전체 목록은 `TokenFailureReason`에 있습니다.

## 지표

애플리케이션에 `MeterRegistry`가 있으면 `AuthenticationMetrics`가 다음 지표를 기록합니다.

| 지표 | 종류 | 집계 대상 |
|---|---|---|
| `simplix.auth.token.issued` | 카운터 | 발급한 토큰 |
| `simplix.auth.token.validation` | 타이머 | 토큰 검증 횟수와 소요 시간 |
| `simplix.auth.token.validation.failure` | 카운터 | 거부한 토큰 |
| `simplix.auth.login.attempts` | 카운터 | 로그인 시도 |
| `simplix.auth.key.rotation` | 카운터 | 키 교체 |

## 블랙리스트 상태

블랙리스트가 켜져 있고 Spring Boot Actuator가 있으면, `/actuator/health`에 사용 중인 저장소와 응답 여부를 보고하는 `blacklist` 컴포넌트가 포함됩니다. Redis는 연결을 직접 확인하므로 `FAIL_OPEN` 모드에서도 장애가 보고됩니다.

## 로그의 요청 ID

`AuthRequestCorrelationFilter`는 `requestId`, `sessionId`와, 요청이 인증된 뒤에는 `username`을 로깅 컨텍스트(MDC)에 기록합니다. 로그 패턴에 `%X{requestId} %X{username}`처럼 추가하세요.

## 관련 문서

- [토큰 폐기](./revoking-tokens.md)
- [오류 처리](../../../spring-boot-starter-simplix/docs/ko/handling-errors.md)
