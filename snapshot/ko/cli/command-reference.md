# 명령 레퍼런스

`simplix-boot`의 모든 명령을 인자, 옵션, 출력, 종료 코드와 함께 설명합니다. 명령을 사용하는 순서는 [시작하기](ko/cli/getting-started.md)에 있습니다.

```
simplix-boot init
simplix-boot config <EntityName> [--force] [--skip-version-check]
simplix-boot generate <EntityName> [--force] [--no-test] [--skip-version-check]
simplix-boot promote <EntityName> --module <module> [--adopt] [--force] [--skip-version-check]
simplix-boot generated [--no-render] [--json]
simplix-boot templates [--eject [<template>]] [--force]
simplix-boot version [--json] [--write] [--update [--to <X.Y.Z>]]
simplix-boot help
simplix-boot --version
```

## 공통 규칙

- `init`, `version`, `help`를 제외한 명령은 프로젝트 안에서 실행합니다. 프로젝트 루트는 현재 폴더와 그 상위 폴더 중 `.simplix`가 있는 가장 가까운 폴더이므로, 프로젝트의 어느 폴더에서든 명령을 실행할 수 있습니다.
- 불리언 옵션은 `--이름`으로 켜고 `--no-이름`으로 끕니다. 문자열 옵션은 `--이름 값` 또는 `--이름=값`으로 지정합니다.
- 명령이 선언하지 않은 옵션이나 남는 인자가 있으면 아무 작업도 하지 않고 중단합니다.
- 진행 상황과 보고는 표준 출력에, 중단 사유는 표준 오류에 출력합니다.
- `simplix-boot generate Book | head`처럼 출력을 읽는 프로세스가 먼저 종료해도 명령은 작업을 끝까지 수행하고 원래의 종료 코드로 끝냅니다.
- `NO_COLOR`가 설정되어 있거나 출력이 터미널이 아니면 색을 넣지 않습니다.
- `simplix-boot <명령> --help`는 해당 명령의 사용법과 옵션을 출력합니다.

| 종료 코드 | 의미 |
|---|---|
| 0 | 명령이 끝까지 실행됨 |
| 1 | 명령을 실행할 수 없었거나, 확인이 필요한 파일이 남음 |

## init

```bash
simplix-boot init
```

현재 폴더에 `.simplix/entity`와 `.simplix/templates`를 만듭니다. `.simplix`가 이미 있으면 아무것도 바꾸지 않습니다. `.simplix/simplix-boot.json`은 만들지 않으므로 직접 작성하세요([설정 레퍼런스](ko/cli/configuration-reference.md)).

## config

```bash
simplix-boot config <EntityName> [--force] [--skip-version-check]
```

`entity.scanPath` 아래에서 `<EntityName>.java`를 찾아 부모 클래스, 참조하는 엔티티와 함께 분석하고 `.simplix/entity/<EntityName>.yml`을 작성합니다.

| 옵션 | 동작 |
|---|---|
| `--force` | 편집한 내용을 포함해 기존 yml을 덮어씁니다. 지정하지 않으면 기존 파일을 유지합니다 |
| `--skip-version-check` | 이번 실행에 한해 버전 검사를 건너뜁니다 |

## generate

```bash
simplix-boot generate <EntityName> [--force] [--no-test] [--skip-version-check]
```

`.simplix/entity/<EntityName>.yml`로 템플릿을 렌더링해 `target.generatedBasePath` 아래에 파일을 씁니다. `<EntityName>`은 yml 파일의 이름이며 생성 클래스 이름의 접두어입니다. yml의 `entity` 키에 다른 클래스를 지정하면 그 엔티티의 클래스 묶음을 하나 더 생성합니다. `entity`는 이 명령의 다른 이름입니다.

| 옵션 | 동작 |
|---|---|
| `--force` | 생성 트리에 이미 있는 파일을 덮어씁니다. 지정하지 않으면 건너뜁니다 |
| `--no-test` | 테스트 파일을 생성하지 않습니다 |
| `--skip-version-check` | 이번 실행에 한해 버전 검사를 건너뜁니다 |

`target.targetPath`에 경로를 지정한 구성 요소를 생성합니다.

| 구성 요소 | 파일 | 생성 조건 |
|---|---|---|
| `service` | `<Name>Service.java` | 경로를 지정함 |
| `controllerRest` | `<Name>RestController.java` 또는 yml의 `controllerName` | 경로를 지정함 |
| `controllerWeb` | `<Name>Controller.java` | 경로를 지정함 |
| `dto` | `<Name>DTOs.java` | 경로를 지정함 |
| `repository` | `<Name>Repository.java` | 경로를 지정함 |
| 서비스 테스트 | `<Name>ServiceTest.java` | `service`를 생성하고 `--no-test`를 지정하지 않음 |
| 컨트롤러 테스트 | `<Name>RestControllerTest.java` | 프로젝트가 `test/EntityRestControllerTest.java.template`을 제공함 |
| 트리 서비스 | `<Name>TreeService.java`와 테스트 | 엔티티가 `TreeEntity`를 구현함 |

템플릿 렌더링에 실패하면 해당 파일과 사유를 출력하고, 나머지 파일을 쓴 뒤 종료 코드 1로 끝냅니다.

## promote

```bash
simplix-boot promote <EntityName> --module <module> [--adopt] [--force] [--skip-version-check]
```

엔티티 하나의 생성 파일을 `<promote.moduleRoot>/<module>` 아래의 소스 경로로 옮깁니다. 파일마다 지문을 넣고 같은 내용을 `.simplix/bases/`에 저장하며, 이후의 `promote`는 저장된 사본을 사용해 템플릿 변경을 직접 고친 내용에 병합합니다. 결과별 설명은 [생성 코드 갱신](ko/cli/updating-generated-code.md)에 있습니다.

| 옵션 | 동작 |
|---|---|
| `--module <module>` | 대상 모듈. 모듈 루트 아래의 경로로 지정합니다(예: `admin/billing`). 필수입니다 |
| `--adopt` | 기준 렌더가 없는 파일의 내용을 유지하고 이번 렌더를 기준 렌더로 저장합니다 |
| `--force` | 직접 고친 내용을 포함해 모든 파일을 새 렌더로 덮어씁니다 |
| `--skip-version-check` | 이번 실행에 한해 버전 검사를 건너뜁니다 |

파일별 결과는 `written`, `merged`, `current`, `removed`, `adopted`, `conflict`, `no-base`입니다. `conflict`나 `no-base`인 파일이 하나라도 있으면 종료 코드 1로 끝내며, 이 결과의 생성 파일은 `promote`를 다시 실행할 수 있도록 생성 트리에 남겨 둡니다.

## generated

```bash
simplix-boot generated [--no-render] [--json]
```

모듈로 옮긴 모든 파일의 상태를 보고합니다. 옮긴 엔티티를 생성 트리에 다시 렌더링한 뒤 저장된 기준 렌더, 모듈의 파일, 새 렌더를 비교합니다.

| 옵션 | 동작 |
|---|---|
| `--no-render` | 렌더링하지 않고 저장된 기준 렌더만으로 판정합니다. `stale`과 `conflict`는 찾지 못합니다 |
| `--json` | 보고를 JSON 한 줄로 출력합니다 |

| 상태 | 종료 코드 |
|---|---|
| `untouched`, `edited`, `removed` | 0 |
| `stale`, `conflict`, `no-base` | 1 |

```json
{"files":[{"path":"modules/catalog/src/main/java/com/example/library/web/catalog/service/AuthorService.java","entity":"Author","state":"edited"}],"counts":{"edited":1}}
```

렌더링에 실패한 엔티티가 있으면 상태를 판정하지 않고 종료 코드 1로 끝냅니다.

## templates

```bash
simplix-boot templates [--eject [<template>]] [--force]
```

옵션 없이 실행하면 템플릿마다 출처를 출력합니다. `project`는 `.simplix/templates`의 파일, `built-in`은 CLI에 포함된 템플릿입니다.

| 옵션 | 동작 |
|---|---|
| `--eject` | 내장 템플릿을 모두 `.simplix/templates`로 복사합니다. 상대 경로를 주면 그 템플릿만 복사합니다 |
| `--force` | `--eject`와 함께 쓰면 프로젝트에 이미 있는 파일을 덮어씁니다 |

## version

```bash
simplix-boot version [--json] [--write] [--update [--to <X.Y.Z>]]
```

실행 중인 버전, 프로젝트가 기록한 버전, 같은 릴리스 라인에 게시된 최신 버전을 보고합니다. 프로젝트 밖에서도 실행됩니다.

| 옵션 | 동작 |
|---|---|
| `--json` | 보고를 JSON 한 줄로 출력합니다 |
| `--write` | 실행 중인 버전을 `generator.version`에 기록합니다. 파일의 나머지 내용은 바꾸지 않습니다. 설정 파일 이름이 `generator-simplix.json`이면 먼저 `simplix-boot.json`으로 바꿉니다 |
| `--update` | 같은 릴리스 라인의 최신 버전을 전역으로 설치합니다 |
| `--to <X.Y.Z>` | `--update`가 설치할 버전 |

| `--json`의 `status` | 의미 |
|---|---|
| `match` | 실행 중인 버전이 기록된 버전과 같습니다 |
| `ahead` | 실행 중인 버전이 더 높습니다. 명령은 실행되며 차이를 알립니다 |
| `outdated` | 실행 중인 버전이 더 낮습니다. `config`, `generate`, `promote`가 실행을 거부합니다 |
| `unrecorded` | 프로젝트가 버전을 기록하지 않았습니다 |
| `unknown` | 기록된 값을 버전으로 읽을 수 없습니다 |

## 관련 문서

- [설정 레퍼런스](ko/cli/configuration-reference.md)
- [템플릿 레퍼런스](ko/cli/template-reference.md)
- [문제 해결](ko/cli/troubleshooting.md)
