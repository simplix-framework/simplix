# simplix-egov 시작하기

이 문서는 eGovFrame 방식의 서비스를 작성하고 트레이스를 기록하는 과정을 안내합니다.

## 1단계. 서비스 작성

```java
@Service
public class LoanDesk extends EgovAbstractServiceImpl {

    public void open(String loanId) {
        // ...
        leaveaTrace("loan.opened");
    }
}
```

`leaveaTrace`의 인자는 메시지 키입니다. 애플리케이션의 메시지에 키를 정의하세요.

```properties
loan.opened=A loan was opened
```

## 2단계. 트레이스 확인

트레이스는 `dev.simplecore.simplix.egov.config.SimpliXTraceHandler`가 `DEBUG` 수준으로 기록합니다. 이 로거를 `DEBUG`로 설정하고 `open`을 호출하면 다음과 같이 기록됩니다.

```
[eGov-TRACE] com.example.library.docs.LoanDesk: A loan was opened
```

메시지가 없는 키는 `null`로 기록됩니다.

## 트레이스를 다른 곳으로 전송

`SimpliXTraceHandler` 타입의 빈을 등록하면 핸들러를 대체합니다.

```java
@Component
public class AuditTraceHandler extends SimpliXTraceHandler {

    @Override
    public void todo(Class<?> clazz, String message) {
        // send the trace to your monitoring system
    }
}
```

## 다음 단계

- [설정 레퍼런스](./configuration-reference.md)
- [서비스와 컨트롤러 작성](../../../spring-boot-starter-simplix/docs/ko/writing-services-and-controllers.md)
