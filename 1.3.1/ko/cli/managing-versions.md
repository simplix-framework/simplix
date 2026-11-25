# 버전 관리

CLI는 SimpliX와 함께 릴리스되며 프레임워크와 같은 버전을 사용합니다. 이 문서는 프로젝트에 맞는 CLI를 설치하는 방법, 팀과 CI가 같은 버전을 쓰게 하는 방법, 갱신하는 방법, 프레임워크 체크아웃의 CLI를 바로 실행하는 방법을 설명합니다.

## 프로젝트에 맞는 라인 설치

SimpliX는 Spring Boot 세대마다 릴리스 라인이 하나씩 있고, 라인마다 CLI를 별도의 npm 태그로 게시합니다. 한 라인의 템플릿은 그 라인의 프레임워크 클래스를 호출하므로, 프로젝트가 사용하는 라인의 CLI를 설치하세요.

| 프로젝트 | SimpliX 라인 | npm 태그 | 설치 |
|---|---|---|---|
| Spring Boot 4 | 2.x | `latest` | `npm install -g @simplix-boot/cli` |
| Spring Boot 3 | 1.x | `spring-boot-3x` | `npm install -g @simplix-boot/cli@spring-boot-3x` |

`npx`에도 같은 패키지 표기를 사용하며, 이 경우 설치하지 않고 실행합니다.

```bash
npx @simplix-boot/cli generate Author
npx @simplix-boot/cli@spring-boot-3x generate Author
```

## 팀이 쓸 버전 고정

```bash
simplix-boot version --write
```

실행 중인 CLI의 버전을 `.simplix/generator-simplix.json`의 `generator.version`에 기록하며, 파일의 다른 내용은 바꾸지 않습니다. 이 파일을 커밋하세요. 이후 `config`, `generate`, `promote`는 파일을 쓰기 전에 실행 중인 CLI와 기록된 버전을 비교합니다.

| 실행 중인 CLI | 동작 |
|---|---|
| 기록된 버전보다 낮음 | 아무것도 쓰지 않고 중단하며 갱신 방법을 출력합니다 |
| 같은 버전 | 명령을 실행합니다 |
| 기록된 버전보다 높음 | 명령을 실행하고, 새 버전을 기록하라고 안내합니다 |
| 기록된 버전 없음 | 명령을 실행하고 한 줄 안내를 출력합니다 |

```
✖ Generator <running> is older than the version this project requires (<required>).
  latest on npm: <latest>
  update: npm install -g @simplix-boot/cli@<required>
  or:     simplix-boot version --update
  skip:   rerun with --skip-version-check
```

버전은 `X.Y.Z` 부분만 비교합니다. 낮은 버전의 CLI를 거부하는 이유는 템플릿과 yml 키가 함께 바뀌기 때문입니다. 낮은 버전은 프로젝트가 더 이상 기대하지 않는 코드를 오류 없이 생성합니다. `--skip-version-check`를 지정하면 그 실행에 한해 검사를 건너뜁니다.

## 확인과 갱신

```bash
simplix-boot version
```

```
SimpliX Boot CLI version status

  package:  @simplix-boot/cli
  running:  <X.Y.Z>
  required: <X.Y.Z>
  latest:   <X.Y.Z>
  config:   <project>/.simplix/generator-simplix.json

✔ The running CLI matches this project.
```

`latest`는 실행 중인 CLI와 같은 라인에 게시된 최신 버전입니다. 따라서 1.x CLI에 2.x로 갱신하라는 안내는 출력되지 않습니다.

```bash
# Install the newest version of the same line
simplix-boot version --update

# Install one exact version
simplix-boot version --update --to <X.Y.Z>

# Then record it for the team
simplix-boot version --write
```

갱신한 뒤에는 [생성 코드 갱신](ko/cli/updating-generated-code.md)의 절차로 모듈의 파일을 갱신하고, 프로젝트 템플릿을 내장 템플릿과 비교하세요.

## 프레임워크 체크아웃의 CLI 실행

SimpliX 저장소를 체크아웃해 두었다면 그 안의 `simplix-cli` 폴더를 전역 `simplix-boot` 명령으로 연결할 수 있습니다. npm이 이 폴더에 대한 심볼릭 링크를 만들기 때문에, 명령은 체크아웃의 현재 소스를 그대로 실행합니다.

```bash
cd <simplix checkout>/simplix-cli

# Install the runtime dependencies of the CLI
npm ci

# Register simplix-boot as a global command that points at this folder
npm link

# The link target is shown after "->"
npm ls -g --depth=0
```

| 상황 | 처리 |
|---|---|
| 새 커밋을 받음 | 다시 연결하지 않아도 됩니다. 연결된 명령이 새 소스를 실행합니다 |
| `simplix-cli/package.json`의 의존성이 바뀜 | 폴더에서 `npm ci`를 다시 실행 |
| Node.js 버전을 바꿈 | `npm link`를 다시 실행. 버전 관리 도구는 Node.js 버전마다 전역 폴더를 따로 둡니다 |
| 다른 릴리스 라인의 브랜치로 전환함 | 명령이 그 라인의 CLI를 실행합니다 |
| 체크아웃을 옮기거나 삭제함 | 새 위치에서 `npm link`를 다시 실행 |
| 연결을 해제하려 함 | `npm unlink -g @simplix-boot/cli` |

> ⚠ 연결한 CLI는 개발 빌드로 실행됩니다. 연결한 CLI에서 `version --write`로 프로젝트의 버전을 고정하는 것은 팀 전체와 CI가 그 버전을 실행할 수 있을 때만 하세요.

## 관련 문서

- [명령 레퍼런스](ko/cli/command-reference.md#version)
- [생성 코드 갱신](ko/cli/updating-generated-code.md)
