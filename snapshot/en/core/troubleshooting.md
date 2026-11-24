# Troubleshooting simplix-core

Symptoms an application meets with the core classes, the cause of each and what to change.

## Entities and trees

| Symptom | Cause | What to do |
|---|---|---|
| A tree read fails with a data conversion error on the parent column, and the transaction ends with `UnexpectedRollbackException` | the identifier is numeric; the tree queries compare the parent column with an empty string | use a `String` identifier for tree entities |
| `@UuidV7Generator` fails on a `UUID` field | the generator produces text | declare the identifier as `String` |
| `findByLookup` fails with a SQL syntax error | a key of the map is not declared in `lookupColumns` | declare the column, or reject the key before the call |
| Children are still in the table after their parent was deleted | `deleteById` deletes one node, and `cascadeDelete` has no effect | delete from the leaves up, or run `repairTreeStructure` to turn the orphans into roots |
| `findLeafNodes` returns every node, and `getTreeMetrics` reports no branch nodes | both judge a node by its `children` list, which the flat read leaves empty | count leaves from `findCompleteHierarchy` |
| A node saved with `createBatch` appears before its siblings | `createBatch` assigns no sort order | set the sort order on each node before the call |
| The application does not start: a method of a tree repository cannot be turned into a query | the repositories are created by the default factory | add `repositoryFactoryBeanClass = SimpliXRepositoryFactoryBean.class` to `@EnableJpaRepositories` |

## Responses and errors

| Symptom | Cause | What to do |
|---|---|---|
| The message passed to `success(body, message)` is not in the response | a success response keeps no message | put the text into the body |
| An exception created with a code of the application answers as `GEN_INTERNAL_SERVER_ERROR` with status 500 | a text that is not the code of an `ErrorCode` falls back to that code | use an `ErrorCode` constant and put the application's reason into the detail |
| A thrown `SimpliXGeneralException` is answered as a plain error page | the exception handler belongs to the starter | add the [starter](en/starter/readme.md), or write a handler |

## Conversion and data protection

| Symptom | Cause | What to do |
|---|---|---|
| `2026-03-01 00:30:00Z` is refused for an `Instant` | an `Instant` is read from the ISO-8601 form | send `2026-03-01T00:30:00Z` |
| A date without a time is refused for a `LocalDateTime` | the date-time patterns all carry a time | read it as a `LocalDate` and call `atStartOfDay()` |
| A name such as `O'Brien` is refused by `SqlInjectionValidator.isSafeInput` | quotes are treated as an injection sign | use the validator for identifiers, codes and sort fields, and bind free text as a query parameter |
| A field marked `@MaskSensitive` cannot be shown in full any more | the listener stores the masked value | use `MaskingConverter` or [simplix-encryption](en/encryption/readme.md) for a value that has to be read back |
| The log warns that the default masking key is in use | `simplix.core.masking.key` is not set | set a key of at least 32 characters from a secret store |

## Caching and events

| Symptom | Cause | What to do |
|---|---|---|
| `CacheManager.getInstance()` stores nothing although simplix-cache is installed | the static manager finds providers through the service loader only | inject `CacheProvider`, or register a provider under `META-INF/services` |
| An entity publishes no event | the entity lacks `@EntityListeners(EntityEventPublishingListener.class)`, or no `EventPublisher` is on the classpath | add the listener, and a module that delivers events such as [simplix-hibernate](en/hibernate/readme.md) |
| A bulk import publishes thousands of events | every saved row publishes one | run the import inside `EventContext.suppressEvents` |

## Related documents

- [How simplix-core works](en/core/how-it-works.md)
- [Error code reference](en/core/error-code-reference.md)
