# Configuration reference

The keys of the project configuration `.simplix/generator-simplix.json` and of an entity yml `.simplix/entity/<Name>.yml`. The first is written once per project; an entity yml is written by `config` and edited by you.

```
project/
+-- .simplix/
|   +-- generator-simplix.json   # project configuration
|   +-- entity/                  # one yml per generated set of classes
|   +-- templates/               # templates that replace built-in ones
|   +-- bases/                   # stored renders of promoted files
+-- generated/                   # output of generate (not committed)
+-- modules/                     # targets of promote
```

## Project configuration

```json
{
  "generator": { "version": "<X.Y.Z>" },
  "entity": {
    "scanPath": "src/main/java",
    "basePackage": "com.example.library.domain"
  },
  "repository": {
    "scanPath": "src/main/java",
    "deriveFromEntity": true
  },
  "dto": {
    "excludeFields": ["version", "createdAt", "updatedAt", "createdBy", "updatedBy"]
  },
  "target": {
    "generatedBasePath": "generated/main/java/com/example/library/web",
    "basePackage": "com.example.library.web",
    "targetPath": {
      "service": "{modulePath}/service",
      "controllerRest": "{modulePath}/controller",
      "dto": "{modulePath}/dto"
    },
    "testGeneratedBasePath": "generated/test/java/com/example/library/web",
    "testTargetPath": {
      "serviceTest": "{modulePath}/service"
    }
  },
  "promote": { "moduleRoot": "modules" },
  "template": {},
  "supportClasses": {}
}
```

| Key | Type | Default | Description |
|---|---|---|---|
| `generator.version` | string | none | the CLI version the project requires; a CLI older than it refuses to run `config`, `generate` and `promote`. Written by `version --write` |
| `entity.scanPath` | string | `src/main/java` | the folder searched recursively for entity sources; `entity.basePath` is read as the same key |
| `entity.basePackage` | string | derived from the path | the package the entities start from |
| `repository.deriveFromEntity` | boolean | `false` | when `true`, the repository package is the entity package with its last `.entity` replaced by `.repository` |
| `repository.basePackage` | string | none | the base package of repositories when `deriveFromEntity` is off; the yml's `modulePath` is appended |
| `repository.scanPath` | string | none | the folder `config` searches for repository sources |
| `dto.excludeFields` | string[] | `[]` | field names left out of every DTO |
| `target.generatedBasePath` | string | required | the folder `generate` writes sources into; `target.basePath` is read as the same key |
| `target.basePackage` | string | required | the base package of the generated classes |
| `target.targetPath.<component>` | string | none | the sub-path of a component, which is generated only when this is set; `{modulePath}` is replaced by the yml's `modulePath`. Components: `service`, `controllerRest`, `controllerWeb`, `dto`, `repository` |
| `target.testGeneratedBasePath` | string | `generatedBasePath` with `/main/` replaced by `/test/` | the folder test sources are written into |
| `target.testTargetPath.serviceTest` | string | none | the sub-path `promote` moves the service test to |
| `promote.moduleRoot` | string | `modules` | the folder that holds the modules `promote` writes into |
| `template.<component>` | string | the built-in path | the relative path of the template a component is rendered from; tests are `serviceTest` and `restControllerTest` |
| `supportClasses.<key>` | string | none | the fully qualified name of an application class the generated code calls ([Template reference](en/cli/template-reference.md#support-classes)) |

## Entity yml

The file name is the prefix of the generated class names. One yml produces one set of classes.

```yaml
entity: Book

modulePath: catalog
idField: bookId
nameField: title
thymeleafBaseDir: catalog/book
permissionGroup: CATALOG
defaultSort: { field: title, direction: asc }
export: true

fields:

  title:
    searchKeyword: true
    sortable: true
    views: [list, detail, edit]
    required: true
    maxLength: 200
    searchOperators: [equals, contains]

  authorId:
    sortable: true
    views: [list, detail, edit]
    maxLength: 36
    searchOperators: [equals, in]
    reference:
      entity: Author
      idField: authorId
      idType: String
      nameField: penName
      multiple: false
```

| Key | Description |
|---|---|
| `entity` | the entity class name. Set it to another class than the file name to generate a second set of classes for the same entity under another prefix |
| `modulePath` | the module path that goes into the generated paths and packages; required |
| `repositoryModulePath` | the module path of the repository when it differs from the entity's |
| `controllerName` | the REST controller class name; `<Name>RestController` when absent |
| `idField` | the name of the identifier field |
| `nameField` | the field a record is called by. `generate` warns when it differs from the entity's `@NameField` |
| `thymeleafBaseDir` | the request path of the controller; the kebab-case file name when absent |
| `permissionGroup` | the permission group of the `@PreAuthorize` checks; the entity name when absent |
| `ownerPermission` | adds a call to the service's `hasOwnerPermission` to the read and update checks |
| `defaultSort` | the list's default order: `field` is a field with `sortable: true`, `direction` is `asc` or `desc` |
| `export` | `true` generates an endpoint that exports the list; `{ dto, baseName }` names the row DTO and the file name |
| `statusCounts` | fields to count records per value of; needs `supportClasses.searchFigures` |
| `aggregates` | a list of `{ field, op }` computed under the list's search condition; needs `supportClasses.searchFigures` |
| `figureScope` | `{ method, mayMatchNothing }`: the method that restricts the counts to what the caller may see |
| `timeAxisField` | the time field counts per period are taken on |
| `notFoundMessageKey` | the message key answered when a record does not exist; needs `supportClasses.messages` |
| `sortOrderConfig` | `{ autoIncrement, field, scopeFields }`: generates a repository method that reads the highest order value |
| `fields` | the settings of each field (below) |

> ℹ `config` also writes `promoteModule`, `defaultSortField` and `defaultSortDirection`. No command reads them.

## Field settings

| Key | Description |
|---|---|
| `views` | the DTOs the field is part of: `list`, `detail`, `edit`, `batchUpdate` |
| `searchOperators` | the operators the search DTO allows on the field; an empty list leaves the field out of the search DTO |
| `sortable` | whether the list may be ordered by the field. `true` on a `Boolean` field is refused with a warning |
| `searchKeyword` | `true` marks the field as a target of the single keyword search (see the note below) |
| `required`, `unique`, `maxLength` | decide the validation annotations |
| `type` | the DTO field type, when it is not the entity field's; `config` fills it for a value object kept in a JSON column |
| `reference` | the entity the field refers to: `entity`, `idField`, `idType`, `nameField`, `multiple`, `modulePath` |

> ⚠ `searchKeyword: true` writes `keyword = true` on the field's `@SearchableField`. That attribute is not in the searchable-jpa release the current SimpliX releases depend on, so the generated DTO compiles only when the project uses a searchable-jpa build that has it.

The search operators `config` starts a field with depend on its type.

| Field type | Operators |
|---|---|
| `String` | `equals`, `contains` |
| `Integer`, `Long`, `Double`, `BigDecimal` | `equals`, `greaterThan`, `lessThan` |
| date and time types | `between`, `greaterThanOrEqual`, `lessThanOrEqual` |
| enum | `equals`, `in` |
| any other type | `equals` |

## Related documents

- [Getting started](en/cli/getting-started.md)
- [Command reference](en/cli/command-reference.md)
- [Template reference](en/cli/template-reference.md)
