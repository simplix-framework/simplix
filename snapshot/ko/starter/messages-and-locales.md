# 메시지와 로케일

애플리케이션의 문구가 저장되는 위치와 응답의 언어가 정해지는 방식을 설명합니다. 스타터는 애플리케이션의 번들과 SimpliX 모듈에 포함된 번들을 합쳐 `MessageSource`를 구성합니다.

## 메시지의 위치

| 번들 | 내용 |
|---|---|
| `messages.properties`, `messages/messages.properties` | 일반 문구 |
| `messages/validation.properties` | 검증 메시지 |
| `messages/errors.properties` | 오류 메시지 |
| `messages/entities/**/*-messages.properties` | 엔티티와 필드의 라벨. 키는 `entities.<Entity>`와 `entities.<Entity>.<field>`입니다 |
| `messages/enums/**/*-messages.properties` | 열거형 상수의 라벨. 키는 `enums.<Enum>.<CONSTANT>`입니다 |

번들마다 `messages_ko.properties`나 `catalog-messages_ko.properties`처럼 언어별 파일을 추가하세요. 다른 번들 이름을 사용하려면 `spring.messages.basename`에 지정합니다.

```yaml
spring:
  messages:
    basename: messages/validation,messages/errors,messages/library
```

## 모듈의 메시지

SimpliX 모듈은 문구를 `messages/simplix_<module>.properties`로 제공하며, 영어 · 한국어 · 일본어 번들이 있습니다. 스타터가 클래스패스에서 이 번들을 모두 찾습니다. 애플리케이션 번들에 같은 이름의 키를 정의하면 모듈의 문구 대신 사용됩니다. `messages/errors.properties`에 `error.authz.insufficient.permissions=You may not do that`을 정의하면 모든 403 응답의 메시지가 바뀝니다.

## 응답의 언어

언어는 요청의 `Accept-Language` 헤더로 정해집니다. 같은 오류에 `Accept-Language: en`이면 `Insufficient permissions`로, `Accept-Language: ko`이면 `권한이 부족합니다`로 응답합니다.

## 검증 메시지

검증기는 같은 `MessageSource`에서 메시지를 읽고, 제약 메시지의 `{min}`, `{max}` 같은 매개변수를 실제 값으로 바꿉니다. `@Size(max = 200)`에는 `Size must be between 0 and 200`으로 응답합니다.

직접 작성하는 메시지에는 매개변수를 이름으로 지정하세요. 번호 매개변수도 값으로 바뀌지만 `max`가 `min`보다 먼저 전달됩니다. `@Size(min = 2, max = 5, message = "Between {0} and {1} characters")`에는 `Between 5 and 2 characters`로 응답하고, `message = "From {min} to {max} characters"`에는 `From 2 to 5 characters`로 응답합니다.

## 속성

| 속성 | 기본값 | 의미 |
|---|---|---|
| `spring.messages.basename` | `messages`, `messages/validation`, `messages/errors`, `messages/messages` | 쉼표로 구분한 애플리케이션 번들 |
| `simplix.message-source.enabled` | `true` | 통합 `MessageSource` 구성 |
| `simplix.validator.enabled` | `true` | 검증기와 `MessageSource` 연결 |
| `simplix.i18n.default-locale`, `simplix.i18n.supported-locales` | `en`; `en`, `ko`, `ja` | 필드 번역의 대체 로케일. [필드 번역](ko/core/translating-fields.md) 참고 |

## 관련 문서

- [필드 번역](ko/core/translating-fields.md)
- [클라이언트용 메타데이터 제공](ko/starter/publishing-metadata-for-clients.md)
