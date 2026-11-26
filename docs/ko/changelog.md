# 변경 이력

SimpliX의 주요 변경 내용을 기록합니다. 항목에 연결된 GitHub 커밋에서 변경 내용을 자세히 볼 수 있습니다.

---

## 최근 변경 사항

### 2026-11

#### 새로운 기능
- **코드 생성 CLI (`@simplix-boot/cli`)**
  - JPA 엔티티에서 서비스, REST 컨트롤러, DTO, 테스트를 생성하는 명령줄 도구 `simplix-boot`
  - 템플릿을 CLI에 내장하고, 프로젝트의 `.simplix/templates`에 있는 같은 상대 경로의 파일을 우선 사용
  - 생성 코드가 호출하는 애플리케이션 클래스를 `supportClasses` 설정으로 지정
  - 템플릿 렌더링에 실패하면 종료 코드 1로 종료

#### 개선 사항
- **거부한 선언을 한 번에 응답**
  - `GET /dev/meta/dto`가 문서를 거부할 때 상태 409와 함께 거부한 선언을 모두 응답: `message`에 전체, `detail`에 하나씩

- **템플릿 변경 시 import 유지**
  - 템플릿이 import를 삭제해도 파일에 직접 작성한 코드가 그 클래스를 사용하면 `promote`가 import를 남김

- **계산 속성의 라벨**
  - 필드 없이 getter가 계산하는 속성은 getter에 `@FieldLabel`을 지정할 수 있고, SimpliX Meta가 그 라벨을 읽음

- **코드 생성 CLI의 파이프 출력**
  - 표준 출력을 읽는 프로세스가 먼저 종료해도(`simplix-boot generate Book | head`) 작업을 끝까지 수행하고 원래의 종료 코드로 종료

- **코드 생성 CLI의 릴리스 라인별 npm 태그**
  - Spring Boot 3 라인의 CLI를 `spring-boot-3x` 태그로 게시하고, `latest`는 Spring Boot 4 라인을 가리킴
  - `version` 명령과 버전 검사가 실행 중인 CLI와 같은 라인의 게시 버전만 조회

- **코드 생성 CLI의 설정 파일**
  - 프로젝트 설정 파일 이름을 `.simplix/simplix-boot.json`으로 변경
  - 이 파일이 없으면 `generator-simplix.json`을 읽고, `version --write`가 파일 이름을 새 이름으로 바꿈

#### 수정 사항
- **컬렉션 본문의 검증**
  - 컬렉션 요소가 검증에 실패한 요청에 내부 서버 오류 대신 상태 400과 `VAL_VALIDATION_FAILED`로 응답하고, 실패한 필드마다 요소의 위치를 포함한 항목을 반환
  - 생성된 컨트롤러가 `PATCH <path>`와 `PATCH <path>/order` 본문의 모든 요소를 검증. 이전에는 검증 없이 받았음

- **Redis 캐시 모드와 분산 싱크 모드**
  - `simplix.cache.mode=redis`와 `simplix.sync.mode=DISTRIBUTED` 설정이 적용되도록 조건을 Redis 자동 구성과 메시징 자동 구성 이후에 평가

- **스트림 영속화**
  - Hibernate가 거부하던 세션·구독 갱신 쿼리가 `Instant` 값을 지정하도록 수정

- **simplix-scheduler의 ShedLock**
  - simplix-scheduler에 의존하는 애플리케이션의 클래스패스에 ShedLock 포함

- **생성된 서비스 테스트**
  - 엔티티에 감사 필드가 있을 때만 생성된 서비스 테스트가 감사 시각을 지정
  - 엔티티 yml에 감사 필드가 없어도 부모 클래스가 선언한 감사 시각을 지정

#### 빌드/의존성
- Spring Boot 4 라인은 searchable-jpa 2.1.2, Spring Boot 3 라인은 searchable-jpa 1.2.2로 변경(키워드 검색, 서버 범위 조건, 스크롤, 프로젝션, 집계 추가, 삽입 순서 정렬은 기본으로 비활성화)

### 2026-08

#### 새로운 기능
- **Excel/CSV 다국어 라벨**
  - `@ExcelColumn(name)`을 `{key}` 형태로 적으면 메시지 키로 해석
  - 열거형은 `enums.{클래스 단순명}.{상수명}` 키 → `SimpliXLabeledEnum.getLabel()` → `name()` 순으로 해석
  - 번들이 클래스패스 와일드카드로 병합된 애플리케이션을 위한 `ExcelLabelResolver` 빈
  - 번역이 없어도 파일 생성은 실패하지 않고 키가 그대로 남음

- **라이선스 검증 키 교체와 유출 키 허용 상한**
  - 검증 키를 `classpath:license-verification-keys.json` 한 자원에 여러 개 담아 서명 키 교체 시에도 이전 라이선스 유지
  - 키 이름과 공개키를 한 항목에 함께 담아 둘이 어긋나지 않음
  - 유출로 표시된 키로 서명된 토큰은 배포본이 이미 보유한 것보다 더 줄 수 없으며, 기능·수량 한도·만료·릴리스 상한 중 하나라도 높아지면 `SIGNING_KEY_COMPROMISED`로 거절
  - 아무것도 등록되지 않은 배포본은 허용 상한이 "보유한 것 없음"으로 고정
  - `VerificationKeyIdentity` 빈이 필요 없어짐

#### 개선 사항
- **CSV 셀 이스케이프**
  - 구분자·따옴표·줄바꿈을 담은 값을 따옴표로 감싸고 내부 따옴표를 중복
  - 천 단위로 구분한 숫자처럼 문자열이 아닌 값도 같은 규칙 적용
  - `=` `+` `-` `@`로 시작하는 값 앞에 작은따옴표를 붙여 스프레드시트가 수식으로 실행하지 않게 함 (`sanitizeFormulas`, 기본 켜짐)
  - `@ExcelColumn(format)`을 CSV 내보내기에서도 사용

- **논리값 표기 통일**
  - Excel이 참·거짓 셀 대신 CSV와 같은 표기(`format.booleanTrueValue` / `booleanFalseValue`)로 기록
  - 같은 목록을 Excel과 CSV로 내려받아도 불리언 값이 같은 표기로 표시됨

#### 빌드/의존성
- searchable-jpa 1.1.2
- license-sdk 1.0.8

### 2026-07

#### 새로운 기능
- **simplix-license 모듈 추가**
  - 빌드에 내장된 공개키로 서명된 라이선스 토큰 검증
  - 온라인 활성화와 폐쇄망을 위한 오프라인 활성화
  - 하트비트 갱신과 주기적 재검증
  - `@RequiresFeature` 기반 기능 게이팅, 관리자 활성화 연동
  - `QuotaCounter` 기반 수량 제한 (신규 등록만 차단)
  - 라이선스 상태별 요청 강제 필터와 최초 설치 게이트
  - JPA/파일 저장소 자동 선택, Actuator Health와 Micrometer 메트릭
  - 통합 스타터에 포함되지 않으며 개별 의존성으로 추가

- **스트림 연결 티켓**
  - `POST /api/stream/tickets`로 일회용 단기 티켓 발급
  - 헤더를 보낼 수 없는 `EventSource`가 세션 값을 쿼리 문자열에 노출하지 않고 인증
  - `simplix.stream.security.connect-ticket-validity`로 유효 시간 설정 (기본 30초)

#### 개선 사항
- **스트림 익명 세션 처리**
  - 인증되지 않은 연결의 세션 소유권 비교를 null 안전하게 변경
  - 공개 상태 페이지처럼 로그인 없이 구독하는 클라이언트가 첫 요청에서 실패하지 않음

- **OpenAPI 컴포넌트 키 검증**
  - 배열 타입처럼 OpenAPI 명세가 허용하지 않는 문자를 포함한 이름을 스키마 등록에서 제외
  - 컴포넌트 키를 검증하는 코드 생성기가 문서 전체를 읽지 못하던 문제 해소

### 2025-12

#### 새로운 기능
- **simplix-scheduler 모듈 추가**
  - Spring `@Scheduled` 메서드 실행 자동 로깅
  - AOP 기반 실행 시간 추적 및 상태 기록
  - database/in-memory 저장 전략 지원
  - ShedLock 통합으로 분산 환경 지원
  - `@SchedulerName` 어노테이션으로 커스텀 이름 지정
  - Spring `${...}` placeholder를 실제 값으로 치환하여 저장

- **@I18nTrans 중첩 모드 지원** [`799936f`](https://github.com/simplix-framework/simplix/commit/799936f)
  - `target` 속성 추가로 중첩 객체의 필드 번역 지원
  - Dot notation 경로 지원 (예: `tagGroup.nameI18n`)
  - 필드 레벨 `@JsonIncludeProperties` 어노테이션 호환
  - 직렬화 후 원본 객체 복원으로 side-effect 방지

- **정렬 가능한 트리 서비스** [`22c4864`](https://github.com/simplix-framework/simplix/commit/22c4864)
  - `SortableTreeEntity` 인터페이스 추가 (정렬 순서 변경 가능한 엔티티)
  - `SimpliXSortableTreeBaseService` 추가 (`reorderChildren()` 기본 구현)
  - 트리 유틸리티 메서드: `normalizeParentId()`, `validateNoCircularReference()`, `validateNoChildren()`
  - 트리 변환 메서드: `buildTreeFromFlatList()`, `mapToTreeDto()`

- **커스텀 로그아웃 핸들러 지원** [`9b2e2e1`](https://github.com/simplix-framework/simplix/commit/9b2e2e1)
  - `LogoutHandler` 빈 주입 지원 (감사 로깅, 토큰 블랙리스트 등)
  - `LogoutSuccessHandler` 빈 주입 지원 (커스텀 리다이렉트)
  - 토큰 컨트롤러 로그아웃 엔드포인트에서 `LogoutHandler` 호출

- **Hibernate6Module 통합** [`ef23597`](https://github.com/simplix-framework/simplix/commit/ef23597)
  - Jackson ObjectMapper에 Hibernate6Module 자동 등록
  - 지연 로딩된 엔티티의 직렬화 개선

- **Unique 검증에 Soft Delete 지원** [`dd56b31`](https://github.com/simplix-framework/simplix/commit/dd56b31)
  - `@UniqueField`, `@UniqueFields` 검증 시 Soft Delete 고려
  - 삭제된 레코드는 유니크 검증에서 제외

- **I18n 번역 설정 시스템** [`d093d92`](https://github.com/simplix-framework/simplix/commit/d093d92)
  - `SimpliXI18nConfigHolder`를 통한 중앙 집중식 설정
  - 기본 로케일 및 지원 로케일 목록 설정 가능

- **Unique 검증 어노테이션** [`9f4033d`](https://github.com/simplix-framework/simplix/commit/9f4033d)
  - `@UniqueField`: 단일 필드 유니크 검증
  - `@UniqueFields`: 복합 필드 유니크 검증
  - JPA 저장소 기반 중복 검사

#### 빌드/의존성
- **searchable-jpa 버전 업데이트** [`f22c4fe`](https://github.com/simplix-framework/simplix/commit/f22c4fe)
  - searchableJpaVersion 1.0.5로 업그레이드

---

## 관련 링크

- [릴리스와 릴리스 노트](https://github.com/simplix-framework/simplix/releases)
- [GitHub 저장소](https://github.com/simplix-framework/simplix)
- [이슈 트래커](https://github.com/simplix-framework/simplix/issues)
- [전체 커밋 이력](https://github.com/simplix-framework/simplix/commits/main)
