# 명령 가이드

`simplix-boot`의 명령별 인자와 옵션, 출력, 종료 코드를 설명합니다.

## 목차

- [공통 규칙](#공통-규칙)
- [init](#init)
- [config](#config)
- [generate](#generate)
- [promote](#promote)
- [generated](#generated)
- [templates](#templates)
- [version](#version)

## 공통 규칙

- `init`과 `version`을 제외한 명령은 프로젝트 안에서 실행해야 합니다. 프로젝트 루트의 하위 디렉터리에서 실행해도 됩니다.
- 불리언 옵션은 `--이름`으로 켜고 `--no-이름`으로 끕니다. 문자열 옵션은 `--이름 값` 또는 `--이름=값`으로 지정합니다.
- 명령이 선언하지 않은 옵션이나 남는 인자가 있으면 실행하지 않고 종료 코드 1로 끝냅니다.
- 진행 상황과 결과는 표준 출력에, 실행을 중단한 사유는 표준 오류에 출력합니다.
- 표준 출력을 읽는 프로세스가 먼저 종료해도(`simplix-boot generate Book | head`) 명령은 작업을 끝까지 수행하고 원래의 종료 코드로 끝냅니다.
- `NO_COLOR` 환경 변수를 설정하거나 출력이 터미널이 아니면 색을 넣지 않습니다.
- `simplix-boot <명령> --help`는 해당 명령의 사용법과 옵션을 출력합니다.

| 종료 코드 | 의미 |
|-----------|------|
| 0 | 명령이 끝까지 실행됐습니다. |
| 1 | 명령을 실행할 수 없었거나, 확인이 필요한 파일이 남았습니다. |

## init

```bash
simplix-boot init
```

현재 디렉터리에 `.simplix/entity`와 `.simplix/templates` 폴더를 만듭니다. `.simplix` 폴더가 이미 있으면 아무것도 바꾸지 않습니다. 설정 파일 `.simplix/generator-simplix.json`은 직접 작성하세요.

## config

```bash
simplix-boot config <EntityName> [--force] [--skip-version-check]
```

`entity.scanPath` 아래에서 `<EntityName>.java`를 찾아 분석하고 `.simplix/entity/<EntityName>.yml`을 작성합니다. 부모 클래스의 필드와 참조 엔티티의 식별자, 이름 필드도 함께 읽습니다.

| 옵션 | 설명 |
|------|------|
| `--force` | 이미 있는 yml을 덮어씁니다. 지정하지 않으면 기존 파일을 유지합니다. |
| `--skip-version-check` | 버전 검사를 이번 실행에 한해 건너뜁니다. |

작성한 yml에서 `<__MODIFY__>`로 표시된 값은 직접 채우세요.

## generate

```bash
simplix-boot generate <EntityName> [--force] [--no-test] [--skip-version-check]
```

`.simplix/entity/<EntityName>.yml`과 템플릿으로 생성 트리(generated tree)에 파일을 씁니다. 생성 트리는 `target.generatedBasePath` 아래의 폴더입니다. `<EntityName>`은 yml의 파일 이름이며 생성하는 클래스 이름의 접두어가 됩니다. yml의 `entity` 키에 다른 엔티티 클래스를 지정하면 같은 엔티티에 대한 화면을 하나 더 만들 수 있습니다.

| 옵션 | 설명 |
|------|------|
| `--force` | 이미 있는 파일을 덮어씁니다. 지정하지 않으면 기존 파일을 건너뜁니다. |
| `--no-test` | 테스트 파일을 생성하지 않습니다. |
| `--skip-version-check` | 버전 검사를 이번 실행에 한해 건너뜁니다. |

생성 대상은 `target.targetPath`에 경로를 지정한 구성 요소입니다.

| 구성 요소 | 생성 파일 | 조건 |
|-----------|-----------|------|
| `service` | `<Name>Service.java` | |
| `controllerRest` | `<Name>RestController.java` 또는 yml의 `controllerName` | |
| `controllerWeb` | `<Name>Controller.java` | |
| `dto` | `<Name>DTOs.java` | |
| `repository` | `<Name>Repository.java` | |
| 서비스 테스트 | `<Name>ServiceTest.java` | `service` 경로가 있고 `--no-test`가 아닐 때 |
| 컨트롤러 테스트 | `<Name>RestControllerTest.java` | 프로젝트가 해당 템플릿을 제공할 때 |
| 트리 서비스 | `<Name>TreeService.java`와 테스트 | 엔티티가 `TreeEntity`를 구현할 때 |

템플릿 하나라도 렌더링에 실패하면 실패한 파일과 사유를 출력하고, 나머지 파일을 쓴 뒤 종료 코드 1로 끝냅니다. `entity`는 `generate`의 다른 이름입니다.

## promote

```bash
simplix-boot promote <EntityName> --module <module> [--adopt] [--force] [--skip-version-check]
```

생성 트리의 파일을 `<promote.moduleRoot>/<module>` 아래의 소스 경로로 옮깁니다. 옮긴 파일은 추적 렌더(tracked render)가 됩니다. `promote`는 파일에 렌더 지문(render fingerprint)을 넣고 같은 내용을 `.simplix/bases/`에 기준 렌더(base render)로 저장하며, 이후의 `promote`가 기준 렌더를 기준으로 템플릿 변경을 병합합니다.

| 옵션 | 설명 |
|------|------|
| `--module <module>` | 대상 모듈입니다. 모듈 루트 아래의 경로로 지정합니다(예: `admin/billing`). 필수입니다. |
| `--adopt` | 기준 렌더 없이 모듈에 있던 파일에 이번 렌더를 기준으로 지정합니다. 파일 내용은 유지합니다. |
| `--force` | 직접 고친 내용을 포함해 파일을 덮어씁니다. |
| `--skip-version-check` | 버전 검사를 이번 실행에 한해 건너뜁니다. |

파일별 결과는 다음 중 하나입니다.

| 결과 | 의미 |
|------|------|
| `written` | 파일이 없었거나 고친 적이 없어 새 렌더로 썼습니다. |
| `merged` | 직접 고친 내용에 템플릿 변경을 병합했습니다. |
| `current` | 직접 고친 파일이 이미 템플릿 변경을 담고 있습니다. |
| `removed` | 옮긴 뒤 삭제한 파일이어서 삭제한 상태로 둡니다. |
| `adopted` | 이번 렌더를 기준으로 지정했습니다. |
| `conflict` | 병합이 충돌했습니다. 파일을 그대로 두고 충돌 표시가 든 결과를 `generated/conflicts/`에 씁니다. |
| `no-base` | 직접 고친 파일에 기준 렌더가 없습니다. `--adopt` 또는 `--force`로 다시 실행하세요. |

`conflict`나 `no-base`가 하나라도 있으면 종료 코드 1로 끝냅니다. `conflict`와 `no-base` 결과의 파일은 생성 트리에 남으므로 문제를 해결한 뒤 다시 실행할 수 있습니다.

## generated

```bash
simplix-boot generated [--no-render] [--json]
```

모듈로 옮긴 모든 파일의 상태를 보고합니다. 기본 동작은 옮긴 엔티티를 생성 트리에 다시 렌더링한 뒤 현재 템플릿의 결과와 비교하는 것입니다.

| 옵션 | 설명 |
|------|------|
| `--no-render` | 다시 렌더링하지 않고 저장된 기준 렌더만으로 판정합니다. |
| `--json` | 결과를 JSON 한 줄로 출력합니다. |

| 상태 | 의미 | 종료 코드 |
|------|------|-----------|
| `untouched` | 옮긴 그대로이며 지금 렌더링해도 같습니다. | 0 |
| `edited` | 직접 고쳤고, 현재 렌더가 충돌 없이 병합됩니다. | 0 |
| `removed` | 기준 렌더가 있고 파일은 삭제했습니다. | 0 |
| `stale` | 고치지 않았지만 현재 렌더와 다릅니다. `promote`가 다시 씁니다. | 1 |
| `conflict` | 직접 고쳤고, 현재 렌더가 그 내용과 충돌합니다. | 1 |
| `no-base` | 파일은 있는데 기준 렌더가 없습니다. | 1 |

`--json`의 출력 형식은 다음과 같습니다.

```json
{"files":[{"path":"modules/catalog/src/main/java/com/example/library/web/catalog/service/BookService.java","entity":"Book","state":"untouched"}],"counts":{"untouched":1}}
```

엔티티 하나라도 렌더링에 실패하면 상태를 판정하지 않고 종료 코드 1로 끝냅니다.

## templates

```bash
simplix-boot templates [--eject [<template>]] [--force]
```

옵션 없이 실행하면 템플릿마다 출처를 출력합니다. `project`는 프로젝트의 `.simplix/templates`에 있는 파일, `built-in`은 CLI에 포함된 파일입니다.

```
built-in  dto/EntityDTOs.java.template
project   service/EntityService.java.template (replaces the built-in template)
```

| 옵션 | 설명 |
|------|------|
| `--eject` | 내장 템플릿을 `.simplix/templates`로 복사합니다. 템플릿 상대 경로를 주면 그 파일만 복사합니다. |
| `--force` | 프로젝트에 이미 있는 파일을 덮어씁니다. 지정하지 않으면 기존 파일을 유지합니다. |

## version

```bash
simplix-boot version [--json] [--write] [--update [--to <X.Y.Z>]]
```

실행 중인 CLI 버전, 프로젝트가 `generator.version`에 기록한 버전, 같은 릴리스 라인에서 npm에 게시된 최신 버전을 보고합니다. 프로젝트 밖에서도 실행할 수 있습니다. 릴리스 라인별 npm 태그는 [개요](overview.md#릴리스-라인)에 있습니다.

| 옵션 | 설명 |
|------|------|
| `--json` | 결과를 JSON 한 줄로 출력합니다. |
| `--write` | 실행 중인 버전을 `generator-simplix.json`의 `generator.version`에 기록합니다. 파일의 다른 내용은 바꾸지 않습니다. |
| `--update` | 같은 릴리스 라인에서 npm에 게시된 최신 버전을 전역으로 설치합니다. |
| `--to <X.Y.Z>` | `--update`가 설치할 버전을 지정합니다. |

`--json`의 `status` 값은 다음과 같습니다.

| 값 | 의미 |
|----|------|
| `match` | 실행 중인 버전이 기록한 버전과 같습니다. |
| `ahead` | 실행 중인 버전이 더 높습니다. 명령은 실행되고 차이를 알립니다. |
| `outdated` | 실행 중인 버전이 더 낮습니다. `config`, `generate`, `promote`가 실행을 거부합니다. |
| `unrecorded` | 프로젝트가 버전을 기록하지 않았습니다. |
| `unknown` | 기록한 값을 버전으로 읽을 수 없습니다. |

버전은 `X.Y.Z` 부분만 비교합니다. 개발 빌드의 `-SNAPSHOT` 접미어는 비교에서 제외합니다.

## 관련 문서

- [개요](ko/cli/overview.md)
- [템플릿 가이드](ko/cli/template-guide.md)
- [설정 레퍼런스](ko/cli/configuration.md)
