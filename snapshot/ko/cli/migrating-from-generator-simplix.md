# generator-simplix에서 전환

`generator-simplix`(`yo simplix:...`로 실행하던 Yeoman 생성기)로 관리하던 프로젝트는 파일을 바꾸지 않고 `simplix-boot`로 전환할 수 있습니다. 이 문서는 그대로 쓰는 파일, 기존 명령에 대응하는 명령, 전환 후 달라지는 동작을 정리합니다.

## 그대로 쓰는 파일

- `.simplix/generator-simplix.json`
- `.simplix/entity/*.yml`
- `.simplix/templates/`의 EJS 템플릿
- `.simplix/bases/`의 기준 렌더와 모듈로 옮긴 파일의 지문 줄

프로젝트 템플릿을 여전히 먼저 사용하므로, 같은 입력에서 같은 파일이 생성됩니다.

## 명령 대응

| generator-simplix | simplix-boot |
|---|---|
| `yo simplix` | `simplix-boot help` |
| `yo simplix:init` | `simplix-boot init` |
| `yo simplix:config <Name>` | `simplix-boot config <Name>` |
| `yo simplix:generate <Name>`, `yo simplix:entity <Name>` | `simplix-boot generate <Name>` |
| `yo simplix:promote <Name> --module <module>` | `simplix-boot promote <Name> --module <module>` |
| `yo simplix:generated` | `simplix-boot generated` |
| `yo simplix:version` | `simplix-boot version` |

옵션 이름은 같습니다.

## 전환 절차

1. 프로젝트의 릴리스 라인에 맞는 CLI를 설치합니다([버전 관리](ko/cli/managing-versions.md)).
2. `simplix-boot generated`를 실행합니다. 전환 전과 같은 상태가 보고되면 CLI가 템플릿과 설정을 기존 생성기와 같게 읽은 것입니다.
3. `simplix-boot version --write`를 실행하고 설정 파일을 커밋합니다. CLI의 버전은 SimpliX의 버전이므로 기록되는 숫자가 달라집니다.
4. 기존 생성기를 제거합니다: `npm uninstall -g generator-simplix yo`

```bash
simplix-boot generated
simplix-boot version --write
```

## 내장 템플릿으로 전환

이 단계는 선택 사항입니다. 바꾼 적이 없는 템플릿은 `.simplix/templates`에서 삭제해도 되며, 이후에는 내장 템플릿을 사용합니다. `simplix-boot templates`로 프로젝트 템플릿을 확인하고, 파일을 하나 삭제한 뒤 `simplix-boot generated`를 실행해 모듈의 파일에 생기는 차이를 확인한 다음 삭제를 확정하세요.

프로젝트 템플릿이 애플리케이션 클래스를 직접 import하고 있었다면, 내장 템플릿으로 바꿀 때 그 클래스를 `supportClasses`에 지정해야 합니다. [템플릿 사용자 지정](ko/cli/customizing-templates.md)을 참조하세요.

## 달라지는 동작

| 항목 | simplix-boot의 동작 |
|---|---|
| 명령 실행 위치 | 프로젝트 루트뿐 아니라 프로젝트 안의 어느 폴더에서든 실행됩니다 |
| 명령이 모르는 옵션 | 무시하지 않고 종료 코드 1로 거부합니다 |
| 렌더링에 실패한 템플릿 | 명령이 종료 코드 1로 끝나고, `generated`는 해당 엔티티에서 중단합니다 |
| 출력 | 진행 상황과 보고는 표준 출력에, 중단 사유는 표준 오류에 출력합니다 |
| 프로젝트에 컨트롤러 테스트 템플릿이 없음 | 컨트롤러 테스트를 생성하지 않으며 건너뛴다는 메시지도 출력하지 않습니다 |
| 기록된 버전이 CLI보다 낮음 | `version --write`로 새 버전을 기록할 때까지 생성 명령마다 차이를 알립니다 |
| 컨트롤러 템플릿의 기본 경로 | `controller/rest/EntityRestController.java.template`, `controller/web/EntityWebController.java.template` |
| 빌드 파일 | `build.gradle`, `build.gradle.kts`, `pom.xml` 중 하나가 있으면 됩니다 |

> ℹ 기존 생성기는 템플릿이 실패해도 종료 코드 0으로 끝났기 때문에, 특정 엔티티에서 템플릿이 실패하고 있었어도 알아차리지 못했을 수 있습니다. 전환 직후 `simplix-boot generate`나 `generated`가 렌더링 실패를 보고한다면 그 템플릿은 이전부터 실패하고 있던 것입니다. 메시지를 읽는 방법은 [문제 해결](ko/cli/troubleshooting.md)에 있습니다.

## 관련 문서

- [버전 관리](ko/cli/managing-versions.md)
- [명령 레퍼런스](ko/cli/command-reference.md)
