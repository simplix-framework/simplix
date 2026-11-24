# Configuration reference

The properties of the starter and the auto-configurations it registers. The properties of the other modules are in their own documents.

## Properties

| Property | Default | Meaning |
|---|---|---|
| `simplix.core.enabled` | `true` | switches the SimpliX auto-configuration on |
| `simplix.exception-handler.enabled` | `true` | registers the exception handler |
| `simplix.date-time.default-timezone` | `spring.jackson.time-zone`, then the system zone | the application time zone |
| `simplix.date-time.use-utc-for-database` | `true` | stores `OffsetDateTime` values in UTC |
| `simplix.date-time.normalize-timezone` | `true` | reads `LocalDateTime` values in the application zone |
| `simplix.date-time.request-timezone-enabled` | `true` | reads the `X-Timezone` header |
| `simplix.message-source.enabled` | `true` | builds the combined `MessageSource` |
| `simplix.validator.enabled` | `true` | connects the validator to the `MessageSource` |
| `simplix.i18n.default-locale` | `en` | the fallback locale of field translation |
| `simplix.i18n.supported-locales` | `en`, `ko`, `ja` | the locales tried after the default |
| `simplix.tree-repository.enabled` | `true` | configures tree repository support |
| `simplix.swagger.i18n-enabled` | `true` | adds translated validation messages to the API document |
| `simplix.swagger.customizers.enum-extractor.enabled` | `true` | extracts inline enums to named schemas |
| `simplix.swagger.customizers.nested-object-extractor.enabled` | `true` | extracts inline nested objects to named schemas |
| `simplix.swagger.customizers.generic-response.enabled` | `true` | restores the type inside the response wrapper |
| `simplix.swagger.customizers.generic-response.auto-wrap` | `true` | describes a plain return type as wrapped in `SimpliXApiResponse` |
| `simplix.swagger.i18n-packages` | none | packages of DTOs that get the extension fields of the API document |
| `simplix.dev.meta.enabled` | `false` | registers the SimpliX Meta endpoint |
| `simplix.dev.i18n.enabled` | `false` | registers the i18n endpoints |
| `simplix.dev.base-packages` | the packages of the application | the packages scanned for labelled enums |
| `simplix.auth.enabled` | `true` | `false` replaces the security of `simplix-auth` with a chain that permits every request |

The starter also reads Spring Boot's own `spring.messages.basename` and `spring.jackson.time-zone`, and springdoc's `springdoc.*`.

### Message source properties

The combined `MessageSource` is built from Spring Boot's `spring.messages.*` properties, with defaults of the starter.

| Property | Default | Meaning |
|---|---|---|
| `spring.messages.basename` | `messages`, `messages/validation`, `messages/errors`, `messages/messages` | the bundles of the application, separated by commas |
| `spring.messages.encoding` | `UTF-8` | the character set of the bundle files |
| `spring.messages.cache-duration` | cached for ever | how long a loaded bundle is kept before it is read again |
| `spring.messages.fallback-to-system-locale` | `true` | uses the system locale when no bundle fits the request |
| `spring.messages.use-code-as-default-message` | `false` | returns the key itself for a missing message instead of failing |
| `spring.messages.always-use-message-format` | `false` | applies `MessageFormat` to messages without arguments too |
| `spring.messages.common-messages` | none | properties files shared by every locale |

## Auto-configurations

| Class | Registers | Switched by |
|---|---|---|
| `SimpliXAutoConfiguration` | component scan of the SimpliX web classes and `SimpliXProperties` | `simplix.core.enabled` |
| `SimpliXWebAutoConfiguration` | `SimpliXExceptionHandler` | `simplix.exception-handler.enabled` |
| `SimpliXJacksonAutoConfiguration` | the primary `ObjectMapper` with the SimpliX serializers | a bean of your own |
| `SimpliXDateTimeAutoConfiguration` | `applicationZoneId`, `applicationZoneOffset`, `SimpliXTimezoneService`, the date-time JPA converters | none |
| `SimpliXTimezoneWebAutoConfiguration` | `TimezoneInterceptor`, which reads `X-Timezone` | `simplix.date-time.request-timezone-enabled` |
| `SimpliXJpaAutoConfiguration` | registers the date-time converters with JPA | none |
| `SimpliXJpaAuditingAutoConfiguration` | JPA auditing, `auditorProvider`, `dateTimeProvider` | beans of your own |
| `SimpliXTreeRepositoryAutoConfiguration` | the `JdbcTemplate` the tree repositories use | `simplix.tree-repository.enabled` |
| `SimpliXModelMapperAutoConfiguration` | the `ModelMapper` bean with date-time conversion | a bean of your own |
| `SimpliXMessageSourceAutoConfiguration` | the combined `MessageSource` | `simplix.message-source.enabled` |
| `SimpliXValidatorAutoConfiguration` | the validator connected to the `MessageSource`, and method validation | `simplix.validator.enabled` |
| `SimpliXI18nAutoConfiguration` | the settings of field translation | none |
| `SimpliXSwaggerAutoConfiguration` | the OpenAPI customizers | `springdoc.api-docs.enabled` and `simplix.swagger.*` |
| `SimpliXThymeleafAutoConfiguration` | template resolvers, the error page templates and a JSP view resolver | `spring.thymeleaf.enabled` |
| `SimpliXSecurityAutoConfiguration` | a filter chain that permits every request | registered only when `simplix.auth.enabled` is `false` |
| `SimpliXDevMetaAutoConfiguration` | `GET /dev/meta/dto` | `simplix.dev.meta.enabled` |
| `SimpliXDevI18nAutoConfiguration` | the `/dev/i18n` endpoints | `simplix.dev.i18n.enabled` |
| `SimpliXExcelLabelsAutoConfiguration` | the resolver that lets an exported file's headers read the entity labels | none |

To leave one out altogether, name it in `spring.autoconfigure.exclude`. The classes are in the package `dev.simplecore.simplix.springboot.autoconfigure`.

```yaml
spring:
  autoconfigure:
    exclude:
      - dev.simplecore.simplix.springboot.autoconfigure.SimpliXThymeleafAutoConfiguration
```

### Thymeleaf beans

`SimpliXThymeleafAutoConfiguration` is active when Thymeleaf and its layout dialect are on the classpath. It registers each bean below only when the application has no bean of the same name, and its `SpringTemplateEngine`, which adds the `LayoutDialect`, only when the application has no bean of that type.

| Bean name | Type | What the module registers |
|---|---|---|
| `defaultTemplateResolver` | `SpringResourceTemplateResolver` | reads templates with `spring.thymeleaf.prefix`, `suffix`, `mode`, `encoding` and `cache` |
| `errorTemplateResolver` | `SpringResourceTemplateResolver` | reads the templates whose name starts with `error` from `classpath:/templates/`, without caching, before the default resolver |
| `thymeleafViewResolver` | `ViewResolver` | renders every view name except `redirect:*`, ahead of the other view resolvers |
| `jspViewResolver` | `ViewResolver` | an `InternalResourceViewResolver` with `spring.mvc.view.prefix` and `suffix`, after the Thymeleaf resolver |

## Related documents

- [Getting started](../../../docs/en/getting-started.md)
- [simplix-auth](../../../simplix-auth/README.md): the `simplix.auth.*` properties
