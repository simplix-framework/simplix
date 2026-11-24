# SimpliX 문서

하려는 일에 맞는 문서를 찾으세요. SimpliX를 처음 사용한다면 「처음 시작」의 문서를 위에서부터 순서대로 읽으면 됩니다.

## 처음 시작

| 하려는 일 | 문서 |
|---|---|
| SimpliX를 사용하는 프로젝트 설정 | [시작하기](ko/getting-started.md) |
| 엔티티의 API 만들기 | [CRUD API 만들기](ko/building-a-crud-api.md) |
| 로그인과 토큰 적용 | [애플리케이션 보안 적용](ko/securing-an-application.md) |
| 2.x와 1.x 라인 선택 | [릴리스 라인](ko/release-lines.md) |

## 모듈

| 모듈 | 제공하는 기능 | 스타터 포함 |
|---|---|---|
| [simplix-core](ko/core/readme.md) | 기본 엔티티와 저장소, 트리 구조, 타입 변환, 예외, API 응답, 검증기, 보안 유틸리티 | ✔ |
| [spring-boot-starter-simplix](ko/starter/readme.md) | 스타터: 웹, JPA, 다국어, 검증, 날짜와 시각, Jackson, OpenAPI의 자동 구성과 기본 서비스 · 컨트롤러 | ✔ |
| [simplix-auth](ko/auth/readme.md) | JWE 토큰 인증, OAuth2 소셜 로그인, Spring Security 통합 | ✔ |
| [simplix-encryption](ko/encryption/readme.md) | 키 교체를 지원하는 데이터 암호화 | ✔ |
| [simplix-cache](ko/cache/readme.md) | Caffeine(로컬)과 Redis(분산)를 같은 API로 사용하는 캐시 | ✔ |
| [simplix-hibernate](ko/hibernate/readme.md) | Hibernate 2차 캐시 관리 | ✔ |
| [simplix-mybatis](ko/mybatis/readme.md) | 타입 핸들러를 포함한 MyBatis 통합 | ✔ |
| [simplix-messaging](ko/messaging/readme.md) | NATS JetStream, Redis Streams, Kafka, RabbitMQ, 로컬 브로커를 지원하는 메시징 | ✔ |
| [simplix-email](ko/email/readme.md) | SMTP, AWS SES, SendGrid, Resend를 지원하는 템플릿 기반 이메일 | ✔ |
| [simplix-file](ko/file/readme.md) | 로컬 디스크, AWS S3, Google Cloud Storage를 지원하는 파일 저장 | ✔ |
| [simplix-excel](ko/excel/readme.md) | Excel과 CSV 가져오기 · 내보내기 | ✔ |
| [simplix-scheduler](ko/scheduler/readme.md) | `@Scheduled` 메서드의 실행 기록과 ShedLock 연동 | ✔ |
| [simplix-egov](ko/egov/readme.md) | eGovFrame 연동 | ✔ |
| [simplix-stream](ko/stream/readme.md) | SSE와 WebSocket 기반 실시간 구독 | 직접 추가 |
| [simplix-sync](ko/sync/readme.md) | 인스턴스 간 상태 동기화와 경량 pub/sub | 직접 추가 |
| [simplix-license](ko/license/readme.md) | 라이선스 등록 · 활성화와 기능 · 수량 제한 | 직접 추가 |

코드 생성: [SimpliX CLI](ko/cli/readme.md)

## 프로젝트 정보

- [변경 이력](ko/changelog.md)
- [라이선스](ko/license.md)
- [문서 기여 가이드](ko/contributing-to-the-docs.md)
