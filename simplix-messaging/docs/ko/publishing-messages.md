# 메시지 발행

메시지 구성 방법, 사용할 수 있는 페이로드, 함께 전달되는 헤더, 발행 결과를 설명합니다.

## 메시지 구성

```java
// Bytes, for example JSON
Message<byte[]> json = Message.ofBytes("loan-opened", JsonCodec.serialize(new LoanOpened("l-42", "m-7")));

// Text
Message<String> text = Message.<String>builder()
    .channel("loan-returned")
    .payload("l-42")
    .build();

// With headers and an id of your own
Message<String> traced = Message.<String>builder()
    .channel("loan-returned")
    .messageId("return-l-42")
    .payload("l-42")
    .headers(MessageHeaders.empty()
        .with(MessageHeaders.CORRELATION_ID, "req-1")
        .with(MessageHeaders.SOURCE, "desk"))
    .build();

PublishResult result = messagePublisher.publish(traced);
```

| `Message<T>`의 구성 요소 | 기본값 | 의미 |
|---|---|---|
| `channel` | 필수 | 메시지를 전송할 채널 |
| `payload` | 없음 | 내용. `byte[]`, `String` 또는 `Message.ofProtobuf`를 사용한 Wire protobuf 메시지 |
| `messageId` | 자동 생성한 UUID | 메시지 식별자. 브로커와 핸들러가 중복을 제거할 때 사용합니다 |
| `headers` | 빈 값 | `MessageHeaders`. 페이로드와 함께 전달되는 문자열 값입니다 |
| `timestamp` | 현재 시각 | 메시지 생성 시각 |

> ⚠ 객체를 JSON으로 자동 변환하지 않습니다. `Message<LoanOpened>`를 발행하면 `IllegalArgumentException: Unsupported payload type`으로 실패합니다. `JsonCodec.serialize`나 애플리케이션의 `ObjectMapper`로 먼저 직렬화하세요.

## JSON

```java
byte[] bytes = JsonCodec.serialize(new LoanOpened("l-42", "m-7"));
LoanOpened event = JsonCodec.deserialize(bytes, LoanOpened.class);
```

`JsonCodec`은 `java.time` 타입을 지원하는 매퍼로 JSON을 기록하고 읽습니다. `new JsonCodec(objectMapper)`로 생성하면 `encode`와 `decode`에 애플리케이션의 매퍼를 사용합니다. 실패하면 `JsonCodec.JsonCodecException`이 발생합니다.

## 헤더

| `MessageHeaders`의 상수 | 헤더 | 설정 주체 |
|---|---|---|
| `MESSAGE_ID` | `x-message-id` | 발행자. 메시지의 ID로 설정합니다 |
| `TIMESTAMP` | `x-timestamp` | 발행자. 메시지의 시각으로 설정합니다 |
| `CORRELATION_ID` | `x-correlation-id` | 애플리케이션. 한 업무 이벤트의 메시지를 연결합니다. 요청-응답 템플릿에서도 사용합니다 |
| `SOURCE` | `x-source` | 애플리케이션. 메시지를 보낸 구성 요소를 지정합니다 |
| `CONTENT_TYPE` | `x-content-type` | 애플리케이션. 페이로드가 채널의 일반 형식과 다를 때 지정합니다 |
| `PARTITION_KEY` | `x-partition-key` | 애플리케이션. 파티션을 사용하는 브로커에서 같은 키의 메시지 순서를 유지합니다 |
| `REPLY_CHANNEL` | `x-reply-channel` | 요청-응답 템플릿 |
| `RETRY_COUNT`, `DEAD_LETTER_REASON`, `ORIGINAL_CHANNEL`, `DEAD_LETTERED_AT` | `x-retry-count`, `x-dead-letter-reason`, `x-original-channel`, `x-dead-lettered-at` | 데드 레터 전략 |

`MessageHeaders`는 불변 객체이며 `with(key, value)`는 새 인스턴스를 반환합니다. `get(key)`로 헤더를 읽고, 자주 사용하는 헤더는 `correlationId()`, `contentType()`, `source()`, `replyChannel()`, `retryCount()`로 읽습니다.

## 발행 결과

| `PublishResult`의 필드 | 내용 |
|---|---|
| `recordId` | 브로커가 저장한 메시지에 부여한 ID |
| `channel` | 채널 |
| `timestamp` | 브로커가 메시지를 접수한 시각 |
| `duplicate` | 브로커가 메시지 ID를 인식해 메시지를 버렸으면 `true` |

`publish`는 브로커가 메시지를 접수하면 반환하며, 핸들러 실행을 기다리지 않습니다. 구독자가 없는 채널에도 메시지는 접수됩니다. `publishAsync`는 `CompletableFuture`를 반환하고 다른 스레드에서 전송합니다. `isAvailable()`은 브로커의 준비 여부를 반환합니다.

## 데이터 변경과 함께 발행

트랜잭션 안에서 발행한 메시지는 트랜잭션이 롤백되어도 전송됩니다. 저장되지 않은 대출을 핸들러가 처리하지 않도록 커밋 후에 발행하세요.

```java
@Component
@RequiredArgsConstructor
public class LoanMessages {

    private final MessagePublisher messagePublisher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(LoanOpenedEvent event) {
        messagePublisher.publish(Message.ofBytes("loan-opened", JsonCodec.serialize(event.payload())));
    }
}
```

## 관련 문서

- [메시지 처리](./handling-messages.md)
- [메시지 재생과 요청-응답](./replaying-messages-and-request-reply.md)
