# Publishing metadata for clients

Development endpoints that describe an application to its frontend: SimpliX Meta lists the DTOs, the operations and the entities with everything a screen needs to know about them, and the i18n endpoint lists the labels in every language. A frontend build reads both to generate types, forms and translations.

## Switch the endpoints on

```yaml
simplix:
  dev:
    meta:
      enabled: true
    i18n:
      enabled: true
  auth:
    security:
      permit-all-patterns:
        - /dev/**
```

Both are off by default, and neither is registered when the `prod` or `production` profile is active, whatever the properties say. Put the properties in a development profile.

| Property | Default | Meaning |
|---|---|---|
| `simplix.dev.meta.enabled` | `false` | registers `GET /dev/meta/dto` |
| `simplix.dev.i18n.enabled` | `false` | registers the `/dev/i18n` endpoints |
| `simplix.dev.base-packages` | the packages of the application | the packages scanned for labelled enums |

## SimpliX Meta

`GET /dev/meta/dto` answers with one document.

| Part | Holds |
|---|---|
| `version` | the version of the document format |
| `types` | every DTO and the classes it refers to, with the fields of each: type, whether it is required or nullable, constraints, format and reference |
| `enums` | the enums with their constants, label keys and tones |
| `operations` | every controller method: its id, HTTP method, path, tag, request, response, the permission it needs and the entity it serves |
| `entities` | every entity a controller serves: its id field, name fields, label keys, and the default sort and figures of its list |
| `extensions` | what the application adds |

An operation of the generated `Author` controller is described as follows; the request and response types are left out here.

```json
{
  "id": "AuthorRest_multiUpdate",
  "method": "PATCH",
  "path": "/api/catalog/author",
  "tag": "catalog.Author",
  "access": { "kind": "permission", "group": "CATALOG", "action": "edit" },
  "entity": "Author"
}
```

The annotations of [Describing entities for screens](../../../simplix-core/docs/en/describing-entities-for-screens.md) are what fill the name fields, formats, tones and references of this document. To add data of your own, register a bean that implements `SimpliXMetaContributor`: what it returns is served under `extensions`.

A declaration the document cannot describe is refused: a default sort its search DTO cannot order by, a reference that names an entity no controller serves, two DTO classes of one simple name. The request is then answered with status 409 and the code `GEN_CONFLICT`. `message` names every refused declaration and `detail` lists them one by one, so one request shows everything to correct. The default sorts and the figures are checked once every type is accepted, so a refused type is reported before them. A `SimpliXMetaContributor` refuses a declaration of its own by throwing `SimpliXMetaViolationException`, which is answered the same way; `violations()` of the exception returns what `detail` lists.

## Labels in every language

| Endpoint | Answers with |
|---|---|
| `GET /dev/i18n/messages` | the version, the supported locales, the entity labels and the enum labels together |
| `GET /dev/i18n/entities` | the label of each entity and of each of its fields, per locale |
| `GET /dev/i18n/enums` | the label of each constant of each enum that implements `LabeledEnum`, per locale |
| `GET /dev/i18n/locales` | the locales the label bundles exist in |

The labels come from the bundles under `messages/entities` and `messages/enums`; see [Messages and locales](./messages-and-locales.md). With `catalog-messages.properties` and `catalog-messages_ko.properties` in place, the entry of `Author` reads as follows.

```json
{
  "label": {
    "translations": {
      "ko": "작가",
      "en": "Author"
    }
  },
  "fields": {
    "penName": {
      "translations": {
        "ko": "필명",
        "en": "Pen name"
      }
    }
  }
}
```

## Related documents

- [Describing entities for screens](../../../simplix-core/docs/en/describing-entities-for-screens.md)
- [Documenting the API](./documenting-the-api.md)
