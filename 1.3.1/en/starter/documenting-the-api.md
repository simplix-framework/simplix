# Documenting the API

How the OpenAPI document of an application is produced and what the starter adds to it. springdoc reads the controllers; the starter corrects what springdoc cannot see, so that a code generator can build a typed client from the document.

## Where the document is

| Path | Serves |
|---|---|
| `/v3/api-docs` | the OpenAPI document as JSON |
| `/swagger-ui.html` | Swagger UI |
| `/scalar` | the Scalar API reference |

With `simplix-auth` active these paths need a login. Open them with `simplix.auth.security.permit-all-patterns`, as [Securing an application](en/securing-an-application.md) shows.

## Configure springdoc

```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
  packages-to-scan: com.example.library.web
```

These are springdoc's own properties; the starter leaves them as they are. The title, the description and the version of the document come from an `OpenAPI` bean of your application, as in any springdoc application.

## What the starter adds

| Customizer | Does | Switch |
|---|---|---|
| `GenericResponseSchemaCustomizer` | restores the type inside the response wrapper, so `SimpliXApiResponse<Page<AuthorListDTO>>` is described with its real body | `simplix.swagger.customizers.generic-response.enabled` |
| `DtoSchemaAutoRegistrar` | registers the DTO classes those response schemas refer to | follows the previous one |
| `EnumSchemaExtractor` | moves inline enums to named schemas that can be referred to | `simplix.swagger.customizers.enum-extractor.enabled` |
| `NestedObjectSchemaExtractor` | moves inline nested objects to named schemas | `simplix.swagger.customizers.nested-object-extractor.enabled` |
| `OperationIdCustomizer` | names an operation after its controller and method, such as `AuthorRest_search`, instead of `search_1` | always on |
| `TemporalSchemaRegistrar` | describes the date and time types springdoc has no mapping for as strings | always on |
| `SwaggerSchemaEnhancer` | adds translated validation messages, search field information and the id field as extension fields | `simplix.swagger.i18n-enabled` |
| `SchemaOrganizer` | sorts the schemas by name and marks enum schemas with `x-schema-type: "enum"` | always on |

Each switch is `true` by default. `springdoc.api-docs.enabled: false` switches the document and all of these off.

### Plain return types and the response wrapper

`simplix.swagger.customizers.generic-response.auto-wrap` is `true` by default: an operation whose method returns a plain type is described as returning that type inside `SimpliXApiResponse`. The answer itself is not wrapped, so the description is right only for methods that return `SimpliXApiResponse`. Set the property to `false` in an application whose controllers return plain objects.

### Classes read for the extension fields

`SwaggerSchemaEnhancer` reads the classes of the SimpliX model packages. Name the packages of your own DTOs in `simplix.swagger.i18n-packages` so their schemas get the translated validation messages and search information as well.

```yaml
simplix:
  swagger:
    i18n-packages:
      - com.example.library.web
    customizers:
      generic-response:
        auto-wrap: false
```

## Describe your endpoints

- `@SimpliXStandardApi` on a controller adds the standard success, bad request and server error responses to each operation. `SimpliXBaseController` carries it.
- Use springdoc's `@Tag`, `@Operation` and `@Schema` for names and descriptions. The CLI writes them on generated controllers and DTOs.
- Return `SimpliXApiResponse<T>` with a concrete `T`: the response schema is built from it.

## Sign in from Swagger UI

With [simplix-auth](en/auth/readme.md) the document carries the security schemes `Bearer` (an access token) and `Basic` (user name and password), so Swagger UI shows its Authorize button without a configuration of your own.

## Hide an endpoint

```java
@Hidden
@GetMapping("/internal")
public String internal() {
    return "internal";
}
```

`@Hidden` of springdoc on a method or a controller class leaves it out of the document. The endpoint itself keeps working.

## Split the document into groups

```yaml
springdoc:
  group-configs:
    - group: plain
      paths-to-match: /api/plain/**
```

Each group is served at `/v3/api-docs/<group>` (here `/v3/api-docs/plain`) and can be chosen in Swagger UI. `/v3/api-docs` keeps the whole document.

## Switch the documents off in production

```yaml
springdoc:
  api-docs:
    enabled: false
  swagger-ui:
    enabled: false

scalar:
  enabled: false
```

The springdoc properties make `/v3/api-docs` and Swagger UI answer 404. The Scalar page has a switch of its own and stays reachable without it.

## Related documents

- [Writing services and controllers](en/starter/writing-services-and-controllers.md)
- [Publishing metadata for clients](en/starter/publishing-metadata-for-clients.md)
