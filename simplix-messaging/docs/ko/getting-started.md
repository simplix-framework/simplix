# simplix-messaging 시작하기

이 페이지에서는 메시지를 발행하고 처리합니다. 먼저 프로세스 하나 안에서 실행한 뒤 브로커를 사용하도록 전환합니다.

## 1단계. 메시지 정의

```java
public record LoanOpened(String loanId, String memberId) {
}
```

메시지는 바이트로 전달됩니다. JSON으로 기록하고 읽는 레코드를 사용하면 발행 측과 구독 측이 서로의 클래스에 의존하지 않습니다.

## 2단계. 발행

```java
@Service
@RequiredArgsConstructor
public class LoanDesk {

    private final MessagePublisher messagePublisher;

    public void open(String loanId, String memberId) {
        byte[] payload = JsonCodec.serialize(new LoanOpened(loanId, memberId));
        messagePublisher.publish(Message.ofBytes("loan-opened", payload));
    }
}
```

`JsonCodec.serialize`가 레코드를 JSON 바이트로 변환하고, `Message.ofBytes`로 채널을 지정합니다. 채널은 첫 메시지나 첫 핸들러가 등록될 때 생성되므로 따로 선언할 필요가 없습니다.

## 3단계. 처리

```java
@Component
public class LoanNotifier {

    @MessageHandler(channel = "loan-opened", group = "notifier")
    public void onLoanOpened(Message<byte[]> message) {
        LoanOpened event = JsonCodec.deserialize(message.getPayload(), LoanOpened.class);
        // notify the member
    }
}
```

Spring 빈의 메서드에 `@MessageHandler`를 지정하면 애플리케이션이 준비되었을 때 구독이 시작됩니다. `group`은 컨슈머 그룹의 이름입니다. 그룹마다 채널의 모든 메시지를 받고, 그룹 안에서는 한 인스턴스만 받습니다. 메서드가 반환되면 메시지에 확인 응답을 보냅니다.

## 4단계. 실행

`LoanDesk.open("l-42", "m-7")`을 호출하세요. 기본 `local` 브로커에서는 곧바로 같은 프로세스에서 핸들러가 실행되며, 헬스 엔드포인트에서 브로커를 확인할 수 있습니다.

```text
BrokerCapabilities[consumerGroups=true, replay=true, ordering=true, deadLetter=false, scheduledDelivery=true, nativeDedup=false, nativeRequestReply=false]
```

## 5단계. 브로커 사용

```groovy
dependencies {
    implementation "io.nats:jnats"
}
```

```yaml
simplix:
  messaging:
    broker: nats
    nats:
      servers: nats://localhost:4222
```

발행 코드와 핸들러는 그대로 사용합니다. 브로커를 전환하면 메시지는 NATS JetStream으로 전달됩니다. 재시작 후에도 메시지가 유지되고, 애플리케이션의 여러 인스턴스가 그룹의 작업을 나누어 처리합니다.

## 다음 단계

- [메시지 발행](./publishing-messages.md)
- [메시지 처리](./handling-messages.md)
- [브로커 선택](./choosing-a-broker.md)
