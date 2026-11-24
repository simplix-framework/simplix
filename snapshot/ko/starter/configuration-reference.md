# 설정 레퍼런스

스타터의 속성과 스타터가 등록하는 자동 구성을 정리합니다. 다른 모듈의 속성은 각 모듈 문서에 있습니다.

## 속성

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.core.enabled` | `true` | SimpliX 자동 구성 사용 |
| `simplix.exception-handler.enabled` | `true` | 예외 핸들러 등록 |
| `simplix.date-time.default-timezone` | `spring.jackson.time-zone`, 없으면 시스템 시간대 | 애플리케이션 시간대 |
| `simplix.date-time.use-utc-for-database` | `true` | `OffsetDateTime` 값을 UTC로 저장 |
| `simplix.date-time.normalize-timezone` | `true` | `LocalDateTime` 값을 애플리케이션 시간대로 해석 |
| `simplix.date-time.request-timezone-enabled` | `true` | `X-Timezone` 헤더 사용 |
| `simplix.message-source.enabled` | `true` | 통합 `MessageSource` 구성 |
| `simplix.validator.enabled` | `true` | 검증기와 `MessageSource` 연결 |
| `simplix.i18n.default-locale` | `en` | 필드 번역의 대체 로케일 |
| `simplix.i18n.supported-locales` | `en`, `ko`, `ja` | 기본 로케일 다음에 시도하는 로케일 |
| `simplix.tree-repository.enabled` | `true` | 트리 저장소 지원 구성 |
| `simplix.swagger.i18n-enabled` | `true` | API 문서에 번역된 검증 메시지 추가 |
| `simplix.swagger.customizers.enum-extractor.enabled` | `true` | 인라인 열거형을 이름 있는 스키마로 분리 |
| `simplix.swagger.customizers.nested-object-extractor.enabled` | `true` | 인라인 중첩 객체를 이름 있는 스키마로 분리 |
| `simplix.swagger.customizers.generic-response.enabled` | `true` | 응답 래퍼 안의 타입 복원 |
| `simplix.swagger.customizers.generic-response.auto-wrap` | `true` | 일반 반환 타입을 `SimpliXApiResponse`로 감싼 형태로 기술합니다 |
| `simplix.swagger.i18n-packages` | 없음 | API 문서의 확장 필드를 추가할 DTO 패키지 |
| `simplix.dev.meta.enabled` | `false` | SimpliX Meta 엔드포인트 등록 |
| `simplix.dev.i18n.enabled` | `false` | i18n 엔드포인트 등록 |
| `simplix.dev.base-packages` | 애플리케이션의 패키지 | 라벨이 있는 열거형을 찾을 패키지 |
| `simplix.auth.enabled` | `true` | `false`이면 `simplix-auth`의 보안 대신 모든 요청을 허용하는 체인을 사용 |

스타터는 Spring Boot의 `spring.messages.basename`과 `spring.jackson.time-zone`, springdoc의 `springdoc.*`도 사용합니다.

### 메시지 소스 속성

통합 `MessageSource`는 Spring Boot의 `spring.messages.*` 속성으로 구성하며, 스타터의 기본값이 적용됩니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `spring.messages.basename` | `messages`, `messages/validation`, `messages/errors`, `messages/messages` | 애플리케이션의 번들. 쉼표로 구분합니다 |
| `spring.messages.encoding` | `UTF-8` | 번들 파일의 문자 집합 |
| `spring.messages.cache-duration` | 계속 유지 | 불러온 번들을 다시 읽기 전까지 유지하는 시간 |
| `spring.messages.fallback-to-system-locale` | `true` | 요청에 맞는 번들이 없으면 시스템 로케일을 사용합니다 |
| `spring.messages.use-code-as-default-message` | `false` | 메시지가 없으면 실패하지 않고 키를 반환합니다 |
| `spring.messages.always-use-message-format` | `false` | 인자가 없는 메시지에도 `MessageFormat`을 적용합니다 |
| `spring.messages.common-messages` | 없음 | 모든 로케일이 공유하는 속성 파일 |

## 자동 구성

| 클래스 | 등록하는 내용 | 설정 |
|---|---|---|
| `SimpliXAutoConfiguration` | SimpliX 웹 클래스의 컴포넌트 스캔과 `SimpliXProperties` | `simplix.core.enabled` |
| `SimpliXWebAutoConfiguration` | `SimpliXExceptionHandler` | `simplix.exception-handler.enabled` |
| `SimpliXJacksonAutoConfiguration` | SimpliX 직렬화기를 등록한 기본 `ObjectMapper` | 직접 등록한 빈 |
| `SimpliXDateTimeAutoConfiguration` | `applicationZoneId`, `applicationZoneOffset`, `SimpliXTimezoneService`, 날짜 시각 JPA 변환기 | 없음 |
| `SimpliXTimezoneWebAutoConfiguration` | `X-Timezone`을 읽는 `TimezoneInterceptor` | `simplix.date-time.request-timezone-enabled` |
| `SimpliXJpaAutoConfiguration` | 날짜 시각 변환기를 JPA에 등록 | 없음 |
| `SimpliXJpaAuditingAutoConfiguration` | JPA 감사, `auditorProvider`, `dateTimeProvider` | 직접 등록한 빈 |
| `SimpliXTreeRepositoryAutoConfiguration` | 트리 저장소가 사용하는 `JdbcTemplate` | `simplix.tree-repository.enabled` |
| `SimpliXModelMapperAutoConfiguration` | 날짜 시각 변환을 포함한 `ModelMapper` 빈 | 직접 등록한 빈 |
| `SimpliXMessageSourceAutoConfiguration` | 통합 `MessageSource` | `simplix.message-source.enabled` |
| `SimpliXValidatorAutoConfiguration` | `MessageSource`와 연결한 검증기, 메서드 검증 | `simplix.validator.enabled` |
| `SimpliXI18nAutoConfiguration` | 필드 번역 설정 | 없음 |
| `SimpliXSwaggerAutoConfiguration` | OpenAPI 커스터마이저 | `springdoc.api-docs.enabled`와 `simplix.swagger.*` |
| `SimpliXThymeleafAutoConfiguration` | 템플릿 리졸버, 오류 페이지 템플릿, JSP 뷰 리졸버 | `spring.thymeleaf.enabled` |
| `SimpliXSecurityAutoConfiguration` | 모든 요청을 허용하는 필터 체인 | `simplix.auth.enabled`가 `false`일 때만 등록 |
| `SimpliXDevMetaAutoConfiguration` | `GET /dev/meta/dto` | `simplix.dev.meta.enabled` |
| `SimpliXDevI18nAutoConfiguration` | `/dev/i18n` 엔드포인트 | `simplix.dev.i18n.enabled` |
| `SimpliXExcelLabelsAutoConfiguration` | 내보낸 파일의 헤더에 엔티티 라벨을 사용하도록 하는 리졸버 | 없음 |

자동 구성을 완전히 제외하려면 `spring.autoconfigure.exclude`에 지정하세요. 클래스는 `dev.simplecore.simplix.springboot.autoconfigure` 패키지에 있습니다.

```yaml
spring:
  autoconfigure:
    exclude:
      - dev.simplecore.simplix.springboot.autoconfigure.SimpliXThymeleafAutoConfiguration
```

### Thymeleaf 빈

`SimpliXThymeleafAutoConfiguration`은 클래스패스에 Thymeleaf와 레이아웃 방언이 있을 때 활성화됩니다. 아래 빈은 애플리케이션에 같은 이름의 빈이 없을 때만 등록하고, `LayoutDialect`를 추가한 `SpringTemplateEngine`은 애플리케이션에 같은 타입의 빈이 없을 때만 등록합니다.

| 빈 이름 | 타입 | 모듈이 등록하는 빈 |
|---|---|---|
| `defaultTemplateResolver` | `SpringResourceTemplateResolver` | `spring.thymeleaf.prefix`, `suffix`, `mode`, `encoding`, `cache` 설정으로 템플릿을 읽습니다 |
| `errorTemplateResolver` | `SpringResourceTemplateResolver` | 이름이 `error`로 시작하는 템플릿을 `classpath:/templates/`에서 캐시 없이 읽습니다. 기본 리졸버보다 먼저 적용됩니다 |
| `thymeleafViewResolver` | `ViewResolver` | `redirect:*`를 제외한 모든 뷰 이름을 렌더링합니다. 다른 뷰 리졸버보다 먼저 적용됩니다 |
| `jspViewResolver` | `ViewResolver` | `spring.mvc.view.prefix`와 `suffix`를 사용하는 `InternalResourceViewResolver`. Thymeleaf 리졸버 다음에 적용됩니다 |

## 관련 문서

- [시작하기](ko/getting-started.md)
- [simplix-auth](ko/auth/readme.md): `simplix.auth.*` 속성
