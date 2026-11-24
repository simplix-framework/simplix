# Sending mail

How to build a message, send it now or in the background, and act on the result.

## Build a message

```java
// HTML body
emailService.send(EmailRequest.simple("ursula@example.com", "Welcome", "<p>Hello</p>"));

// Plain text body
emailService.send(EmailRequest.plainText("ursula@example.com", "Welcome", "Hello"));
```

The two factory methods cover a message to one recipient. Everything else goes through the builder.

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

| Field of `EmailRequest` | Default | Meaning |
|---|---|---|
| `to` | required | the recipients; at least one |
| `subject` | required | the subject line |
| `htmlBody`, `textBody` | none | the body as HTML, as plain text, or both; with both, the mail program shows the one it supports |
| `from` | `simplix.email.from` | the sender |
| `cc`, `bcc` | empty | copies, visible and hidden |
| `replyTo` | none | where an answer goes when it is not the sender |
| `attachments` | empty | files and inline images |
| `priority` | `NORMAL` | a `MailPriority`: `LOW`, `NORMAL`, `HIGH` or `CRITICAL` |
| `headers` | empty | further mail headers |
| `correlationId` | none | an id of your own that ties the message to a business event, for logs |
| `tags` | empty | labels a provider reports statistics by |
| `tenantId` | none | the tenant the message belongs to, passed on to template resolvers |

## Addresses

```java
EmailAddress.of("ursula@example.com");
EmailAddress.of("Ursula", "ursula@example.com");

EmailAddress.of("Ursula", "ursula@example.com").toFormattedString();  // "Ursula" <ursula@example.com>
EmailAddress.of("ursula@example.com").toMaskedString();               // u***@example.com
```

Use `toMaskedString()` when an address goes into a log. The service does not check the form of an address: a text such as `not-an-address` is handed to the provider as it is, so validate addresses where they enter the application.

## Attachments and inline images

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

An attachment carries a file name, a content type and the bytes. An inline attachment also carries a content id, and the HTML refers to it as `cid:<id>`. `getSize()` gives the size in bytes; providers limit the total size of a message, commonly to about 10 MB.

## Read the result

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

| Field of `EmailResult` | Holds |
|---|---|
| `success` | whether a provider accepted the message |
| `status` | an `EmailStatus`: `SENT` or `FAILED` from this module; `PENDING`, `SENDING`, `DELIVERED`, `BOUNCED` and `COMPLAINED` are there for an application that tracks deliveries itself |
| `messageId` | the id the provider gave the message |
| `providerType` | the `MailProviderType` that answered: `CONSOLE`, `SMTP`, `AWS_SES`, `SENDGRID` or `RESEND` |
| `errorMessage`, `errorCode` | why it failed |
| `retryable` | whether sending again later may succeed |
| `timestamp` | when the provider answered |

A request without a recipient or without a subject is answered as a failure before any provider is called: `Validation failed: At least one recipient is required`.

## Send in the background

```java
emailService.sendAsync(request)
    .thenAccept(result -> {
        if (!result.isSuccess()) {
            log.warn("mail failed: {}", result.getErrorMessage());
        }
    });
```

`sendAsync`, `sendTemplateAsync` and `sendBulkAsync` return at once with a `CompletableFuture` and send on a thread pool of the module. Use them where the caller should not wait for a mail server: a registration, a notification after a payment. Send in the foreground when the next step depends on the result.

| Property | Default | Meaning |
|---|---|---|
| `simplix.email.async.core-pool-size` | `2` | threads kept ready |
| `simplix.email.async.max-pool-size` | `10` | the most threads |
| `simplix.email.async.queue-capacity` | `100` | messages that wait for a thread |
| `simplix.email.async.thread-name-prefix` | `email-async-` | the name of the threads, as it appears in logs |

## Related documents

- [Using templates](./using-templates.md)
- [Choosing a provider](./choosing-a-provider.md)
