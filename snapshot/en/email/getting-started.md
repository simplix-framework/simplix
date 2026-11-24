# Getting started with simplix-email

This page sends a message that is printed to the log, then sends the same message through an SMTP server.

## Step 1. Send a message

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class WelcomeMailer {

    private final EmailService emailService;

    public void welcome(String address, String name) {
        EmailResult result = emailService.send(
            EmailRequest.simple(address, "Welcome to the library", "<p>Hello " + name + "</p>"));

        if (!result.isSuccess()) {
            log.warn("welcome mail failed: {}", result.getErrorMessage());
        }
    }
}
```

Inject `EmailService` and call `send`. The call returns an `EmailResult`; it does not throw when the message cannot be sent, so check `isSuccess()`.

## Step 2. Read it in the log

With no configuration the provider is `CONSOLE`. It sends nothing and prints what would have been sent.

```text
╔════════════════════════════════════════════════════════════════════════════════╗
║ EMAIL (Console Provider - Not Actually Sent)                                   ║
║                                                                                ║
║ Message ID: console-f6979418-8e1f-4f78-a180-f8c59786d468                       ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ To: ursula@example.com                                                         ║
║ Subject: Welcome to the library                                                ║
║ Priority: NORMAL                                                               ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ HTML Body Preview:                                                             ║
║   Hello Ursula                                                                 ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

The result of the call says the same: `success` is true, `status` is `SENT`, `providerType` is `CONSOLE` and `messageId` begins with `console-`.

## Step 3. Send it for real

```yaml
simplix:
  email:
    provider: SMTP
    from:
      address: library@example.com
      name: Library
    smtp:
      enabled: true
      host: smtp.example.com
      port: 587
      username: ${SMTP_USERNAME}
      password: ${SMTP_PASSWORD}
      starttls: true
```

- `smtp.enabled: true` registers the SMTP provider.
- `provider: SMTP` switches the console provider off. Any value other than `CONSOLE` does that; which real provider sends is decided by the `enabled` flags.
- `from` is the sender of every message that names none.

With SMTP configured, the same `welcome` call answers with `providerType` `SMTP`, and the message arrives.

## Next steps

- [Sending mail](en/email/sending-mail.md)
- [Using templates](en/email/using-templates.md)
- [Choosing a provider](en/email/choosing-a-provider.md)
