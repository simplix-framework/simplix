# 템플릿 레퍼런스

내장 템플릿, 템플릿에서 쓸 수 있는 문법과 변수, 생성 코드가 사용하는 애플리케이션 클래스와 메시지 키를 설명합니다. 템플릿을 바꾸거나 대체하는 방법은 [템플릿 사용자 지정](ko/cli/customizing-templates.md)에 있습니다.

## 내장 템플릿

| 상대 경로 | 생성 대상 |
|---|---|
| `service/EntityService.java.template` | 서비스 |
| `service/EntityTreeService.java.template` | `TreeEntity`의 트리 서비스 |
| `controller/rest/EntityRestController.java.template` | REST 컨트롤러 |
| `controller/web/EntityWebController.java.template` | 웹 컨트롤러 |
| `dto/EntityDTOs.java.template` | DTO |
| `repository/EntityRepository.java.template` | 저장소 |
| `test/EntityServiceTest.java.template` | 서비스 테스트 |
| `test/EntityTreeServiceTest.java.template` | 트리 서비스 테스트 |

내장 템플릿이 생성하는 코드는 CLI와 같은 릴리스 라인의 SimpliX와 searchable-jpa 클래스만 import하며, 애플리케이션의 클래스는 import하지 않습니다. 컨트롤러 테스트 템플릿은 내장하지 않습니다. 프로젝트가 `test/EntityRestControllerTest.java.template`을 제공하면 컨트롤러 테스트를 생성합니다.

## 문법

템플릿은 EJS 파일입니다. 출력 태그 `<%= %>`는 HTML 이스케이프를 하지 않고 값을 그대로 출력합니다. 렌더링한 뒤에는 줄 끝 공백을 제거하고 연속한 빈 줄을 한 줄로 줄입니다.

```java
package <%= packagePaths['service'] %>;

public class <%= classPrefix %>Service extends SimpliXBaseService<<%= entityName %>, <%= idType %>> {
}
```

## 변수

| 변수 | 내용 |
|---|---|
| `entityName` | 엔티티 클래스 이름 |
| `classPrefix` | 생성 클래스 이름의 접두어(yml 파일 이름) |
| `controllerName` | REST 컨트롤러 클래스 이름 |
| `entityNameLowerFirst`, `classPrefixLowerFirst` | 첫 글자를 소문자로 바꾼 이름 |
| `basePackage` | `target.basePackage` |
| `modulePath` | yml의 `modulePath` |
| `packagePaths` | 구성 요소별 패키지. `packagePaths.service`, `packagePaths.dto`, `packagePaths.repository` |
| `targetPaths` | `target.targetPath` |
| `entityPackage`, `entityBasePackage` | 엔티티의 패키지와 `entity.basePackage` |
| `templatePath` | 요청 경로. yml의 `thymeleafBaseDir` 또는 클래스 이름의 케밥 표기 |
| `entityComment` | 엔티티의 테이블 주석 |
| `fields`, `entityFields` | 분석한 필드 목록 |
| `idType`, `idFieldName` | 식별자의 타입과 필드 이름 |
| `hasEmbeddedId`, `embeddedIdField`, `embeddedIdType`, `embeddedIdFields`, `embeddedIdPropertyNames` | 복합 식별자 정보 |
| `entitySearchFields`, `embeddedIdSearchFields` | 검색 DTO의 필드 |
| `ymlConfig` | 엔티티 yml 전체 |
| `dtoExcludeFields` | `dto.excludeFields` |
| `hasOrderField`, `orderField` | 정렬 순서 필드 정보 |
| `hasTreeEntity`, `treeEntityInterface` | `TreeEntity` 구현 여부와 타입 정보 |
| `exportConfig` | yml의 `export`를 해석한 결과 |
| `supportClasses` | 애플리케이션 클래스 조회(아래) |
| `capitalizeFirstLetter` | 첫 글자를 대문자로 바꾸는 함수 |
| `_` | lodash |
| `generatorVersion`, `generatedAt`, `gitUser`, `gitEmail` | CLI 버전, 렌더링 시각, Git 사용자 정보 |

## 지원 클래스

생성 코드의 일부 멤버는 프레임워크가 제공하지 않아 애플리케이션이 직접 작성하는 클래스를 호출합니다. 그 클래스의 전체 이름을 `.simplix/generator-simplix.json`의 `supportClasses`에 지정합니다.

```json
{
  "supportClasses": {
    "searchFigures": "com.example.library.app.search.ListFigures",
    "localizedSearchParams": "com.example.library.app.search.LocalizedSearchParams",
    "messages": "com.example.library.app.util.MessageUtils"
  }
}
```

| 키 | 필요한 경우 | 클래스가 제공하는 멤버 |
|---|---|---|
| `searchFigures` | yml에 `statusCounts`나 `aggregates`가 있거나, `timeAxisField`를 `figureScope`와 함께 쓸 때 | 중첩 타입 `ValueCountDTO`(`of(ValueCount)`)와 `AggregateValueDTO`(`of(AggregateValue)`, `empty(Aggregate)`), 정적 메서드 `scoped(Map)`과 `scoped(Optional)` |
| `messages` | yml에 `notFoundMessageKey`가 있을 때 | 정적 메서드 `get(String)` |
| `localizedSearchParams` | 다국어 파생 컬럼으로 검색과 정렬을 처리할 때 | 정적 메서드 `rewrite(Map, String...)` |

`searchFigures`나 `messages`가 필요한 yml인데 키를 지정하지 않았으면 `generate`가 생성을 거부합니다. `localizedSearchParams`는 지정했을 때만 동작합니다. 엔티티에 `<name>I18n` 맵과 `<name>Search` 또는 `<name>Sort<Lang>` 파생 컬럼이 있으면 검색 DTO가 파생 컬럼을 대상으로 하고, 서비스가 검색 매개변수를 이 클래스로 변환합니다.

템플릿에서 `supportClasses.find(key)`는 `{ fqn, name }` 또는 `undefined`를 돌려주고, `supportClasses.require(key, usedBy)`는 yml 이름과 키를 담은 메시지를 출력하며 렌더링을 중단합니다.

## 메시지 키

생성 코드는 다음 메시지 키를 사용합니다. 프레임워크의 메시지 번들에는 없는 키이므로 애플리케이션의 메시지 번들에 정의하세요.

| 키 | 사용 위치 |
|---|---|
| `error.id.cannot.change` | 수정 요청의 식별자가 대상 레코드와 다를 때 서비스가 발생시키는 예외 |
| `error.search.countFieldUnknown` | `statusCounts`에 없는 필드의 건수를 요청했을 때 서비스가 발생시키는 예외 |
| `error.tree.circular.reference` | 노드를 자신의 하위로 옮기려 할 때 트리 서비스가 발생시키는 예외 |
| `entities.<엔티티>.<필드>` | DTO 필드의 `@FieldLabel` |

## 관련 문서

- [템플릿 사용자 지정](ko/cli/customizing-templates.md)
- [설정 레퍼런스](ko/cli/configuration-reference.md)
