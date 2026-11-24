# How the starter works

What the starter brings into an application, what happens to a request on its way through it, and how to replace a part.

## What one dependency brings

The starter is an umbrella: it depends on [simplix-core](../../../simplix-core/README.md) and on the feature modules, so their classes and their auto-configurations arrive with it. `simplix-stream`, `simplix-sync` and `simplix-license` are not included and are added one by one.

| Included module | Adds |
|---|---|
| [simplix-auth](../../../simplix-auth/README.md) | token authentication and the security filter chains |
| [simplix-cache](../../../simplix-cache/README.md) | the cache service and Spring cache support |
| [simplix-egov](../../../simplix-egov/README.md) | eGovFrame core beans |
| [simplix-email](../../../simplix-email/README.md) | mail sending |
| [simplix-encryption](../../../simplix-encryption/README.md) | column encryption |
| [simplix-excel](../../../simplix-excel/README.md) | Excel and CSV export and import |
| [simplix-file](../../../simplix-file/README.md) | file storage |
| [simplix-hibernate](../../../simplix-hibernate/README.md) | second-level cache eviction across instances |
| [simplix-messaging](../../../simplix-messaging/README.md) | broker messaging |
| [simplix-mybatis](../../../simplix-mybatis/README.md) | MyBatis support |
| [simplix-scheduler](../../../simplix-scheduler/README.md) | recording of scheduled runs |

## What happens at startup

- `SimpliXAutoConfiguration` binds `SimpliXProperties` and scans the packages `dev.simplecore.simplix.web` and `dev.simplecore.simplix.springboot`, which is how the web classes of the starter become beans without a scan in the application.
- Each auto-configuration then registers its part unless a property switches it off or the application already has a bean of that type; the [configuration reference](./configuration-reference.md) lists the class, what it registers and its switch.
- When the application is ready, `ApplicationInfoRunner` prints a banner with the active profiles and the port.

## What happens to a request

1. The security filters of [simplix-auth](../../../simplix-auth/README.md) authenticate the caller. A request they refuse is answered here, before the steps below, so a 401 carries no `X-Trace-Id` header.
2. The trace filter of `SimpliXWebConfig` creates a trace id, puts it into the logging context as `traceId` and writes it to the `X-Trace-Id` response header. The id is always new: a trace id sent by the client is not taken over.
3. `TimezoneInterceptor` reads the `X-Timezone` header into `TimezoneContext`.
4. The controller runs. Its argument is validated with messages from the combined `MessageSource`.
5. The `ObjectMapper` writes the answer: date-time values with an offset, and `Instant` values in the zone of the request through `TimezoneAwareInstantSerializer`.
6. An exception on the way is answered by `SimpliXExceptionHandler`; see [Handling errors](./handling-errors.md).
7. The filter of `SimpliXWebMvcConfiguration` clears the logging context, so a pooled thread carries no trace id into the next request.

## What the starter does not do

A controller method that returns a plain object is answered as that object: `Map.of("hello", "world")` is sent as `{"hello": "world"}`, not inside a `SimpliXApiResponse`. Return `SimpliXApiResponse.success(...)` from your own controllers, as the base controllers do. `SimpliXResponseBodyAdvice`, which would wrap such values, is in the module and is not registered.

> ⚠ The API document describes a plain return type as wrapped all the same, because `simplix.swagger.customizers.generic-response.auto-wrap` is `true` by default. Set it to `false` when controllers return plain objects, so the document matches the answers.

## Replace a part

| To replace | Do this |
|---|---|
| the exception handler | declare a bean of type `SimpliXExceptionHandler`, or set `simplix.exception-handler.enabled: false` and write a `@RestControllerAdvice` |
| the `ObjectMapper` | declare an `ObjectMapper` bean; the SimpliX serializers are then yours to register |
| the `ModelMapper` | declare a `ModelMapper` bean |
| the auditor | declare an `AuditorAware` bean named `auditorProvider` |
| the `MessageSource` | set `simplix.message-source.enabled: false` and declare your own |
| a whole auto-configuration | name the class in `spring.autoconfigure.exclude` |

## Other public methods

The guides show the methods a task needs. The types they name also have these public methods.

| Type | Method | Does |
|---|---|---|
| `SimpliXMetaContributor` | `contributeType(type, typeName, extensions)` | default method a contributor overrides to put data of its own into the `extensions` of a type |
| `SimpliXMetaContributor` | `contributeOperation(handler, operation, extensions)` | default method a contributor overrides to put data of its own into the `extensions` of an operation |
| `TypeRef` | `string()`, `bool()`, `number(integral)`, `instant()`, `date()`, `time(pattern)`, `file()`, `binary()`, `unknown()`, `enumRef(name)`, `ref(name)`, `ref(name, args)` | create the reference of a type of that kind |
| `AccessMeta` | `publicAccess()`, `authenticated()`, `permission(group, action)`, `expression(raw)` | create the access description of an operation open to everyone, to signed-in users, to holders of a permission, or guarded by an expression |
| `OperationMeta` | `withDefaultSort(value)`, `withFigures(counts, figures, axis)` | return the operation with the default order, or with the counts and aggregates of its list, set |
| `FieldMeta` | `withReference(value)`, `withSearchable(value)`, `withFormat(value)`, `withLabels(value)`, `withTones(value)`, `withDefaultValue(value)`, `withMoney(value)`, `asVerbOnly()` | return the field with that member set; `asVerbOnly()` marks a field whose value changes only through a verb, never through a form |
| `SearchableMeta` | `withSortAlias(value)`, `withKeyword(value)` | return the search description with the sort aliases or the keyword mark set |
| `ReferenceMeta` | `withNameField(value)`, `byKind()` | return the reference with its name field set, and say whether the target depends on the value of another field |
| `I18nMessagesResponse`, `EntityMessages`, `EnumMessages` | `addEntity(entityName, messages)`, `addEnum(enumName, messages)`, `addField(fieldName, localizedString)`, `addValue(valueName, localizedString)` | add the labels of an entity, of an enum, of a field and of an enum value to the response |
| `LocalizedString` | `addTranslation(locale, value)`, `getTranslation(locale)` | add and read the text of one locale |

## Related documents

- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
- [How simplix-core works](../../../simplix-core/docs/en/how-it-works.md)
