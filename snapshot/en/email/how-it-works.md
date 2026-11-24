# How simplix-email works

The classes behind a send, what the module registers and where a message can stop on its way.

## The path of a message

1. The application calls `EmailService`; the bean is a `DefaultEmailService`.
2. For a template, `EmailTemplateService` asks the `EmailTemplateResolver` beans, highest priority first, for the template, and `EmailTemplateEngine` fills it with the variables through Thymeleaf. A code no resolver knows ends here with a failed result.
3. A message without a sender takes the address of `simplix.email.from`.
4. The service goes through the `EmailProvider` beans in order of priority and skips those whose `isAvailable()` is false.
5. The provider checks the request (a recipient and a subject are required), hands it to its mail service and answers with an `EmailResult`.
6. A success, or a failure that is not retryable, is returned. A retryable failure moves on to the next provider.

## What the module registers

`EmailAutoConfiguration` binds `simplix.email` to `EmailProperties` and registers the beans below, unless `simplix.email.enabled` is `false`. Each bean steps back when the application declares its own of the same type.

| Bean | Registered when | Role |
|---|---|---|
| `EmailService` | always | the service applications call |
| `ConsoleEmailProvider` | always; available only with `provider: CONSOLE` | prints messages to the log |
| `SmtpEmailProvider` and its `JavaMailSender` | `smtp.enabled: true` | sends through an SMTP server |
| `AwsSesEmailProvider`, from `AwsSesConfiguration` | `aws-ses.enabled: true` and the SES SDK on the classpath | sends through Amazon SES |
| `SendGridEmailProvider`, from `SendGridConfiguration` | `sendgrid.enabled: true` and the SendGrid library on the classpath | sends through SendGrid |
| `ResendEmailProvider`, from `ResendConfiguration` | `resend.enabled: true` and the Resend library on the classpath | sends through Resend |
| `ClasspathEmailTemplateResolver` | always | reads templates from `template.base-path` |
| `EmailTemplateService`, `EmailTemplateEngine` | always | resolve and render templates, with one Thymeleaf engine for text and one for HTML |
| `emailAsyncExecutor` | always | the thread pool of the asynchronous sends |

## What the module does not do

- It does not queue or repeat a failed message. The result says whether a retry may help; the retry is the application's.
- It does not track what happens after a provider accepted a message. Deliveries, bounces and complaints are reported by the provider, through its webhooks or event streams.
- It does not check the form of an address or keep a list of addresses that must not be mailed.
- It does not limit the rate of sends. Stay under the limit of the provider in the code that sends many messages.

`EmailTemplateEngine` is a bean as well: `processText(template, variables, locale)` and `processHtml(template, variables, locale)` render one text in the text or the HTML syntax, and `process(resolvedTemplate, variables, locale)` renders the subject and the bodies of a resolved template, whose `hasHtmlBody()` and `hasTextBody()` say which bodies exist. The two Thymeleaf engines are the beans `textTemplateEngine` and `htmlTemplateEngine`. A `TemplateEngine` bean of your application with one of these names replaces that engine, for example to add a dialect.

## Related documents

- [Choosing a provider](en/email/choosing-a-provider.md)
- [Configuration reference](en/email/configuration-reference.md)
- [Troubleshooting](en/email/troubleshooting.md)
