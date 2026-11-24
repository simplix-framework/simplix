**English** | [한국어](ko/egov/readme.md)

# simplix-egov

Integration with eGovFrame, the Korean e-Government standard framework. It brings the eGovFrame runtime and registers the beans `EgovAbstractServiceImpl` needs, so a Spring Boot application can write eGovFrame-style services without XML configuration.

## Install

The [starter](en/starter/readme.md) includes the module. Without the starter:

```groovy
repositories {
    maven {
        url = uri("https://maven.egovframe.go.kr/maven/")
    }
}

dependencies {
    implementation "dev.simplecore.simplix:simplix-egov:${version}"
}
```

## What it provides

| Bean | Type | Does |
|---|---|---|
| `leaveaTrace` | `LeaveaTrace` | the bean `EgovAbstractServiceImpl` injects to record a trace |
| `traceHandlerService` | `DefaultTraceHandleManager` | sends the traces of every class to the handler |
| `simplixTraceHandler` | `SimpliXTraceHandler` | writes a trace to the log through SLF4J |

`SimpliXBaseService` of the starter extends `EgovAbstractServiceImpl`, so every SimpliX service is an eGovFrame service as well.

## Documents

- [Getting started](en/egov/getting-started.md): write a service and record a trace
- [Configuration reference](en/egov/configuration-reference.md)

## Requirements

| Your project | SimpliX line | Version to declare |
|---|---|---|
| Spring Boot 4 | 2.x | a `2.x` release |
| Spring Boot 3 | 1.x | a `1.x` release |

## License

[SimpleCORE License 1.0 (SCL-1.0)](en/license.md)
