# 메일 발송

메시지를 구성해 즉시 또는 백그라운드로 발송하고, 결과에 따라 처리하는 방법을 설명합니다.

## 메시지 구성

```java
// HTML body
emailService.send(EmailRequest.simple("ursula@example.com", "Welcome", "<p>Hello</p>"));

// Plain text body
emailService.send(EmailRequest.plainText("ursula@example.com", "Welcome", "Hello"));
```

팩토리 메서드로 수신자가 한 명인 메시지를 만들 수 있습니다. 수신자가 여러 명이거나 다른 필드가 필요하면 빌더를 사용합니다.

```java
EmailRequest request = EmailRequest.builder()
    .from(EmailAddress.of("Library", "library@example.com"))
    .to(List.of(EmailAddress.of("Ursula", "ursula@example.com")))
    .cc(List.of(EmailAddress.of("desk@example.com")))
    .replyTo(EmailAddress.of("help@example.com"))
    .subject("Your receipt")
    .htmlBody("<p>See the attachment.</p>")
    .textBody("See the attachment.")
    .attachments(List.of(EmailAttachment.of("receipt.pdf", "application/pdf", pdfBytes)))
    .priority(MailPriority.HIGH)
    .correlationId("loan-42")
    .tags(List.of("receipt"))
    .build();

EmailResult result = emailService.send(request);
```

| `EmailRequest`의 필드 | 기본값 | 의미 |
|---|---|---|
| `to` | 필수 | 수신자. 한 명 이상 지정합니다 |
| `subject` | 필수 | 제목 |
| `htmlBody`, `textBody` | 없음 | HTML 본문, 일반 문자열 본문 또는 양쪽 모두. 모두 지정하면 메일 프로그램이 지원하는 형식을 표시합니다 |
| `from` | `simplix.email.from` | 발신자 |
| `cc`, `bcc` | 빈 값 | 참조와 숨은 참조 |
| `replyTo` | 없음 | 답장이 발신자가 아닌 주소로 가야 할 때의 회신 주소 |
| `attachments` | 빈 값 | 첨부 파일과 인라인 이미지 |
| `priority` | `NORMAL` | `MailPriority` 값: `LOW`, `NORMAL`, `HIGH`, `CRITICAL` |
| `headers` | 빈 값 | 추가 메일 헤더 |
| `correlationId` | 없음 | 메시지를 업무 이벤트와 연결하는 식별자. 로그 추적에 사용합니다 |
| `tags` | 빈 값 | 프로바이더에서 통계를 구분하는 라벨 |
| `tenantId` | 없음 | 메시지가 속한 테넌트. 템플릿 리졸버에 전달됩니다 |

## 주소

```java
EmailAddress.of("ursula@example.com");
EmailAddress.of("Ursula", "ursula@example.com");

EmailAddress.of("Ursula", "ursula@example.com").toFormattedString();  // "Ursula" <ursula@example.com>
EmailAddress.of("ursula@example.com").toMaskedString();               // u***@example.com
```

주소를 로그에 기록할 때는 `toMaskedString()`을 사용하세요. 서비스는 주소의 형식을 검사하지 않습니다. `not-an-address` 같은 문자열도 그대로 프로바이더에 전달하므로, 주소는 애플리케이션에 입력되는 시점에 검증하세요.

## 첨부 파일과 인라인 이미지

```java
EmailAttachment receipt = EmailAttachment.of("receipt.pdf", "application/pdf", pdfBytes);

// Shown inside the HTML body through its content id
EmailAttachment logo = EmailAttachment.inline("logo", "logo.png", "image/png", logoBytes);

EmailRequest request = EmailRequest.builder()
    .to(List.of(EmailAddress.of("ursula@example.com")))
    .subject("Your receipt")
    .htmlBody("<img src=\"cid:logo\"><p>See the attachment.</p>")
    .attachments(List.of(receipt, logo))
    .build();
```

첨부 파일은 파일 이름, 콘텐츠 타입, 바이트로 구성됩니다. 인라인 첨부에는 콘텐츠 ID도 지정하며, HTML에서 `cid:<id>`로 참조합니다. `getSize()`는 크기(바이트)를 반환합니다. 프로바이더는 메시지 전체 크기를 제한하며 보통 10MB 안팎입니다.

## 결과 확인

```java
EmailResult result = emailService.send(request);

if (result.isSuccess()) {
    log.info("sent {} through {}", result.getMessageId(), result.getProviderType());
} else if (result.isRetryable()) {
    retryQueue.add(request);
} else {
    log.error("mail refused: {} ({})", result.getErrorMessage(), result.getErrorCode());
}
```

| `EmailResult`의 필드 | 내용 |
|---|---|
| `success` | 프로바이더가 메시지를 접수했는지 여부 |
| `status` | `EmailStatus` 값. 이 모듈은 `SENT` 또는 `FAILED`를 반환합니다. `PENDING`, `SENDING`, `DELIVERED`, `BOUNCED`, `COMPLAINED`는 전달 상태를 직접 추적하는 애플리케이션에서 사용합니다 |
| `messageId` | 프로바이더가 메시지에 부여한 ID |
| `providerType` | 응답한 `MailProviderType`: `CONSOLE`, `SMTP`, `AWS_SES`, `SENDGRID`, `RESEND` |
| `errorMessage`, `errorCode` | 실패 사유 |
| `retryable` | 나중에 다시 발송하면 성공할 가능성이 있는지 여부 |
| `timestamp` | 프로바이더가 응답한 시각 |

수신자나 제목이 없는 요청에는 프로바이더를 호출하기 전에 실패 결과를 반환합니다: `Validation failed: At least one recipient is required`.

## 백그라운드 발송

```java
emailService.sendAsync(request)
    .thenAccept(result -> {
        if (!result.isSuccess()) {
            log.warn("mail failed: {}", result.getErrorMessage());
        }
    });
```

`sendAsync`, `sendTemplateAsync`, `sendBulkAsync`는 `CompletableFuture`를 즉시 반환하고 모듈의 스레드 풀에서 발송합니다. 회원 가입이나 결제 후 알림처럼 호출자가 메일 서버를 기다릴 필요가 없는 경우에 사용하세요. 다음 단계가 발송 결과에 따라 달라진다면 동기 방식으로 발송합니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.email.async.core-pool-size` | `2` | 대기 상태로 유지하는 스레드 수 |
| `simplix.email.async.max-pool-size` | `10` | 최대 스레드 수 |
| `simplix.email.async.queue-capacity` | `100` | 스레드를 기다리는 메시지 수 |
| `simplix.email.async.thread-name-prefix` | `email-async-` | 스레드 이름. 로그에 표시됩니다 |

## 관련 문서

- [템플릿 사용](ko/email/using-templates.md)
- [프로바이더 선택](ko/email/choosing-a-provider.md)
