# 설정 레퍼런스

프로젝트 설정 파일 `.simplix/generator-simplix.json`과 엔티티 yml `.simplix/entity/<이름>.yml`의 키를 설명합니다.

## 목차

- [generator-simplix.json](#generator-simplixjson)
- [엔티티 yml](#엔티티-yml)
- [필드 설정](#필드-설정)

## generator-simplix.json

### 전체 구조

```json
{
  "generator": { "version": "<X.Y.Z>" },
  "entity": {
    "scanPath": "src/main/java",
    "basePackage": "com.example.library.domain"
  },
  "repository": {
    "scanPath": "src/main/java",
    "deriveFromEntity": true
  },
  "dto": {
    "excludeFields": ["version", "createdAt", "updatedAt", "createdBy", "updatedBy"]
  },
  "target": {
    "generatedBasePath": "generated/main/java/com/example/library/web",
    "basePackage": "com.example.library.web",
    "targetPath": {
      "service": "{modulePath}/service",
      "controllerRest": "{modulePath}/controller",
      "dto": "{modulePath}/dto"
    },
    "testGeneratedBasePath": "generated/test/java/com/example/library/web",
    "testTargetPath": {
      "serviceTest": "{modulePath}/service"
    }
  },
  "promote": { "moduleRoot": "modules" },
  "template": {},
  "supportClasses": {}
}
```

### 키 설명

| 키 | 타입 | 기본값 | 설명 |
|----|------|--------|------|
| `generator.version` | string | 없음 | 프로젝트가 요구하는 CLI 버전입니다. 실행 중인 CLI가 더 낮으면 `config`, `generate`, `promote`가 실행을 거부합니다. |
| `entity.scanPath` | string | `src/main/java` | 엔티티 소스를 재귀적으로 찾는 경로입니다. `entity.basePath`도 같은 뜻으로 읽습니다. |
| `entity.basePackage` | string | 경로에서 유도 | 엔티티의 기준 패키지입니다. |
| `repository.deriveFromEntity` | boolean | `false` | `true`이면 엔티티 패키지의 마지막 `.entity`를 `.repository`로 바꿔 저장소 패키지를 정합니다. |
| `repository.basePackage` | string | 없음 | `deriveFromEntity`를 쓰지 않을 때의 저장소 기준 패키지입니다. 여기에 yml의 `modulePath`를 덧붙입니다. |
| `repository.scanPath` | string | 없음 | `config`가 저장소 소스를 찾는 경로입니다. |
| `dto.excludeFields` | string[] | `[]` | 모든 DTO에서 제외할 필드 이름입니다. |
| `target.generatedBasePath` | string | 필수 | `generate`가 소스를 쓰는 경로입니다. `target.basePath`도 같은 뜻으로 읽습니다. |
| `target.basePackage` | string | 필수 | 생성한 클래스의 기준 패키지입니다. |
| `target.targetPath.<구성 요소>` | string | 없음 | 구성 요소의 하위 경로입니다. `{modulePath}`는 yml의 `modulePath`로 바뀝니다. 구성 요소 이름은 `service`, `controllerRest`, `controllerWeb`, `dto`, `repository`입니다. |
| `target.testGeneratedBasePath` | string | `generatedBasePath`의 `/main/`을 `/test/`로 바꾼 경로 | 테스트 소스를 쓰는 경로입니다. |
| `target.testTargetPath.serviceTest` | string | 없음 | `promote`가 서비스 테스트를 옮길 하위 경로입니다. |
| `promote.moduleRoot` | string | `modules` | `promote` 대상 모듈이 있는 폴더입니다. |
| `template.<구성 요소>` | string | 내장 템플릿 경로 | 구성 요소가 사용할 템플릿의 상대 경로입니다. 테스트는 `serviceTest`, `restControllerTest`로 지정합니다. |
| `supportClasses.<키>` | string | 없음 | 생성 코드가 호출하는 애플리케이션 클래스의 전체 이름입니다. [템플릿 가이드](ko/cli/template-guide.md#애플리케이션-클래스-연결)를 참조하세요. |

## 엔티티 yml

`config`가 작성하고 개발자가 편집하는 파일입니다. 파일 이름이 생성하는 클래스 이름의 접두어가 됩니다.

```yaml
entity: Book

modulePath: catalog
idField: bookId
nameField: title
thymeleafBaseDir: catalog/book
permissionGroup: CATALOG
defaultSort: { field: title, direction: asc }
export: true

fields:

  title:
    searchKeyword: true
    sortable: true
    views: [list, detail, edit]
    required: true
    maxLength: 200
    searchOperators: [equals, contains]
```

| 키 | 설명 |
|----|------|
| `entity` | 엔티티 클래스 이름입니다. 파일 이름과 다르게 지정하면 같은 엔티티에 대한 클래스 묶음을 다른 접두어로 하나 더 생성합니다. |
| `modulePath` | 생성 경로와 패키지에 들어가는 모듈 경로입니다. 필수입니다. |
| `repositoryModulePath` | 저장소가 엔티티와 다른 모듈 경로에 있을 때 지정합니다. |
| `controllerName` | REST 컨트롤러 클래스 이름입니다. 지정하지 않으면 `<이름>RestController`입니다. |
| `idField` | 식별자 필드 이름입니다. |
| `nameField` | 레코드를 대표하는 이름 필드입니다. 엔티티의 `@NameField`와 다르면 `generate`가 경고합니다. |
| `thymeleafBaseDir` | 컨트롤러의 요청 경로입니다. 지정하지 않으면 파일 이름의 케밥 표기를 사용합니다. |
| `permissionGroup` | `@PreAuthorize`의 권한 그룹입니다. 지정하지 않으면 엔티티 이름을 사용합니다. |
| `ownerPermission` | 지정하면 조회와 수정 권한 검사에 서비스의 `hasOwnerPermission` 호출을 추가합니다. |
| `defaultSort` | 목록의 기본 정렬입니다. `field`는 `sortable: true`인 필드여야 하고 `direction`은 `asc` 또는 `desc`입니다. |
| `export` | `true`이면 목록 내보내기 엔드포인트를 생성합니다. `{ dto, baseName }` 객체로 행 DTO와 파일 이름을 지정할 수 있습니다. |
| `statusCounts` | 값별 건수를 집계할 필드 목록입니다. `supportClasses.searchFigures`가 필요합니다. |
| `aggregates` | `{ field, op }` 목록입니다. 목록 조건으로 합계 등을 계산합니다. `supportClasses.searchFigures`가 필요합니다. |
| `figureScope` | `{ method, mayMatchNothing }`입니다. 집계에 적용할 범위 강제 메서드를 지정합니다. |
| `timeAxisField` | 기간별 건수를 집계할 시각 필드입니다. |
| `notFoundMessageKey` | 레코드가 없을 때 응답할 메시지 키입니다. `supportClasses.messages`가 필요합니다. |
| `sortOrderConfig` | `{ autoIncrement, field, scopeFields }`입니다. 저장소에 최대 순서 값 조회 메서드를 생성합니다. |
| `fields` | 필드별 설정입니다. |

## 필드 설정

| 키 | 설명 |
|----|------|
| `views` | 필드가 들어갈 DTO입니다. `list`, `detail`, `edit`, `batchUpdate` 중에서 고릅니다. |
| `searchOperators` | 검색 DTO에 허용할 연산자입니다. 비워 두면 검색 필드로 만들지 않습니다. |
| `sortable` | 정렬 허용 여부입니다. `Boolean` 필드에 `true`를 지정하면 `generate`가 경고하고 정렬을 제외합니다. |
| `searchKeyword` | `true`이면 통합 검색어의 대상 필드로 표시합니다. |
| `required`, `unique`, `maxLength` | 검증 어노테이션을 정합니다. |
| `type` | DTO 필드의 타입을 직접 지정합니다. JSON 컬럼의 값 객체에 `config`가 채웁니다. |
| `reference` | 참조 엔티티 정보입니다. `entity`, `idField`, `idType`, `nameField`, `multiple`, `modulePath`로 구성합니다. |

`config`가 정하는 검색 연산자의 초깃값은 다음과 같습니다.

| 필드 타입 | 초깃값 |
|-----------|--------|
| `String` | `equals`, `contains` |
| `Integer`, `Long`, `Double`, `BigDecimal` | `equals`, `greaterThan`, `lessThan` |
| 날짜와 시각 타입 | `between`, `greaterThanOrEqual`, `lessThanOrEqual` |
| 열거형 | `equals`, `in` |
| 그 밖의 타입 | `equals` |

## 관련 문서

- [개요](ko/cli/overview.md)
- [명령 가이드](ko/cli/command-guide.md)
- [템플릿 가이드](ko/cli/template-guide.md)
