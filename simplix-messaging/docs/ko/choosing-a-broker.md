# 브로커 선택

메시지를 전달하는 브로커의 선택 기준, 브로커별 기능, 설정 방법을 설명합니다. 발행 코드와 핸들러는 모든 브로커에서 같습니다.

| `simplix.messaging.broker` | 전달 수단 | 필요 사항 | 적합한 경우 |
|---|---|---|---|
| `local` | 단일 프로세스의 메모리 | 없음 | 테스트와 개발 |
| `nats` | NATS JetStream | `io.nats:jnats` | 권장 기본값. 서버에서 중복을 제거하며 모든 기능을 사용할 수 있습니다 |
| `redis` | Redis Streams | `spring-boot-starter-data-redis` | 이미 운영 중인 Redis 서버 |
| `kafka` | Kafka 토픽 | `org.springframework.kafka:spring-kafka` | 대용량과 장기 보존 |
| `rabbit` | RabbitMQ | `spring-boot-starter-amqp` | 이미 운영 중인 RabbitMQ |

## 브로커별 기능

아래 표는 각 브로커가 `BrokerStrategy.capabilities()`로 반환하는 `BrokerCapabilities` 값입니다.

| 기능 | `local` | `nats` | `redis` | `kafka` | `rabbit` |
|---|---|---|---|---|---|
| `consumerGroups`: 그룹 안에서 메시지를 나누어 받음 | ✔ | ✔ | ✔ | ✔ | ✖ |
| `replay`: 이전 메시지를 다시 읽을 수 있음 | ✔ | ✔ | ✔ | ✔ | ✖ |
| `ordering`: 전송한 순서대로 도착함 | ✔ | ✔ | ✔ | ✔ | ✖ |
| `deadLetter`: 브로커 자체의 데드 레터 처리 | ✖ | ✔ | ✖ | ✔ | ✔ |
| `scheduledDelivery`: 메시지를 나중에 전달할 수 있음 | ✔ | ✔ | ✔ | ✖ | ✖ |
| `nativeDedup`: 브로커가 반복된 메시지 ID를 제거함 | ✖ | ✔ | ✔ | ✖ | ✖ |
| `nativeRequestReply`: 브로커 자체의 요청-응답 | ✖ | ✔ | ✖ | ✖ | ✖ |

## NATS JetStream

```yaml
simplix:
  messaging:
    broker: nats
    nats:
      servers: nats://nats-1:4222,nats://nats-2:4222
      stream-prefix: "library-"
      subject-prefix: "library."
      replicas: 3
      max-age: 7d
      duplicate-window: 2m
```

- 채널은 `<stream-prefix><channel>` 이름의 스트림과 `<subject-prefix><channel>` 서브젝트로 구성됩니다. 같은 서버를 사용하는 애플리케이션이 스트림을 공유하지 않도록 접두어를 직접 지정하세요.
- 컨슈머는 메시지를 배치로 가져와 건별로 확인 응답을 보냅니다. 핸들러에서 예외가 발생한 메시지는 즉시, `ack-wait` 안에 확인 응답을 받지 못한 메시지는 해당 시간이 지난 뒤 다시 전달합니다. 전달 횟수는 합쳐서 최대 `max-deliver`회입니다.
- `duplicate-window` 안에 반복된 메시지 ID는 서버에서 제거하고, 발행 결과의 `duplicate`가 true로 반환됩니다.
- 인증 정보는 `username`과 `password`, `token`, `creds-file` 중 하나로 지정합니다. `nkey-file`은 아직 지원하지 않으며 지정하면 경고를 로그에 기록합니다.
- `auto-create-streams: false`와 `auto-update-streams: false`를 지정하면 Terraform 등으로 관리하는 스트림을 모듈이 변경하지 않습니다. 이때 스트림이 없는 채널은 `Stream <name> is not provisioned` 오류로 실패합니다.

## Redis Streams

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379

simplix:
  messaging:
    broker: redis
    redis:
      key-prefix: "library:"
      batch-size: 20
      poll-timeout: 3s
      claim-min-idle-time: 5m
      payload-encoding: BASE64
```

- 채널은 `<key-prefix><channel>` 키의 스트림이고, 그룹은 해당 스트림의 컨슈머 그룹입니다.
- 메시지를 처리하던 컨슈머가 중단되면 해당 메시지는 대기 상태로 남습니다. 다른 컨슈머가 `claim-min-idle-time`보다 오래 유휴 상태인 메시지를 가져갑니다. 이 시간은 핸들러의 최대 실행 시간보다 충분히 길게 지정하세요. 그렇지 않으면 처리 시간이 긴 메시지가 중복 처리됩니다.
- `payload-encoding`은 `PayloadEncoding` 값입니다. `BASE64`는 페이로드를 문자열로 저장하고, `RAW`는 바이트를 그대로 저장해 스트림을 조회하는 도구에서 디코딩할 수 있습니다.
- 모든 스트림의 길이는 설정한 `channels.<name>.max-length` 중 가장 작은 값으로 제한합니다. 설정이 없으면 50,000건입니다.

## Kafka

```yaml
spring:
  kafka:
    bootstrap-servers: kafka:9092

simplix:
  messaging:
    broker: kafka
```

채널은 토픽이고 그룹은 Kafka 컨슈머 그룹입니다. 순서는 파티션 안에서만 보장되므로, 같은 키의 메시지를 한 파티션에 모으려면 `x-partition-key` 헤더를 지정하세요. Kafka에는 지연 전달이 없고 브로커에서 중복을 제거하지 않습니다. 반복되면 안 되는 핸들러는 직접 구현한 저장소와 함께 `idempotent = true`를 사용하거나 작업을 멱등하게 구현하세요.

## RabbitMQ

```yaml
spring:
  rabbitmq:
    host: rabbitmq
    port: 5672

simplix:
  messaging:
    broker: rabbit
```

채널은 같은 이름의 영속 큐이며, 채널 이름을 라우팅 키로 토픽 익스체인지 `simplix.messaging`에 바인딩됩니다. 각 큐는 데드 레터 익스체인지 `simplix.messaging.dlx`와 데드 레터 큐 `<channel>.dlq`를 지정해 선언됩니다. RabbitMQ는 컨슈머 그룹, 재생, 순서 보장을 지원하지 않습니다. 메시지마다 한 번 처리하고 이력이 필요 없는 작업에 사용하세요.

## 채널 설정

```yaml
simplix:
  messaging:
    channels:
      audit-events:
        max-length: 1000000
        duplicate-window: 5m
        deliver-policy: new
```

| 속성 | 기본값 | 의미 |
|---|---|---|
| `channels.<name>.max-length` | `50000` | 보관하는 최대 메시지 수. NATS에서는 해당 채널의 스트림에 적용합니다. Redis에서는 모든 채널의 값 중 가장 작은 값을 모든 스트림에 적용합니다 |
| `channels.<name>.duplicate-window` | 브로커 설정값 | NATS에서 해당 채널의 메시지 ID를 인식하는 시간 |
| `channels.<name>.deliver-policy` | 브로커 설정값 | NATS에서 해당 채널의 새 컨슈머가 시작하는 위치: `all` 또는 `new` |
| `channels.<name>.content-type` | `application/json` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

## 브로커 교체

1. 의존성의 클라이언트 라이브러리를 교체합니다.
2. `simplix.messaging.broker`와 새 브로커의 설정을 지정합니다.
3. 기능 표에서 새 브로커가 지원하지 않는 기능을 확인합니다. 코드에서 사용하는 재생, 지연 전달, 브로커의 중복 제거가 대상입니다.
4. 이전 브로커에 남아 있는 메시지는 이전되지 않습니다. 전환하기 전에 컨슈머가 모두 처리하도록 하세요.

## 관련 문서

- [설정 레퍼런스](./configuration-reference.md)
- [실패 처리](./handling-failures.md)
- [문제 해결](./troubleshooting.md)
