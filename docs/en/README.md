# SimpliX documentation

Find a document by what you want to do. New to SimpliX? Read the documents under "Start here" from the top.

## Start here

| If you want to | Read |
|---|---|
| set up a project that uses SimpliX | [Getting started](./getting-started.md) |
| get the API of an entity | [Building a CRUD API](./building-a-crud-api.md) |
| add login and tokens | [Securing an application](./securing-an-application.md) |
| choose between the 2.x and 1.x lines | [Release lines](./release-lines.md) |

## Modules

| Module | What it gives you | In the starter |
|---|---|---|
| [simplix-core](../../simplix-core/README.md) | Base entity and repository, tree structures, type converters, exceptions, the API response, validators, security utilities | ✔ |
| [spring-boot-starter-simplix](../../spring-boot-starter-simplix/README.md) | The starter: auto-configuration of web, JPA, i18n, validation, date and time, Jackson and OpenAPI, and the base service and controller | ✔ |
| [simplix-auth](../../simplix-auth/README.md) | JWE token authentication, OAuth2 social login, Spring Security integration | ✔ |
| [simplix-encryption](../../simplix-encryption/README.md) | Data encryption with key rotation | ✔ |
| [simplix-cache](../../simplix-cache/README.md) | One cache API over Caffeine (local) and Redis (distributed) | ✔ |
| [simplix-hibernate](../../simplix-hibernate/README.md) | Hibernate second-level cache management | ✔ |
| [simplix-mybatis](../../simplix-mybatis/README.md) | MyBatis integration with type handlers | ✔ |
| [simplix-messaging](../../simplix-messaging/README.md) | Messaging over NATS JetStream, Redis Streams, Kafka, RabbitMQ or a local broker | ✔ |
| [simplix-email](../../simplix-email/README.md) | Email through SMTP, AWS SES, SendGrid or Resend, with templates | ✔ |
| [simplix-file](../../simplix-file/README.md) | File storage on the local disk, AWS S3 or Google Cloud Storage | ✔ |
| [simplix-excel](../../simplix-excel/README.md) | Excel and CSV import and export | ✔ |
| [simplix-scheduler](../../simplix-scheduler/README.md) | Execution records of `@Scheduled` methods, with ShedLock | ✔ |
| [simplix-egov](../../simplix-egov/README.md) | eGovFrame integration | ✔ |
| [simplix-stream](../../simplix-stream/README.md) | Real-time subscriptions over SSE and WebSocket | add it yourself |
| [simplix-sync](../../simplix-sync/README.md) | State sync between instances and lightweight pub/sub | add it yourself |
| [simplix-license](../../simplix-license/README.md) | License registration, activation and feature or quota gating | add it yourself |

Code generation: [SimpliX CLI](../../simplix-cli/README.md).

## About the project

- [Changelog](./changelog.md)
- [License](./license.md)
- [Contributing to the documentation](./contributing-to-the-docs.md)
