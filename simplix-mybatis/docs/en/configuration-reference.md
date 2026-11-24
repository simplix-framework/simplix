# Configuration reference

The module is configured with the properties of the MyBatis Spring Boot starter, under `mybatis`.

| Property | Default | Meaning |
|---|---|---|
| `mybatis.enabled` | `true` | `false` leaves the SimpliX MyBatis configuration out |
| `mybatis.mapper-locations` | none | where the mapper XML files are, such as `classpath*:mapper/**/*.xml` |
| `mybatis.type-aliases-package` | none | the package whose classes can be named by their short name in XML |
| `mybatis.config-location` | none | a MyBatis configuration file, such as `classpath:mybatis-config.xml` |
| `mybatis.configuration.map-underscore-to-camel-case` | `false` | maps a column `pen_name` to a property `penName` |
| `mybatis.configuration.call-setters-on-nulls` | `false` | calls the setter of a property whose column is `NULL` |

## What the module registers

`SimpliXMyBatisAutoConfiguration` binds the properties to `SimpliXMyBatisProperties` and registers transaction management, and a `SqlSessionFactory` and `SqlSessionTemplate` for an application that has none. It runs after the auto-configuration of the MyBatis starter. With the MyBatis starter the module brings, the starter's own session factory is the one in use, and it is configured by the properties above.

## Related documents

- [Getting started](./getting-started.md)
