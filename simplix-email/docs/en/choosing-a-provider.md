# Choosing a provider

Which service delivers the mail, how to configure each, and how the module moves to another provider when one fails.

| Provider | Sends through | Needs | Fits |
|---|---|---|---|
| `CONSOLE` | the log; nothing is sent | nothing | development and tests |
| `SMTP` | any SMTP server | host and credentials | a mail server you already have: a company server, Google Workspace, Microsoft 365 |
| `AWS_SES` | the Amazon SES API | `software.amazon.awssdk:sesv2`, a region and credentials | applications on AWS, and large volumes |
| `SENDGRID` | the SendGrid API | `com.sendgrid:sendgrid-java` and an API key | delivery statistics by category |
| `RESEND` | the Resend API | `com.resend:resend-java` and an API key | a small setup with an API key |

## How a provider is switched on

- A real provider is registered by its own flag: `smtp.enabled`, `aws-ses.enabled`, `sendgrid.enabled`, `resend.enabled`. Several may be on at once.
- `simplix.email.provider` decides one thing: with `CONSOLE`, the default, the console provider is available; with any other value it is not.
- Set `provider` to the provider you use, so that no message ends in the log when the real provider is down.

## SMTP

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
      ssl: false
      connection-timeout: 10000
      timeout: 10000
```

| Server | Host | Port | Notes |
|---|---|---|---|
| a server with STARTTLS | your host | `587` | `starttls: true`, the default |
| a server with implicit TLS | your host | `465` | `ssl: true` and `starttls: false` |
| Gmail and Google Workspace | `smtp.gmail.com` | `587` | an app password, not the account password |
| Microsoft 365 | `smtp.office365.com` | `587` | SMTP AUTH has to be allowed for the mailbox |
| Amazon SES over SMTP | `email-smtp.<region>.amazonaws.com` | `587` | the SMTP credentials of SES, which differ from the access keys |

## AWS SES

```groovy
dependencies {
    implementation platform("software.amazon.awssdk:bom:${awsSdkVersion}")
    implementation "software.amazon.awssdk:sesv2"
}
```

```yaml
simplix:
  email:
    provider: AWS_SES
    aws-ses:
      enabled: true
      region: ap-northeast-2
      configuration-set: library-mail
      access-key: ${AWS_ACCESS_KEY_ID}
      secret-key: ${AWS_SECRET_ACCESS_KEY}
```

Leave `access-key` and `secret-key` out to use the default credential chain of the AWS SDK, such as an instance role. The sender address or its domain has to be verified in SES, and an account still in the SES sandbox can send to verified addresses only. `configuration-set` names the SES configuration set that collects delivery events.

## SendGrid

```groovy
dependencies {
    implementation "com.sendgrid:sendgrid-java:${sendGridVersion}"
}
```

```yaml
simplix:
  email:
    provider: SENDGRID
    sendgrid:
      enabled: true
      api-key: ${SENDGRID_API_KEY}
```

The API key needs the permission to send mail, and the sender has to be verified in SendGrid. The `tags` of a message become SendGrid categories.

## Resend

```groovy
dependencies {
    implementation "com.resend:resend-java:${resendVersion}"
}
```

```yaml
simplix:
  email:
    provider: RESEND
    resend:
      enabled: true
      api-key: ${RESEND_API_KEY}
```

The domain of the sender has to be verified in Resend.

## What each provider takes from a message

| Field | SMTP | AWS SES | SendGrid | Resend |
|---|---|---|---|---|
| `priority` | ✔ as a mail header | ✖ | ✖ | ✖ |
| `tags` | ✖ | ✔ | ✔ as categories | ✔ |
| `headers` | ✖ | ✔ | ✔ | ✖ |

## Fail over to another provider

```yaml
simplix:
  email:
    provider: AWS_SES
    aws-ses:
      enabled: true
      region: ap-northeast-2
    smtp:
      enabled: true
      host: smtp.example.com
      username: ${SMTP_USERNAME}
      password: ${SMTP_PASSWORD}
```

With several providers on, the service tries them in a fixed order and stops at the first that accepts the message.

| Order | Provider | Priority |
|---|---|---|
| 1 | `AWS_SES` | 100 |
| 2 | `RESEND` | 55 |
| 3 | `SENDGRID` | 50 |
| 4 | `SMTP` | 10 |
| 5 | `CONSOLE` | -100 |

- A failure a provider marks as retryable, such as a timeout, a rate limit or a server error, moves on to the next provider.
- A failure that is not retryable, such as a rejected address or wrong credentials, is returned at once: another provider would refuse it too.
- When every provider failed or none is available, the result is a failure with `All email providers failed or unavailable`.
- The service does not send again by itself. A result with `retryable` true is yours to queue and repeat.

## A provider of your own

Declare a bean that implements `EmailProvider` to send through another service. `send(request)` returns an `EmailResult`, `getType()` names a `MailProviderType`, `isAvailable()` tells whether it can send now, and `getPriority()` places it in the order above. `AbstractEmailProvider` is a base class that checks the request and logs each send, leaving the delivery to you.

## Related documents

- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
