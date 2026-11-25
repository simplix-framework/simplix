# 메시징 모니터링

브로커의 응답 여부와 발행 · 처리 · 실패 메시지 수를 확인하는 방법을 설명합니다.

## 헬스 체크

```bash
curl http://localhost:8080/actuator/health/messaging
```

Spring Boot Actuator를 사용하면 `MessagingHealthIndicator`가 브로커가 준비 상태이면 `UP`, 아니면 `DOWN`을 보고합니다. 상세 정보에는 브로커 이름과 `consumerGroups`, `replay`, `ordering`, `deadLetter` 기능이 포함됩니다.

## 메트릭

| 메트릭 | 태그 | 집계 대상 |
|---|---|---|
| `simplix.messaging.published` | `channel` | 발행한 메시지 |
| `simplix.messaging.consumed` | `channel`, `group` | 처리한 메시지 |
| `simplix.messaging.failed` | `channel`, `errorType` | 처리에 실패한 메시지 |
| `simplix.messaging.publish.time` | `channel` | 발행 소요 시간 |
| `simplix.messaging.consume.time` | `channel`, `group` | 핸들러 소요 시간 |
| `simplix.messaging.pending.count` | `channel`, `group` | 전달되었지만 확인 응답을 받지 못한 메시지 |

Micrometer가 클래스패스에 있으면 `MessagingMetrics`가 이 메트릭을 등록합니다. 대기 건수가 계속 증가하면 핸들러가 실패하고 있거나 부하에 비해 처리 속도가 느린 것입니다. 한 가지 `errorType`의 실패 건수가 증가하면 원인이 하나라는 뜻입니다.

## 로그

로거 `dev.simplecore.simplix.messaging`을 `DEBUG`로 지정하면 구독, 건너뛴 중복 메시지, 다시 가져온 메시지를 확인할 수 있습니다. 핸들러에서 발생한 예외는 클래스와 메서드 이름과 함께 `ERROR`로 기록됩니다.

## 관련 문서

- [실패 처리](ko/messaging/handling-failures.md)
- [문제 해결](ko/messaging/troubleshooting.md)
