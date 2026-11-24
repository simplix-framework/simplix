# 스타터 동작 방식

스타터가 애플리케이션에 추가하는 구성, 요청이 처리되는 과정, 구성 요소를 교체하는 방법을 설명합니다.

## 의존성 하나로 추가되는 구성

스타터는 여러 모듈을 묶어 제공합니다. [simplix-core](ko/core/readme.md)와 기능 모듈에 의존하므로 각 모듈의 클래스와 자동 구성이 함께 추가됩니다. `simplix-stream`, `simplix-sync`, `simplix-license`는 포함되지 않으며 필요할 때 개별로 추가합니다.

| 포함된 모듈 | 추가되는 기능 |
|---|---|
| [simplix-auth](ko/auth/readme.md) | 토큰 인증과 보안 필터 체인 |
| [simplix-cache](ko/cache/readme.md) | 캐시 서비스와 Spring 캐시 지원 |
| [simplix-egov](ko/egov/readme.md) | eGovFrame 핵심 빈 |
| [simplix-email](ko/email/readme.md) | 메일 발송 |
| [simplix-encryption](ko/encryption/readme.md) | 컬럼 암호화 |
| [simplix-excel](ko/excel/readme.md) | Excel과 CSV 내보내기 · 가져오기 |
| [simplix-file](ko/file/readme.md) | 파일 저장 |
| [simplix-hibernate](ko/hibernate/readme.md) | 인스턴스 간 2차 캐시 무효화 |
| [simplix-messaging](ko/messaging/readme.md) | 브로커 메시징 |
| [simplix-mybatis](ko/mybatis/readme.md) | MyBatis 지원 |
| [simplix-scheduler](ko/scheduler/readme.md) | 스케줄 실행 기록 |

## 시작 과정

- `SimpliXAutoConfiguration`이 `SimpliXProperties`를 바인딩하고 `dev.simplecore.simplix.web`과 `dev.simplecore.simplix.springboot` 패키지를 스캔합니다. 그래서 애플리케이션에서 스캔을 지정하지 않아도 스타터의 웹 클래스가 빈으로 등록됩니다.
- 이후 각 자동 구성이 담당하는 구성 요소를 등록합니다. 속성으로 비활성화했거나 애플리케이션에 같은 타입의 빈이 있으면 등록하지 않습니다. 클래스, 등록 대상, 전환 속성은 [설정 레퍼런스](ko/starter/configuration-reference.md)에 있습니다.
- 애플리케이션이 준비되면 `ApplicationInfoRunner`가 활성 프로파일과 포트가 표시된 배너를 출력합니다.

## 요청 처리 과정

1. [simplix-auth](ko/auth/readme.md)의 보안 필터가 호출자를 인증합니다. 보안 필터가 거부한 요청은 아래 단계보다 먼저 응답되므로, 401 응답에는 `X-Trace-Id` 헤더가 없습니다.
2. `SimpliXWebConfig`의 추적 필터가 추적 식별자를 생성해 로깅 컨텍스트에 `traceId`로 저장하고 `X-Trace-Id` 응답 헤더에 기록합니다. 식별자는 항상 새로 생성하며, 클라이언트가 보낸 추적 식별자는 사용하지 않습니다.
3. `TimezoneInterceptor`가 `X-Timezone` 헤더를 읽어 `TimezoneContext`에 설정합니다.
4. 컨트롤러가 실행됩니다. 인자는 통합 `MessageSource`의 메시지로 검증합니다.
5. `ObjectMapper`가 응답을 기록합니다. 날짜 시각 값에는 오프셋을 포함하고, `Instant` 값은 `TimezoneAwareInstantSerializer`로 요청의 시간대에 맞춰 기록합니다.
6. 처리 중 발생한 예외는 `SimpliXExceptionHandler`가 응답합니다. [오류 처리](ko/starter/handling-errors.md)를 참고하세요.
7. `SimpliXWebMvcConfiguration`의 필터가 로깅 컨텍스트를 비우므로, 풀에서 재사용하는 스레드에 추적 식별자가 다음 요청까지 남지 않습니다.

## 스타터가 처리하지 않는 범위

컨트롤러 메서드가 일반 객체를 반환하면 그 객체를 그대로 응답 본문으로 전송합니다. `Map.of("hello", "world")`는 `SimpliXApiResponse`로 감싸지 않고 `{"hello": "world"}`로 전송됩니다. 기반 컨트롤러처럼 직접 작성한 컨트롤러에서도 `SimpliXApiResponse.success(...)`를 반환하세요. 이런 값을 감싸는 `SimpliXResponseBodyAdvice`가 모듈에 있지만 등록되어 있지 않습니다.

> ⚠ `simplix.swagger.customizers.generic-response.auto-wrap`의 기본값이 `true`이므로, API 문서에는 일반 반환 타입도 감싼 형태로 기술됩니다. 컨트롤러가 일반 객체를 반환한다면 문서와 응답이 일치하도록 이 값을 `false`로 지정하세요.

## 구성 요소 교체

| 교체 대상 | 방법 |
|---|---|
| 예외 핸들러 | `SimpliXExceptionHandler` 타입의 빈을 선언하거나, `simplix.exception-handler.enabled: false`를 지정하고 `@RestControllerAdvice`를 작성하세요 |
| `ObjectMapper` | `ObjectMapper` 빈을 선언하세요. 이 경우 SimpliX 직렬화기는 직접 등록해야 합니다 |
| `ModelMapper` | `ModelMapper` 빈을 선언하세요 |
| 감사 사용자 제공자 | `auditorProvider`라는 이름의 `AuditorAware` 빈을 선언하세요 |
| `MessageSource` | `simplix.message-source.enabled: false`를 지정하고 직접 선언하세요 |
| 자동 구성 전체 | `spring.autoconfigure.exclude`에 클래스를 지정하세요 |

## 관련 문서

- [설정 레퍼런스](ko/starter/configuration-reference.md)
- [문제 해결](ko/starter/troubleshooting.md)
- [simplix-core 동작 방식](ko/core/how-it-works.md)
