# 릴리스 라인

SimpliX는 Spring Boot 세대별로 릴리스 라인을 나누어 개발합니다. 이 문서는 사용할 라인을 고르는 기준, 라인 간 공통점, 아티팩트의 게시 위치를 설명합니다.

## 사용할 라인

| 프로젝트의 Spring Boot | 사용할 SimpliX | 브랜치 | searchable-jpa |
|---|---|---|---|
| Spring Boot 4 | 2.x | `main` | 2.x |
| Spring Boot 3 | 1.x | `spring-boot-3x` | 1.x |

라인은 애플리케이션의 Spring Boot 세대만으로 정해집니다. 어느 라인이든 Java 17 이상이 필요합니다.

## 라인 간 공통점

한 라인에 추가한 기능이나 수정은 다른 라인에도 반영하므로, 모든 라인이 같은 모듈과 같은 API, 같은 문서를 제공합니다. 차이는 기반이 되는 Spring Boot 세대와 그에 따른 의존성뿐입니다. 한 라인에만 있는 변경은 Spring Boot 4 API에 맞춘 조정처럼 다른 라인에 적용할 수 없는 변경입니다.

## 아티팩트의 위치

| 아티팩트 | 게시 위치 | 라인을 고르는 방법 |
|---|---|---|
| Java 모듈(`dev.simplecore.simplix:*`) | `simplix-framework/simplix`의 GitHub Packages | 버전으로 선택: 2.x 또는 1.x |
| 명령줄 도구(`@simplix-boot/cli`) | npm | 태그로 선택: 2.x는 `latest`, 1.x는 `spring-boot-3x` |

```bash
# Spring Boot 4 projects
npm install -g @simplix-boot/cli

# Spring Boot 3 projects
npm install -g @simplix-boot/cli@spring-boot-3x
```

한 릴리스의 모듈과 명령줄 도구는 같은 버전 번호를 사용합니다. 릴리스된 버전은 [릴리스 페이지](https://github.com/simplix-framework/simplix/releases)에서 확인할 수 있습니다.

## 1.x에서 2.x로 전환

애플리케이션을 2.x 라인으로 전환하는 작업은 우선 Spring Boot 3에서 4로의 마이그레이션입니다. Spring Boot의 마이그레이션 가이드에 따라 업그레이드하면서 SimpliX와 searchable-jpa의 버전을 2.x 라인으로 함께 바꾸고, 2.x 라인의 CLI를 설치하세요.

## 관련 문서

- [시작하기](./getting-started.md)
- [변경 이력](./changelog.md)
- [SimpliX CLI](../../simplix-cli/README.ko.md)
