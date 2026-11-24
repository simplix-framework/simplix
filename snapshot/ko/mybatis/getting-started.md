# simplix-mybatis 시작하기

이 문서는 JPA보다 SQL로 작성하기 쉬운 쿼리의 매퍼를 작성하고, JPA 저장소와 함께 호출하는 과정을 안내합니다.

## 1단계. MyBatis 설정

```yaml
mybatis:
  mapper-locations: classpath*:mapper/**/*.xml
  configuration:
    map-underscore-to-camel-case: true
```

이 설정은 모두 필요합니다. `mapper-locations`가 없으면 XML 파일을 불러오지 않아 호출이 `Invalid bound statement (not found)`로 실패합니다. `map-underscore-to-camel-case`가 없으면 `pen_name` 같은 컬럼이 `penName` 속성에 매핑되지 않으며, 매핑된 컬럼이 없는 행은 `null`로 반환됩니다.

## 2단계. 매퍼 작성

```java
@Mapper
public interface AuthorMapper {

    List<AuthorRow> findByPenNameLike(@Param("pattern") String pattern);

    int countAll();
}

@Getter
@Setter
public class AuthorRow {

    private String authorId;
    private String penName;
}
```

애플리케이션 패키지에 있는 `@Mapper` 인터페이스는 자동으로 등록됩니다.

## 3단계. SQL 작성

`src/main/resources/mapper/AuthorMapper.xml`로 저장하세요. `namespace`는 인터페이스의 전체 이름입니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.library.domain.catalog.mapper.AuthorMapper">

    <select id="findByPenNameLike" resultType="com.example.library.domain.catalog.mapper.AuthorRow">
        SELECT author_id, pen_name
        FROM authors
        WHERE pen_name LIKE #{pattern}
        ORDER BY pen_name
    </select>

    <select id="countAll" resultType="int">
        SELECT COUNT(*) FROM authors
    </select>
</mapper>
```

## 4단계. 호출

`AuthorMapper`를 일반 빈처럼 주입하세요. Ursula, Octavia, Ursa라는 작가가 저장되어 있으면 `findByPenNameLike("Urs%")`는 Ursa와 Ursula를 반환하고, `countAll()`은 3을 반환합니다.

## MyBatis와 JPA 함께 사용

매퍼는 애플리케이션의 `DataSource`를 사용하고 같은 트랜잭션에 참여합니다. 트랜잭션 안에서 JPA 저장소로 저장하고 플러시한 행은 커밋 전에도 매퍼 쿼리에서 조회됩니다. 쿼리하기 전에 플러시하세요. Hibernate가 아직 기록하지 않은 변경은 MyBatis에서 조회되지 않습니다.

## 동작하지 않을 때

| 증상 | 원인 | 해결 |
|---|---|---|
| `Invalid bound statement (not found)` | XML을 불러오지 않았거나, `namespace` 또는 구문 ID가 인터페이스와 다름 | `mybatis.mapper-locations`를 설정하고 이름을 비교 |
| 쿼리가 `null` 행이나 `null` 속성을 반환 | 컬럼 이름이 속성 이름에 매핑되지 않음 | `mybatis.configuration.map-underscore-to-camel-case: true`를 설정 |
| `Could not resolve type alias` | XML의 짧은 클래스 이름을 찾을 수 없음 | 전체 클래스 이름을 사용하거나 `mybatis.type-aliases-package`를 설정 |
| 로그에 `No MyBatis mapper was found in '[classpath*:mapper/**/*.xml]' package` 경고 | 모듈의 스캔이 매퍼 위치를 패키지 이름으로 읽음 | 조치할 필요가 없습니다. 매퍼는 애플리케이션 패키지 스캔으로 등록됩니다 |

## 다음 단계

- [설정 레퍼런스](ko/mybatis/configuration-reference.md)
