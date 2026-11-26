# 클라이언트용 메타데이터 제공

애플리케이션의 정보를 프론트엔드에 제공하는 개발용 엔드포인트를 설명합니다. SimpliX Meta는 DTO, 오퍼레이션, 엔티티와 화면에 필요한 정보를 제공하고, i18n 엔드포인트는 모든 언어의 라벨을 제공합니다. 프론트엔드 빌드가 이 정보를 읽어 타입, 폼, 번역을 생성합니다.

## 엔드포인트 활성화

```yaml
simplix:
  dev:
    meta:
      enabled: true
    i18n:
      enabled: true
  auth:
    security:
      permit-all-patterns:
        - /dev/**
```

메타와 i18n 엔드포인트의 기본값은 비활성이며, `prod`나 `production` 프로필이 활성화되어 있으면 속성과 관계없이 등록되지 않습니다. 이 속성은 개발 프로필에 지정하세요.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.dev.meta.enabled` | `false` | `GET /dev/meta/dto` 등록 |
| `simplix.dev.i18n.enabled` | `false` | `/dev/i18n` 엔드포인트 등록 |
| `simplix.dev.base-packages` | 애플리케이션의 패키지 | 라벨이 있는 열거형을 찾을 패키지 |

## SimpliX Meta

`GET /dev/meta/dto`는 다음 항목으로 구성된 문서로 응답합니다.

| 항목 | 내용 |
|---|---|
| `version` | 문서 형식의 버전 |
| `types` | 모든 DTO와 DTO가 참조하는 클래스. 필드별 타입, 필수 여부와 null 허용 여부, 제약, 형식, 참조를 포함합니다 |
| `enums` | 열거형의 상수, 라벨 키, 색조 |
| `operations` | 모든 컨트롤러 메서드. 식별자, HTTP 메서드, 경로, 태그, 요청, 응답, 필요한 권한, 대상 엔티티를 포함합니다 |
| `entities` | 컨트롤러가 제공하는 모든 엔티티. 식별자 필드, 이름 필드, 라벨 키, 목록의 기본 정렬과 수치를 포함합니다 |
| `extensions` | 애플리케이션이 추가한 정보 |

생성된 `Author` 컨트롤러의 오퍼레이션은 다음과 같이 기술됩니다. 요청과 응답 타입은 생략했습니다.

```json
{
  "id": "AuthorRest_multiUpdate",
  "method": "PATCH",
  "path": "/api/catalog/author",
  "tag": "catalog.Author",
  "access": { "kind": "permission", "group": "CATALOG", "action": "edit" },
  "entity": "Author"
}
```

이 문서의 이름 필드, 형식, 색조, 참조 정보는 [화면을 위한 엔티티 설명](ko/core/describing-entities-for-screens.md)의 어노테이션으로 지정합니다. 애플리케이션의 정보를 추가하려면 `SimpliXMetaContributor`를 구현한 빈을 등록하세요. 이 빈이 반환한 값은 `extensions`에 포함됩니다.

문서로 기술할 수 없는 선언은 거부합니다. 검색 DTO가 정렬할 수 없는 필드를 지정한 기본 정렬, 컨트롤러가 제공하지 않는 엔티티를 지정한 참조, 단순 이름이 같은 두 DTO 클래스가 여기에 해당합니다. 이 경우 요청에 상태 409와 코드 `GEN_CONFLICT`로 응답합니다. `message`에는 거부한 선언을 모두 기재하고 `detail`에는 하나씩 나열하므로, 요청 한 번으로 수정할 선언을 모두 확인할 수 있습니다. 기본 정렬과 수치는 모든 타입을 승인한 뒤에 검사하므로, 거부한 타입을 먼저 보고합니다. `SimpliXMetaContributor`가 자체 규칙으로 선언을 거부하려면 `SimpliXMetaViolationException`을 던지세요. 같은 형식으로 응답하며, 예외의 `violations()`가 `detail`에 나열되는 목록을 반환합니다.

## 모든 언어의 라벨

| 엔드포인트 | 응답 |
|---|---|
| `GET /dev/i18n/messages` | 버전, 지원 로케일, 엔티티 라벨, 열거형 라벨 전체 |
| `GET /dev/i18n/entities` | 엔티티와 필드의 로케일별 라벨 |
| `GET /dev/i18n/enums` | `LabeledEnum`을 구현한 열거형의 상수별 로케일별 라벨 |
| `GET /dev/i18n/locales` | 라벨 번들이 존재하는 로케일 |

라벨은 `messages/entities`와 `messages/enums` 아래의 번들에서 읽습니다. [메시지와 로케일](ko/starter/messages-and-locales.md)을 참고하세요. `catalog-messages.properties`와 `catalog-messages_ko.properties`가 있으면 `Author` 항목은 다음과 같습니다.

```json
{
  "label": {
    "translations": {
      "ko": "작가",
      "en": "Author"
    }
  },
  "fields": {
    "penName": {
      "translations": {
        "ko": "필명",
        "en": "Pen name"
      }
    }
  }
}
```

## 관련 문서

- [화면을 위한 엔티티 설명](ko/core/describing-entities-for-screens.md)
- [API 문서화](ko/starter/documenting-the-api.md)
