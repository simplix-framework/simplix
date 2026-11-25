# Configuration reference

| Property | Default | Meaning |
|---|---|---|
| `simplix.egov.enabled` | `true` | registers the eGovFrame beans |

The beans are registered when `org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl` is on the classpath, which the module itself provides. A bean named `leaveaTrace` of your own, or a bean of type `SimpliXTraceHandler`, takes the place of the module's.

## What the module registers

`SimpliXEgovAutoConfiguration` binds `simplix.egov` to `SimpliXEgovProperties` and imports `SimpliXEgovConfiguration`, which declares the beans.

| Bean name | Type | Role | Replace it by |
|---|---|---|---|
| `simplixTraceHandler` | `SimpliXTraceHandler` | writes a trace a service leaves to the log | declaring a bean of type `SimpliXTraceHandler` |
| `traceHandlerService` | `DefaultTraceHandleManager` | passes every trace to the handler | not replaceable; change the handler instead |
| `leaveaTrace` | `LeaveaTrace` | the bean `EgovAbstractServiceImpl` calls from `leaveaTrace(...)` | declaring a bean named `leaveaTrace` |

## Logging libraries

eGovFrame depends on Log4j 2, which collides with the Logback of Spring Boot. The module leaves these artifacts out of its dependencies.

| Artifact | Reason |
|---|---|
| `org.apache.logging.log4j:log4j-slf4j2-impl` | a second SLF4J binding |
| `org.apache.logging.log4j:log4j-core` | a second logging backend beside Logback |

## If it does not work

| Symptom | Cause | What to do |
|---|---|---|
| a service that extends `EgovAbstractServiceImpl` fails to start for lack of a `leaveaTrace` bean | `simplix.egov.enabled` is `false`, or the auto-configuration is excluded | switch the module on, or declare the bean yourself |
| the log warns about several SLF4J providers | another dependency brings `log4j-slf4j2-impl` back | exclude the artifacts of the table above from that dependency |

## Related documents

- [Getting started](en/egov/getting-started.md)
