# Getting started with the starter

The starter is what [Getting started](en/getting-started.md) installs: that page adds the dependency, writes the application class, creates the token key and runs the application. This page says what is in place once it runs and where to go next.

## What is in place after the first run

| You can | Because | Next |
|---|---|---|
| write an entity and get a complete API | the base service and controller classes are on the classpath | [Building a CRUD API](en/building-a-crud-api.md) |
| throw an exception and have it answered as JSON | the exception handler is registered | [Handling errors](en/starter/handling-errors.md) |
| store and return date-time values in one zone | the date-time converters and serializers are registered | [Working with dates and time zones](en/starter/working-with-dates-and-time-zones.md) |
| read the API document at `/v3/api-docs` | springdoc is included and extended | [Documenting the API](en/starter/documenting-the-api.md) |
| sign users in | `simplix-auth` is included | [Securing an application](en/securing-an-application.md) |

## The application class

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

| Annotation | Needed | Why |
|---|---|---|
| `@SpringBootApplication` | always | scans the application's own package; the starter scans its packages itself |
| `@EnableJpaRepositories` with `SimpliXRepositoryFactoryBean` | always | gives repositories the tree queries and the filter-aware read by id |
| `@EntityScan` | when entities live outside the package of the application class, for example in modules | tells JPA where the entities are |
| `@EnableScheduling`, `@EnableAsync` | when the application schedules or runs methods asynchronously | the starter does not switch them on |

## A layout that works with the generator

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

You write the entity and its repository under `domain`; the [CLI](en/cli/readme.md) writes the service, the DTOs and the controller of the entity under `web`. In a project made of Gradle modules, each module keeps the same `domain` and `web` split and the application module lists every module package in `@EntityScan` and `@EnableJpaRepositories`.

## Switch a part off

```yaml
simplix:
  exception-handler:
    enabled: false
  date-time:
    request-timezone-enabled: false
```

Each part has a property that switches it off; the [configuration reference](en/starter/configuration-reference.md) lists them. A bean of your own of the same type also replaces the starter's, since its beans are registered only when none exists.

## Next steps

- [Writing services and controllers](en/starter/writing-services-and-controllers.md)
- [Configuration reference](en/starter/configuration-reference.md)
