# 데이터 수집

수집기 작성 방법, 호출 주기, 매개변수, 실패했을 때의 동작을 설명합니다.

## 수집기 인터페이스

`SimpliXStreamDataCollector`를 구현한 모든 Spring 빈은 리소스 이름으로 `SimpliXStreamDataCollectorRegistry`에 등록됩니다.

| 메서드 | 기본값 | 의미 |
|---|---|---|
| `getResource()` | 필수 | 클라이언트가 구독하는 이름. 이름마다 수집기는 하나입니다 |
| `collect(params)` | 필수 | 전송할 데이터를 반환합니다. `data` 메시지의 `payload`로 직렬화됩니다 |
| `getDefaultIntervalMs()` | `1000` | `collect` 호출 주기(밀리초) |
| `getMinIntervalMs()` | `100` | 수집기가 허용하는 최소 주기 |
| `validateParams(params)` | `true` | 효과가 없습니다. 이 메서드를 호출하는 코드가 없습니다. 매개변수는 `ResourceAuthorizer`에서 검사하세요 |
| `getRequiredPermission()` | `null` | 효과가 없습니다. 이 메서드를 호출하는 코드가 없습니다. 권한은 `ResourceAuthorizer`에서 검사하세요 |

사용되지 않는 메서드 대신 사용하는 권한 검사기는 [스트림 보안](./securing-streams.md)에서 설명합니다.

## 주기

구독의 주기는 `getDefaultIntervalMs()`, `getMinIntervalMs()`, `simplix.stream.scheduler.min-interval` 중 가장 큰 값입니다. 이 값은 `scheduler.min-interval`과 `scheduler.max-interval` 사이로 제한됩니다. 클라이언트는 주기를 지정할 수 없으며, 구독 응답의 `intervalMs`로 적용된 주기를 확인합니다.

## 매개변수와 구독 키

구독은 리소스와 매개변수의 조합입니다. 모듈은 이 조합을 `SubscriptionKey`로 변환합니다. 형식은 리소스 이름 뒤에 매개변수의 해시를 추가한 `shelf-occupancy:3b02a4c3`입니다. 같은 리소스와 같은 매개변수로 구독한 세션은 키를 공유하며, 수집기는 주기마다 한 번만 호출됩니다.

`collect`가 받는 매개변수는 연결 요청의 쿼리 매개변수에 구독의 `params`를 덮어쓴 값입니다. `/connect?branchId=b1`로 연결한 세션의 모든 구독에는 `branchId`가 포함됩니다. 연결 티켓도 쿼리 매개변수이므로, 티켓으로 연결한 세션의 모든 키에는 `ticket` 매개변수가 포함되고 해당 세션의 키는 다른 세션과 공유되지 않습니다.

> ⚠ `params`가 없는 구독의 키는 `<resource>:empty`입니다. `collect`에서는 매개변수가 없는 경우를 처리하세요. 지정하지 않은 매개변수는 `null`로 전달됩니다.

## 수집 실패

`collect`에서 발생한 예외는 로그에 기록되고, 구독자는 코드 `SCHEDULER_ERROR`와 예외 메시지가 포함된 `error` 메시지를 받습니다. 다음 주기에 수집기를 다시 호출합니다. 연속 실패 횟수는 `scheduler.max-consecutive-errors`와 비교하며, 이 횟수에 도달하면 [관리 API](./managing-streams.md)에서 조회하는 스케줄러 상태가 `ERROR`로 바뀝니다.

## 제한

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.stream.scheduler.max-total-schedulers` | `500` | 동시에 수집하는 구독 키 수. 한도를 넘는 키는 수집하지 않고 경고를 로그에 기록합니다 |
| `simplix.stream.scheduler.thread-pool-size` | `10` | 수집기와 하트비트를 실행하는 스레드 수 |
| `simplix.stream.subscription.max-per-session` | `20` | 세션별 최대 구독 수. 이보다 긴 목록은 `BIZ_QUOTA_EXCEEDED`로 거부합니다 |

`collect`는 짧게 유지하세요. 응답이 느린 서비스를 기다리는 수집기는 그 시간 동안 스케줄러 스레드 하나를 점유합니다. 비용이 큰 결과는 캐시하거나, 변경 사항을 이벤트로 발행하세요([이벤트 스트리밍](./streaming-events.md)).

## 관련 문서

- [이벤트 스트리밍](./streaming-events.md)
- [스트림 보안](./securing-streams.md)
- [설정 레퍼런스](./configuration-reference.md)
