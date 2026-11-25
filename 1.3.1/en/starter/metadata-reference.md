# Metadata reference

The shape of the document `GET /dev/meta/dto` returns. A client generator or a screen builder reads it to learn the operations of the API, the types they exchange, the entities behind them and the labels of every field, without parsing Java or OpenAPI.

The endpoint is registered with `simplix.dev.meta.enabled: true`; see [Publishing metadata for clients](en/starter/publishing-metadata-for-clients.md). A member without a value is left out of the JSON.

## The document

| Field | Type | Holds |
|---|---|---|
| `version` | number | the version of this format, `1` |
| `enums` | map of `EnumMeta` | the enums the types use, by simple name |
| `types` | map of `TypeMeta` | the DTOs and other classes the operations exchange, by simple name |
| `operations` | list of `OperationMeta` | every handler method of the application |
| `entities` | map of `EntityMeta` | the entities a `SimpliXBaseController` serves, by simple name |
| `extensions` | map | values other modules add to the document; absent when there are none |

The Java record of the document is `DtoMeta`.

## An operation

```json
{
  "id" : "AuthorRest_simpleSearch",
  "method" : "GET",
  "path" : "/api/catalog/author/search",
  "tag" : "catalog.Author",
  "summary" : "Search Author list (GET)",
  "request" : {
    "query" : [],
    "path" : [],
    "searchDto" : "AuthorSearchDTO"
  },
  "response" : {
    "kind" : "container",
    "name" : "SimpliXApiResponse",
    "args" : [
      {
        "kind" : "container",
        "name" : "Page",
        "args" : [
          {
            "kind" : "ref",
            "name" : "AuthorListDTO"
          }
        ]
      }
    ]
  },
  "access" : {
    "kind" : "permission",
    "group" : "CATALOG",
    "action" : "list"
  },
  "entity" : "Author"
}
```

| Field | Type | Holds |
|---|---|---|
| `id` | text | the controller and the method, such as `AuthorRest_simpleSearch` |
| `method`, `path` | text | the HTTP method and the path with its prefix |
| `tag`, `summary` | text | the tag and the summary of the OpenAPI annotations |
| `request` | `RequestMeta` | what the operation takes |
| `response` | `TypeRef` | what it returns, with its containers; absent for no content |
| `access` | `AccessMeta` | who may call it |
| `entity` | text | the entity the operation works on |
| `defaultSort` | `DefaultSortMeta` | the order a list opens in: `field` and `direction`, from `@SimpliXDefaultSort` of the controller |
| `statusCounts`, `aggregates`, `timeAxis` | list, list of `AggregateMeta`, text | the figures of the list, from `@SimpliXListFigures` of the controller; an `AggregateMeta` is a `field` and an `op` |

### The request

| Field | Type | Holds |
|---|---|---|
| `body` | `TypeRef` | the type of the request body |
| `contentType` | text | the content type, when it is not JSON |
| `query`, `path` | list of `ParamMeta` | the query and path parameters: `name`, `type`, `required`, `description` |
| `searchDto` | text | the search DTO whose fields are the conditions of a search operation |

### Access

`AccessMeta` is the `@PreAuthorize` expression of the method in a form a client can read without parsing it.

| Field | Type | Holds |
|---|---|---|
| `kind` | text | `public`, `authenticated`, `permission` or `expression` |
| `group`, `action` | text | for `permission`: the permission the caller needs, such as `CATALOG` and `list` |
| `operator`, `permissions` | text, list of `PermissionTermMeta` | for an expression made of several permissions: `or` or `and`, and the terms, each a `group` and an `action` |
| `residual` | boolean | set when the expression has a term that is not a permission, such as an ownership check, which only the server can decide |
| `raw` | text | for `expression`: the expression as written |

## A type

```json
{
  "javaClass" : "com.example.library.web.catalog.dto.AuthorDTOs$AuthorCreateDTO",
  "typeParams" : [],
  "fields" : [
    {
      "name" : "penName",
      "type" : {
        "kind" : "string"
      },
      "required" : true,
      "nullable" : false,
      "description" : "Pen Name",
      "labelKey" : "entities.Author.penName",
      "constraints" : [
        {
          "kind" : "notBlank"
        },
        {
          "kind" : "maxLength",
          "value" : 120
        }
      ],
      "labels" : {
        "en" : "Pen name",
        "ko" : "필명"
      }
    }
  ],
  "entity" : "Author"
}
```

| Field | Type | Holds |
|---|---|---|
| `javaClass` | text | the Java class |
| `extends` | text | the parent type, when it is in the document too |
| `typeParams` | list | the names of the type parameters of a generic class |
| `description` | text | the description of the schema annotation |
| `fields` | list of `FieldMeta` | the serialised properties |
| `entity` | text | the entity the DTO belongs to |

The Java record is `TypeMeta`.

### A field

| Field | Type | Holds |
|---|---|---|
| `name` | text | the name of the property in JSON |
| `type` | `TypeRef` | the type of the value |
| `required`, `nullable` | boolean | whether a value must be sent, and whether `null` is allowed |
| `description` | text | the description of the schema annotation |
| `labelKey`, `labels` | text, map | the message key of the label, and the label in every locale the bundles carry |
| `constraints` | list of `ConstraintMeta` | the validation rules: `kind`, a `value` where the rule has one, and `name` for a custom rule |
| `searchable` | `SearchableMeta` | on a field of a search DTO: how it can be searched and sorted |
| `reference` | `ReferenceMeta` | the record of another entity the value names |
| `format` | text | how to show the value: `code`, `money`, `credits`, `signedCredits`, `bytes`, `duration` |
| `money` | `MoneyMeta` | for the `money` format: `currency` and `scale` |
| `tones` | map | for a status field: the tone of each value, from `@Tone` |
| `defaultValue` | any | the value a create form starts with |
| `verbOnly` | boolean | `true` for a field marked `@VerbOnly`, which changes only through its own action |

The kinds of constraint are `notBlank`, `notEmpty`, `minLength`, `maxLength`, `minItems`, `maxItems`, `min`, `max`, `positive`, `nonnegative`, `negative`, `nonpositive`, `pattern`, `email`, `assertTrue`, `assertFalse` and `custom`.

### Search capability

```json
{
  "operators" : [
    "EQUALS",
    "CONTAINS"
  ],
  "sortable" : true,
  "entityField" : "penName"
}
```

| Field | Type | Holds |
|---|---|---|
| `operators` | list | the operators the field accepts, such as `EQUALS`, `CONTAINS`, `IN` |
| `sortable` | boolean | whether a list can be sorted by the field |
| `entityField` | text | the entity field the condition applies to |
| `sortField` | text | the entity field the order applies to, when it differs |
| `sortAlias` | map | per language, the sibling field a translated value is sorted through |
| `keyword` | boolean | set when the field takes part in the keyword search |

### A reference

| Field | Type | Holds |
|---|---|---|
| `entity`, `idField` | text | the referenced entity and the field of it the value holds |
| `many` | boolean | whether the value is a collection of identifiers |
| `kindField`, `kinds` | text, map | for `@ReferencesByKind`: the field that says which entity, and the entity of each of its values |
| `nameField` | text | the property of the holding record that carries the name of the referenced record |

## A type reference

`TypeRef` describes a type by its `kind`. The members a kind does not use are absent.

| `kind` | Other members | Meaning |
|---|---|---|
| `string`, `boolean`, `date`, `time`, `instant` | `pattern` where a format is set | a simple value |
| `number` | `integral` | a number; `integral` tells whether it is whole |
| `enum` | `name` | an entry of `enums` |
| `ref` | `name` | an entry of `types` |
| `container` | `name`, `args` | a generic container such as `SimpliXApiResponse`, `Page`, `List`, `Set` or `Map`, with the types inside it |
| `param` | `name` | a type parameter of the enclosing generic type |
| `pick` | `of`, `fields` | the named fields of another type |
| `file`, `binary` |  | an uploaded file, and raw bytes |
| `unknown` |  | a type the builder could not describe |

## An enum

```json
{
  "labeled" : false,
  "values" : [
    {
      "name" : "CSV"
    },
    {
      "name" : "XLSX"
    }
  ]
}
```

`EnumMeta` carries `labeled`, which is true for a `SimpliXLabeledEnum`, and `values`. Each `EnumMeta.Value` has the `name` of the constant, the `labelKey` of its message and its `tone`.

## An entity

```json
{
  "javaClass" : "com.example.library.domain.catalog.entity.Author",
  "idField" : "authorId",
  "nameFields" : [
    "penName"
  ],
  "labelKey" : "entities.Author",
  "pluralKey" : "entities.Author._plural",
  "descriptionKey" : "entities.Author._description",
  "label" : {
    "en" : "Author",
    "ko" : "작가"
  }
}
```

| Field | Type | Holds |
|---|---|---|
| `javaClass` | text | the entity class |
| `idField` | text | the identifier field |
| `nameFields` | list | the fields a record is named by on a screen, from `@NameField` |
| `labelKey`, `pluralKey`, `descriptionKey` | text | the message keys of the name, the plural and the description |
| `label`, `plural`, `description` | map | the texts in every locale whose bundle has the key |
| `holders` | list of `HolderMeta` | the entities whose records refer to this one: `entity`, `field`, `operators` and the `searchOperation` that lists them |
| `defaultSort`, `statusCounts`, `aggregates` |  | the list settings of the entity, as on an operation |

## The label document

With `simplix.dev.i18n.enabled: true`, `GET /dev/i18n/messages` returns every entity and enum label in every locale; the Java class is `I18nMessagesResponse`. `GET /dev/i18n/entities`, `/dev/i18n/enums` and `/dev/i18n/locales` return its parts.

```json
{
  "version" : "<format version>",
  "supportedLocales" : [
    "en",
    "ko"
  ],
  "entities" : {
    "Author" : {
      "label" : {
        "translations" : {
          "ko" : "작가",
          "en" : "Author"
        }
      },
      "fields" : {
        "penName" : {
          "translations" : {
            "ko" : "필명",
            "en" : "Pen name"
          }
        }
      }
    }
  },
  "enums" : {}
}
```

An `EntityMessages` holds the `label` of the entity and its `fields`; an `EnumMessages` holds the `values` of an enum. Each text is a `LocalizedString`: `translations` by locale. A label no bundle carries has empty `translations`.

## Related documents

- [Publishing metadata for clients](en/starter/publishing-metadata-for-clients.md)
- [Describing entities for screens](en/core/describing-entities-for-screens.md)
