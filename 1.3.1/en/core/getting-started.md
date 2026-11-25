# Getting started with simplix-core

This page writes a first entity on the core classes and reports a missing record as a standard error. An application that follows [Getting started](en/getting-started.md) has the dependency already and can begin at step 2.

## Step 1. Add the dependency

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-core:${version}"
}
```

The repositories and the credentials Gradle needs are described in [Getting started](en/getting-started.md).

## Step 2. Write an entity and its repository

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

## Step 3. Register the repositories

```java
@SpringBootApplication
@EnableJpaRepositories(
    basePackages = "com.example.library.domain",
    repositoryFactoryBeanClass = SimpliXRepositoryFactoryBean.class
)
public class LibraryApplication {
}
```

`SimpliXRepositoryFactoryBean` creates plain and tree repositories alike.

## Step 4. Report an error with a code

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

With the [starter](en/starter/readme.md), the exception is answered as a `SimpliXApiResponse` of type `ERROR` with status 404 and the code `GEN_NOT_FOUND`.

## Next steps

- [Entities and repositories](en/core/entities-and-repositories.md)
- [API responses and errors](en/core/api-responses-and-errors.md)
- [Building a CRUD API](en/building-a-crud-api.md)
