# SimpliX CLI 시작하기

이 문서는 JPA 엔티티 하나로 동작하는 API를 만드는 과정을 안내합니다. 끝까지 따라 하면 `Author` 엔티티의 서비스, REST 컨트롤러, DTO, 서비스 테스트가 직접 편집한 yml을 바탕으로 생성되고 프로젝트의 모듈에 배치됩니다. 명령과 출력은 작은 도서관 애플리케이션에서 실행한 결과이므로, 이름은 프로젝트에 맞게 바꿔 읽으세요.

## 준비

- Node.js 20 이상
- SimpliX에 의존하는 Gradle 또는 Maven 프로젝트. 루트에 `build.gradle`, `build.gradle.kts`, `pom.xml` 중 하나가 있어야 합니다.
- API를 만들 엔티티와 그 엔티티의 Spring Data 저장소

이 문서의 엔티티는 `SimpliXBaseEntity`를 상속한 프로젝트 기본 클래스를 상속하고, 레코드를 대표하는 이름 필드를 `@NameField`로 지정합니다.

```java
@Entity
@Table(name = "authors")
@Comment("A person who wrote books the library holds")
@Getter
@Setter
@NoArgsConstructor
public class Author extends BaseEntity<String> {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "author_id", nullable = false, unique = true, updatable = false)
    @Comment("Unique identifier of the author")
    private String authorId;

    @Column(name = "pen_name", nullable = false, length = 120)
    @Comment("The name printed on the books")
    @NameField
    private String penName;

    @Column(name = "biography", length = 2000)
    @Comment("A short account of the author's life")
    private String biography;

    @Override
    public String getId() {
        return authorId;
    }

    @Override
    public void setId(String id) {
        this.authorId = id;
    }
}
```

이 문서의 설정에서는 CLI가 저장소를 생성하지 않습니다. `target.targetPath`에 `repository` 항목이 없기 때문입니다. 엔티티의 `entity` 패키지와 나란한 `repository` 패키지에 `AuthorRepository`가 있어야 합니다.

```java
package com.example.library.domain.catalog.repository;

public interface AuthorRepository extends SimpliXBaseRepository<Author, String> {
}
```

## 1단계. CLI 설치

프로젝트의 SimpliX가 속한 릴리스 라인의 CLI를 설치하세요.

| 프로젝트 | SimpliX 라인 | 설치 |
|---|---|---|
| Spring Boot 4 | 2.x | `npm install -g @simplix-boot/cli` |
| Spring Boot 3 | 1.x | `npm install -g @simplix-boot/cli@spring-boot-3x` |

```bash
simplix-boot --version
```

## 2단계. 프로젝트 설정 작성

프로젝트 루트에서 `init`을 실행하세요. 다른 명령이 찾는 `.simplix` 폴더를 만듭니다.

```bash
simplix-boot init
```

```
SimpliX Boot CLI v<X.Y.Z> - Initialize

   create .simplix/entity/.gitkeep
   create .simplix/templates/.gitkeep
SimpliX initialized successfully.
```

이어서 `.simplix/generator-simplix.json`을 작성하세요. 엔티티의 위치와 생성 코드의 위치를 CLI에 알려 주는 파일입니다.

```json
{
  "entity": {
    "scanPath": "src/main/java",
    "basePackage": "com.example.library.domain"
  },
  "repository": {
    "scanPath": "src/main/java",
    "deriveFromEntity": true
  },
  "dto": {
    "excludeFields": [
      "version",
      "createdAt",
      "updatedAt",
      "createdBy",
      "updatedBy"
    ]
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
  "promote": {
    "moduleRoot": "modules"
  }
}
```

| 키 | 설정하는 내용 |
|---|---|
| `entity.scanPath`, `entity.basePackage` | 엔티티 소스의 위치와 기준 패키지 |
| `repository.deriveFromEntity` | 저장소가 `entity`와 나란한 `repository` 패키지에 있으면 `true` |
| `dto.excludeFields` | 감사 컬럼처럼 어떤 DTO에도 넣지 않을 필드 |
| `target.generatedBasePath`, `target.basePackage` | `generate`가 파일을 쓰는 폴더와 생성 클래스의 패키지 |
| `target.targetPath` | 생성할 구성 요소와 각각의 하위 경로. `{modulePath}`는 엔티티 yml의 값으로 바뀝니다 |
| `promote.moduleRoot` | `promote`가 코드를 옮길 모듈들이 있는 폴더 |

모든 키의 설명은 [설정 레퍼런스](ko/cli/configuration-reference.md)에 있습니다.

## 3단계. CLI 버전 기록

```bash
simplix-boot version --write
```

```
✔ Recorded generator version <X.Y.Z> in <project>/.simplix/generator-simplix.json
```

버전은 설정 파일의 `generator.version`에 기록됩니다. 이후에는 더 낮은 버전의 CLI를 쓰는 팀원이나 CI 작업이 파일을 쓰기 전에 중단되므로, 모두가 같은 코드를 생성합니다.

## 4단계. 엔티티 yml 작성

```bash
simplix-boot config Author
```

```
Found parent class: BaseEntity at src/main/java/com/example/library/domain/core/entity/BaseEntity.java
  Analyzed BaseEntity: found 5 fields
  Parent BaseEntity extends SimpliXBaseEntity (import: dev.simplecore.simplix.core.entity.SimpliXBaseEntity)
Parent BaseEntity extends SimpliXBaseEntity, analyzing recursively...

✔ Generated config file: Author.yml
```

`config`는 엔티티와 부모 클래스를 읽어 필드마다 항목이 하나씩 있는 `.simplix/entity/Author.yml`을 작성합니다. 이 파일은 직접 편집하는 파일입니다. 필드가 들어갈 DTO, 검색 방법, 검증 규칙을 여기서 정합니다. 먼저 파일의 윗부분을 편집하세요.

```yaml
entity: Author

modulePath: catalog
promoteModule: catalog
idField: authorId
nameField: penName
thymeleafBaseDir: catalog/author
permissionGroup: CATALOG
defaultSortField: createdAt
defaultSortDirection: desc

fields:

  authorId:
    sortable: true
    views: [list, detail, edit]
    required: true
    unique: true
    searchOperators: [equals]

  penName:
    sortable: true
    views: [list, detail, edit]
    required: true
    maxLength: 120
    searchOperators: [equals, contains]
```

| 키 | 의미 |
|---|---|
| `modulePath` | 생성 클래스의 하위 경로이자 패키지 구간 |
| `thymeleafBaseDir` | 컨트롤러의 요청 경로. `catalog/author`이면 `/catalog/author`로 제공하며, 애플리케이션이 REST 컨트롤러에 지정한 접두 경로가 있으면 그 뒤에 이어집니다 |
| `permissionGroup` | `@PreAuthorize` 검사에 쓰는 권한 그룹 |
| `views` | 필드가 들어갈 DTO. `list`, `detail`, `edit`, `batchUpdate` 중에서 고릅니다 |
| `searchOperators` | 검색 요청이 이 필드에 쓸 수 있는 연산자. 비워 두면 검색할 수 없습니다 |
| `sortable`, `required`, `unique`, `maxLength` | 필드의 정렬과 검증 |

> ℹ `config`는 `promoteModule`, `defaultSortField`, `defaultSortDirection`도 함께 씁니다. CLI는 이 키들을 읽지 않습니다. `promote`는 `--module`로 모듈을 받고, 기본 정렬은 `defaultSort`로 지정합니다. `<__MODIFY__>`로 표시된 값은 직접 채워야 하는 빈칸입니다.

## 5단계. 코드 생성

```bash
simplix-boot generate Author
```

```
✔ Found entity file:
    src/main/java/com/example/library/domain/catalog/entity/Author.java

ℹ Files to generate:
   ✔ generated/main/java/com/example/library/web/catalog/service/AuthorService.java
   ✔ generated/main/java/com/example/library/web/catalog/controller/AuthorRestController.java
   ✔ generated/main/java/com/example/library/web/catalog/dto/AuthorDTOs.java
   ✔ generated/test/java/com/example/library/web/catalog/service/AuthorServiceTest.java

✔ Successfully generated CRUD files for Author!
```

파일은 `generated/` 아래에 생성됩니다. 자유롭게 읽고 다시 생성할 수 있는 임시 트리이므로 `generated/`를 `.gitignore`에 추가하세요. yml을 바꾼 뒤에는 `generate Author --force`로 다시 씁니다.

## 6단계. 모듈로 옮기기

`promote`를 실행하기 전에 모듈 폴더가 있어야 합니다. 모듈 폴더는 Gradle 하위 프로젝트이거나, 단일 프로젝트 빌드의 소스 폴더입니다.

```bash
mkdir -p modules/catalog
simplix-boot promote Author --module catalog
```

```
ℹ Promoting Author to module "catalog"...
ℹ Module path: catalog
ℹ Target module: modules/catalog

ℹ Service:
  From: generated/main/java/com/example/library/web/catalog/service/AuthorService.java
  To:   modules/catalog/src/main/java/com/example/library/web/catalog/service/AuthorService.java
  ✔ Written (absent or untouched)

...

ℹ Summary:
  written: 4

✔ Promotion complete!
```

`promote`는 각 파일을 `modules/catalog` 아래의 소스 경로로 옮기고 파일 첫머리에 생성 표시를 추가합니다. 같은 내용을 `.simplix/bases/`에도 저장하는데, 이 사본이 있어야 직접 고친 파일에 이후의 템플릿 변경을 병합할 수 있습니다. `.simplix/`를 모듈과 함께 커밋하세요.

```java
// @simplix-generated
// @simplix-render 2595cf7d3830 promote Author --module catalog
```

## 결과 확인

```bash
simplix-boot generated
```

```
untouched  modules/catalog/src/main/java/com/example/library/web/catalog/service/AuthorService.java
untouched  modules/catalog/src/main/java/com/example/library/web/catalog/controller/AuthorRestController.java
untouched  modules/catalog/src/main/java/com/example/library/web/catalog/dto/AuthorDTOs.java
untouched  modules/catalog/src/test/java/com/example/library/web/catalog/service/AuthorServiceTest.java

untouched 4
```

모든 파일이 `untouched`입니다. 현재 템플릿이 만드는 내용과 정확히 같다는 뜻입니다. 프로젝트를 빌드해 새 클래스를 컴파일하세요.

```bash
./gradlew build
```

생성 코드는 애플리케이션이 정의해야 하는 메시지 키를 몇 개 사용합니다. `error.id.cannot.change`와 필드 라벨 `entities.Author.<필드>`가 그 예입니다. 전체 목록은 [템플릿 레퍼런스](ko/cli/template-reference.md#메시지-키)에 있습니다.

## 다음 단계

- [생성 코드 갱신](ko/cli/updating-generated-code.md): 나중에 yml이나 템플릿을 바꾸면서 직접 고친 내용을 유지합니다.
- [템플릿 사용자 지정](ko/cli/customizing-templates.md): 생성 코드를 프로젝트의 규칙에 맞춥니다.
- [설정 레퍼런스](ko/cli/configuration-reference.md): 다른 엔티티 참조, 내보내기, 집계를 포함한 yml의 모든 키를 설명합니다.
