# 여러 수신자에게 발송

템플릿 하나를 여러 수신자에게 수신자별 값으로 발송하고, 수신자별 결과를 확인하는 방법을 설명합니다.

```java
BulkEmailRequest request = BulkEmailRequest.builder()
    .templateCode("loan-due")
    .commonVariables(Map.of("dueDate", "2026-03-09"))
    .recipients(List.of(
        BulkEmailRequest.BulkRecipient.of("ursula@example.com", Map.of("name", "Ursula", "title", "On dragons")),
        BulkEmailRequest.BulkRecipient.of("octavia@example.com", Map.of("name", "Octavia", "title", "Kindred"))))
    .build();

BulkEmailResult result = emailService.sendBulk(request);

result.getTotalCount();     // 2
result.getSuccessCount();   // 2
result.getFailureCount();   // 0
```

수신자마다 별도의 메시지를 받으며 다른 수신자의 주소는 표시되지 않습니다. 템플릿에는 `commonVariables`를 먼저 적용하고 수신자의 변수를 적용하며, 같은 이름이 있으면 수신자의 변수가 우선합니다.

| `BulkEmailRequest`의 필드 | 기본값 | 의미 |
|---|---|---|
| `templateCode` | 필수 | 모든 수신자에게 발송할 템플릿 |
| `recipients` | 필수 | 수신자별 `BulkEmailRequest.BulkRecipient`. 주소와 해당 수신자의 변수로 구성됩니다 |
| `commonVariables` | 빈 값 | 모든 메시지에 공통으로 적용하는 값 |
| `locale` | JVM의 기본 로케일 | 배치 전체의 언어. 언어별로 배치를 나누어 발송하세요 |
| `subject` | 템플릿의 제목 | 제목을 대체합니다 |
| `from` | `simplix.email.from` | 발신자 |
| `priority` | `LOW` | 각 메시지의 우선순위 |
| `continueOnError` | `true` | `false`이면 실패한 첫 수신자에서 발송을 중단합니다. 시도하지 않은 수신자는 결과의 `pendingCount`에 포함됩니다 |
| `batchId` | 자동 생성 | 배치 식별자. 결과에 포함됩니다 |
| `tenantId`, `tags` | 없음 | 일반 메시지와 같습니다 |

## 결과 확인

```java
for (BulkEmailResult.RecipientResult recipient : result.getResults()) {
    if (!recipient.isSuccess()) {
        log.warn("mail to {} failed: {}", EmailAddress.of(recipient.getEmail()).toMaskedString(), recipient.getErrorMessage());
    }
}
```

| `BulkEmailResult`의 필드 | 내용 |
|---|---|
| `batchId` | 배치 식별자 |
| `totalCount`, `successCount`, `failureCount`, `pendingCount` | 전체 수신자 수와 발송 성공, 실패 수. `pendingCount`는 0으로 유지됩니다 |
| `results` | 수신자별 `BulkEmailResult.RecipientResult`: `email`, `success`, `messageId`, `errorMessage`, `status` |
| `startTime`, `endTime` | 배치의 시작 시각과 종료 시각 |
| `providerType` | 발송한 프로바이더 |

## 대량 배치

- 호출자가 배치 전체를 기다리지 않도록 `sendBulkAsync`를 사용하세요. 한 배치의 메시지는 이 경우에도 순서대로 하나씩 발송합니다.
- 수천 건이 넘는 목록은 여러 요청으로 나누세요. 프로바이더는 초당 접수 건수를 제한하며, 작은 배치는 다시 실행하기 쉽습니다.
- 결과에서 실패한 수신자를 보관했다가 나중에 다시 발송하세요. 배치 전체를 다시 실행하면 이미 받은 수신자에게 메시지가 중복 발송됩니다.
- 비밀번호 재설정처럼 사용자가 요청한 메일은 공지 배치에 포함하지 말고 `send`로 `HIGH` 우선순위를 지정해 발송하세요.

## 관련 문서

- [템플릿 사용](ko/email/using-templates.md)
- [프로바이더 선택](ko/email/choosing-a-provider.md)
