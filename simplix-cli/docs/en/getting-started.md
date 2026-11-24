# Getting started with the SimpliX CLI

This page takes one JPA entity to a working API. At the end, the service, the REST controller, the DTOs and the service test of an `Author` entity sit in a module of your project, generated from a yml file you edited. The commands and their output come from a small library application; replace its names with yours.

## Before you begin

- Node.js 20 or later.
- A Gradle or Maven project that depends on SimpliX, with `build.gradle`, `build.gradle.kts` or `pom.xml` in its root.
- The entity you want an API for, and its Spring Data repository.

The entity of this page extends a project base class that itself extends `SimpliXBaseEntity`, and names the field a record is called by with `@NameField`.

```java
@Entity
@Table(name = "authors")
@Comment("A person who wrote books the library holds")
@Getter
@Setter
@NoArgsConstructor
public class Author extends BaseEntity<String> {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "author_id", nullable = false, unique = true, updatable = false)
    @Comment("Unique identifier of the author")
    private String authorId;

    @Column(name = "pen_name", nullable = false, length = 120)
    @Comment("The name printed on the books")
    @NameField
    private String penName;

    @Column(name = "biography", length = 2000)
    @Comment("A short account of the author's life")
    private String biography;

    @Override
    public String getId() {
        return authorId;
    }

    @Override
    public void setId(String id) {
        this.authorId = id;
    }
}
```

With the configuration of this page the CLI does not generate the repository: `target.targetPath` has no `repository` entry. It expects `AuthorRepository` in the `repository` package beside the entity's `entity` package.

```java
package com.example.library.domain.catalog.repository;

public interface AuthorRepository extends SimpliXBaseRepository<Author, String> {
}
```

## Step 1. Install the CLI

Install the CLI of the release line your project's SimpliX belongs to.

| Your project | SimpliX line | Install |
|---|---|---|
| Spring Boot 4 | 2.x | `npm install -g @simplix-boot/cli` |
| Spring Boot 3 | 1.x | `npm install -g @simplix-boot/cli@spring-boot-3x` |

```bash
simplix-boot --version
```

## Step 2. Create the project configuration

Run `init` in the project root. It creates the `.simplix` folder the other commands look for.

```bash
simplix-boot init
```

```
SimpliX Boot CLI v<X.Y.Z> - Initialize

   create .simplix/entity/.gitkeep
   create .simplix/templates/.gitkeep
SimpliX initialized successfully.
```

Then write `.simplix/generator-simplix.json`. It tells the CLI where the entities are and where generated code goes.

```json
{
  "entity": {
    "scanPath": "src/main/java",
    "basePackage": "com.example.library.domain"
  },
  "repository": {
    "scanPath": "src/main/java",
    "deriveFromEntity": true
  },
  "dto": {
    "excludeFields": [
      "version",
      "createdAt",
      "updatedAt",
      "createdBy",
      "updatedBy"
    ]
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
  "promote": {
    "moduleRoot": "modules"
  }
}
```

| Key | What you set |
|---|---|
| `entity.scanPath`, `entity.basePackage` | where the entity sources are and the package they start from |
| `repository.deriveFromEntity` | `true` when repositories sit in a `repository` package beside `entity` |
| `dto.excludeFields` | fields no DTO carries, such as audit columns |
| `target.generatedBasePath`, `target.basePackage` | the folder `generate` writes into and the package of the generated classes |
| `target.targetPath` | which components are generated and the sub-path of each; `{modulePath}` comes from the entity yml |
| `promote.moduleRoot` | the folder that holds the modules `promote` moves code into |

Every key is described in the [configuration reference](./configuration-reference.md).

## Step 3. Record the CLI version

```bash
simplix-boot version --write
```

```
✔ Recorded generator version <X.Y.Z> in <project>/.simplix/generator-simplix.json
```

The version goes into `generator.version` of the configuration file. From then on a teammate or a CI job with an older CLI is stopped before it writes anything, so everyone generates the same code.

## Step 4. Describe the entity in yml

```bash
simplix-boot config Author
```

```
Found parent class: BaseEntity at src/main/java/com/example/library/domain/core/entity/BaseEntity.java
  Analyzed BaseEntity: found 5 fields
  Parent BaseEntity extends SimpliXBaseEntity (import: dev.simplecore.simplix.core.entity.SimpliXBaseEntity)
Parent BaseEntity extends SimpliXBaseEntity, analyzing recursively...

✔ Generated config file: Author.yml
```

`config` reads the entity and its parent classes and writes `.simplix/entity/Author.yml` with one entry per field. This file is yours to edit: it decides which DTOs each field appears in, how it can be searched and how it is validated. Edit the top of the file first.

```yaml
entity: Author

modulePath: catalog
promoteModule: catalog
idField: authorId
nameField: penName
thymeleafBaseDir: catalog/author
permissionGroup: CATALOG
defaultSortField: createdAt
defaultSortDirection: desc

fields:

  authorId:
    sortable: true
    views: [list, detail, edit]
    required: true
    unique: true
    searchOperators: [equals]

  penName:
    sortable: true
    views: [list, detail, edit]
    required: true
    maxLength: 120
    searchOperators: [equals, contains]
```

| Key | Meaning |
|---|---|
| `modulePath` | the sub-path and package segment of the generated classes |
| `thymeleafBaseDir` | the request path of the controller: `catalog/author` serves `/catalog/author`, after any prefix your application gives its REST controllers |
| `permissionGroup` | the group named in the `@PreAuthorize` checks |
| `views` | the DTOs the field is part of: `list`, `detail`, `edit`, `batchUpdate` |
| `searchOperators` | the operators a search request may use on the field; an empty list makes it unsearchable |
| `sortable`, `required`, `unique`, `maxLength` | sorting and validation of the field |

> ℹ `config` also writes `promoteModule`, `defaultSortField` and `defaultSortDirection`. The CLI does not read them: `promote` takes the module from `--module`, and a default sort is set with `defaultSort`. A value shown as `<__MODIFY__>` is a blank for you to fill in.

## Step 5. Generate the code

```bash
simplix-boot generate Author
```

```
✔ Found entity file:
    src/main/java/com/example/library/domain/catalog/entity/Author.java

ℹ Files to generate:
   ✔ generated/main/java/com/example/library/web/catalog/service/AuthorService.java
   ✔ generated/main/java/com/example/library/web/catalog/controller/AuthorRestController.java
   ✔ generated/main/java/com/example/library/web/catalog/dto/AuthorDTOs.java
   ✔ generated/test/java/com/example/library/web/catalog/service/AuthorServiceTest.java

✔ Successfully generated CRUD files for Author!
```

The files are written under `generated/`, a staging tree you can read and regenerate freely. Add `generated/` to `.gitignore`. After a yml change, run `generate Author --force` to write them again.

## Step 6. Move the code into a module

The module folder has to exist before `promote` runs: it is a Gradle subproject, or a source folder of a single-project build.

```bash
mkdir -p modules/catalog
simplix-boot promote Author --module catalog
```

```
ℹ Promoting Author to module "catalog"...
ℹ Module path: catalog
ℹ Target module: modules/catalog

ℹ Service:
  From: generated/main/java/com/example/library/web/catalog/service/AuthorService.java
  To:   modules/catalog/src/main/java/com/example/library/web/catalog/service/AuthorService.java
  ✔ Written (absent or untouched)

...

ℹ Summary:
  written: 4

✔ Promotion complete!
```

`promote` moves each file to its source path under `modules/catalog` and marks it as generated in its first lines. It also stores a copy under `.simplix/bases/`, which is what lets a later `promote` merge a template change into a file you have edited. Commit `.simplix/` together with the module.

```java
// @simplix-generated
// @simplix-render 2595cf7d3830 promote Author --module catalog
```

## Check the result

```bash
simplix-boot generated
```

```
untouched  modules/catalog/src/main/java/com/example/library/web/catalog/service/AuthorService.java
untouched  modules/catalog/src/main/java/com/example/library/web/catalog/controller/AuthorRestController.java
untouched  modules/catalog/src/main/java/com/example/library/web/catalog/dto/AuthorDTOs.java
untouched  modules/catalog/src/test/java/com/example/library/web/catalog/service/AuthorServiceTest.java

untouched 4
```

Every file is `untouched`: it is exactly what the templates produce now. Build the project to compile the new classes.

```bash
./gradlew build
```

The generated code refers to a few message keys your application defines, such as `error.id.cannot.change` and the field labels `entities.Author.<field>`. The list is in the [template reference](./template-reference.md#message-keys).

## Next steps

- [Updating generated code](./updating-generated-code.md): change the yml or a template later and keep your edits.
- [Customizing templates](./customizing-templates.md): make the generated code follow your project's conventions.
- [Configuration reference](./configuration-reference.md): every key of the yml, including references to other entities, exports and counts.
