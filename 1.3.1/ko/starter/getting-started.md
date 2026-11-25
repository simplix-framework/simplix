# 스타터 시작하기

스타터는 [시작하기](ko/getting-started.md)에서 설치하는 의존성입니다. 그 문서에서 의존성을 추가하고, 애플리케이션 클래스를 작성하고, 토큰 키를 만들어 애플리케이션을 실행합니다. 이 문서는 실행한 뒤에 무엇이 구성되어 있는지와 다음에 볼 문서를 안내합니다.

## 첫 실행 후 구성된 내용

| 할 수 있는 일 | 이유 | 다음 문서 |
|---|---|---|
| 엔티티를 작성해 전체 API 만들기 | 서비스와 컨트롤러의 기본 클래스가 클래스패스에 있음 | [CRUD API 만들기](ko/building-a-crud-api.md) |
| 예외가 발생하면 JSON으로 응답 | 예외 핸들러가 등록되어 있음 | [오류 처리](ko/starter/handling-errors.md) |
| 날짜 시각 값을 같은 시간대로 저장하고 반환 | 날짜 시각 변환기와 직렬화기가 등록되어 있음 | [날짜와 시간대 다루기](ko/starter/working-with-dates-and-time-zones.md) |
| `/v3/api-docs`에서 API 문서 조회 | springdoc이 포함되어 있고 확장되어 있음 | [API 문서화](ko/starter/documenting-the-api.md) |
| 사용자 로그인 | `simplix-auth`가 포함되어 있음 | [애플리케이션 보안 적용](ko/securing-an-application.md) |

## 애플리케이션 클래스

```java
@SpringBootApplication
@EntityScan("com.example.library.domain")
@EnableJpaRepositories(
    basePackages = "com.example.library.domain",
    repositoryFactoryBeanClass = SimpliXRepositoryFactoryBean.class
)
public class LibraryApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

| 어노테이션 | 필요 여부 | 이유 |
|---|---|---|
| `@SpringBootApplication` | 항상 | 애플리케이션의 패키지를 스캔합니다. 스타터의 패키지는 스타터가 직접 스캔합니다 |
| `SimpliXRepositoryFactoryBean`을 지정한 `@EnableJpaRepositories` | 항상 | 저장소에서 트리 쿼리와 필터가 적용된 식별자 조회를 사용할 수 있습니다 |
| `@EntityScan` | 엔티티가 애플리케이션 클래스의 패키지 밖(예: 모듈)에 있을 때 | JPA가 엔티티를 찾을 위치를 지정합니다 |
| `@EnableScheduling`, `@EnableAsync` | 애플리케이션에서 스케줄이나 비동기 메서드를 사용할 때 | 스타터는 이 기능을 활성화하지 않습니다 |

## 생성기와 맞는 프로젝트 구조

```text
src/main/java/com/example/library
├── LibraryApplication.java
├── config                  application configuration, the permission evaluator
├── domain
│   └── catalog
│       ├── entity          Author.java
│       └── repository      AuthorRepository.java
└── web
    └── catalog
        ├── controller      AuthorRestController.java
        ├── dto             AuthorDTOs.java
        └── service         AuthorService.java
```

엔티티와 저장소는 `domain` 아래에 직접 작성하고, [CLI](ko/cli/readme.md)가 엔티티의 서비스, DTO, 컨트롤러를 `web` 아래에 생성합니다. Gradle 모듈로 구성한 프로젝트에서는 모듈마다 같은 `domain` · `web` 구분을 유지하고, 애플리케이션 모듈의 `@EntityScan`과 `@EnableJpaRepositories`에 모든 모듈 패키지를 지정합니다.

## 일부 기능 끄기

```yaml
simplix:
  exception-handler:
    enabled: false
  date-time:
    request-timezone-enabled: false
```

기능마다 끄는 속성이 있으며, [설정 레퍼런스](ko/starter/configuration-reference.md)에 정리되어 있습니다. 같은 타입의 빈을 직접 등록해도 스타터의 빈을 대체합니다. 스타터의 빈은 같은 타입의 빈이 없을 때만 등록되기 때문입니다.

## 다음 단계

- [서비스와 컨트롤러 작성](ko/starter/writing-services-and-controllers.md)
- [설정 레퍼런스](ko/starter/configuration-reference.md)
