# simplix-email 시작하기

이 페이지에서는 메시지를 로그에 출력하는 방식으로 먼저 발송한 뒤, 같은 메시지를 SMTP 서버로 발송합니다.

## 1단계. 메시지 발송

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

`EmailService`를 주입해 `send`를 호출합니다. 호출은 `EmailResult`를 반환하며, 메시지를 발송하지 못해도 예외를 발생시키지 않으므로 `isSuccess()`를 확인하세요.

## 2단계. 로그에서 확인

설정이 없으면 프로바이더는 `CONSOLE`입니다. 실제로 발송하지 않고 발송될 내용을 출력합니다.

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

호출 결과도 같은 내용입니다. `success`는 true, `status`는 `SENT`, `providerType`은 `CONSOLE`이며 `messageId`는 `console-`로 시작합니다.

## 3단계. 실제 발송

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

- `smtp.enabled: true`를 지정하면 SMTP 프로바이더가 등록됩니다.
- `provider: SMTP`를 지정하면 콘솔 프로바이더가 비활성화됩니다. `CONSOLE`이 아닌 값이면 모두 같은 효과이며, 실제로 발송하는 프로바이더는 `enabled` 값으로 결정됩니다.
- `from`은 발신자를 지정하지 않은 모든 메시지의 발신자입니다.

SMTP를 설정한 뒤 같은 `welcome`을 호출하면 결과의 `providerType`이 `SMTP`로 반환되고 메시지가 도착합니다.

## 다음 단계

- [메일 발송](ko/email/sending-mail.md)
- [템플릿 사용](ko/email/using-templates.md)
- [프로바이더 선택](ko/email/choosing-a-provider.md)
