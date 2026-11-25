# 설정 레퍼런스

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.egov.enabled` | `true` | eGovFrame 빈 등록 |

빈은 `org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl`이 클래스패스에 있을 때 등록되며, 이 클래스는 모듈이 직접 제공합니다. `leaveaTrace`라는 이름의 빈이나 `SimpliXTraceHandler` 타입의 빈을 직접 등록하면 모듈의 빈을 대체합니다.

## 모듈이 등록하는 구성

`SimpliXEgovAutoConfiguration`이 `simplix.egov`를 `SimpliXEgovProperties`에 바인딩하고, 빈을 선언하는 `SimpliXEgovConfiguration`을 가져옵니다.

| 빈 이름 | 타입 | 역할 | 교체 방법 |
|---|---|---|---|
| `simplixTraceHandler` | `SimpliXTraceHandler` | 서비스가 남긴 트레이스를 로그에 기록합니다 | `SimpliXTraceHandler` 타입의 빈 선언 |
| `traceHandlerService` | `DefaultTraceHandleManager` | 모든 트레이스를 핸들러에 전달합니다 | 교체할 수 없습니다. 핸들러를 교체하세요 |
| `leaveaTrace` | `LeaveaTrace` | `EgovAbstractServiceImpl`이 `leaveaTrace(...)`에서 호출하는 빈 | `leaveaTrace`라는 이름의 빈 선언 |

## 로깅 라이브러리

eGovFrame은 Log4j 2에 의존하며, Spring Boot의 Logback과 충돌합니다. 모듈은 다음 아티팩트를 의존성에서 제외합니다.

| 아티팩트 | 사유 |
|---|---|
| `org.apache.logging.log4j:log4j-slf4j2-impl` | SLF4J 바인딩 중복 |
| `org.apache.logging.log4j:log4j-core` | Logback과 로깅 백엔드 중복 |

## 동작하지 않을 때

| 증상 | 원인 | 조치 |
|---|---|---|
| `EgovAbstractServiceImpl`을 상속한 서비스가 `leaveaTrace` 빈이 없어 시작에 실패함 | `simplix.egov.enabled`가 `false`이거나 자동 구성이 제외되어 있습니다 | 모듈을 활성화하거나 빈을 직접 선언하세요 |
| SLF4J 프로바이더가 여러 개라는 경고가 로그에 기록됨 | 다른 의존성이 `log4j-slf4j2-impl`을 다시 추가했습니다 | 해당 의존성에서 위 표의 아티팩트를 제외하세요 |

## 관련 문서

- [시작하기](ko/egov/getting-started.md)
