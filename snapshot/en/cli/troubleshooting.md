# Troubleshooting

Messages the CLI prints when it stops, what causes each one and how to continue. The version in a message is written as a placeholder such as `<X.Y.Z>`.

## The .simplix directory is missing

```
✖ The .simplix directory is missing. Run "simplix-boot init" in the project root first.
```

**Cause**: the command was run outside a project. No folder from the current one upward holds `.simplix`.

**Fix**: change into the project, or run `simplix-boot init` in the root of a new one.

## Unknown option

```
✖ Unknown option: --dry-run
```

**Cause**: the command does not declare that option. Nothing was done.

**Fix**: `simplix-boot <command> --help` lists the options of the command.

## Entity file not found

```
✖ Entity file not found
Looking for: Nope.java
Searched in: <project>/src/main/java
```

**Cause**: `config` or `generate` found no source file of that name under `entity.scanPath`.

**Fix**: check the spelling of the entity name, then `entity.scanPath` in `.simplix/generator-simplix.json`. In a multi-module project it is the folder that contains every module's entities.

## Entity yml not found

```
✖ .simplix/entity/Nope.yml not found. Run "simplix-boot config Nope" to create it.
```

**Cause**: `generate` or `promote` was run for an entity that has no yml yet.

**Fix**: run `simplix-boot config <EntityName>` and edit the yml it writes.

## Generator is older than the version this project requires

```
✖ Generator <running> is older than the version this project requires (<required>).
  latest on npm: <latest>
  update: npm install -g @simplix-boot/cli@<required>
  or:     simplix-boot version --update
  skip:   rerun with --skip-version-check
```

**Cause**: the project records a newer CLI version in `generator.version` than the one running.

**Fix**: run `simplix-boot version --update`, or install the version the message names. `--skip-version-check` lets one run through, at the risk of generating code that differs from the team's.

## A template fails to render

```
   ✖ generated/main/java/com/example/library/web/catalog/dto/BookDTOs.java
     Failed to render dto/EntityDTOs.java.template: <template path>:<line> ...
✖ 1 of 4 files failed to render for Book: BookDTOs.java
```

**Cause**: the template threw while rendering this entity, usually because it reads a yml value or a field property the entity does not have. The message names the template that was used (the project's copy when one exists) and the line.

**Fix**: correct the template or the yml value at that line, then run `simplix-boot generate <EntityName> --force`. The other files were written, and `generated` stops at this entity until the render succeeds.

## A yml key needs a support class

```
Book.yml uses statusCounts or aggregates, which needs supportClasses.searchFigures in .simplix/generator-simplix.json
```

**Cause**: the yml asks for a feature whose generated code calls a class of your application, and that class is not named.

**Fix**: name the class under `supportClasses` ([Template reference](en/cli/template-reference.md#support-classes)).

## A template is skipped

```
   ⚠ SKIP: generated/.../BookDTOs.java (template not found: .simplix/templates/dto/AdminDTOs.java.template)
```

**Cause**: the path set under `template` exists neither in the project nor among the built-in templates.

**Fix**: correct the path, or put the template at that path under `.simplix/templates`.

## A change to a built-in template has no effect

**Cause**: the project has its own file at the same relative path, and that file is the one used.

**Fix**: `simplix-boot templates` marks such files as `project`. Edit the project file, or delete it to go back to the built-in template.

## promote reports a conflict or no-base

**Cause**: the template changed lines you edited (`conflict`), or the file has no stored base (`no-base`). The file was left as it is in both cases.

**Fix**: follow [Updating generated code](en/cli/updating-generated-code.md#resolve-a-conflict).

## The generated DTO does not compile on keyword

**Cause**: a field of the yml sets `searchKeyword: true`, which generates `@SearchableField(keyword = true)`. The project resolves a searchable-jpa release without the `keyword` attribute: it pins an older searchable-jpa version, or it uses a SimpliX release older than the CLI.

**Fix**: `./gradlew dependencies --configuration compileClasspath` shows the resolved searchable-jpa version. Remove the pinned version or move SimpliX to the release of the CLI, or remove `searchKeyword` from the yml and generate again.

## The command is not found

**Cause**: the CLI is not installed for the Node.js version in use, or a linked checkout was moved, deleted or switched to a branch without `simplix-cli`.

**Fix**: `npm ls -g --depth=0` shows what is installed and where a link points. Install the CLI or run `npm link` again ([Managing versions](en/cli/managing-versions.md)).
