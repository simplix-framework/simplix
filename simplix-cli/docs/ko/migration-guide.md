# 전환 가이드

`generator-simplix`(Yeoman 생성기)로 관리하던 프로젝트에서 `simplix-boot`를 사용하는 방법을 설명합니다.

## 목차

- [호환 범위](#호환-범위)
- [명령 대응표](#명령-대응표)
- [전환 절차](#전환-절차)
- [동작 차이](#동작-차이)

## 호환 범위

다음 파일은 그대로 사용합니다.

- `.simplix/generator-simplix.json`
- `.simplix/entity/*.yml`
- `.simplix/templates/`의 EJS 템플릿
- `.simplix/bases/`의 기준 렌더(base render)와 모듈로 옮긴 파일의 렌더 지문(render fingerprint)

프로젝트 템플릿이 있으면 그 템플릿으로 렌더링하므로, 같은 입력에서 `generator-simplix`와 같은 내용의 파일을 생성합니다.

## 명령 대응표

| generator-simplix | simplix-boot |
|-------------------|--------------|
| `yo simplix` | `simplix-boot help` |
| `yo simplix:init` | `simplix-boot init` |
| `yo simplix:config <Name>` | `simplix-boot config <Name>` |
| `yo simplix:generate <Name>`, `yo simplix:entity <Name>` | `simplix-boot generate <Name>` |
| `yo simplix:promote <Name> --module <module>` | `simplix-boot promote <Name> --module <module>` |
| `yo simplix:generated` | `simplix-boot generated` |
| `yo simplix:version` | `simplix-boot version` |

옵션 이름은 같습니다.

## 전환 절차

### 1. CLI 설치

```bash
npm install -g @simplix-boot/cli
```

### 2. 생성 결과 확인

모듈로 옮긴 파일의 상태를 확인하세요. 전환 전과 같은 상태가 보고되면 템플릿과 설정을 그대로 읽은 것입니다.

```bash
simplix-boot generated
```

### 3. 버전 기록

```bash
simplix-boot version --write
```

`generator.version`에 CLI의 버전을 기록합니다. CLI의 버전은 SimpliX 프레임워크의 버전과 같습니다.

### 4. 내장 템플릿으로 전환(선택)

프로젝트 템플릿을 유지할 필요가 없으면 `.simplix/templates`에서 해당 파일을 삭제하세요. 삭제한 파일은 내장 템플릿으로 렌더링합니다. 삭제하기 전에 `simplix-boot templates`로 어떤 파일이 프로젝트 템플릿인지 확인하고, `generated`로 생성 결과의 차이를 확인하세요.

프로젝트 템플릿이 애플리케이션 클래스를 직접 import하고 있었다면 그 클래스의 전체 이름을 `supportClasses`에 지정해야 합니다. [템플릿 가이드](./template-guide.md#애플리케이션-클래스-연결)를 참조하세요.

## 동작 차이

| 항목 | simplix-boot의 동작 |
|------|---------------------|
| 실행 위치 | 프로젝트 루트의 하위 디렉터리에서도 실행됩니다. |
| 선언하지 않은 옵션 | 무시하지 않고 실행을 거부합니다. |
| 템플릿 렌더링 실패 | 종료 코드 1로 끝냅니다. `generated`도 해당 엔티티에서 중단합니다. |
| 출력 스트림 | 진행 상황과 결과를 표준 출력에 씁니다. |
| 컨트롤러 테스트 템플릿이 없을 때 | 건너뛴다는 메시지를 출력하지 않습니다. |
| 기록한 버전이 CLI보다 낮을 때 | 생성 명령마다 버전 차이를 알립니다. `simplix-boot version --write`로 기록을 갱신하면 알림이 없어집니다. |
| `template` 미지정 시 컨트롤러 템플릿 경로 | `controller/rest/EntityRestController.java.template`, `controller/web/EntityWebController.java.template`입니다. |
| 빌드 파일 확인 | `build.gradle`, `build.gradle.kts`, `pom.xml` 중 하나가 있으면 됩니다. |

## 관련 문서

- [개요](./overview.md)
- [명령 가이드](./command-guide.md)
- [템플릿 가이드](./template-guide.md)
