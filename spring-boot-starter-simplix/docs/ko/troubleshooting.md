# 스타터 문제 해결

스타터를 사용할 때 발생하는 증상과 원인, 조치를 정리합니다. 로그인과 토큰 문제는 [simplix-auth 문제 해결](../../../simplix-auth/docs/ko/troubleshooting.md)에 있습니다.

## 애플리케이션 시작

| 증상 | 원인 | 조치 |
|---|---|---|
| 애플리케이션이 시작되지 않고 로그에 토큰 암호화 키가 언급됨 | JWE 키가 설정되어 있지 않습니다 | 키를 생성하고 `simplix.auth.jwe.encryption-key-location`을 지정하세요. [시작하기](../../../docs/ko/getting-started.md)를 참고하세요 |
| 생성한 컨트롤러의 모든 엔드포인트가 `AUTHZ_INSUFFICIENT_PERMISSIONS`와 함께 403으로 응답함 | `hasPermission`을 판정할 `PermissionEvaluator` 빈이 없습니다 | `PermissionEvaluator` 빈을 선언하세요. [애플리케이션 보안 적용](../../../docs/ko/securing-an-application.md)을 참고하세요 |
| 모듈의 엔티티나 저장소를 찾지 못함 | 해당 패키지가 애플리케이션 클래스의 스캔 범위 밖에 있습니다 | `@EntityScan`과 `@EnableJpaRepositories`에 패키지를 지정하고 `repositoryFactoryBeanClass = SimpliXRepositoryFactoryBean.class`를 유지하세요 |

## 요청과 응답

| 증상 | 원인 | 조치 |
|---|---|---|
| 유효한 토큰으로 요청했는데 401로 응답됨 | 경로가 토큰을 확인하는 `/api` 아래에 있지 않습니다 | REST 컨트롤러를 `/api` 아래에서 제공하세요. [애플리케이션 보안 적용](../../../docs/ko/securing-an-application.md)을 참고하세요 |
| 직접 작성한 컨트롤러의 응답에 `type`, `body`, `timestamp` 형식이 없음 | 일반 반환 값은 감싸지 않습니다 | `SimpliXApiResponse.success(...)`를 반환하세요 |
| API 문서에는 감싼 형식으로 표시되지만 실제 응답은 그렇지 않음 | `generic-response.auto-wrap`이 일반 반환 타입을 감싼 형태로 문서화합니다 | `SimpliXApiResponse`를 반환하거나 `simplix.swagger.customizers.generic-response.auto-wrap: false`를 지정하세요 |
| 올바르지 않은 JSON 본문을 보내면 500으로 응답됨 | 핸들러에 읽을 수 없는 본문을 처리하는 분기가 없습니다 | 클라이언트에서 내용을 검증하세요. 응답의 `X-Trace-Id`로 로그를 검색하면 파싱 오류를 확인할 수 있습니다 |
| 존재하지 않는 필드나 연산자로 검색하면 상태 200으로 응답됨 | 검색 오류는 상태 200의 `ERROR` 본문으로 전송됩니다 | 상태뿐 아니라 본문의 `type`도 확인하세요 |
| 401 응답에 `X-Trace-Id` 헤더가 없음 | 추적 필터가 실행되기 전에 보안 필터가 응답합니다 | 시각과 경로로 로그에서 요청을 찾으세요 |

## 날짜와 시각

| 증상 | 원인 | 조치 |
|---|---|---|
| 응답의 시각이 9시간 차이 남 | 애플리케이션 시간대가 값을 저장한 시간대와 다릅니다 | `simplix.date-time.default-timezone`을 지정하고 시각은 UTC로 저장하세요 |
| `X-Timezone`을 보내면 `Instant` 필드만 바뀌고 나머지는 그대로임 | `Instant` 값만 요청의 시간대를 따릅니다 | 읽는 사용자의 시간대로 표시해야 하는 값에는 `Instant`를 사용하세요 |
| `2026-03-01T09:30+09:00`으로 저장한 값이 테이블에는 `2026-03-01 00:30`으로 기록됨 | `use-utc-for-database`가 `OffsetDateTime` 값을 UTC로 저장합니다 | 의도된 동작입니다. 조회할 때는 애플리케이션 시간대의 값으로 반환됩니다 |

## 메타데이터와 API 문서

| 증상 | 원인 | 조치 |
|---|---|---|
| `/dev/meta/dto`나 `/dev/i18n/messages`가 404로 응답함 | 엔드포인트는 기본으로 비활성화되어 있습니다 | 개발 환경에서 `simplix.dev.meta.enabled`와 `simplix.dev.i18n.enabled`를 `true`로 지정하세요 |
| `/dev/meta/dto`가 409로 응답함 | SimpliX Meta가 선언을 거부했습니다 | 응답의 `errorDetail`에 나열된 선언을 모두 수정한 뒤 문서를 다시 요청하세요 |
| 라벨의 `translations`가 비어 있음 | 해당 키가 어느 번들에도 없습니다 | `messages/entities/**/*-messages.properties` 또는 `messages/enums/**/*-messages.properties`에 추가하세요 |
| `springdoc.info`에 지정한 제목이 API 문서에 반영되지 않음 | 스타터는 `springdoc.info`를 읽지 않습니다 | `OpenAPI` 빈을 선언하세요. [API 문서화](./documenting-the-api.md)를 참고하세요 |

## 관련 문서

- [스타터 동작 방식](./how-it-works.md)
- [simplix-core 문제 해결](../../../simplix-core/docs/ko/troubleshooting.md)
