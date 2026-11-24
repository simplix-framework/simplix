# Sending to many recipients

How to send one template to a list of recipients, each with values of their own, and read what happened to each.

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

Every recipient gets a message of their own; nobody sees the other addresses. The template is filled with `commonVariables` and then with the variables of the recipient, which win where both name the same value.

| Field of `BulkEmailRequest` | Default | Meaning |
|---|---|---|
| `templateCode` | required | the template every recipient gets |
| `recipients` | required | a `BulkEmailRequest.BulkRecipient` per recipient: an address and the variables of that recipient |
| `commonVariables` | empty | values every message shares |
| `locale` | the default locale of the JVM | the language of the whole batch; send one batch per language |
| `subject` | that of the template | replaces the subject |
| `from` | `simplix.email.from` | the sender |
| `priority` | `LOW` | the priority of each message |
| `continueOnError` | `true` | `false` stops at the first recipient that fails; the recipients that were not tried are counted in `pendingCount` of the result |
| `batchId` | generated | an id for the batch, returned in the result |
| `tenantId`, `tags` | none | as in a plain message |

## Read the result

```java
for (BulkEmailResult.RecipientResult recipient : result.getResults()) {
    if (!recipient.isSuccess()) {
        log.warn("mail to {} failed: {}", EmailAddress.of(recipient.getEmail()).toMaskedString(), recipient.getErrorMessage());
    }
}
```

| Field of `BulkEmailResult` | Holds |
|---|---|
| `batchId` | the id of the batch |
| `totalCount`, `successCount`, `failureCount`, `pendingCount` | how many recipients there were, and how many were sent and failed; `pendingCount` stays 0 |
| `results` | a `BulkEmailResult.RecipientResult` per recipient: `email`, `success`, `messageId`, `errorMessage`, `status` |
| `startTime`, `endTime` | when the batch began and ended |
| `providerType` | the provider that sent |

## Large batches

- Use `sendBulkAsync` so the caller does not wait for the whole batch. The messages of one batch are still sent one after another.
- Split a list of many thousands into several requests. A provider limits how many messages it takes per second, and a smaller batch is easier to repeat.
- Keep the failed recipients of the result and send to them again later; do not repeat the whole batch, or those who received the message get it twice.
- Mail people asked for, such as a password reset, goes out with `send` at `HIGH` priority, not inside a batch of announcements.

## Related documents

- [Using templates](./using-templates.md)
- [Choosing a provider](./choosing-a-provider.md)
