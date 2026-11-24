# Configuration reference

Every property of the module, under `simplix.email`.

## Module and sender

| Property | Default | Meaning |
|---|---|---|
| `enabled` | `true` | switches the module on |
| `provider` | `CONSOLE` | `CONSOLE` makes the console provider available; any other value (`SMTP`, `AWS_SES`, `SENDGRID`, `RESEND`) switches it off |
| `from.address` | none | the sender of a message that names none |
| `from.name` | none | the display name of that sender |

## SMTP

| Property | Default | Meaning |
|---|---|---|
| `smtp.enabled` | `false` | registers the SMTP provider |
| `smtp.host` | none | the server |
| `smtp.port` | `587` | the port |
| `smtp.username`, `smtp.password` | none | the credentials |
| `smtp.starttls` | `true` | upgrades the connection with STARTTLS |
| `smtp.ssl` | `false` | connects with TLS from the start |
| `smtp.connection-timeout` | `10000` | milliseconds to wait for the connection |
| `smtp.timeout` | `10000` | milliseconds to wait for an answer |

## AWS SES, SendGrid and Resend

| Property | Default | Meaning |
|---|---|---|
| `aws-ses.enabled` | `false` | registers the SES provider |
| `aws-ses.region` | none | the AWS region |
| `aws-ses.access-key`, `aws-ses.secret-key` | none | static credentials; without them the default credential chain is used |
| `aws-ses.configuration-set` | none | the SES configuration set |
| `sendgrid.enabled` | `false` | registers the SendGrid provider |
| `sendgrid.api-key` | none | the API key |
| `resend.enabled` | `false` | registers the Resend provider |
| `resend.api-key` | none | the API key |

## Templates and asynchronous sends

| Property | Default | Meaning |
|---|---|---|
| `template.base-path` | `templates/email` | the classpath folder of the template files |
| `template.database-enabled` | `false` | no effect: no code reads it; declare a `DatabaseEmailTemplateResolver` bean |
| `async.core-pool-size` | `2` | threads kept ready |
| `async.max-pool-size` | `10` | the most threads |
| `async.queue-capacity` | `100` | messages that wait for a thread |
| `async.thread-name-prefix` | `email-async-` | the name of the threads |

## A complete example

```yaml
simplix:
  email:
    provider: AWS_SES
    from:
      address: library@example.com
      name: Library
    aws-ses:
      enabled: true
      region: ap-northeast-2
    smtp:
      enabled: true
      host: smtp.example.com
      port: 587
      username: ${SMTP_USERNAME}
      password: ${SMTP_PASSWORD}
    template:
      base-path: templates/email
    async:
      core-pool-size: 2
      max-pool-size: 10
      queue-capacity: 100
```

## Related documents

- [Choosing a provider](en/email/choosing-a-provider.md)
- [How simplix-email works](en/email/how-it-works.md)
