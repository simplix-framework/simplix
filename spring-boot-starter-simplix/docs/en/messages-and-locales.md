# Messages and locales

Where the texts of an application live and how the language of an answer is chosen. The starter builds one `MessageSource` from the bundles of your application and the bundles the SimpliX modules ship.

## Where to put your messages

| Bundle | Holds |
|---|---|
| `messages.properties`, `messages/messages.properties` | general texts |
| `messages/validation.properties` | validation messages |
| `messages/errors.properties` | error messages |
| `messages/entities/**/*-messages.properties` | labels of entities and their fields, under `entities.<Entity>` and `entities.<Entity>.<field>` |
| `messages/enums/**/*-messages.properties` | labels of enum constants, under `enums.<Enum>.<CONSTANT>` |

Add a file per language beside each, such as `messages_ko.properties` or `catalog-messages_ko.properties`. To use other bundle names, list them in `spring.messages.basename`.

```yaml
spring:
  messages:
    basename: messages/validation,messages/errors,messages/library
```

## Messages of the modules

Each SimpliX module ships its texts as `messages/simplix_<module>.properties`, in English, Korean and Japanese. The starter finds every such bundle on the classpath. A key you define in your own bundle with the same name takes the place of the module's text: `error.authz.insufficient.permissions=You may not do that` in `messages/errors.properties` changes the message of every 403 answer.

## The language of an answer

The language follows the `Accept-Language` header of the request. The same error is answered as `Insufficient permissions` to `Accept-Language: en` and as `권한이 부족합니다` to `Accept-Language: ko`.

## Validation messages

The validator reads its messages from the same `MessageSource`, and fills the placeholders of a constraint, such as `{min}` and `{max}`. `@Size(max = 200)` is answered as `Size must be between 0 and 200`.

Write the placeholders of a message of your own by name. Numbered placeholders are filled as well, but they receive `max` before `min`: `@Size(min = 2, max = 5, message = "Between {0} and {1} characters")` is answered as `Between 5 and 2 characters`, and `message = "From {min} to {max} characters"` as `From 2 to 5 characters`.

## Properties

| Property | Default | Meaning |
|---|---|---|
| `spring.messages.basename` | `messages`, `messages/validation`, `messages/errors`, `messages/messages` | the bundles of the application, separated by commas |
| `simplix.message-source.enabled` | `true` | builds the combined `MessageSource` |
| `simplix.validator.enabled` | `true` | connects the validator to the `MessageSource` |
| `simplix.i18n.default-locale`, `simplix.i18n.supported-locales` | `en`; `en`, `ko`, `ja` | the fallback of field translation; see [Translating fields](../../../simplix-core/docs/en/translating-fields.md) |

## Related documents

- [Translating fields](../../../simplix-core/docs/en/translating-fields.md)
- [Publishing metadata for clients](./publishing-metadata-for-clients.md)
