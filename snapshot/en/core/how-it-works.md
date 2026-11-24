# How simplix-core works

What the module contains, what it does on its own and what it leaves to the starter. Read it to decide whether an application needs the core alone or the [starter](en/starter/readme.md) around it.

## What is in the module

| Package | Holds | Guide |
|---|---|---|
| `entity`, `repository` | base entity, base repository, composite keys, JPA converters, entity listeners | [Entities and repositories](en/core/entities-and-repositories.md) |
| `tree` | tree entities, the tree repository and its recursive queries, the tree services | [Tree structures](en/core/tree-structures.md) |
| `model`, `exception` | `SimpliXApiResponse`, `SimpliXGeneralException`, `ErrorCode` | [API responses and errors](en/core/api-responses-and-errors.md) |
| `validator` | the uniqueness constraints, `@ValidateWith`, `@SafeHtml` | [Validating input](en/core/validating-input.md) |
| `security` | sanitising, masking, hashing and input checks | [Protecting sensitive data](en/core/protecting-sensitive-data.md) |
| `convert`, `enums`, `timezone` | converters between text and typed values, labelled enums, the time zone of a request | [Converting types](en/core/converting-types.md) |
| `jackson`, `i18n` | the translation annotation and its serializer, message resolvers | [Translating fields](en/core/translating-fields.md) |
| `annotation` | annotations that describe an entity to a screen | [Describing entities for screens](en/core/describing-entities-for-screens.md) |
| `event` | the event model, the publisher interface and the entity event listener | [Publishing events](en/core/publishing-events.md) |
| `cache` | the cache interface and the static manager | [Caching](en/core/caching.md) |
| `resilience`, `util` | in-memory guards for load and failure, identifier and mapping helpers | [Resilience utilities](en/core/resilience-utilities.md) |

## What the core does on its own

The module registers no auto-configuration. Its classes work wherever they are used: an entity extends the base class, a constraint annotation brings its validator, a JPA converter or an entity listener runs because the entity names it, and a utility is called directly. The one thing an application registers is the repository factory, `@EnableJpaRepositories(repositoryFactoryBeanClass = SimpliXRepositoryFactoryBean.class)`, which gives repositories the tree queries and the filter-aware read by id.

## What the starter adds

| Feature of the core | What the starter does with it |
|---|---|
| `SimpliXGeneralException`, `ErrorCode` | an exception handler answers them as `SimpliXApiResponse` with the status of the code |
| the converters and their Jackson serializers | registered with the application's `ObjectMapper` |
| `TimezoneContext` | set from the `X-Timezone` header of each request |
| `@I18nTrans`, the message resolvers | the locale of the request and the message sources are configured |
| the describing annotations | published to clients through the metadata endpoint |
| `SimpliXBaseEntity`, `SimpliXBaseRepository` | base services and controllers built on them |

## Extension points found by the service loader

`CacheManager` and `EventManager` are static, so code that is not a Spring bean can use them. Each finds its implementation through Java's service loader: a file under `META-INF/services` named after the interface (`dev.simplecore.simplix.core.cache.CacheProvider`, `dev.simplecore.simplix.core.event.EventPublisher`) lists the implementing classes. Without an implementation both do nothing: a cache read is empty and a published event is dropped, so a library can call them whether or not the application delivers.

## Native images

`SimpliXRuntimeHints` is registered in `META-INF/spring/aot.factories`. During an ahead-of-time build it declares the reflection the module uses, for the tree repository, the entity interfaces and the annotations read at run time, so a GraalVM native image needs no reflection configuration for them.

## Dependencies the module brings

The module exposes searchable-jpa to its consumers, which is why an application adds the searchable-jpa package repository beside the SimpliX one. Spring Data JPA, Spring Web, Jackson, Hibernate Validator, ModelMapper and the OWASP HTML sanitizer are used inside the module; an application that calls them directly declares them itself.

## Other public methods

The guides show the methods a task needs. The types they name also have these public methods.

| Type | Method | Does |
|---|---|---|
| `Event` | `getEventId()`, `getEventType()`, `getAggregateId()`, `getOccurredAt()` | the id of the event, its type, the id of the aggregate it relates to and the time it occurred |
| `Event` | `getUserId()`, `getTenantId()` | the user who triggered the event and the tenant it belongs to; both are optional |
| `Event` | `getMetadata()`, `getPayload()` | the metadata map and the payload of the event |
| `EventMessage` | `payloadInt(key)`, `metadataString(key)` | read an `Integer` from the payload and a text from the metadata |
| `EventMessage` | `isType(type)`, `isAggregate(type)` | say whether the event has the given event type or belongs to the given aggregate type |
| `EventMessage` | `isSoftDelete()`, `hasAnyChangedProperty(properties...)` | say whether a soft delete caused the event, and whether an update event changed one of the named properties |
| `EventContext` | `isEventsSuppressed()` | says whether events are suppressed on the current thread |
| `EventManager` | `getPublisherName()` | returns the name of the publisher in use |
| `BooleanConverter`, `EnumConverter`, `DateTimeConverter` | `getDefault()` | returns the default converter; the one of `DateTimeConverter` uses the default time zone |
| `TimezoneContext` | `getZoneIdOrDefault(fallback)` | returns the time zone of the current request, or the fallback when the request has none |
| `EntityUtils` | `getEntityClass(clazz)` | returns the first type argument of the generic superclass of a class, for example the entity type of a service that extends `SimpliXBaseService<Book, Long>` |
| `RoundRobinSelector` | `getCursorPosition()` | returns the current position of the cursor, for diagnostics |
| `RateLimiter` | `getAvailableTokens()` | returns the number of tokens available now |
| `EntityMessageResolver`, `EnumMessageResolver` | `setLocale(locale)`, `getLocale()`, `clearLocale()` | set, read and clear the locale the resolver uses on the current thread |
| `EntityMessageResolver`, `EnumMessageResolver` | `getDiscoveredBundles()` | returns the names of the message bundles the resolver found, for diagnostics and tests |
| `RetryAfterHint` | `retryAfterSeconds()` | the method an exception of your own implements to state after how many seconds a caller may retry |
| `HashingUtils` | `isValidSha256Hash(hash)`, `isValidSha512Hash(hash)` | say whether a text has the form of a SHA-256 or a SHA-512 hash in Base64 |
| `InputSanitizer` | `isValidEmail(email)`, `isValidUrl(url)`, `isAlphanumericWithSpace(input)` | check the form of an e-mail address and of a URL, and whether a text has only letters, digits and spaces |
| `SqlInjectionValidator` | `matchesSafePattern(input)` | says whether a text matches the pattern of allowed characters |

## Related documents

- [Getting started with simplix-core](en/core/getting-started.md)
- [spring-boot-starter-simplix](en/starter/readme.md)
- [Troubleshooting](en/core/troubleshooting.md)
