# Getting started

This page sets up a Spring Boot project that uses SimpliX and starts it. At the end the application runs with the SimpliX auto-configuration in place, ready for the first entity.

## Before you begin

- JDK 17 or later.
- A Spring Boot project built with Gradle. Take the SimpliX line that matches its Spring Boot generation.
- A GitHub personal access token with the `read:packages` scope.
- Node.js 20 or later. This page uses it to create a key, and the SimpliX CLI runs on it.

| Your project | SimpliX line | Install |
|---|---|---|
| Spring Boot 4 | 2.x | `npm install -g @simplix-boot/cli` |
| Spring Boot 3 | 1.x | `npm install -g @simplix-boot/cli@spring-boot-3x` |

## Step 1. Add the repositories and the starter

SimpliX is published to GitHub Packages under the group `dev.simplecore.simplix`. The starter also brings searchable-jpa and the eGovFrame runtime, which are served from repositories of their own. Add all of them to `build.gradle`.

```groovy
repositories {
    mavenCentral()
    maven {
        url = uri("https://maven.pkg.github.com/simplix-framework/simplix")
        credentials {
            username = project.findProperty("gpr.user") ?: System.getenv("GITHUB_USERNAME")
            password = project.findProperty("gpr.token") ?: System.getenv("GITHUB_TOKEN")
        }
    }
    maven {
        url = uri("https://maven.pkg.github.com/simplix-framework/searchable-jpa")
        credentials {
            username = project.findProperty("gpr.user") ?: System.getenv("GITHUB_USERNAME")
            password = project.findProperty("gpr.token") ?: System.getenv("GITHUB_TOKEN")
        }
    }
    maven {
        url = uri("https://maven.egovframe.go.kr/maven/")
        content {
            includeGroup "org.egovframe.rte"
        }
    }
}

dependencies {
    implementation "dev.simplecore.simplix:spring-boot-starter-simplix:${version}"
    runtimeOnly 'com.h2database:h2'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
}
```

| Repository | Serves |
|---|---|
| `maven.pkg.github.com/simplix-framework/simplix` | the SimpliX modules |
| `maven.pkg.github.com/simplix-framework/searchable-jpa` | searchable-jpa, the search layer of the generated APIs |
| `maven.egovframe.go.kr/maven` | the eGovFrame runtime that `simplix-egov` builds on |

Replace `${version}` with a version of your line from the [releases page](https://github.com/simplix-framework/simplix/releases). The entities and the generated code use Lombok, and the example runs on an in-memory H2 database. Then give Gradle the credentials in `gradle.properties`, and add that file to `.gitignore`.

```properties
gpr.user=<your GitHub user name>
gpr.token=<personal access token with read:packages>
```

## Step 2. Write the application class

```java
package com.example.library;

import dev.simplecore.simplix.core.tree.factory.SimpliXRepositoryFactoryBean;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
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

`SimpliXRepositoryFactoryBean` creates the repositories. A repository that extends `SimpliXTreeRepository` needs it, and plain repositories work with it too, so set it once for the application.

## Step 3. Create the token key

The starter includes `simplix-auth`, which encrypts the tokens it issues with an RSA key and reads that key when the application starts. Create the key as a JSON Web Key file.

```bash
mkdir -p src/main/resources/keys
node -e "console.log(JSON.stringify(require('crypto').generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({format:'jwk'})))" > src/main/resources/keys/jwe-key.json
```

> ⚠ The file holds a private key. Add `src/main/resources/keys/` to `.gitignore`, and use a separate key or key rotation in production.

## Step 4. Configure the application

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:library
  jpa:
    hibernate:
      ddl-auto: create-drop
    open-in-view: false

simplix:
  auth:
    jwe:
      encryption-key-location: classpath:keys/jwe-key.json
  date-time:
    default-timezone: Asia/Seoul
    use-utc-for-database: true
```

| Property | Default | Meaning |
|---|---|---|
| `simplix.auth.jwe.encryption-key-location` | none | the key file of step 3 |
| `simplix.date-time.default-timezone` | `spring.jackson.time-zone`, then the system time zone | the time zone used when a value carries none |
| `simplix.date-time.use-utc-for-database` | `true` | converts `OffsetDateTime` values to UTC before they are saved |
| `simplix.date-time.normalize-timezone` | `true` | reads a `LocalDateTime` value as a time in the application time zone |
| `simplix.exception-handler.enabled` | `true` | answers exceptions as `SimpliXApiResponse` errors |
| `simplix.core.enabled` | `true` | switches the SimpliX auto-configuration on |

Each module has properties of its own under `simplix.<module>`; they are listed in the module's documents.

## Step 5. Run it

```bash
./gradlew bootRun
```

The application starts on port 8080. Spring Security is active, so every request is answered with 401 until the application knows its users. SimpliX's own security configuration and its token endpoints become active once the application provides a `SimpliXUserDetailsService`, which [Securing an application](./securing-an-application.md) covers.

## If it does not start

| Message | Cause | Fix |
|---|---|---|
| `Could not resolve dev.simplecore.simplix:spring-boot-starter-simplix` | Gradle could not read GitHub Packages | check `gpr.user` and `gpr.token`, and that the token has `read:packages` |
| `Could not resolve dev.simplecore.searchable:spring-boot-starter-searchable-jpa` or `org.egovframe.rte:...` | a repository of step 1 is missing | add the searchable-jpa and eGovFrame repositories |
| `package lombok does not exist` | Lombok is not declared | add the `compileOnly` and `annotationProcessor` lines of step 1 |
| `Security key is not configured. Please set simplix.auth.jwt.secret-key` | no token key is configured; the property the message names does not exist | create the key of step 3 and set `simplix.auth.jwe.encryption-key-location` |

## Next steps

- [Building a CRUD API](./building-a-crud-api.md): write an entity and generate its API.
- [Securing an application](./securing-an-application.md): add login and tokens.
