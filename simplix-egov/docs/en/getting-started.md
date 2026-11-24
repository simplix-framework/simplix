# Getting started with simplix-egov

This page writes an eGovFrame-style service and records a trace from it.

## Step 1. Write a service

```java
@Service
public class LoanDesk extends EgovAbstractServiceImpl {

    public void open(String loanId) {
        // ...
        leaveaTrace("loan.opened");
    }
}
```

`leaveaTrace` takes a message key. Define it in the messages of the application.

```properties
loan.opened=A loan was opened
```

## Step 2. Read the trace

The trace is logged at `DEBUG` by `dev.simplecore.simplix.egov.config.SimpliXTraceHandler`. With that logger at `DEBUG`, a call to `open` writes:

```
[eGov-TRACE] com.example.library.docs.LoanDesk: A loan was opened
```

A key with no message is logged as `null`.

## Send traces elsewhere

Register a bean of type `SimpliXTraceHandler` to replace the handler.

```java
@Component
public class AuditTraceHandler extends SimpliXTraceHandler {

    @Override
    public void todo(Class<?> clazz, String message) {
        // send the trace to your monitoring system
    }
}
```

## Next steps

- [Configuration reference](./configuration-reference.md)
- [Writing services and controllers](../../../spring-boot-starter-simplix/docs/en/writing-services-and-controllers.md)
