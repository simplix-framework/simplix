# 메시지 재생과 요청-응답

채널에 남아 있는 메시지를 다시 읽는 방법, 채널로 요청을 보내고 응답을 기다리는 방법, 지연 전달의 현재 상태를 설명합니다.

## 재생

```java
@Service
@RequiredArgsConstructor
public class LoanHistoryRebuilder {

    private final ReplayService replayService;

    public long rebuildSince(Instant from) {
        return replayService.replay("loan-returned", from, Instant.now(),
            (message, acknowledgment) -> apply(new String(message.getPayload(), StandardCharsets.UTF_8)));
    }
}
```

재생은 채널에 저장된 메시지를 읽어 리스너에 전달하며 컨슈머 그룹에는 영향을 주지 않습니다. 채널의 핸들러에는 재생 메시지가 전달되지 않습니다. 프로젝션을 다시 구성하거나, 새 컨슈머에 이력을 채우거나, 문제를 해결한 뒤 데드 레터 채널을 처리할 때 사용하세요.

| `ReplayService`의 메서드 | 읽는 범위 |
|---|---|
| `Instant` 값을 사용하는 `replay(channel, from, to, listener)` | 지정한 시각 사이에 저장된 메시지 |
| `replay(channel, fromId, toId, listener)` | 브로커의 레코드 ID 범위에 해당하는 메시지. 로컬과 Redis 브로커에서는 `"0"`이 처음, `"+"`가 끝을 뜻합니다 |
| `replayPaginated(channel, fromId, toId, listener, pageSize)` | 같은 범위. 한 번에 최대 `pageSize`건씩 읽습니다 |

각 메서드는 재생한 메시지 수를 반환합니다. `ReplayService` 빈은 로컬, Redis, NATS 브로커에서 등록됩니다. 재생할 수 있는 범위는 채널의 보존 설정으로 결정됩니다. NATS는 `max-age`, Redis는 스트림 길이입니다.

## 요청과 응답

```java
@Configuration
public class StockQueryConfig {

    @Bean(destroyMethod = "shutdown")
    public RequestReplyTemplate stockRequests(BrokerStrategy brokerStrategy) {
        return new RequestReplyTemplate(brokerStrategy, "stock-replies", "desk");
    }
}
```

```java
Message<byte[]> request = Message.ofBytes("stock-query", "isbn-978-1".getBytes(StandardCharsets.UTF_8));

Message<byte[]> reply = stockRequests.sendAndReceive(request, Duration.ofSeconds(3)).get();
String count = new String(reply.getPayload(), StandardCharsets.UTF_8);
```

```java
@Component
@RequiredArgsConstructor
public class StockQueryHandler {

    private final MessagePublisher messagePublisher;
    private final StockCounter stockCounter;

    @MessageHandler(channel = "stock-query", group = "stock")
    public void onStockQuery(Message<String> message) {
        MessageHeaders replyHeaders = MessageHeaders.empty()
            .with(MessageHeaders.CORRELATION_ID, message.getHeaders().correlationId());

        messagePublisher.publish(Message.<String>builder()
            .channel(message.getHeaders().replyChannel())
            .payload(String.valueOf(stockCounter.count(message.getPayload())))
            .headers(replyHeaders)
            .build());
    }
}
```

1. `sendAndReceive`가 요청의 헤더에 상관관계 ID와 응답 채널을 추가해 발행합니다.
2. 응답하는 핸들러가 `replyChannel()`을 읽어 같은 상관관계 ID와 함께 해당 채널에 응답을 발행합니다.
3. 응답 채널을 구독 중인 템플릿이 해당 ID의 요청에 대한 future를 완료합니다.
4. 타임아웃 안에 응답이 없는 요청의 future는 `TimeoutException`으로 완료되며, `get()`은 이 예외를 원인으로 하는 `ExecutionException`을 발생시킵니다.

`RequestReplyTemplate`은 응답 채널마다 하나씩 생성해 애플리케이션이 실행되는 동안 유지하세요. `shutdown()`을 호출하면 구독이 종료됩니다. 브로커를 사용한 요청은 다른 서비스가 수 초 안에 응답하는 질의에 사용하세요. 즉시 응답이 필요한 호출에는 HTTP 호출이 더 단순합니다.

> ⚠ NATS에서는 첫 요청 전에 응답 채널의 스트림이 있어야 합니다. 스트림이 없으면 요청은 `Failed to add/update consumer for stream <stream>`(`stream not found`) 오류로 실패합니다. 서브젝트 `<subject-prefix><reply channel>`에 스트림 `<stream-prefix><reply channel>`을 미리 생성하세요. 로컬과 Redis 브로커에서는 준비할 것이 없습니다.

## 지연 전달

`MessageScheduler`는 지정한 시간이 지난 뒤 메시지를 발행합니다. `publishDelayed(message, delay)`는 ID를 반환하고 `cancel(id)`로 취소합니다. 이 인터페이스와 구현은 사용 중단(deprecated) 상태이며 이후 메이저 릴리스에서 제거됩니다. `simplix.messaging.local.scheduler.enabled`, `simplix.messaging.redis.scheduler.enabled`, `simplix.messaging.nats.scheduler.enabled`를 `true`로 지정한 경우에만 등록됩니다.

새로 작성하는 코드에서는 메시지의 발행 예정 시각을 데이터베이스 컬럼에 보관하고, [simplix-scheduler](ko/scheduler/readme.md)에서 설명하는 방식으로 락을 적용한 `@Scheduled` 메서드에서 발행하거나 스케줄링 엔진을 사용하세요.

## 관련 문서

- [실패 처리](ko/messaging/handling-failures.md)
- [브로커 선택](ko/messaging/choosing-a-broker.md)
