# simplix-core 동작 방식

모듈의 구성, 모듈이 단독으로 처리하는 범위, 스타터에 맡기는 범위를 설명합니다. 애플리케이션에 core만 필요한지, [스타터](ko/starter/readme.md)까지 필요한지 판단할 때 참고하세요.

## 모듈 구성

| 패키지 | 내용 | 가이드 |
|---|---|---|
| `entity`, `repository` | 기반 엔티티, 기반 저장소, 복합 키, JPA 변환기, 엔티티 리스너 | [엔티티와 저장소](ko/core/entities-and-repositories.md) |
| `tree` | 트리 엔티티, 트리 저장소와 재귀 쿼리, 트리 서비스 | [트리 구조](ko/core/tree-structures.md) |
| `model`, `exception` | `SimpliXApiResponse`, `SimpliXGeneralException`, `ErrorCode` | [API 응답과 오류](ko/core/api-responses-and-errors.md) |
| `validator` | 유일성 제약, `@ValidateWith`, `@SafeHtml` | [입력 검증](ko/core/validating-input.md) |
| `security` | 새니타이즈, 마스킹, 해시, 입력 검사 | [민감한 데이터 보호](ko/core/protecting-sensitive-data.md) |
| `convert`, `enums`, `timezone` | 문자열과 타입 값 사이의 변환기, 라벨이 있는 열거형, 요청의 시간대 | [타입 변환](ko/core/converting-types.md) |
| `jackson`, `i18n` | 번역 어노테이션과 직렬화기, 메시지 리졸버 | [필드 번역](ko/core/translating-fields.md) |
| `annotation` | 엔티티를 화면에 설명하는 어노테이션 | [화면을 위한 엔티티 설명](ko/core/describing-entities-for-screens.md) |
| `event` | 이벤트 모델, 발행 인터페이스, 엔티티 이벤트 리스너 | [이벤트 발행](ko/core/publishing-events.md) |
| `cache` | 캐시 인터페이스와 정적 매니저 | [캐싱](ko/core/caching.md) |
| `resilience`, `util` | 부하와 장애에 대응하는 메모리 기반 가드, 식별자와 매핑 도우미 | [복원력 유틸리티](ko/core/resilience-utilities.md) |

## core가 단독으로 처리하는 범위

이 모듈은 자동 구성을 등록하지 않습니다. 클래스는 사용하는 위치에서 바로 동작합니다. 엔티티는 기반 클래스를 상속하고, 제약 어노테이션에는 검증기가 연결되어 있으며, JPA 변환기와 엔티티 리스너는 엔티티에 지정하면 실행되고, 유틸리티는 직접 호출합니다. 애플리케이션이 등록하는 항목은 저장소 팩토리 하나입니다. `@EnableJpaRepositories(repositoryFactoryBeanClass = SimpliXRepositoryFactoryBean.class)`를 지정하면 저장소에서 트리 쿼리와 필터가 적용된 식별자 조회를 사용할 수 있습니다.

## 스타터가 추가하는 범위

| core의 기능 | 스타터의 처리 |
|---|---|
| `SimpliXGeneralException`, `ErrorCode` | 예외 핸들러가 코드의 상태와 함께 `SimpliXApiResponse`로 응답합니다 |
| 변환기와 Jackson 직렬화기 | 애플리케이션의 `ObjectMapper`에 등록합니다 |
| `TimezoneContext` | 요청마다 `X-Timezone` 헤더의 값으로 설정합니다 |
| `@I18nTrans`, 메시지 리졸버 | 요청 로케일과 메시지 소스를 구성합니다 |
| 엔티티 설명 어노테이션 | 메타데이터 엔드포인트로 클라이언트에 제공합니다 |
| `SimpliXBaseEntity`, `SimpliXBaseRepository` | 이를 기반으로 하는 기반 서비스와 컨트롤러를 제공합니다 |

## 서비스 로더로 찾는 확장 지점

`CacheManager`와 `EventManager`는 정적 클래스이므로 Spring 빈이 아닌 코드에서도 사용할 수 있습니다. 각각 Java 서비스 로더로 구현을 찾습니다. `META-INF/services` 아래에 인터페이스 이름(`dev.simplecore.simplix.core.cache.CacheProvider`, `dev.simplecore.simplix.core.event.EventPublisher`)으로 만든 파일에 구현 클래스를 기재합니다. 구현이 없으면 양쪽 모두 아무 동작도 하지 않습니다. 캐시 조회는 빈 값을 반환하고 발행한 이벤트는 버려지므로, 라이브러리는 애플리케이션의 구현 여부와 관계없이 호출할 수 있습니다.

## 네이티브 이미지

`SimpliXRuntimeHints`는 `META-INF/spring/aot.factories`에 등록되어 있습니다. AOT 빌드에서 트리 저장소, 엔티티 인터페이스, 런타임에 읽는 어노테이션에 대해 모듈이 사용하는 리플렉션을 선언하므로, GraalVM 네이티브 이미지에서 이 항목의 리플렉션 설정을 따로 작성하지 않아도 됩니다.

## 모듈이 전달하는 의존성

이 모듈은 searchable-jpa를 사용하는 쪽에 전이 의존성으로 노출합니다. 그래서 애플리케이션은 SimpliX 패키지 저장소와 함께 searchable-jpa 패키지 저장소도 추가합니다. Spring Data JPA, Spring Web, Jackson, Hibernate Validator, ModelMapper, OWASP HTML 새니타이저는 모듈 내부에서 사용하므로, 애플리케이션에서 직접 호출하려면 의존성을 따로 선언하세요.

## 그 밖의 공개 메서드

가이드에서는 작업에 필요한 메서드를 설명합니다. 가이드에 나온 타입은 아래 공개 메서드도 제공합니다.

| 타입 | 메서드 | 동작 |
|---|---|---|
| `Event` | `getEventId()`, `getEventType()`, `getAggregateId()`, `getOccurredAt()` | 이벤트 ID, 이벤트 타입, 관련 애그리거트의 ID, 발생 시각을 반환합니다 |
| `Event` | `getUserId()`, `getTenantId()` | 이벤트를 발생시킨 사용자와 이벤트가 속한 테넌트를 반환합니다. 사용자와 테넌트는 없을 수 있습니다 |
| `Event` | `getMetadata()`, `getPayload()` | 이벤트의 메타데이터 맵과 페이로드를 반환합니다 |
| `EventMessage` | `payloadInt(key)`, `metadataString(key)` | 페이로드에서 `Integer` 값을, 메타데이터에서 문자열 값을 읽습니다 |
| `EventMessage` | `isType(type)`, `isAggregate(type)` | 이벤트 타입이 지정한 값과 같은지, 이벤트가 지정한 애그리거트 타입에 속하는지 반환합니다 |
| `EventMessage` | `isSoftDelete()`, `hasAnyChangedProperty(properties...)` | 논리 삭제로 발생한 이벤트인지, 수정 이벤트에서 지정한 속성 중 하나가 변경되었는지 반환합니다 |
| `EventContext` | `isEventsSuppressed()` | 현재 스레드에서 이벤트 발행이 억제되어 있는지 반환합니다 |
| `EventManager` | `getPublisherName()` | 사용 중인 발행기의 이름을 반환합니다 |
| `BooleanConverter`, `EnumConverter`, `DateTimeConverter` | `getDefault()` | 기본 변환기를 반환합니다. `DateTimeConverter`의 기본 변환기는 기본 시간대를 사용합니다 |
| `TimezoneContext` | `getZoneIdOrDefault(fallback)` | 현재 요청의 시간대를 반환합니다. 요청에 시간대가 없으면 전달받은 값을 반환합니다 |
| `EntityUtils` | `getEntityClass(clazz)` | 클래스의 제네릭 상위 클래스에 지정된 첫 번째 타입 인자를 반환합니다. `SimpliXBaseService<Book, Long>`을 상속한 서비스에서는 엔티티 타입입니다 |
| `RoundRobinSelector` | `getCursorPosition()` | 커서의 현재 위치를 반환합니다. 진단용입니다 |
| `RateLimiter` | `getAvailableTokens()` | 현재 사용할 수 있는 토큰 수를 반환합니다 |
| `EntityMessageResolver`, `EnumMessageResolver` | `setLocale(locale)`, `getLocale()`, `clearLocale()` | 현재 스레드에서 리졸버가 사용하는 로케일을 지정하고, 조회하고, 지웁니다 |
| `EntityMessageResolver`, `EnumMessageResolver` | `getDiscoveredBundles()` | 리졸버가 찾은 메시지 번들 이름을 반환합니다. 진단과 테스트에 사용합니다 |
| `RetryAfterHint` | `retryAfterSeconds()` | 직접 작성하는 예외에서 구현하는 메서드입니다. 호출자가 몇 초 뒤에 재시도할 수 있는지 반환합니다 |
| `HashingUtils` | `isValidSha256Hash(hash)`, `isValidSha512Hash(hash)` | 문자열이 Base64로 표현한 SHA-256 또는 SHA-512 해시 형식인지 반환합니다 |
| `InputSanitizer` | `isValidEmail(email)`, `isValidUrl(url)`, `isAlphanumericWithSpace(input)` | 이메일 주소와 URL의 형식을 검사하고, 문자열이 영문자, 숫자, 공백으로만 구성되어 있는지 검사합니다 |
| `SqlInjectionValidator` | `matchesSafePattern(input)` | 문자열이 허용 문자 패턴과 일치하는지 반환합니다 |

## 관련 문서

- [simplix-core 시작하기](ko/core/getting-started.md)
- [spring-boot-starter-simplix](ko/starter/readme.md)
- [문제 해결](ko/core/troubleshooting.md)
