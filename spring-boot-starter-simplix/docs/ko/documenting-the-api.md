# API 문서화

애플리케이션의 OpenAPI 문서가 만들어지는 방식과 스타터가 추가하는 내용을 설명합니다. springdoc이 컨트롤러를 읽고, 스타터는 springdoc이 알아내지 못하는 부분을 보완합니다. 코드 생성기가 이 문서로 타입이 있는 클라이언트를 만들 수 있습니다.

## 문서의 위치

| 경로 | 제공하는 내용 |
|---|---|
| `/v3/api-docs` | JSON 형식의 OpenAPI 문서 |
| `/swagger-ui.html` | Swagger UI |
| `/scalar` | Scalar API 레퍼런스 |

`simplix-auth`가 활성화되어 있으면 이 경로에 로그인이 필요합니다. [애플리케이션 보안 적용](../../../docs/ko/securing-an-application.md)에 있는 대로 `simplix.auth.security.permit-all-patterns`로 공개하세요.

## springdoc 설정

```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
  packages-to-scan: com.example.library.web
```

이 속성은 springdoc의 속성이며, 스타터는 값을 바꾸지 않습니다. 문서의 제목, 설명, 버전은 일반 springdoc 애플리케이션과 같게 애플리케이션의 `OpenAPI` 빈으로 지정합니다.

## 스타터가 추가하는 내용

| 커스터마이저 | 동작 | 설정 |
|---|---|---|
| `GenericResponseSchemaCustomizer` | 응답 래퍼 안의 타입을 복원합니다. `SimpliXApiResponse<Page<AuthorListDTO>>`를 실제 본문 타입으로 기술합니다 | `simplix.swagger.customizers.generic-response.enabled` |
| `DtoSchemaAutoRegistrar` | 응답 스키마가 참조하는 DTO 클래스를 등록합니다 | 위 항목의 설정을 따름 |
| `EnumSchemaExtractor` | 인라인 열거형을 참조할 수 있는 이름 있는 스키마로 분리합니다 | `simplix.swagger.customizers.enum-extractor.enabled` |
| `NestedObjectSchemaExtractor` | 인라인 중첩 객체를 이름 있는 스키마로 분리합니다 | `simplix.swagger.customizers.nested-object-extractor.enabled` |
| `OperationIdCustomizer` | 오퍼레이션 이름을 `search_1` 대신 `AuthorRest_search`처럼 컨트롤러와 메서드로 지정합니다 | 항상 적용 |
| `TemporalSchemaRegistrar` | springdoc에 매핑이 없는 날짜 시각 타입을 문자열로 기술합니다 | 항상 적용 |
| `SwaggerSchemaEnhancer` | 번역된 검증 메시지, 검색 필드 정보, 식별자 필드를 확장 필드로 추가합니다 | `simplix.swagger.i18n-enabled` |
| `SchemaOrganizer` | 스키마를 이름순으로 정렬하고 열거형 스키마에 `x-schema-type: "enum"`을 표시합니다 | 항상 적용 |

각 설정의 기본값은 `true`입니다. `springdoc.api-docs.enabled: false`를 지정하면 문서와 이 기능이 모두 꺼집니다.

### 일반 반환 타입과 응답 래퍼

`simplix.swagger.customizers.generic-response.auto-wrap`의 기본값은 `true`입니다. 메서드가 일반 타입을 반환하는 오퍼레이션을 `SimpliXApiResponse`로 감싼 형태로 기술합니다. 실제 응답은 감싸지 않으므로, 이 기술은 `SimpliXApiResponse`를 반환하는 메서드에만 일치합니다. 컨트롤러가 일반 객체를 반환하는 애플리케이션에서는 이 속성을 `false`로 지정하세요.

### 확장 필드를 읽는 대상 클래스

`SwaggerSchemaEnhancer`는 SimpliX 모델 패키지의 클래스를 읽습니다. 직접 작성한 DTO의 스키마에도 번역된 검증 메시지와 검색 정보를 추가하려면 `simplix.swagger.i18n-packages`에 DTO 패키지를 지정하세요.

```yaml
simplix:
  swagger:
    i18n-packages:
      - com.example.library.web
    customizers:
      generic-response:
        auto-wrap: false
```

## 엔드포인트 기술

- 컨트롤러에 `@SimpliXStandardApi`를 지정하면 오퍼레이션마다 표준 성공, 잘못된 요청, 서버 오류 응답이 추가됩니다. `SimpliXBaseController`에는 이미 지정되어 있습니다.
- 이름과 설명에는 springdoc의 `@Tag`, `@Operation`, `@Schema`를 사용하세요. CLI는 생성하는 컨트롤러와 DTO에 이 어노테이션을 작성합니다.
- 구체적인 `T`를 지정해 `SimpliXApiResponse<T>`를 반환하세요. 응답 스키마가 이 타입으로 만들어집니다.

## 관련 문서

- [서비스와 컨트롤러 작성](./writing-services-and-controllers.md)
- [클라이언트용 메타데이터 제공](./publishing-metadata-for-clients.md)
