# simplix-core 문제 해결

core 클래스를 사용할 때 발생하는 증상과 원인, 조치를 정리합니다.

## 엔티티와 트리

| 증상 | 원인 | 조치 |
|---|---|---|
| 트리 조회가 부모 컬럼의 데이터 변환 오류로 실패하고, 트랜잭션이 `UnexpectedRollbackException`으로 종료됨 | 식별자가 숫자 타입입니다. 트리 쿼리는 부모 컬럼을 빈 문자열과 비교합니다 | 트리 엔티티의 식별자를 `String`으로 지정하세요 |
| `UUID` 필드에서 `@UuidV7Generator`가 실패함 | 생성기가 문자열을 생성합니다 | 식별자를 `String`으로 선언하세요 |
| `findByLookup`이 SQL 문법 오류로 실패함 | 맵의 키가 `lookupColumns`에 선언되어 있지 않습니다 | 컬럼을 선언하거나 호출 전에 키를 거부하세요 |
| 부모를 삭제한 뒤에도 자식이 테이블에 남아 있음 | `deleteById`는 노드 한 건만 삭제하며 `cascadeDelete`는 효과가 없습니다 | 리프부터 위쪽으로 삭제하거나, `repairTreeStructure`를 실행해 부모가 없는 노드를 루트로 바꾸세요 |
| `findLeafNodes`가 모든 노드를 반환하고 `getTreeMetrics`의 가지 노드 수가 0임 | 양쪽 모두 평면 조회에서 비어 있는 `children` 목록으로 판정합니다 | `findCompleteHierarchy`의 결과에서 리프 수를 계산하세요 |
| `createBatch`로 저장한 노드가 형제 노드보다 앞에 표시됨 | `createBatch`는 정렬 순서를 지정하지 않습니다 | 호출 전에 노드마다 정렬 순서를 지정하세요 |
| 애플리케이션이 시작되지 않음: 트리 저장소의 메서드를 쿼리로 변환하지 못함 | 저장소를 기본 팩토리로 생성하고 있습니다 | `@EnableJpaRepositories`에 `repositoryFactoryBeanClass = SimpliXRepositoryFactoryBean.class`를 추가하세요 |

## 응답과 오류

| 증상 | 원인 | 조치 |
|---|---|---|
| `success(body, message)`에 전달한 메시지가 응답에 없음 | 성공 응답은 메시지를 유지하지 않습니다 | 문구를 body에 포함하세요 |
| 애플리케이션 고유의 코드로 생성한 예외가 상태 500의 `GEN_INTERNAL_SERVER_ERROR`로 응답됨 | `ErrorCode`에 없는 문자열은 이 코드로 대체됩니다 | `ErrorCode` 상수를 사용하고 애플리케이션 고유의 사유는 상세 정보에 포함하세요 |
| `SimpliXGeneralException`이 일반 오류 페이지로 응답됨 | 예외 핸들러는 스타터에 있습니다 | [스타터](ko/starter/readme.md)를 추가하거나 핸들러를 직접 작성하세요 |

## 변환과 데이터 보호

| 증상 | 원인 | 조치 |
|---|---|---|
| `Instant`에 `2026-03-01 00:30:00Z`를 전달하면 거부됨 | `Instant`는 ISO-8601 형식으로 읽습니다 | `2026-03-01T00:30:00Z` 형식으로 전달하세요 |
| `LocalDateTime`에 시각이 없는 날짜를 전달하면 거부됨 | 날짜 시각 패턴에는 모두 시각이 포함됩니다 | `LocalDate`로 읽은 뒤 `atStartOfDay()`를 호출하세요 |
| `SqlInjectionValidator.isSafeInput`이 `O'Brien` 같은 이름을 거부함 | 따옴표를 인젝션 징후로 처리합니다 | 검증기는 식별자, 코드, 정렬 필드에 사용하고, 자유 형식 문자열은 쿼리 매개변수로 바인딩하세요 |
| `@MaskSensitive`를 지정한 필드의 원래 값을 표시할 수 없음 | 리스너가 마스킹한 값을 저장합니다 | 다시 읽어야 하는 값에는 `MaskingConverter`나 [simplix-encryption](ko/encryption/readme.md)을 사용하세요 |
| 기본 마스킹 키를 사용 중이라는 경고가 로그에 기록됨 | `simplix.core.masking.key`가 설정되어 있지 않습니다 | 비밀 저장소에서 32자 이상의 키를 주입하세요 |

## 캐싱과 이벤트

| 증상 | 원인 | 조치 |
|---|---|---|
| simplix-cache를 설치했는데도 `CacheManager.getInstance()`에 값이 저장되지 않음 | 정적 매니저는 서비스 로더로만 프로바이더를 찾습니다 | `CacheProvider`를 주입하거나 `META-INF/services`에 프로바이더를 등록하세요 |
| 엔티티에서 이벤트가 발행되지 않음 | 엔티티에 `@EntityListeners(EntityEventPublishingListener.class)`가 없거나 클래스패스에 `EventPublisher`가 없습니다 | 리스너를 추가하고, [simplix-hibernate](ko/hibernate/readme.md)처럼 이벤트를 전달하는 모듈을 추가하세요 |
| 대량 가져오기에서 이벤트가 수천 건 발행됨 | 저장하는 행마다 이벤트를 발행합니다 | `EventContext.suppressEvents` 안에서 가져오기를 실행하세요 |

## 관련 문서

- [simplix-core 동작 방식](ko/core/how-it-works.md)
- [오류 코드 레퍼런스](ko/core/error-code-reference.md)
