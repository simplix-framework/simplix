[English](en/egov/readme.md) | **한국어**

# simplix-egov

전자정부 표준프레임워크(eGovFrame) 연동 모듈입니다. eGovFrame 런타임을 함께 가져오고 `EgovAbstractServiceImpl`에 필요한 빈을 등록하므로, Spring Boot 애플리케이션에서 XML 설정 없이 eGovFrame 방식의 서비스를 작성할 수 있습니다.

## 설치

[스타터](ko/starter/readme.md)에 이 모듈이 포함되어 있습니다. 스타터 없이 사용할 때는 다음과 같이 추가합니다.

```groovy
repositories {
    maven {
        url = uri("https://maven.egovframe.go.kr/maven/")
    }
}

dependencies {
    implementation "dev.simplecore.simplix:simplix-egov:${version}"
}
```

## 제공하는 기능

| 빈 | 타입 | 동작 |
|---|---|---|
| `leaveaTrace` | `LeaveaTrace` | `EgovAbstractServiceImpl`이 트레이스를 기록할 때 주입받는 빈 |
| `traceHandlerService` | `DefaultTraceHandleManager` | 모든 클래스의 트레이스를 핸들러에 전달 |
| `simplixTraceHandler` | `SimpliXTraceHandler` | 트레이스를 SLF4J 로그로 기록 |

스타터의 `SimpliXBaseService`는 `EgovAbstractServiceImpl`을 상속하므로, 모든 SimpliX 서비스는 eGovFrame 서비스이기도 합니다.

## 문서

- [시작하기](ko/egov/getting-started.md): 서비스를 작성하고 트레이스 기록
- [설정 레퍼런스](ko/egov/configuration-reference.md)

## 요구 사항

| 프로젝트 | SimpliX 라인 | 선언할 버전 |
|---|---|---|
| Spring Boot 4 | 2.x | `2.x` 릴리스 |
| Spring Boot 3 | 1.x | `1.x` 릴리스 |

## 라이선스

[SimpleCORE License 1.0 (SCL-1.0)](ko/license.md)
