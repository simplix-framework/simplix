# 문제 해결

CLI가 중단하면서 출력하는 메시지와 그 원인, 해결 방법을 정리했습니다. 메시지의 버전 부분은 `<X.Y.Z>` 같은 표기로 대체했습니다.

## .simplix 폴더가 없음

```
✖ The .simplix directory is missing. Run "simplix-boot init" in the project root first.
```

**원인**: 프로젝트 밖에서 명령을 실행했습니다. 현재 폴더와 그 상위 폴더 어디에도 `.simplix`가 없습니다.

**해결**: 프로젝트 폴더로 이동하거나, 새 프로젝트의 루트에서 `simplix-boot init`을 실행하세요.

## 선언하지 않은 옵션

```
✖ Unknown option: --dry-run
```

**원인**: 명령이 선언하지 않은 옵션입니다. 아무 작업도 수행하지 않았습니다.

**해결**: `simplix-boot <명령> --help`로 해당 명령의 옵션을 확인하세요.

## 엔티티 파일을 찾을 수 없음

```
✖ Entity file not found
Looking for: Nope.java
Searched in: <project>/src/main/java
```

**원인**: `config`나 `generate`가 `entity.scanPath` 아래에서 그 이름의 소스 파일을 찾지 못했습니다.

**해결**: 엔티티 이름의 철자를 확인하고, `.simplix/simplix-boot.json`의 `entity.scanPath`를 확인하세요. 멀티 모듈 프로젝트에서는 모든 모듈의 엔티티를 포함하는 폴더를 지정합니다.

## 엔티티 yml을 찾을 수 없음

```
✖ .simplix/entity/Nope.yml not found. Run "simplix-boot config Nope" to create it.
```

**원인**: yml이 아직 없는 엔티티에 `generate`나 `promote`를 실행했습니다.

**해결**: `simplix-boot config <EntityName>`을 실행하고, 작성된 yml을 편집하세요.

## 프로젝트가 더 높은 CLI 버전을 요구함

```
✖ Generator <running> is older than the version this project requires (<required>).
  latest on npm: <latest>
  update: npm install -g @simplix-boot/cli@<required>
  or:     simplix-boot version --update
  skip:   rerun with --skip-version-check
```

**원인**: 프로젝트의 `generator.version`에 실행 중인 CLI보다 높은 버전이 기록되어 있습니다.

**해결**: `simplix-boot version --update`를 실행하거나 메시지에 표시된 버전을 설치하세요. `--skip-version-check`를 지정하면 그 실행에 한해 검사를 건너뛰지만, 팀과 다른 코드가 생성될 수 있습니다.

## 템플릿 렌더링 실패

```
   ✖ generated/main/java/com/example/library/web/catalog/dto/BookDTOs.java
     Failed to render dto/EntityDTOs.java.template: <template path>:<line> ...
✖ 1 of 4 files failed to render for Book: BookDTOs.java
```

**원인**: 이 엔티티를 렌더링하는 중에 템플릿에서 오류가 발생했습니다. 대개 이 엔티티에 없는 yml 값이나 필드 속성을 템플릿이 읽기 때문입니다. 메시지에는 사용한 템플릿(프로젝트에 사본이 있으면 그 파일)과 줄 번호가 표시됩니다.

**해결**: 해당 줄의 템플릿이나 yml 값을 고친 뒤 `simplix-boot generate <EntityName> --force`를 실행하세요. 나머지 파일은 이미 썼으며, 렌더링이 성공할 때까지 `generated`는 이 엔티티에서 중단합니다.

## yml 키에 지원 클래스가 필요함

```
Book.yml uses statusCounts or aggregates, which needs supportClasses.searchFigures in .simplix/simplix-boot.json
```

**원인**: yml이 요청한 기능의 생성 코드가 애플리케이션 클래스를 호출하는데, 그 클래스를 지정하지 않았습니다.

**해결**: 그 클래스를 `supportClasses`에 지정하세요([템플릿 레퍼런스](./template-reference.md#지원-클래스)).

## 템플릿을 건너뜀

```
   ⚠ SKIP: generated/.../BookDTOs.java (template not found: .simplix/templates/dto/AdminDTOs.java.template)
```

**원인**: `template`에 지정한 경로의 파일이 프로젝트에도 내장 템플릿에도 없습니다.

**해결**: 경로를 고치거나 `.simplix/templates` 아래의 그 경로에 템플릿을 두세요.

## 내장 템플릿의 변경이 반영되지 않음

**원인**: 프로젝트에 같은 상대 경로의 파일이 있어 그 파일을 사용하고 있습니다.

**해결**: `simplix-boot templates`의 출력에서 `project`로 표시된 파일입니다. 프로젝트 파일을 편집하거나, 삭제해서 내장 템플릿을 다시 사용하세요.

## promote가 conflict 또는 no-base를 보고함

**원인**: 직접 고친 줄을 템플릿도 바꿨거나(`conflict`), 파일에 저장된 기준 렌더가 없습니다(`no-base`). 어느 경우에도 파일은 그대로 유지됩니다.

**해결**: [생성 코드 갱신](./updating-generated-code.md#충돌-해결)의 절차를 따르세요.

## 생성된 DTO가 keyword에서 컴파일되지 않음

**원인**: yml의 필드에 `searchKeyword: true`를 지정하면 `@SearchableField(keyword = true)`를 생성합니다. 프로젝트가 `keyword` 속성이 없는 searchable-jpa 릴리스를 사용하고 있습니다. 더 낮은 searchable-jpa 버전을 고정했거나, CLI보다 낮은 SimpliX 릴리스를 사용하는 경우입니다.

**해결**: `./gradlew dependencies --configuration compileClasspath`로 실제 적용된 searchable-jpa 버전을 확인하세요. 고정한 버전을 제거하거나 SimpliX를 CLI와 같은 릴리스로 올리세요. 또는 yml에서 `searchKeyword`를 제거하고 다시 생성하세요.

## 명령을 찾을 수 없음

**원인**: 사용 중인 Node.js 버전에 CLI가 설치되어 있지 않거나, 연결한 체크아웃을 옮겼거나 삭제했거나 `simplix-cli`가 없는 브랜치로 전환했습니다.

**해결**: `npm ls -g --depth=0`으로 설치 상태와 링크 대상을 확인하세요. CLI를 설치하거나 `npm link`를 다시 실행합니다([버전 관리](./managing-versions.md)).
