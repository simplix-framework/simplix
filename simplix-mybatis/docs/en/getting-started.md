# Getting started with simplix-mybatis

This page writes a mapper for a query that is easier in SQL than in JPA, and calls it beside a JPA repository.

## Step 1. Configure MyBatis

```yaml
mybatis:
  mapper-locations: classpath*:mapper/**/*.xml
  configuration:
    map-underscore-to-camel-case: true
```

Both settings are needed. Without `mapper-locations` the XML files are not loaded and a call fails with `Invalid bound statement (not found)`. Without `map-underscore-to-camel-case` a column such as `pen_name` does not reach the property `penName`, and a row whose columns all miss is returned as `null`.

## Step 2. Write the mapper

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

A `@Mapper` interface in a package of the application is found automatically.

## Step 3. Write the SQL

Save it as `src/main/resources/mapper/AuthorMapper.xml`. The `namespace` is the full name of the interface.

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

## Step 4. Call it

Inject `AuthorMapper` like any bean. With authors named Ursula, Octavia and Ursa stored, `findByPenNameLike("Urs%")` returns Ursa and Ursula, and `countAll()` returns 3.

## MyBatis and JPA together

The mappers use the `DataSource` of the application and join its transactions. Inside a transaction, a row saved and flushed through a JPA repository is visible to a mapper query before the commit. Flush before you query: MyBatis does not see changes Hibernate has not yet written.

## If it does not work

| Symptom | Cause | Fix |
|---|---|---|
| `Invalid bound statement (not found)` | the XML was not loaded, or its `namespace` or statement id differs from the interface | set `mybatis.mapper-locations`; compare the names |
| a query returns `null` rows or `null` properties | column names are not mapped to property names | set `mybatis.configuration.map-underscore-to-camel-case: true` |
| `Could not resolve type alias` | a short class name in the XML is not known | use the full class name, or set `mybatis.type-aliases-package` |
| the log warns `No MyBatis mapper was found in '[classpath*:mapper/**/*.xml]' package` | a scan of the module reads the mapper location as a package name | none needed: the mappers are registered by the scan of the application packages |

## Next steps

- [Configuration reference](./configuration-reference.md)
