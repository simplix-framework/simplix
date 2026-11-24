[English](en/mybatis/readme.md) | **한국어**

# simplix-mybatis

SimpliX 애플리케이션에서 MyBatis를 사용하기 위한 모듈입니다. MyBatis Spring Boot 스타터와 트랜잭션 관리를 함께 가져오므로, 매퍼 인터페이스를 JPA 저장소와 같은 데이터 소스, 같은 트랜잭션에서 사용할 수 있습니다.

## 설치

[스타터](ko/starter/readme.md)에 이 모듈이 포함되어 있습니다. 스타터 없이 사용할 때는 다음과 같이 추가합니다.

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-mybatis:${version}"
}
```

## 문서

- [시작하기](ko/mybatis/getting-started.md): 매퍼를 작성하고 호출
- [설정 레퍼런스](ko/mybatis/configuration-reference.md)

## 요구 사항

| 프로젝트 | SimpliX 라인 | 선언할 버전 |
|---|---|---|
| Spring Boot 4 | 2.x | `2.x` 릴리스 |
| Spring Boot 3 | 1.x | `1.x` 릴리스 |

## 라이선스

[SimpleCORE License 1.0 (SCL-1.0)](ko/license.md)
