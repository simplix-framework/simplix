# Troubleshooting the starter

Symptoms an application meets with the starter, the cause of each and what to change. Problems of signing in and of tokens are in [Troubleshooting simplix-auth](../../../simplix-auth/docs/en/troubleshooting.md).

## Starting the application

| Symptom | Cause | What to do |
|---|---|---|
| The application does not start and the log names the token encryption key | no JWE key is configured | create a key and set `simplix.auth.jwe.encryption-key-location`; see [Getting started](../../../docs/en/getting-started.md) |
| Every endpoint of a generated controller answers 403 with `AUTHZ_INSUFFICIENT_PERMISSIONS` | no `PermissionEvaluator` bean answers `hasPermission` | declare a `PermissionEvaluator` bean; see [Securing an application](../../../docs/en/securing-an-application.md) |
| An entity or a repository of a module is not found | its package is outside the scan of the application class | name the packages in `@EntityScan` and `@EnableJpaRepositories`, keeping `repositoryFactoryBeanClass = SimpliXRepositoryFactoryBean.class` |

## Requests and responses

| Symptom | Cause | What to do |
|---|---|---|
| A request with a valid token is answered with 401 | the path is not under `/api`, where tokens are checked | serve REST controllers under `/api`; see [Securing an application](../../../docs/en/securing-an-application.md) |
| A controller of your own answers without the `type`, `body` and `timestamp` wrapper | a plain return value is not wrapped | return `SimpliXApiResponse.success(...)` |
| The API document shows a wrapper the answer does not have | `generic-response.auto-wrap` documents plain return types as wrapped | return `SimpliXApiResponse`, or set `simplix.swagger.customizers.generic-response.auto-wrap: false` |
| A request body that is not valid JSON is answered with 500 | the handler has no case for an unreadable body | validate the content on the client; the log line with the `X-Trace-Id` of the response names the parse error |
| A search with an unknown field or operator is answered with status 200 | search errors are sent as an `ERROR` body with status 200 | check `type` in the body, not only the status |
| A 401 response has no `X-Trace-Id` header | the security filters answer before the trace filter runs | find the request in the log by its time and path |

## Dates and times

| Symptom | Cause | What to do |
|---|---|---|
| Times in a response are nine hours off | the application zone differs from the zone the values were stored in | set `simplix.date-time.default-timezone`, and store instants in UTC |
| `X-Timezone` changes `Instant` fields and leaves the others | only `Instant` values follow the zone of the request | use `Instant` for values every reader sees in their own zone |
| A value stored as `2026-03-01T09:30+09:00` is in the table as `2026-03-01 00:30` | `use-utc-for-database` stores `OffsetDateTime` values in UTC | this is the intended form; the value is returned in the application zone |

## Metadata and the API document

| Symptom | Cause | What to do |
|---|---|---|
| `/dev/meta/dto` or `/dev/i18n/messages` answers 404 | the endpoints are off by default | set `simplix.dev.meta.enabled` and `simplix.dev.i18n.enabled` to `true` in development |
| `/dev/meta/dto` answers 409 | SimpliX Meta refuses a declaration | read `detail` of the response, which lists every refused declaration, correct them and request the document again |
| A label has empty `translations` | no bundle carries the key | add it to `messages/entities/**/*-messages.properties` or `messages/enums/**/*-messages.properties` |
| The title set under `springdoc.info` is not in the API document | the starter does not read `springdoc.info` | declare an `OpenAPI` bean; see [Documenting the API](./documenting-the-api.md) |

## Related documents

- [How the starter works](./how-it-works.md)
- [Troubleshooting simplix-core](../../../simplix-core/docs/en/troubleshooting.md)
