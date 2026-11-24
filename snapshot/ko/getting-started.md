# 시작하기

이 문서는 SimpliX를 사용하는 Spring Boot 프로젝트를 설정하고 실행하는 과정을 안내합니다. 끝까지 따라 하면 SimpliX 자동 구성이 적용된 애플리케이션이 실행되고, 첫 엔티티를 추가할 수 있습니다.

## 준비

- JDK 17 이상
- Gradle로 빌드하는 Spring Boot 프로젝트. 프로젝트의 Spring Boot 세대에 맞는 SimpliX 라인을 사용합니다.
- `read:packages` 범위가 있는 GitHub 개인 액세스 토큰
- Node.js 20 이상. 이 문서에서 키를 만들 때 사용하며, SimpliX CLI도 Node.js로 실행합니다.

| 프로젝트 | SimpliX 라인 | 설치 |
|---|---|---|
| Spring Boot 4 | 2.x | `npm install -g @simplix-boot/cli` |
| Spring Boot 3 | 1.x | `npm install -g @simplix-boot/cli@spring-boot-3x` |

## 1단계. 저장소와 스타터 추가

SimpliX는 `dev.simplecore.simplix` 그룹으로 GitHub Packages에 게시합니다. 스타터가 함께 가져오는 searchable-jpa와 eGovFrame 런타임은 각자의 저장소에서 제공합니다. 모두 `build.gradle`에 추가하세요.

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

| 저장소 | 제공하는 아티팩트 |
|---|---|
| `maven.pkg.github.com/simplix-framework/simplix` | SimpliX 모듈 |
| `maven.pkg.github.com/simplix-framework/searchable-jpa` | 생성된 API의 검색 계층인 searchable-jpa |
| `maven.egovframe.go.kr/maven` | `simplix-egov`가 사용하는 eGovFrame 런타임 |

`${version}`은 [릴리스 페이지](https://github.com/simplix-framework/simplix/releases)에서 사용하는 라인의 버전으로 바꾸세요. 엔티티와 생성된 코드는 Lombok을 사용하고, 예제는 인메모리 H2 데이터베이스로 실행합니다. 이어서 `gradle.properties`에 자격 증명을 적고, 이 파일을 `.gitignore`에 추가하세요.

```properties
gpr.user=<your GitHub user name>
gpr.token=<personal access token with read:packages>
```

## 2단계. 애플리케이션 클래스 작성

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

`SimpliXRepositoryFactoryBean`이 저장소를 생성합니다. `SimpliXTreeRepository`를 상속하는 저장소에는 반드시 필요하고 일반 저장소도 함께 동작하므로, 애플리케이션에 한 번만 지정하면 됩니다.

## 3단계. 토큰 키 생성

스타터에 포함된 `simplix-auth`는 발급하는 토큰을 RSA 키로 암호화하며, 애플리케이션을 시작할 때 이 키를 읽습니다. 키를 JSON Web Key 파일로 만드세요.

```bash
mkdir -p src/main/resources/keys
node -e "console.log(JSON.stringify(require('crypto').generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({format:'jwk'})))" > src/main/resources/keys/jwe-key.json
```

> ⚠ 이 파일에는 개인 키가 들어 있습니다. `src/main/resources/keys/`를 `.gitignore`에 추가하고, 운영 환경에서는 별도의 키나 키 교체 기능을 사용하세요.

## 4단계. 애플리케이션 설정

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

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.auth.jwe.encryption-key-location` | 없음 | 3단계에서 만든 키 파일 |
| `simplix.date-time.default-timezone` | `spring.jackson.time-zone`, 없으면 시스템 시간대 | 값에 시간대 정보가 없을 때 사용하는 시간대 |
| `simplix.date-time.use-utc-for-database` | `true` | `OffsetDateTime` 값을 저장하기 전에 UTC로 변환 |
| `simplix.date-time.normalize-timezone` | `true` | `LocalDateTime` 값을 애플리케이션 시간대의 시각으로 해석 |
| `simplix.exception-handler.enabled` | `true` | 예외를 `SimpliXApiResponse` 오류로 응답 |
| `simplix.core.enabled` | `true` | SimpliX 자동 구성 사용 |

모듈별 속성은 `simplix.<module>` 아래에 있으며, 각 모듈 문서에 정리되어 있습니다.

## 5단계. 실행

```bash
./gradlew bootRun
```

애플리케이션은 8080 포트에서 시작됩니다. Spring Security가 활성화되어 있으므로, 애플리케이션에 사용자 정보가 등록되기 전에는 모든 요청에 401로 응답합니다. SimpliX의 보안 구성과 토큰 엔드포인트는 애플리케이션이 `SimpliXUserDetailsService`를 제공해야 활성화되며, 그 방법은 [애플리케이션 보안 적용](ko/securing-an-application.md)에 있습니다.

## 시작되지 않을 때

| 메시지 | 원인 | 해결 |
|---|---|---|
| `Could not resolve dev.simplecore.simplix:spring-boot-starter-simplix` | Gradle이 GitHub Packages를 읽지 못함 | `gpr.user`와 `gpr.token`을 확인하고, 토큰에 `read:packages` 범위가 있는지 확인 |
| `Could not resolve dev.simplecore.searchable:spring-boot-starter-searchable-jpa` 또는 `org.egovframe.rte:...` | 1단계의 저장소 중 일부가 없음 | searchable-jpa와 eGovFrame 저장소를 추가 |
| `package lombok does not exist` | Lombok을 선언하지 않음 | 1단계의 `compileOnly`와 `annotationProcessor` 줄을 추가 |
| `Security key is not configured. Please set simplix.auth.jwt.secret-key` | 토큰 키를 설정하지 않았습니다. 메시지에 적힌 속성은 존재하지 않습니다 | 3단계의 키를 만들고 `simplix.auth.jwe.encryption-key-location`을 설정 |

## 다음 단계

- [CRUD API 만들기](ko/building-a-crud-api.md): 엔티티를 작성하고 API를 생성합니다.
- [애플리케이션 보안 적용](ko/securing-an-application.md): 로그인과 토큰을 적용합니다.
