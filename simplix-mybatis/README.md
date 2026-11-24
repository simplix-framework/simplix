**English** | [한국어](./README.ko.md)

# simplix-mybatis

MyBatis for a SimpliX application. The module brings the MyBatis Spring Boot starter and transaction management, so mapper interfaces work beside the JPA repositories on the same data source and in the same transactions.

## Install

The [starter](../spring-boot-starter-simplix/README.md) includes the module. Without the starter:

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-mybatis:${version}"
}
```

## Documents

- [Getting started](docs/en/getting-started.md): write a mapper and call it
- [Configuration reference](docs/en/configuration-reference.md)

## Requirements

| Your project | SimpliX line | Version to declare |
|---|---|---|
| Spring Boot 4 | 2.x | a `2.x` release |
| Spring Boot 3 | 1.x | a `1.x` release |

## License

[SimpleCORE License 1.0 (SCL-1.0)](../docs/en/license.md)
