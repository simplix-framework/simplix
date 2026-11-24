# SimpliX documentation

Find a document by what you want to do. New to SimpliX? Read the documents under "Start here" from the top.

## Start here

| If you want to | Read |
|---|---|
| set up a project that uses SimpliX | [Getting started](en/getting-started.md) |
| get the API of an entity | [Building a CRUD API](en/building-a-crud-api.md) |
| add login and tokens | [Securing an application](en/securing-an-application.md) |
| choose between the 2.x and 1.x lines | [Release lines](en/release-lines.md) |

## Modules

| Module | What it gives you | In the starter |
|---|---|---|
| [simplix-core](en/core/readme.md) | Base entity and repository, tree structures, type converters, exceptions, the API response, validators, security utilities | ✔ |
| [spring-boot-starter-simplix](en/starter/readme.md) | The starter: auto-configuration of web, JPA, i18n, validation, date and time, Jackson and OpenAPI, and the base service and controller | ✔ |
| [simplix-auth](en/auth/readme.md) | JWE token authentication, OAuth2 social login, Spring Security integration | ✔ |
| [simplix-encryption](en/encryption/readme.md) | Data encryption with key rotation | ✔ |
| [simplix-cache](en/cache/readme.md) | One cache API over Caffeine (local) and Redis (distributed) | ✔ |
| [simplix-hibernate](en/hibernate/readme.md) | Hibernate second-level cache management | ✔ |
| [simplix-mybatis](en/mybatis/readme.md) | MyBatis integration with type handlers | ✔ |
| [simplix-messaging](en/messaging/readme.md) | Messaging over NATS JetStream, Redis Streams, Kafka, RabbitMQ or a local broker | ✔ |
| [simplix-email](en/email/readme.md) | Email through SMTP, AWS SES, SendGrid or Resend, with templates | ✔ |
| [simplix-file](en/file/readme.md) | File storage on the local disk, AWS S3 or Google Cloud Storage | ✔ |
| [simplix-excel](en/excel/readme.md) | Excel and CSV import and export | ✔ |
| [simplix-scheduler](en/scheduler/readme.md) | Execution records of `@Scheduled` methods, with ShedLock | ✔ |
| [simplix-egov](en/egov/readme.md) | eGovFrame integration | ✔ |
| [simplix-stream](en/stream/readme.md) | Real-time subscriptions over SSE and WebSocket | add it yourself |
| [simplix-sync](en/sync/readme.md) | State sync between instances and lightweight pub/sub | add it yourself |
| [simplix-license](en/license/readme.md) | License registration, activation and feature or quota gating | add it yourself |

Code generation: [SimpliX CLI](en/cli/readme.md).

## About the project

- [Changelog](en/changelog.md)
- [License](en/license.md)
- [Contributing to the documentation](en/contributing-to-the-docs.md)
