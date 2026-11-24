# SimpliX CLI

JPA 엔티티에서 SimpliX 서비스, REST 컨트롤러, DTO, 테스트 코드를 생성하는 명령줄 도구입니다. npm 패키지 이름은 `@simplix-boot/cli`이고 실행 파일 이름은 `simplix-boot`입니다.

## 주요 기능

- ✔ **엔티티 분석** - JPA 엔티티 소스를 읽어 필드, 식별자, 연관 관계를 담은 yml을 작성합니다.
- ✔ **코드 생성** - yml과 템플릿으로 서비스, REST 컨트롤러, DTO, 서비스 테스트를 생성합니다.
- ✔ **내장 템플릿** - 템플릿을 CLI에 포함해 배포하므로 프로젝트에 템플릿을 복사하지 않아도 생성할 수 있습니다.
- ✔ **프로젝트 템플릿 우선** - `.simplix/templates`에 같은 상대 경로의 파일을 두면 내장 템플릿 대신 그 파일로 렌더링합니다.
- ✔ **추적 렌더(tracked render)** - 모듈로 옮긴 파일에 렌더 지문(render fingerprint)을 기록하고, 템플릿이 바뀌면 직접 고친 내용에 3방향 병합으로 반영합니다.
- ✔ **버전 고정** - 프로젝트가 요구하는 CLI 버전을 설정 파일에 기록하고, 더 낮은 버전의 CLI로는 생성하지 않습니다.

## 빠른 시작

### 1. 실행

설치 없이 실행하려면 `npx`를 사용하세요.

```bash
npx @simplix-boot/cli help
```

자주 쓰는 환경에서는 전역으로 설치하세요.

```bash
npm install -g @simplix-boot/cli
simplix-boot help
```

Spring Boot 3 기반의 SimpliX 1.x 프로젝트에서는 `@simplix-boot/cli@spring-boot-3x`를 설치하세요. 릴리스 라인별 설치 방법은 [개요](docs/ko/overview.md#릴리스-라인)에 있습니다.

SimpliX 프레임워크 체크아웃이 있으면 그 안의 `simplix-cli`를 전역 명령으로 연결해 사용할 수 있습니다. 게시된 버전을 기다리지 않고 체크아웃의 현재 소스로 실행합니다. 확인과 해제 방법은 [개요](docs/ko/overview.md#설치와-실행)에 있습니다.

```bash
cd <simplix checkout>/simplix-cli
npm ci
npm link
simplix-boot --version
```

### 2. 프로젝트 설정

프로젝트 루트에서 `.simplix` 폴더를 만듭니다.

```bash
simplix-boot init
```

`.simplix/generator-simplix.json`을 작성합니다.

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

### 3. 사용

```bash
# Write .simplix/entity/Book.yml from the Book entity
simplix-boot config Book

# Edit the yml, then generate the code into the generated tree
simplix-boot generate Book

# Move the generated files into a module as tracked renders
simplix-boot promote Book --module catalog

# Report the state of every promoted file
simplix-boot generated
```

## 설정 요약

`.simplix/generator-simplix.json`의 주요 키입니다. 전체 목록은 [설정 레퍼런스](docs/ko/configuration.md)에 있습니다.

| 키 | 필수 | 설명 |
|----|------|------|
| `entity.scanPath` | 아니요 | 엔티티 소스를 찾는 경로입니다. 지정하지 않으면 `src/main/java`를 사용합니다. |
| `target.generatedBasePath` | 예 | 생성한 소스를 쓰는 경로입니다. |
| `target.basePackage` | 예 | 생성한 클래스의 기준 패키지입니다. |
| `target.targetPath` | 예 | 구성 요소별 하위 경로입니다. 경로를 지정한 구성 요소만 생성합니다. |
| `template` | 아니요 | 구성 요소별 템플릿 상대 경로입니다. |
| `supportClasses` | 아니요 | 생성 코드가 호출하는 애플리케이션 클래스의 전체 이름입니다. |
| `generator.version` | 아니요 | 프로젝트가 요구하는 CLI 버전입니다. |

## 아키텍처

```
simplix-cli/
+-- bin/
|   +-- simplix-boot.js          # Executable entry
+-- src/
|   +-- cli.js                   # Command dispatch, help, exit codes
|   +-- commands/                # init, config, generate, promote, generated, templates, version
|   +-- lib/
|       +-- analysis/            # JPA entity source analysis
|       +-- config/              # Entity yml construction
|       +-- generate/            # File plan, search fields, template variables
|       +-- templates.js         # Project template first, built-in template otherwise
|       +-- tracked-render.js    # Render fingerprint, stored base, three-way merge
+-- templates/                   # Built-in templates
+-- test/                        # node:test suites and the fixture project
```

## 문서

| 문서 | 설명 |
|------|------|
| [개요](docs/ko/overview.md) | 처리 흐름, 구성 요소, 설정 구조 |
| [명령 가이드](docs/ko/command-guide.md) | 명령별 인자, 옵션, 종료 코드 |
| [템플릿 가이드](docs/ko/template-guide.md) | 내장 템플릿, 프로젝트 템플릿, 템플릿 변수 |
| [설정 레퍼런스](docs/ko/configuration.md) | `generator-simplix.json`과 엔티티 yml의 키 |
| [전환 가이드](docs/ko/migration-guide.md) | `generator-simplix` 프로젝트에서 사용하는 방법 |

## 요구 사항

- Node.js 20 이상
- Git (`promote`의 3방향 병합에 `git merge-file`을 사용합니다)

## 라이선스

SimpleCORE License 1.0 (SCL-1.0)
