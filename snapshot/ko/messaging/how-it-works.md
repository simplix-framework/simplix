# simplix-messaging 동작 방식

발행부터 핸들러 실행까지 관여하는 클래스, 브로커가 선택되는 방식, 모듈이 등록하는 구성을 설명합니다.

## 발행부터 핸들러까지

1. `MessagePublisher`(구현은 `DefaultMessagePublisher`)가 페이로드를 바이트로 변환하고, 헤더에 메시지 ID와 타임스탬프를 추가한 뒤 `BrokerStrategy.send`를 호출합니다.
2. 설정한 브로커의 `BrokerStrategy`가 메시지를 채널에 저장합니다.
3. 시작할 때 `MessageHandlerRegistrar`가 모든 `@MessageHandler` 메서드를 찾아 형식을 검사합니다. 애플리케이션이 준비되면 `subscriber-startup-delay`가 지난 뒤 `SubscribeRequest`로 각 메서드를 구독하고 반환된 `Subscription`을 보관합니다.
4. 브로커가 메시지를 `MessageListener`에 전달합니다. 레지스트라는 멱등 핸들러이면 먼저 `IdempotencyStore`를 조회하고, 페이로드를 매개변수의 타입으로 변환한 뒤 메서드를 호출합니다.
5. 메서드가 반환되고 `autoAck`가 켜져 있으면 레지스트라가 브로커의 `MessageAcknowledgment`로 확인 응답을 보냅니다. 메서드에서 예외가 발생하면 확인 응답을 보내지 않습니다.

## 브로커 선택 방식

| `broker` | 구성 클래스 | 전략 | 함께 등록하는 구성 |
|---|---|---|---|
| `local` 또는 미지정 | `MessagingAutoConfiguration` 내부 | `LocalBrokerStrategy` | `LocalReplayService`, `LocalIdempotencyStore`. 전환 값을 켜면 `LocalMessageScheduler`도 등록합니다 |
| `nats` | `NatsMessagingConfiguration` | `NatsBrokerStrategy` | `NatsOptionsBuilder`로 구성한 연결(`NatsLoggingConnectionListener`, `NatsLoggingErrorListener` 포함), `NatsJetStreamPublisher`, `NatsJetStreamPullSubscriber`, `NatsConsumerGroupManager`, `NatsJetStreamReplayService`, `NatsNativeIdempotencyStore`. 전환 값을 켜면 `NatsLeaderElection`을 사용하는 `NatsScheduledMessagePublisher`도 등록합니다 |
| `redis` | `RedisMessagingConfiguration` | `RedisBrokerStrategy` | `RedisStreamPublisher`, `RedisStreamSubscriber`, `RedisConsumerGroupManager`, `RedisStreamReplayService`, `RedisIdempotencyStore`. 전환 값을 켜면 `RedisScheduledMessagePublisher`도 등록합니다 |
| `kafka` | `KafkaMessagingConfiguration` | `KafkaBrokerStrategy` | 추가 구성 없음 |
| `rabbit` | `RabbitMessagingConfiguration` | `RabbitBrokerStrategy` | 추가 구성 없음 |

각 구성 클래스는 해당 브로커 값을 지정했고 클라이언트 라이브러리가 클래스패스에 있을 때만 활성화됩니다. `MessagingAutoConfiguration`은 `simplix.messaging`을 `MessagingProperties`에 바인딩하고 모든 브로커가 공유하는 구성을 등록합니다. 발행자, 레지스트라, `RetryPolicy`, `PoisonMessageHandler`, 활성화한 경우 `DeadLetterStrategy`, 라이브러리가 있는 경우 메트릭과 헬스 인디케이터가 여기에 해당합니다.

## 브로커 내부 도우미

| 클래스 | 역할 |
|---|---|
| `SubscriptionHealthTracker` | 채널 컨슈머의 실행 여부를 기록합니다. 헬스 인디케이터에서 사용합니다 |
| `InFlightTracker` | 컨슈머가 처리 중인 NATS 메시지를 집계합니다. 종료할 때 처리 완료를 기다리는 데 사용합니다 |
| `NatsMessageAcknowledgment`, `NatsSubscription` | NATS 브로커의 확인 응답과 구독 |
| `LocalBrokerStrategy.PublishedMessage` | 로컬 브로커가 재생과 테스트 검증용으로 보관하는 메시지. `getPublishedMessages(channel)`로 조회합니다 |
| `StreamReplayService`, `ScheduledMessagePublisher`, `IdempotentGuard` | 기존 코드를 위해 유지하는 Redis 전용 클래스. `ReplayService`, `MessageScheduler`, `IdempotencyStore`를 사용하세요 |

## 브로커 직접 작성

다른 수단으로 메시지를 전달하려면 `BrokerStrategy`를 구현한 빈을 선언하세요. 채널에 헤더와 함께 바이트를 전송하고, 그룹의 리스너를 구독하고, 확인 응답을 처리하며, `BrokerCapabilities`를 실제 기능에 맞게 반환해야 합니다. 특정 기능에 의존하는 코드는 이 값을 조회합니다.

| `BrokerStrategy`의 메서드 | 동작 |
|---|---|
| `send(channel, payload, headers)` | 채널에 바이트를 저장하고 `PublishResult`를 반환합니다 |
| `ensureConsumerGroup(channel, groupName)` | 브로커가 그룹을 지원하면 채널의 그룹을 생성합니다 |
| `subscribe(request)` | `SubscribeRequest`의 리스너에 채널 메시지 전달을 시작하고 `Subscription`을 반환합니다 |
| `acknowledge(channel, groupName, messageId)` | 메시지를 처리 완료로 표시합니다 |
| `capabilities()`, `name()`, `isReady()` | 호출자, 로그, 헬스 인디케이터에 브로커 정보를 제공합니다 |
| `initialize()`, `shutdown()` | 연결을 열고 닫습니다 |

## 관련 문서

- [브로커 선택](ko/messaging/choosing-a-broker.md)
- [설정 레퍼런스](ko/messaging/configuration-reference.md)
- [문제 해결](ko/messaging/troubleshooting.md)
