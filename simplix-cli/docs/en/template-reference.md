# Template reference

The built-in templates, the syntax and variables a template can use, the application classes and message keys generated code relies on. To change or replace a template, see [Customizing templates](./customizing-templates.md).

## Built-in templates

| Relative path | Renders |
|---|---|
| `service/EntityService.java.template` | the service |
| `service/EntityTreeService.java.template` | the tree service of a `TreeEntity` |
| `controller/rest/EntityRestController.java.template` | the REST controller |
| `controller/web/EntityWebController.java.template` | the web controller |
| `dto/EntityDTOs.java.template` | the DTOs |
| `repository/EntityRepository.java.template` | the repository |
| `test/EntityServiceTest.java.template` | the service test |
| `test/EntityTreeServiceTest.java.template` | the tree service test |

The code they generate imports classes of SimpliX and searchable-jpa of the CLI's release line and no class of your application. No controller test template is built in: a project that provides `test/EntityRestControllerTest.java.template` gets controller tests.

## Syntax

A template is an EJS file. The output tag `<%= %>` writes a value as it is, without HTML escaping. After rendering, trailing spaces are removed and runs of blank lines are reduced to one.

```java
package <%= packagePaths['service'] %>;

public class <%= classPrefix %>Service extends SimpliXBaseService<<%= entityName %>, <%= idType %>> {
}
```

## Variables

| Variable | Holds |
|---|---|
| `entityName` | the entity class name |
| `classPrefix` | the prefix of the generated class names (the yml file name) |
| `controllerName` | the REST controller class name |
| `entityNameLowerFirst`, `classPrefixLowerFirst` | the names with a lowercase first letter |
| `basePackage` | `target.basePackage` |
| `modulePath` | the yml's `modulePath` |
| `packagePaths` | the package of each component: `packagePaths.service`, `packagePaths.dto`, `packagePaths.repository` |
| `targetPaths` | `target.targetPath` |
| `entityPackage`, `entityBasePackage` | the entity's package and `entity.basePackage` |
| `templatePath` | the request path: the yml's `thymeleafBaseDir`, or the kebab-case class name |
| `entityComment` | the entity's table comment |
| `fields`, `entityFields` | the analysed fields |
| `idType`, `idFieldName` | the type and the field name of the identifier |
| `hasEmbeddedId`, `embeddedIdField`, `embeddedIdType`, `embeddedIdFields`, `embeddedIdPropertyNames` | a composite identifier |
| `embeddedIdPropertyName1`, `embeddedIdPropertyName2`, `propType1`, `propType2` | the names and the types of the first two properties of a composite identifier; the names are `propertyName1` and `propertyName2` when the identifier has no such property |
| `embeddedFieldCapitalized`, `embeddedField2Capitalized` | the composite identifier field followed by each of those property names with a capital first letter; empty without a composite identifier |
| `otherEntityField`, `otherFieldCapitalized` | the first field that is neither an identifier nor the composite identifier field (`someField` when there is none), and that name with a capital first letter |
| `importsArray` | the imports the properties of a composite identifier need |
| `entitySearchFields`, `embeddedIdSearchFields` | the fields of the search DTO |
| `ymlConfig` | the whole entity yml |
| `dtoExcludeFields` | `dto.excludeFields` |
| `hasOrderField`, `orderField` | the sort order field |
| `hasTreeEntity`, `treeEntityInterface` | whether the entity implements `TreeEntity`, and with which types |
| `exportConfig` | the yml's `export`, resolved |
| `supportClasses` | the lookup of application classes (below) |
| `capitalizeFirstLetter` | a function that capitalises the first letter |
| `_` | lodash |
| `generatorVersion`, `generatedAt`, `gitUser`, `gitEmail` | the CLI version, the time of the render and the Git user |

## Support classes

Some generated members call a class the framework does not provide and the application writes. Its fully qualified name is set under `supportClasses` in `.simplix/generator-simplix.json`.

```json
{
  "supportClasses": {
    "searchFigures": "com.example.library.app.search.ListFigures",
    "localizedSearchParams": "com.example.library.app.search.LocalizedSearchParams",
    "messages": "com.example.library.app.util.MessageUtils"
  }
}
```

| Key | Needed when | The class provides |
|---|---|---|
| `searchFigures` | the yml has `statusCounts` or `aggregates`, or uses `timeAxisField` with `figureScope` | nested types `ValueCountDTO` (`of(ValueCount)`) and `AggregateValueDTO` (`of(AggregateValue)`, `empty(Aggregate)`), and static methods `scoped(Map)` and `scoped(Optional)` |
| `messages` | the yml has `notFoundMessageKey` | a static method `get(String)` |
| `localizedSearchParams` | search and sorting go through derived i18n columns | a static method `rewrite(Map, String...)` |

`generate` refuses a yml that asks for `searchFigures` or `messages` while the key is not set. `localizedSearchParams` only acts when it is set: for an entity with a `<name>I18n` map and a derived `<name>Search` or `<name>Sort<Lang>` column, the search DTO then points at the derived column and the service rewrites the search parameters through the class.

In a template, `supportClasses.find(key)` returns `{ fqn, name }` or `undefined`, and `supportClasses.require(key, usedBy)` stops the render with a message that names the yml and the key.

## Message keys

Generated code uses these message keys. They are not in the framework's bundles: define them in your application's message bundle.

| Key | Used for |
|---|---|
| `error.id.cannot.change` | the exception the service throws when an update request names another identifier than the record's |
| `error.search.countFieldUnknown` | the exception the service throws when counts are asked for a field that is not in `statusCounts` |
| `error.tree.circular.reference` | the exception the tree service throws when a node is moved under itself |
| `entities.<Entity>.<field>` | the `@FieldLabel` of a DTO field |

## Related documents

- [Customizing templates](./customizing-templates.md)
- [Configuration reference](./configuration-reference.md)
