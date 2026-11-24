# 스트림 보안

연결 권한, 리소스별 구독 권한, 사용자가 접근 권한을 잃었을 때 세션을 종료하는 방법, 서버를 보호하는 제한을 설명합니다.

## 세션의 사용자

세션의 사용자는 연결 요청의 Spring Security 인증 이름 또는 연결 티켓을 발급받은 사용자입니다. 둘 다 없는 연결 요청은 사용자가 `null`인 세션을 생성합니다.

> ⚠ 모듈은 익명 세션을 거부하지 않습니다. `simplix.stream.security.require-authentication`은 읽는 코드가 없어 효과가 없습니다. 익명 세션은 애플리케이션에서 접근을 결정하는 위치에서 거부하세요. `/api/stream/**`에 인증을 적용하고, 티켓을 위해 연결 경로를 허용한 경우에는 모든 권한 검사기에서 `null` 사용자를 거부하고 `enforce-authorization`을 지정하세요.

## 구독 권한 결정

```java
@Component
public class ShelfOccupancyAuthorizer implements ResourceAuthorizer {

    @Override
    public String getResource() {
        return "shelf-occupancy";
    }

    @Override
    public boolean authorize(String userId, Map<String, Object> params) {
        return userId != null && !"staff-room".equals(params.get("shelfId"));
    }

    @Override
    public String getDenialReason(String userId, Map<String, Object> params) {
        return "Shelf " + params.get("shelfId") + " is not open to " + userId;
    }
}
```

`ResourceAuthorizer` 빈은 담당 리소스의 구독 권한을 결정합니다. `StreamAuthorizationService`는 구독 요청의 항목마다 세션의 사용자와 항목의 매개변수로 이 빈을 호출하고, 결과를 `AuthorizationResult`로 반환합니다.

| 메서드 | 기본값 | 의미 |
|---|---|---|
| `getResource()` | 필수 | 이 검사기가 담당하는 리소스. 리소스마다 검사기는 하나입니다 |
| `authorize(userId, params)` | 필수 | `true`이면 구독을 허용합니다. 예외가 발생하면 거부합니다 |
| `getDenialReason(userId, params)` | `Access denied to resource: <resource>` | 클라이언트가 `failed`에서 확인하는 `reason` |
| `getRequiredPermission()` | `null` | 참고용 값입니다. 서비스는 이 값을 반환할 뿐 검사하지 않습니다 |

```json
{
  "success" : true,
  "subscribed" : [ ],
  "failed" : [ {
    "resource" : "shelf-occupancy",
    "params" : { "shelfId" : "staff-room" },
    "reason" : "Shelf staff-room is not open to alice"
  } ],
  "totalCount" : 0
}
```

권한 검사기가 없는 리소스는 모든 세션이 구독할 수 있습니다. 공개 데이터가 아니면 기본 동작을 반대로 설정하세요.

```yaml
simplix:
  stream:
    security:
      enforce-authorization: true
```

`enforce-authorization`을 지정하면 권한 검사기가 없는 리소스의 구독은 `No authorizer configured for resource: <resource>` 사유로 실패합니다.

## 접근 권한을 잃은 사용자의 세션 종료

```java
@Component
@RequiredArgsConstructor
public class MemberSessionValidator implements SessionValidator {

    private final MemberStatusLookup memberStatusLookup;

    @Override
    public SessionValidationResult validate(StreamSession session) {
        if (memberStatusLookup.isSuspended(session.getUserId())) {
            return SessionValidationResult.invalid("Member is suspended");
        }
        return SessionValidationResult.ok();
    }
}
```

스트림은 연결 요청의 인증 시점 이후에도 오랫동안 유지됩니다. `SessionValidator` 빈은 하트비트 전송 전마다 세션을 계속 유지할 수 있는지 판정합니다. `SessionValidationResult.invalid(reason)`을 반환하면 클라이언트는 사유가 포함된 `session_terminated`를 받고 세션이 종료됩니다.

```text
id:1795540618684
event:session_terminated
data:{
data:  "type" : {
data:    "type" : "MessageType",
data:    "value" : "SESSION_TERMINATED"
data:  },
data:  "timestamp" : "2026-11-25T02:16:58.684+09:00",
data:  "message" : "Member is suspended"
data:}
```

- 빈을 선언하지 않으면 모든 세션이 유효합니다.
- 검사는 전용 스레드 풀에서 실행되며 `session.validation-timeout`(기본 5초) 안에 끝나야 합니다. 이 시간을 초과한 검사는 해당 하트비트를 건너뛰며 세션을 종료하지 않습니다.
- 연결 요청의 액세스 토큰은 `bearerToken`이라는 임시 메타데이터로 세션에 보관되므로, 검증기에서 토큰의 폐기 여부를 확인할 수 있습니다. 이 값은 데이터베이스에 저장되지 않습니다.

검증기가 받는 `StreamSession`은 다음 메서드를 제공합니다.

| 메서드 | 반환값 |
|---|---|
| `getId()` | 클라이언트가 받은 세션 ID |
| `getUserId()` | 세션의 사용자. 익명 세션에는 사용자가 없습니다 |
| `getTransportType()` | `TransportType.SSE` 또는 `TransportType.WEBSOCKET` |
| `getConnectedAt()` | 세션을 연 시각 |
| `getState()`, `isConnected()`, `isTerminated()` | `SessionState` 값인 `CONNECTED`, `DISCONNECTED`, `TERMINATED` |
| `getSubscriptions()`, `getSubscriptionCount()`, `hasSubscription(key)` | 세션이 보유한 `SubscriptionKey` 목록과 개수, 특정 키의 보유 여부 |

## 제한

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.stream.session.max-per-user` | `5` | 사용자 한 명의 최대 세션 수. 한도를 넘는 연결이 들어오면 해당 사용자의 가장 오래된 세션을 종료합니다. 익명 세션은 모두 한 사용자로 계산합니다 |
| `simplix.stream.subscription.max-per-session` | `20` | 세션별 최대 구독 수 |
| `simplix.stream.scheduler.max-total-schedulers` | `500` | 동시에 수집하는 구독 키 수 |
| `simplix.stream.send.queue-capacity` | `256` | 클라이언트 하나에 대기할 수 있는 메시지 수. 초과하면 세션을 종료합니다 |

## 관리 API

`/api/stream/admin` 아래의 엔드포인트는 모든 사용자의 세션을 조회하고 종료하며, 모듈은 이 경로에 접근 규칙을 적용하지 않습니다. [simplix-auth](../../../simplix-auth/README.ko.md)의 설명에 따라 애플리케이션의 보안 설정에서 이 경로를 관리자만 접근하도록 제한하세요. 엔드포인트 목록은 [스트림 관리](./managing-streams.md)에 있습니다.

## 관련 문서

- [클라이언트 연결](./connecting-clients.md)
- [스트림 관리](./managing-streams.md)
- [문제 해결](./troubleshooting.md)
