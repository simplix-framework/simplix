# 설정 레퍼런스

`simplix.messaging` 아래에 있는 모듈의 모든 속성을 정리합니다.

## 브로커와 핸들러

| 속성 | 기본값 | 의미 |
|---|---|---|
| `broker` | `local` | `local`, `nats`, `redis`, `kafka`, `rabbit` 중 하나 |
| `instance-id` | 호스트에서 생성 | 이 인스턴스의 이름. 컨슈머 이름과 리더 선출에 사용합니다 |
| `subscriber-startup-delay` | `0` | 애플리케이션이 준비된 뒤 핸들러가 메시지를 받기 시작할 때까지의 대기 시간 |
| `publisher.auto-message-id` | `false` | NATS에서 ID 헤더가 없는 메시지에 ID를 생성해 추가합니다. 서버에서 중복을 제거할 수 있습니다 |
| `idempotent.ttl` | 24시간 | 처리한 메시지의 ID를 보관하는 시간 |
| `error.max-retries` | `3` | `RetryPolicy` 빈의 재시도 횟수. NATS에서는 메시지 전달 횟수(이 값 + 1)에도 적용됩니다 |
| `error.retry-backoff` | 1초 | `RetryPolicy` 빈의 첫 대기 시간 |
| `error.dead-letter.enabled` | `false` | `DeadLetterStrategy` 빈을 등록합니다 |

## 채널

| 속성 | 기본값 | 의미 |
|---|---|---|
| `channels.<name>.max-length` | `50000` | 보관하는 최대 메시지 수. NATS에서는 해당 채널의 스트림에 적용합니다. Redis에서는 모든 채널의 값 중 가장 작은 값을 모든 스트림에 적용합니다 |
| `channels.<name>.duplicate-window` | 브로커 설정값 | NATS에서 해당 채널의 메시지 ID를 인식하는 시간 |
| `channels.<name>.deliver-policy` | 브로커 설정값 | NATS에서 해당 채널의 새 컨슈머가 시작하는 위치: `all` 또는 `new` |
| `channels.<name>.content-type` | `application/json` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

## Redis

| 속성 | 기본값 | 의미 |
|---|---|---|
| `redis.key-prefix` | 빈 값 | 모든 스트림 키 앞에 추가하는 값 |
| `redis.batch-size` | `10` | 폴링 한 번에 읽는 메시지 수 |
| `redis.poll-timeout` | 2초 | 폴링에서 메시지를 기다리는 시간 |
| `redis.pending-check-interval` | 30초 | 컨슈머가 대기 상태로 남은 메시지를 확인하는 주기 |
| `redis.claim-min-idle-time` | 5분 | 대기 메시지를 다른 컨슈머가 가져가기 전까지의 최소 유휴 시간 |
| `redis.payload-encoding` | `BASE64` | `BASE64` 또는 `RAW` |
| `redis.scheduler.enabled` | `false` | 사용 중단된 지연 전달 스케줄러를 등록합니다 |

## NATS 연결

| 속성 | 기본값 | 의미 |
|---|---|---|
| `nats.servers` | `nats://localhost:4222` | 서버 목록. 쉼표로 구분합니다 |
| `nats.username`, `nats.password` | 빈 값 | 사용자와 비밀번호 |
| `nats.token` | 빈 값 | 토큰 |
| `nats.creds-file` | 빈 값 | 인증 정보 파일 |
| `nats.nkey-file` | 빈 값 | 아직 지원하지 않습니다. 경고를 로그에 기록합니다 |
| `nats.tls.enabled` | `false` | TLS로 연결합니다 |
| `nats.tls.trust-store`, `nats.tls.trust-store-password` | 빈 값 | 클라이언트가 신뢰하는 인증서 |
| `nats.tls.key-store`, `nats.tls.key-store-password` | 빈 값 | 상호 TLS에 사용하는 클라이언트 인증서 |
| `nats.connection-name` | `simplix-messaging` | 서버에 표시되는 연결 이름 |
| `nats.connection-timeout` | 5초 | 연결 대기 시간 |
| `nats.reconnect-wait` | 2초 | 재연결 시도 사이의 대기 시간 |
| `nats.max-reconnects` | `-1` | 재연결 시도 횟수. `-1`은 제한 없음 |

## NATS 스트림과 컨슈머

| 속성 | 기본값 | 의미 |
|---|---|---|
| `nats.stream-prefix` | `simplix-` | 스트림 이름 앞에 추가하는 값 |
| `nats.subject-prefix` | `simplix.` | 서브젝트 앞에 추가하는 값 |
| `nats.auto-create-streams` | `true` | 없는 스트림을 생성합니다. `false`이면 시작할 때 실패합니다 |
| `nats.auto-update-streams` | `true` | 기존 스트림을 설정에 맞게 변경합니다 |
| `nats.retention` | `limits` | 스트림의 보존 정책 |
| `nats.storage` | `file` | `file` 또는 `memory` |
| `nats.discard-policy` | `old` | 스트림이 가득 찼을 때 버리는 대상 |
| `nats.max-msgs`, `nats.max-bytes` | `-1` | 스트림의 크기 한도. `max-msgs`가 음수이면 채널에 `max-length`를 지정하지 않는 한 50,000건을 적용합니다. `max-bytes`의 `-1`은 제한 없음 |
| `nats.max-age` | 7일 | 메시지 보관 기간 |
| `nats.duplicate-window` | 2분 | 메시지 ID를 인식하는 시간 |
| `nats.replicas` | `1` | 클러스터에서 스트림의 복제본 수 |
| `nats.ack-policy` | `explicit` | 컨슈머의 확인 응답 정책 |
| `nats.ack-wait` | 30초 | 서버가 확인 응답을 기다린 뒤 다시 전달하기까지의 시간 |
| `nats.max-deliver` | `error.max-retries` + 1 | 메시지 한 건의 최대 전달 횟수 |
| `nats.deliver-policy` | `all` | 새 컨슈머의 시작 위치: `all` 또는 `new` |
| `nats.batch-size` | `10` | 요청 한 번에 가져오는 메시지 수 |
| `nats.poll-timeout` | 2초 | 가져오기 대기 시간 |
| `nats.pending-check-interval` | 30초 | 메트릭용 대기 건수를 읽는 주기 |
| `nats.scheduler.enabled` | `false` | 사용 중단된 지연 전달 스케줄러를 등록합니다 |
| `nats.scheduler.kv-bucket` | `simplix-scheduled` | 스케줄러의 키-값 버킷 |
| `nats.scheduler.poll-interval` | 5초 | 전달 시점이 된 메시지를 확인하는 주기 |
| `nats.scheduler.leader-lock-ttl` | 30초 | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

## 로컬 브로커

| 속성 | 기본값 | 의미 |
|---|---|---|
| `local.scheduler.enabled` | `false` | 로컬 브로커의 사용 중단된 지연 전달 스케줄러를 등록합니다 |

## Kafka와 RabbitMQ

이 브로커의 연결 정보는 Spring Boot의 `spring.kafka.*`와 `spring.rabbitmq.*`로 지정합니다. 모듈에서 추가하는 속성은 없습니다.

## 관련 문서

- [브로커 선택](ko/messaging/choosing-a-broker.md)
- [실패 처리](ko/messaging/handling-failures.md)
