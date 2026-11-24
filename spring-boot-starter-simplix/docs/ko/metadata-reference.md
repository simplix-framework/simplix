# 메타데이터 레퍼런스

`GET /dev/meta/dto`가 반환하는 문서의 구조를 정리합니다. 클라이언트 생성기나 화면 빌더는 이 문서에서 API의 오퍼레이션, 주고받는 타입, 대상 엔티티, 모든 필드의 라벨을 읽으며, Java나 OpenAPI를 파싱하지 않아도 됩니다.

엔드포인트는 `simplix.dev.meta.enabled: true`로 등록합니다. [클라이언트용 메타데이터 제공](./publishing-metadata-for-clients.md)을 참고하세요. 값이 없는 멤버는 JSON에서 제외합니다.

## 문서

| 필드 | 타입 | 내용 |
|---|---|---|
| `version` | number | 이 형식의 버전. `1`입니다 |
| `enums` | map of `EnumMeta` | 타입에서 사용하는 열거형. 단순 이름이 키입니다 |
| `types` | map of `TypeMeta` | 오퍼레이션이 주고받는 DTO와 클래스. 단순 이름이 키입니다 |
| `operations` | list of `OperationMeta` | 애플리케이션의 모든 핸들러 메서드 |
| `entities` | map of `EntityMeta` | `SimpliXBaseController`가 제공하는 엔티티. 단순 이름이 키입니다 |
| `extensions` | map | 다른 모듈이 문서에 추가한 값. 없으면 제외합니다 |

문서의 Java 레코드는 `DtoMeta`입니다.

## 오퍼레이션

```json
{
  "id" : "AuthorRest_simpleSearch",
  "method" : "GET",
  "path" : "/api/catalog/author/search",
  "tag" : "catalog.Author",
  "summary" : "Search Author list (GET)",
  "request" : {
    "query" : [],
    "path" : [],
    "searchDto" : "AuthorSearchDTO"
  },
  "response" : {
    "kind" : "container",
    "name" : "SimpliXApiResponse",
    "args" : [
      {
        "kind" : "container",
        "name" : "Page",
        "args" : [
          {
            "kind" : "ref",
            "name" : "AuthorListDTO"
          }
        ]
      }
    ]
  },
  "access" : {
    "kind" : "permission",
    "group" : "CATALOG",
    "action" : "list"
  },
  "entity" : "Author"
}
```

| 필드 | 타입 | 내용 |
|---|---|---|
| `id` | text | 컨트롤러와 메서드. 예: `AuthorRest_simpleSearch` |
| `method`, `path` | text | HTTP 메서드와 접두어를 포함한 경로 |
| `tag`, `summary` | text | OpenAPI 어노테이션의 태그와 요약 |
| `request` | `RequestMeta` | 오퍼레이션의 입력 |
| `response` | `TypeRef` | 컨테이너를 포함한 반환 타입. 내용이 없으면 제외합니다 |
| `access` | `AccessMeta` | 호출할 수 있는 사용자 |
| `entity` | text | 오퍼레이션의 대상 엔티티 |
| `defaultSort` | `DefaultSortMeta` | 목록의 초기 정렬. 컨트롤러의 `@SimpliXDefaultSort`에서 읽은 `field`와 `direction`입니다 |
| `statusCounts`, `aggregates`, `timeAxis` | list, list of `AggregateMeta`, text | 컨트롤러의 `@SimpliXListFigures`에서 읽은 목록 지표. `AggregateMeta`는 `field`와 `op`로 구성됩니다 |

### 요청

| 필드 | 타입 | 내용 |
|---|---|---|
| `body` | `TypeRef` | 요청 본문의 타입 |
| `contentType` | text | JSON이 아닌 경우의 콘텐츠 타입 |
| `query`, `path` | list of `ParamMeta` | 쿼리 매개변수와 경로 매개변수. `name`, `type`, `required`, `description`으로 구성됩니다 |
| `searchDto` | text | 검색 오퍼레이션의 조건 필드를 정의한 검색 DTO |

### 접근 권한

`AccessMeta`는 메서드의 `@PreAuthorize` 표현식을 클라이언트가 파싱 없이 읽을 수 있는 형태로 제공합니다.

| 필드 | 타입 | 내용 |
|---|---|---|
| `kind` | text | `public`, `authenticated`, `permission`, `expression` 중 하나 |
| `group`, `action` | text | `permission`인 경우 필요한 권한. 예: `CATALOG`와 `list` |
| `operator`, `permissions` | text, list of `PermissionTermMeta` | 여러 권한으로 구성된 표현식인 경우 `or` 또는 `and`와 각 항. 항은 `group`과 `action`으로 구성됩니다 |
| `residual` | boolean | 소유자 확인처럼 권한이 아닌 항이 표현식에 있으면 설정됩니다. 이 항은 서버에서만 판정합니다 |
| `raw` | text | `expression`인 경우 작성된 표현식 그대로 |

## 타입

```json
{
  "javaClass" : "com.example.library.web.catalog.dto.AuthorDTOs$AuthorCreateDTO",
  "typeParams" : [],
  "fields" : [
    {
      "name" : "penName",
      "type" : {
        "kind" : "string"
      },
      "required" : true,
      "nullable" : false,
      "description" : "Pen Name",
      "labelKey" : "entities.Author.penName",
      "constraints" : [
        {
          "kind" : "notBlank"
        },
        {
          "kind" : "maxLength",
          "value" : 120
        }
      ],
      "labels" : {
        "en" : "Pen name",
        "ko" : "필명"
      }
    }
  ],
  "entity" : "Author"
}
```

| 필드 | 타입 | 내용 |
|---|---|---|
| `javaClass` | text | Java 클래스 |
| `extends` | text | 상위 타입. 문서에 함께 있는 경우에만 포함합니다 |
| `typeParams` | list | 제네릭 클래스의 타입 매개변수 이름 |
| `description` | text | 스키마 어노테이션의 설명 |
| `fields` | list of `FieldMeta` | 직렬화되는 프로퍼티 |
| `entity` | text | DTO가 속한 엔티티 |

Java 레코드는 `TypeMeta`입니다.

### 필드

| 필드 | 타입 | 내용 |
|---|---|---|
| `name` | text | JSON에 기록되는 프로퍼티 이름 |
| `type` | `TypeRef` | 값의 타입 |
| `required`, `nullable` | boolean | 값을 반드시 보내야 하는지 여부와 `null` 허용 여부 |
| `description` | text | 스키마 어노테이션의 설명 |
| `labelKey`, `labels` | text, map | 라벨의 메시지 키와, 번들에 있는 모든 로케일의 라벨 |
| `constraints` | list of `ConstraintMeta` | 검증 규칙. `kind`, 규칙에 값이 있으면 `value`, 사용자 정의 규칙이면 `name`으로 구성됩니다 |
| `searchable` | `SearchableMeta` | 검색 DTO의 필드인 경우 검색과 정렬 방식 |
| `reference` | `ReferenceMeta` | 값이 가리키는 다른 엔티티의 레코드 |
| `format` | text | 값의 표시 형식: `code`, `money`, `credits`, `signedCredits`, `bytes`, `duration` |
| `money` | `MoneyMeta` | `money` 형식인 경우 `currency`와 `scale` |
| `tones` | map | 상태 필드인 경우 값별 톤. `@Tone`에서 읽습니다 |
| `defaultValue` | any | 생성 폼의 초기값 |
| `verbOnly` | boolean | `@VerbOnly`를 지정한 필드이면 `true`. 전용 동작으로만 값이 바뀝니다 |

제약의 종류는 `notBlank`, `notEmpty`, `minLength`, `maxLength`, `minItems`, `maxItems`, `min`, `max`, `positive`, `nonnegative`, `negative`, `nonpositive`, `pattern`, `email`, `assertTrue`, `assertFalse`, `custom`입니다.

### 검색 기능

```json
{
  "operators" : [
    "EQUALS",
    "CONTAINS"
  ],
  "sortable" : true,
  "entityField" : "penName"
}
```

| 필드 | 타입 | 내용 |
|---|---|---|
| `operators` | list | 필드에 사용할 수 있는 연산자. 예: `EQUALS`, `CONTAINS`, `IN` |
| `sortable` | boolean | 이 필드로 목록을 정렬할 수 있는지 여부 |
| `entityField` | text | 조건을 적용하는 엔티티 필드 |
| `sortField` | text | 정렬을 적용하는 엔티티 필드. 다른 경우에만 포함합니다 |
| `sortAlias` | map | 번역된 값을 정렬할 때 사용하는 언어별 필드 |
| `keyword` | boolean | 키워드 검색에 포함되는 필드이면 설정됩니다 |

### 참조

| 필드 | 타입 | 내용 |
|---|---|---|
| `entity`, `idField` | text | 참조하는 엔티티와, 값이 가리키는 해당 엔티티의 필드 |
| `many` | boolean | 값이 식별자 컬렉션인지 여부 |
| `kindField`, `kinds` | text, map | `@ReferencesByKind`인 경우 엔티티를 결정하는 필드와, 그 값별 엔티티 |
| `nameField` | text | 참조한 레코드의 이름을 보관하는 프로퍼티 |

## 타입 참조

`TypeRef`는 `kind`로 타입을 구분합니다. 해당 종류에서 사용하지 않는 멤버는 제외합니다.

| `kind` | 함께 사용하는 멤버 | 의미 |
|---|---|---|
| `string`, `boolean`, `date`, `time`, `instant` | 형식을 지정한 경우 `pattern` | 단순 값 |
| `number` | `integral` | 숫자. `integral`로 정수 여부를 구분합니다 |
| `enum` | `name` | `enums`의 항목 |
| `ref` | `name` | `types`의 항목 |
| `container` | `name`, `args` | `SimpliXApiResponse`, `Page`, `List`, `Set`, `Map` 같은 제네릭 컨테이너와 내부 타입 |
| `param` | `name` | 바깥 제네릭 타입의 타입 매개변수 |
| `pick` | `of`, `fields` | 다른 타입에서 선택한 필드 |
| `file`, `binary` |  | 업로드 파일과 바이트 데이터 |
| `unknown` |  | 빌더가 기술하지 못한 타입 |

## 열거형

```json
{
  "labeled" : false,
  "values" : [
    {
      "name" : "CSV"
    },
    {
      "name" : "XLSX"
    }
  ]
}
```

`EnumMeta`에는 `SimpliXLabeledEnum`이면 true인 `labeled`와 `values`가 있습니다. `EnumMeta.Value`는 상수의 `name`, 메시지의 `labelKey`, `tone`으로 구성됩니다.

## 엔티티

```json
{
  "javaClass" : "com.example.library.domain.catalog.entity.Author",
  "idField" : "authorId",
  "nameFields" : [
    "penName"
  ],
  "labelKey" : "entities.Author",
  "pluralKey" : "entities.Author._plural",
  "descriptionKey" : "entities.Author._description",
  "label" : {
    "en" : "Author",
    "ko" : "작가"
  }
}
```

| 필드 | 타입 | 내용 |
|---|---|---|
| `javaClass` | text | 엔티티 클래스 |
| `idField` | text | 식별자 필드 |
| `nameFields` | list | 화면에서 레코드를 지칭하는 필드. `@NameField`에서 읽습니다 |
| `labelKey`, `pluralKey`, `descriptionKey` | text | 이름, 복수형, 설명의 메시지 키 |
| `label`, `plural`, `description` | map | 번들에 해당 키가 있는 모든 로케일의 문구 |
| `holders` | list of `HolderMeta` | 이 엔티티를 참조하는 엔티티. `entity`, `field`, `operators`, 목록을 조회하는 `searchOperation`으로 구성됩니다 |
| `defaultSort`, `statusCounts`, `aggregates` |  | 엔티티의 목록 설정. 오퍼레이션의 값과 같은 형식입니다 |

## 라벨 문서

`simplix.dev.i18n.enabled: true`를 지정하면 `GET /dev/i18n/messages`가 모든 엔티티와 열거형의 라벨을 모든 로케일로 반환합니다. Java 클래스는 `I18nMessagesResponse`입니다. `GET /dev/i18n/entities`, `/dev/i18n/enums`, `/dev/i18n/locales`는 각 부분을 반환합니다.

```json
{
  "version" : "<format version>",
  "supportedLocales" : [
    "en",
    "ko"
  ],
  "entities" : {
    "Author" : {
      "label" : {
        "translations" : {
          "ko" : "작가",
          "en" : "Author"
        }
      },
      "fields" : {
        "penName" : {
          "translations" : {
            "ko" : "필명",
            "en" : "Pen name"
          }
        }
      }
    }
  },
  "enums" : {}
}
```

`EntityMessages`에는 엔티티의 `label`과 `fields`가, `EnumMessages`에는 열거형의 `values`가 있습니다. 각 문구는 로케일별 `translations`로 구성된 `LocalizedString`입니다. 어느 번들에도 없는 라벨은 `translations`가 비어 있습니다.

## 관련 문서

- [클라이언트용 메타데이터 제공](./publishing-metadata-for-clients.md)
- [화면을 위한 엔티티 설명](../../../simplix-core/docs/ko/describing-entities-for-screens.md)
