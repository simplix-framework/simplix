# 메시지 처리

핸들러 작성 방법, 메시지를 처리 완료로 판단하는 시점, 중복 메시지를 건너뛰는 방법, 인스턴스 간 작업 분산 방식을 설명합니다.

## 핸들러 작성

```java
@Component
@Slf4j
public class LoanEventHandlers {

    private final List<String> received = new CopyOnWriteArrayList<>();

    // The payload arrives as text; the handler decodes the JSON itself
    @MessageHandler(channel = "loan-opened", group = "notifier")
    public void onLoanOpened(Message<String> message) {
        LoanOpened event = JsonCodec.deserialize(message.getPayload().getBytes(StandardCharsets.UTF_8), LoanOpened.class);
        received.add("opened:" + event.loanId());
    }

    // The handler decides when the message counts as processed
    @MessageHandler(channel = "loan-returned", group = "ledger", autoAck = false)
    public void onLoanReturned(Message<String> message, MessageAcknowledgment acknowledgment) {
        received.add("returned:" + message.getPayload());
        acknowledgment.ack();
    }

    // A message id that was seen before is skipped
    @MessageHandler(channel = "fee-charged", group = "billing", idempotent = true)
    public void onFeeCharged(Message<String> message) {
        received.add("fee:" + message.getPayload());
    }

    public List<String> received() {
        return received;
    }
}
```

핸들러는 Spring 빈의 메서드입니다. 첫 번째 매개변수는 `Message<T>`이고, 두 번째 매개변수를 사용한다면 `MessageAcknowledgment`여야 합니다. 형식이 다른 메서드가 있으면 해당 메서드 이름이 포함된 메시지와 함께 애플리케이션 시작이 중단됩니다.

| 매개변수의 `T` | 페이로드 전달 형태 |
|---|---|
| `byte[]` | 바이트 그대로 |
| `String` | UTF-8로 읽은 문자열 |
| Wire protobuf 클래스 | 디코딩한 메시지 |
| 그 밖의 타입 | 바이트 그대로. 메서드에서 `JsonCodec.deserialize` 등으로 디코딩하세요 |

| `@MessageHandler`의 속성 | 기본값 | 의미 |
|---|---|---|
| `channel` | 필수 | 구독할 채널 |
| `group` | 빈 값 | 컨슈머 그룹. 같은 그룹의 핸들러가 메시지를 나누어 받습니다 |
| `concurrency` | `1` | 이 인스턴스에서 핸들러용으로 실행하는 컨슈머 수 |
| `autoAck` | `true` | 메서드가 예외 없이 반환되면 확인 응답을 보냅니다 |
| `idempotent` | `false` | 이 그룹이 이미 처리한 ID의 메시지를 건너뜁니다 |

## 그룹

| 구성 | 메시지를 받는 대상 |
|---|---|
| 그룹이 다른 핸들러 여러 개 | 모든 핸들러가 한 번씩 |
| 핸들러 하나, 애플리케이션 인스턴스 세 개 | 세 인스턴스 중 하나 |
| `concurrency = 4` | 인스턴스의 컨슈머 네 개 중 하나. 메시지를 병렬로 처리하므로 엄격한 순서는 보장되지 않습니다 |

`notifier`, `ledger`처럼 용도마다 그룹 이름을 지정하고 이름을 변경하지 마세요. 브로커는 그룹별로 처리한 메시지를 기록합니다. RabbitMQ에는 컨슈머 그룹이 없습니다. [브로커 선택](ko/messaging/choosing-a-broker.md)을 참고하세요.

## 수동 확인 응답

```java
@Component
@RequiredArgsConstructor
public class FeeHandlers {

    private final BillingService billing;

    // The method decides when the message counts as processed
    @MessageHandler(channel = "fee-charged", group = "billing", autoAck = false)
    public void onFeeCharged(Message<byte[]> message, MessageAcknowledgment acknowledgment) {
        FeeCharged event = JsonCodec.deserialize(message.getPayload(), FeeCharged.class);
        if (billing.record(event)) {
            acknowledgment.ack();
        } else {
            acknowledgment.nack(true);
        }
    }
}
```

| 호출 | 브로커에 전달하는 의미 |
|---|---|
| `ack()` | 메시지 처리 완료 |
| `nack(true)` | 처리하지 못했습니다. 다시 전달을 요청합니다 |
| `nack(false)` | 처리하지 못했습니다. 다시 전달하지 않습니다 |
| `reject(reason)` | 처리할 수 없는 메시지 |

메서드가 끝나는 시점이 아닌 다른 시점에 작업이 완료되는 경우, 예를 들어 비동기 호출의 결과를 받은 뒤에 완료되는 경우에는 `autoAck = false`를 사용하세요.

## 중복 건너뛰기

브로커는 메시지를 한 번 이상 전달합니다. 타임아웃이나 재시작 뒤에 같은 메시지가 다시 도착할 수 있습니다. `idempotent = true`를 지정하면 모듈이 그룹별로 메시지 ID를 보관하고, 반복된 메시지는 메서드를 호출하지 않고 확인 응답을 보냅니다. ID가 `fee-1`인 메시지를 세 번 발행해도 핸들러에는 한 번만 전달됩니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.messaging.idempotent.ttl` | 24시간 | 메시지 ID를 보관하는 시간 |

ID는 `IdempotencyStore`에 보관합니다. 로컬 브로커는 메모리, Redis 브로커는 Redis, NATS 브로커는 NATS에 보관합니다. 수수료의 식별자처럼 업무 이벤트에서 가져온 `messageId`로 발행하세요. 발행자가 같은 메시지를 다시 보내도 ID가 같아집니다.

## 구독 시작 지연

```yaml
simplix:
  messaging:
    subscriber-startup-delay: 10s
```

핸들러는 애플리케이션이 준비된 뒤에 시작됩니다. 지연을 지정하면 그 시간만큼 기다린 뒤 시작하므로, 스트림에 연결된 브라우저처럼 재시작 후 다시 연결하는 클라이언트가 첫 메시지 전에 연결을 복구할 수 있습니다.

## 관련 문서

- [실패 처리](ko/messaging/handling-failures.md)
- [메시지 발행](ko/messaging/publishing-messages.md)
