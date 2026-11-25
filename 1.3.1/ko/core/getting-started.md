# simplix-core 시작하기

이 문서는 코어 클래스로 첫 엔티티를 작성하고, 레코드가 없을 때 표준 오류로 보고하는 과정을 안내합니다. [시작하기](ko/getting-started.md)를 따른 애플리케이션에는 의존성이 이미 있으므로 2단계부터 시작하면 됩니다.

## 1단계. 의존성 추가

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-core:${version}"
}
```

Gradle에 필요한 저장소와 자격 증명은 [시작하기](ko/getting-started.md)에 있습니다.

## 2단계. 엔티티와 저장소 작성

```java
@Entity
@Table(name = "authors")
@Getter
@Setter
@NoArgsConstructor
public class Author extends SimpliXBaseEntity<String> {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "author_id", nullable = false, updatable = false)
    private String authorId;

    @Column(name = "pen_name", nullable = false, length = 120)
    @NameField
    private String penName;

    @Column(name = "biography", length = 2000)
    private String biography;

    @Override
    public String getId() {
        return authorId;
    }

    @Override
    public void setId(String id) {
        this.authorId = id;
    }
}

public interface AuthorRepository extends SimpliXBaseRepository<Author, String> {
}
```

## 3단계. 저장소 등록

```java
@SpringBootApplication
@EnableJpaRepositories(
    basePackages = "com.example.library.domain",
    repositoryFactoryBeanClass = SimpliXRepositoryFactoryBean.class
)
public class LibraryApplication {
}
```

`SimpliXRepositoryFactoryBean`은 일반 저장소와 트리 저장소를 모두 생성합니다.

## 4단계. 코드로 오류 보고

```java
@Service
@RequiredArgsConstructor
public class AuthorLookup {

    private final AuthorRepository authorRepository;

    public Author require(String authorId) {
        return authorRepository.findById(authorId)
            .orElseThrow(() -> new SimpliXGeneralException(
                ErrorCode.GEN_NOT_FOUND, "Author not found", Map.of("authorId", authorId)));
    }
}
```

[스타터](ko/starter/readme.md)를 사용하면 이 예외에 상태 코드 404, 코드 `GEN_NOT_FOUND`, `ERROR` 타입의 `SimpliXApiResponse`로 응답합니다.

## 다음 단계

- [엔티티와 저장소](ko/core/entities-and-repositories.md)
- [API 응답과 오류](ko/core/api-responses-and-errors.md)
- [CRUD API 만들기](ko/building-a-crud-api.md)
