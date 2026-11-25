# 설정 레퍼런스

프로젝트 설정 `.simplix/simplix-boot.json`과 엔티티 yml `.simplix/entity/<이름>.yml`의 키를 설명합니다. 프로젝트 설정은 프로젝트마다 한 번 작성하고, 엔티티 yml은 `config`가 작성한 뒤 직접 편집합니다.

```
project/
+-- .simplix/
|   +-- simplix-boot.json        # project configuration
|   +-- entity/                  # one yml per generated set of classes
|   +-- templates/               # templates that replace built-in ones
|   +-- bases/                   # stored renders of promoted files
+-- generated/                   # output of generate (not committed)
+-- modules/                     # targets of promote
```

> ℹ 프로젝트에 `simplix-boot.json`이 없으면 generator-simplix에서 쓰던 이름인 `generator-simplix.json`을 프로젝트 설정으로 읽고, 이 파일을 읽는 명령은 그 사실을 표준 오류에 출력합니다. `simplix-boot version --write`를 실행하면 이 파일의 이름을 `simplix-boot.json`으로 바꿉니다.

## 프로젝트 설정

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

| 키 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `generator.version` | string | 없음 | 프로젝트가 요구하는 CLI 버전입니다. 이보다 낮은 CLI는 `config`, `generate`, `promote`의 실행을 거부합니다. `version --write`가 기록합니다 |
| `entity.scanPath` | string | `src/main/java` | 엔티티 소스를 재귀적으로 찾는 폴더입니다. `entity.basePath`도 같은 키로 읽습니다 |
| `entity.basePackage` | string | 경로에서 유도 | 엔티티의 기준 패키지입니다 |
| `repository.deriveFromEntity` | boolean | `false` | `true`이면 엔티티 패키지의 마지막 `.entity`를 `.repository`로 바꾼 패키지를 저장소 패키지로 사용합니다 |
| `repository.basePackage` | string | 없음 | `deriveFromEntity`를 쓰지 않을 때의 저장소 기준 패키지입니다. yml의 `modulePath`를 덧붙입니다 |
| `repository.scanPath` | string | 없음 | `config`가 저장소 소스를 찾는 폴더입니다 |
| `dto.excludeFields` | string[] | `[]` | 모든 DTO에서 제외할 필드 이름입니다 |
| `target.generatedBasePath` | string | 필수 | `generate`가 소스를 쓰는 폴더입니다. `target.basePath`도 같은 키로 읽습니다 |
| `target.basePackage` | string | 필수 | 생성 클래스의 기준 패키지입니다 |
| `target.targetPath.<구성 요소>` | string | 없음 | 구성 요소의 하위 경로이며, 지정한 구성 요소만 생성합니다. `{modulePath}`는 yml의 `modulePath`로 바뀝니다. 구성 요소는 `service`, `controllerRest`, `controllerWeb`, `dto`, `repository`입니다 |
| `target.testGeneratedBasePath` | string | `generatedBasePath`의 `/main/`을 `/test/`로 바꾼 경로 | 테스트 소스를 쓰는 폴더입니다. `target.testBasePath`도 같은 키로 읽습니다 |
| `target.testTargetPath.serviceTest` | string | 없음 | `promote`가 서비스 테스트를 옮기는 하위 경로입니다 |
| `promote.moduleRoot` | string | `modules` | `promote`가 파일을 쓰는 모듈들이 있는 폴더입니다 |
| `template.<구성 요소>` | string | 내장 템플릿 경로 | 구성 요소를 렌더링할 템플릿의 상대 경로입니다. 테스트는 `serviceTest`, `restControllerTest`로 지정합니다 |
| `supportClasses.<키>` | string | 없음 | 생성 코드가 호출하는 애플리케이션 클래스의 전체 이름입니다([템플릿 레퍼런스](./template-reference.md#지원-클래스)) |

## 엔티티 yml

파일 이름이 생성 클래스 이름의 접두어입니다. yml 하나가 클래스 묶음 하나를 만듭니다.

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

  authorId:
    sortable: true
    views: [list, detail, edit]
    maxLength: 36
    searchOperators: [equals, in]
    reference:
      entity: Author
      idField: authorId
      idType: String
      nameField: penName
      multiple: false
```

| 키 | 설명 |
|---|---|
| `entity` | 엔티티 클래스 이름입니다. 파일 이름과 다른 클래스를 지정하면 같은 엔티티의 클래스 묶음을 다른 접두어로 하나 더 생성합니다 |
| `modulePath` | 생성 경로와 패키지에 들어가는 모듈 경로입니다. 필수입니다 |
| `repositoryModulePath` | 저장소의 모듈 경로가 엔티티와 다를 때 지정합니다 |
| `controllerName` | REST 컨트롤러 클래스 이름입니다. 지정하지 않으면 `<이름>RestController`입니다 |
| `idField` | 식별자 필드의 이름입니다 |
| `nameField` | 레코드를 대표하는 이름 필드입니다. 엔티티의 `@NameField`와 다르면 `generate`가 경고합니다 |
| `thymeleafBaseDir` | 컨트롤러의 요청 경로입니다. 지정하지 않으면 파일 이름의 케밥 표기를 사용합니다 |
| `permissionGroup` | `@PreAuthorize` 검사의 권한 그룹입니다. 지정하지 않으면 엔티티 이름을 사용합니다 |
| `ownerPermission` | 조회와 수정 권한 검사에 서비스의 `hasOwnerPermission` 호출을 추가합니다 |
| `defaultSort` | 목록의 기본 정렬입니다. `field`는 `sortable: true`인 필드, `direction`은 `asc` 또는 `desc`입니다 |
| `export` | `true`이면 목록을 내보내는 엔드포인트를 생성합니다. `{ dto, baseName }`으로 행 DTO와 파일 이름을 지정할 수 있습니다 |
| `statusCounts` | 값별 건수를 집계할 필드 목록입니다. `supportClasses.searchFigures`가 필요합니다 |
| `aggregates` | 목록의 검색 조건으로 계산하는 `{ field, op }` 목록입니다. `supportClasses.searchFigures`가 필요합니다 |
| `figureScope` | `{ method, mayMatchNothing }`. 집계 범위를 호출자가 볼 수 있는 레코드로 제한하는 메서드를 지정합니다 |
| `timeAxisField` | 기간별 건수를 집계할 시각 필드입니다 |
| `notFoundMessageKey` | 레코드가 없을 때 응답할 메시지 키입니다. `supportClasses.messages`가 필요합니다 |
| `sortOrderConfig` | `{ autoIncrement, field, scopeFields }`. 최대 순서 값을 조회하는 저장소 메서드를 생성합니다 |
| `fields` | 필드별 설정입니다(아래) |

> ℹ `config`는 `promoteModule`, `defaultSortField`, `defaultSortDirection`도 함께 씁니다. 이 키들을 읽는 명령은 없습니다.

## 필드 설정

| 키 | 설명 |
|---|---|
| `views` | 필드가 들어갈 DTO입니다. `list`, `detail`, `edit`, `batchUpdate` 중에서 고릅니다 |
| `searchOperators` | 검색 DTO가 이 필드에 허용하는 연산자입니다. 비워 두면 검색 DTO에서 제외합니다 |
| `sortable` | 이 필드로 목록을 정렬할 수 있는지 정합니다. `Boolean` 필드에 `true`를 지정하면 경고와 함께 정렬에서 제외합니다 |
| `searchKeyword` | `true`이면 통합 검색어의 대상 필드로 표시합니다(아래 안내 참조) |
| `required`, `unique`, `maxLength` | 검증 어노테이션을 정합니다 |
| `type` | DTO 필드의 타입이 엔티티 필드와 다를 때 지정합니다. JSON 컬럼에 저장하는 값 객체에는 `config`가 채웁니다 |
| `reference` | 필드가 참조하는 엔티티입니다. `entity`, `idField`, `idType`, `nameField`, `multiple`, `modulePath`로 구성합니다 |

> ℹ `config`는 `@NaturalId`를 지정한 필드에 `naturalId: true`를, `@Lob`을 지정한 필드에 `largeText: true`를 함께 씁니다. 이 키를 읽는 템플릿은 없습니다.

> ℹ `searchKeyword: true`를 지정하면 필드의 `@SearchableField`에 `keyword = true`를 생성합니다. 이 속성은 현재 SimpliX 릴리스가 의존하는 searchable-jpa 릴리스에 포함되어 있습니다. 더 낮은 searchable-jpa 버전을 고정한 프로젝트에서는 생성된 DTO가 컴파일되지 않습니다.

`config`가 필드에 처음 지정하는 검색 연산자는 타입에 따라 다릅니다.

| 필드 타입 | 연산자 |
|---|---|
| `String` | `equals`, `contains` |
| `Integer`, `Long`, `Double`, `BigDecimal` | `equals`, `greaterThan`, `lessThan` |
| 날짜와 시각 타입 | `between`, `greaterThanOrEqual`, `lessThanOrEqual` |
| 열거형 | `equals`, `in` |
| 그 밖의 타입 | `equals` |

## 관련 문서

- [시작하기](./getting-started.md)
- [명령 레퍼런스](./command-reference.md)
- [템플릿 레퍼런스](./template-reference.md)
