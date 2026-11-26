# Changelog

The notable changes of SimpliX. An entry that links a GitHub commit shows the change in detail there.

---

## Recent changes

### 2026-11

#### New features
- **Code generation CLI (`@simplix-boot/cli`)**
  - `simplix-boot`, a command line tool that generates services, REST controllers, DTOs and tests from JPA entities
  - Templates ship with the CLI, and a file of the same relative path under the project's `.simplix/templates` is used first
  - Application classes that generated code calls are named with the `supportClasses` setting
  - A template that fails to render ends the command with exit code 1

#### Improvements
- **JSON columns that hold value objects**
  - simplix-hibernate hands the JSON column type of hypersistence-utils a mapper that keeps the stored form and a copy that works for values that are not `Serializable`
  - `simplix.hibernate.json-column.enabled` switches it off
  - A `@DataJpaTest` slice applies the mapper and the copy as the application does

- **Every refused declaration in one answer**
  - `GET /dev/meta/dto` answers a refused document with status 409 and every refused declaration, in `message` and one by one in `detail`

- **Imports kept across a template change**
  - `promote` keeps an import a template dropped while code written into the file still names the class

- **Labels of computed properties**
  - `@FieldLabel` can sit on a getter, for a property no field holds, and SimpliX Meta reads the label from there

- **Piped output of the code generation CLI**
  - When the reader of the output ends first (`simplix-boot generate Book | head`), the command finishes its work and keeps its exit code

- **An npm tag per release line for the code generation CLI**
  - The CLI of the Spring Boot 3 line is published under the `spring-boot-3x` tag, and `latest` names the Spring Boot 4 line
  - The `version` command and the version check look up published versions of the running CLI's own line only

- **Configuration file of the code generation CLI**
  - The project configuration is `.simplix/simplix-boot.json`
  - A `generator-simplix.json` is read while that file is absent, and `version --write` renames it

#### Fixes
- **Validation of collection bodies**
  - A request whose collection element fails validation is answered with status 400 and `VAL_VALIDATION_FAILED`, one entry per failing field with the position of its element, instead of an internal server error
  - A generated controller validates every element of the bodies of `PATCH <path>` and `PATCH <path>/order`, which were accepted unchecked

- **Redis cache mode and distributed sync mode**
  - `simplix.cache.mode=redis` and `simplix.sync.mode=DISTRIBUTED` take effect; their conditions are evaluated after the Redis and messaging auto-configurations

- **Stream persistence**
  - The update queries of sessions and subscriptions assign an `Instant`, which Hibernate refused

- **ShedLock with simplix-scheduler**
  - ShedLock is on the classpath of an application that depends on simplix-scheduler

- **Generated service tests**
  - A generated service test sets audit timestamps only when the entity has them
  - Audit timestamps a parent class declares are set when the entity yml does not list them

#### Build and dependencies
- searchable-jpa 2.1.2 on the Spring Boot 4 line and 1.2.2 on the Spring Boot 3 line, which add keyword search, server scope, scrolling, projections and aggregates, and leave ordered inserts off by default

### 2026-08

#### New features
- **Localised labels for Excel and CSV**
  - `@ExcelColumn(name)` written as `{key}` is read as a message key
  - An enum is resolved through the key `enums.{simple class name}.{constant}`, then `SimpliXLabeledEnum.getLabel()`, then `name()`
  - An `ExcelLabelResolver` bean for applications whose bundles are merged by a classpath wildcard
  - A missing translation does not fail the file: the key is written as it is

- **Rotation of license verification keys and a ceiling for compromised keys**
  - Several verification keys in the one resource `classpath:license-verification-keys.json`, so earlier licenses stay valid when the signing key changes
  - A key name and its public key sit in one entry, so the two cannot drift apart
  - A token signed with a key marked as compromised cannot grant more than the installation already holds: a higher feature set, quota, expiry or release ceiling is refused with `SIGNING_KEY_COMPROMISED`
  - An installation with nothing registered has the ceiling fixed at "holds nothing"
  - The `VerificationKeyIdentity` bean is no longer needed

#### Improvements
- **CSV cell escaping**
  - A value that contains a separator, a quote or a line break is quoted, and quotes inside it are doubled
  - Values that are not strings, such as numbers with a thousands separator, follow the same rule
  - A value that starts with `=` `+` `-` `@` gets a leading apostrophe so that a spreadsheet does not run it as a formula (`sanitizeFormulas`, on by default)
  - `@ExcelColumn(format)` is applied to CSV export too

- **One notation for boolean values**
  - Excel writes the same notation as CSV (`format.booleanTrueValue` / `booleanFalseValue`) instead of true and false cells
  - The same list downloaded in both formats reads the same

#### Build and dependencies
- searchable-jpa 1.1.2
- license-sdk 1.0.8

### 2026-07

#### New features
- **The simplix-license module**
  - Verifies license tokens signed with the public key built into the application
  - Online activation, and offline activation for closed networks
  - Heartbeat renewal and periodic re-verification
  - Feature gating with `@RequiresFeature`, linked to administrator activation
  - Quota limits with `QuotaCounter` (only new registrations are blocked)
  - A request filter that enforces the license state, and a first-install gate
  - JPA or file storage chosen automatically, an Actuator health indicator and Micrometer metrics
  - Not part of the starter: added as its own dependency

- **Stream connection tickets**
  - `POST /api/stream/tickets` issues a short-lived single-use ticket
  - An `EventSource`, which cannot send headers, authenticates without putting a session value in the query string
  - `simplix.stream.security.connect-ticket-validity` sets the validity (30 seconds by default)

#### Improvements
- **Anonymous stream sessions**
  - The session ownership comparison of an unauthenticated connection is null-safe
  - A client that subscribes without a login, such as a public status page, no longer fails on its first request

- **Validation of OpenAPI component keys**
  - A name with characters the OpenAPI specification does not allow, such as an array type, is left out of schema registration
  - Code generators that validate component keys can read the whole document again

### 2025-12

#### New features
- **The simplix-scheduler module**
  - Records every run of a Spring `@Scheduled` method
  - Tracks duration and status through AOP
  - Stores records in a database or in memory
  - Works across instances through ShedLock
  - `@SchedulerName` gives a method a name of its own
  - Spring `${...}` placeholders are stored with their resolved values

- **Nested mode of @I18nTrans** [`799936f`](https://github.com/simplix-framework/simplix/commit/799936f)
  - The `target` attribute translates a field of a nested object
  - Dot notation paths (for example `tagGroup.nameI18n`)
  - Works with a field-level `@JsonIncludeProperties`
  - The original object is restored after serialisation, so there is no side effect

- **Sortable tree service** [`22c4864`](https://github.com/simplix-framework/simplix/commit/22c4864)
  - The `SortableTreeEntity` interface for entities whose order can change
  - `SimpliXSortableTreeBaseService` with a default `reorderChildren()`
  - Tree utilities: `normalizeParentId()`, `validateNoCircularReference()`, `validateNoChildren()`
  - Tree conversion: `buildTreeFromFlatList()`, `mapToTreeDto()`

- **Custom logout handlers** [`9b2e2e1`](https://github.com/simplix-framework/simplix/commit/9b2e2e1)
  - A `LogoutHandler` bean is called on logout (audit logging, token blacklist)
  - A `LogoutSuccessHandler` bean replaces the default redirect
  - The logout endpoint of the token controller calls the `LogoutHandler`

- **Hibernate6Module** [`ef23597`](https://github.com/simplix-framework/simplix/commit/ef23597)
  - Registered with the Jackson ObjectMapper automatically
  - Lazily loaded entities serialise correctly

- **Soft delete in unique validation** [`dd56b31`](https://github.com/simplix-framework/simplix/commit/dd56b31)
  - `@UniqueField` and `@UniqueFields` take soft delete into account
  - Deleted records are left out of the check

- **I18n translation settings** [`d093d92`](https://github.com/simplix-framework/simplix/commit/d093d92)
  - Central settings through `SimpliXI18nConfigHolder`
  - The default locale and the supported locales can be set

- **Unique validation annotations** [`9f4033d`](https://github.com/simplix-framework/simplix/commit/9f4033d)
  - `@UniqueField`: a unique check on one field
  - `@UniqueFields`: a unique check across fields
  - The check queries through the JPA repository

#### Build and dependencies
- **searchable-jpa** [`f22c4fe`](https://github.com/simplix-framework/simplix/commit/f22c4fe)
  - searchableJpaVersion moved to 1.0.5

---

## Related links

- [Releases and their notes](https://github.com/simplix-framework/simplix/releases)
- [GitHub repository](https://github.com/simplix-framework/simplix)
- [Issue tracker](https://github.com/simplix-framework/simplix/issues)
- [Full commit history](https://github.com/simplix-framework/simplix/commits/main)
