# Command reference

Every command of `simplix-boot` with its arguments, options, output and exit code. For the order the commands are used in, see [Getting started](en/cli/getting-started.md).

```
simplix-boot init
simplix-boot config <EntityName> [--force] [--skip-version-check]
simplix-boot generate <EntityName> [--force] [--no-test] [--skip-version-check]
simplix-boot promote <EntityName> --module <module> [--adopt] [--force] [--skip-version-check]
simplix-boot generated [--no-render] [--json]
simplix-boot templates [--eject [<template>]] [--force]
simplix-boot version [--json] [--write] [--update [--to <X.Y.Z>]]
simplix-boot help
simplix-boot --version
```

## Rules every command follows

- A command other than `init`, `version` and `help` runs inside a project. The project root is the nearest folder at or above the current one that holds `.simplix`, so a command works from any folder of the project.
- A boolean option is switched on with `--name` and off with `--no-name`. A string option is written `--name value` or `--name=value`.
- An option the command does not declare, or an argument too many, stops the command before it does anything.
- Progress and reports go to standard output. The reason a command stopped goes to standard error.
- When the reader of the output ends first, as in `simplix-boot generate Book | head`, the command still finishes its work and keeps its exit code.
- Colour is left out when `NO_COLOR` is set or the output is not a terminal.
- `simplix-boot <command> --help` prints the usage and options of one command.

| Exit code | Meaning |
|---|---|
| 0 | the command ran to its end |
| 1 | the command could not run, or left files that need attention |

## init

```bash
simplix-boot init
```

Creates `.simplix/entity` and `.simplix/templates` in the current folder. When `.simplix` already exists it changes nothing. It does not write `.simplix/generator-simplix.json`: write that file yourself ([Configuration reference](en/cli/configuration-reference.md)).

## config

```bash
simplix-boot config <EntityName> [--force] [--skip-version-check]
```

Finds `<EntityName>.java` under `entity.scanPath`, analyses it with its parent classes and the entities it refers to, and writes `.simplix/entity/<EntityName>.yml`.

| Option | Effect |
|---|---|
| `--force` | overwrites an existing yml, edits included; without it an existing file is kept |
| `--skip-version-check` | skips the version check for this run |

## generate

```bash
simplix-boot generate <EntityName> [--force] [--no-test] [--skip-version-check]
```

Renders the templates with `.simplix/entity/<EntityName>.yml` and writes the files under `target.generatedBasePath`. `<EntityName>` is the name of the yml file and the prefix of the generated class names; a yml whose `entity` key names another class generates a second set of classes for that entity. `entity` is another name of this command.

| Option | Effect |
|---|---|
| `--force` | overwrites files that exist in the generated tree; without it they are skipped |
| `--no-test` | generates no test file |
| `--skip-version-check` | skips the version check for this run |

A component is generated when `target.targetPath` gives it a path.

| Component | File | Generated when |
|---|---|---|
| `service` | `<Name>Service.java` | the path is set |
| `controllerRest` | `<Name>RestController.java`, or `controllerName` of the yml | the path is set |
| `controllerWeb` | `<Name>Controller.java` | the path is set |
| `dto` | `<Name>DTOs.java` | the path is set |
| `repository` | `<Name>Repository.java` | the path is set |
| service test | `<Name>ServiceTest.java` | `service` is generated and `--no-test` is not given |
| controller test | `<Name>RestControllerTest.java` | the project provides `test/EntityRestControllerTest.java.template` |
| tree service | `<Name>TreeService.java` and its test | the entity implements `TreeEntity` |

When a template fails to render, the command names the file and the reason, writes the other files and ends with exit code 1.

## promote

```bash
simplix-boot promote <EntityName> --module <module> [--adopt] [--force] [--skip-version-check]
```

Moves the generated files of one entity to their source paths under `<promote.moduleRoot>/<module>`. Each file is stamped with a fingerprint and stored under `.simplix/bases/`; a later `promote` uses the stored copy to merge a template change into your edits. [Updating generated code](en/cli/updating-generated-code.md) explains each result.

| Option | Effect |
|---|---|
| `--module <module>` | the target module as a path under the module root, such as `admin/billing`; required |
| `--adopt` | for a file that has no stored base: keeps its content and stores this render as its base |
| `--force` | overwrites every file with the fresh render, edits included |
| `--skip-version-check` | skips the version check for this run |

Results per file: `written`, `merged`, `current`, `removed`, `adopted`, `conflict`, `no-base`. The command ends with exit code 1 when any file is `conflict` or `no-base`; the generated file of such a result stays in the generated tree so that `promote` can run again.

## generated

```bash
simplix-boot generated [--no-render] [--json]
```

Reports the state of every promoted file. It renders each promoted entity again into the generated tree, then compares the stored base, the file and the fresh render.

| Option | Effect |
|---|---|
| `--no-render` | judges against the stored bases without rendering; `stale` and `conflict` cannot be found |
| `--json` | prints the report as one JSON line |

| State | Exit code |
|---|---|
| `untouched`, `edited`, `removed` | 0 |
| `stale`, `conflict`, `no-base` | 1 |

```json
{"files":[{"path":"modules/catalog/src/main/java/com/example/library/web/catalog/service/AuthorService.java","entity":"Author","state":"edited"}],"counts":{"edited":1}}
```

When an entity fails to render, no state is judged and the command ends with exit code 1.

## templates

```bash
simplix-boot templates [--eject [<template>]] [--force]
```

Without an option, lists every template with its origin: `project` for a file under `.simplix/templates`, `built-in` for one the CLI ships.

| Option | Effect |
|---|---|
| `--eject` | copies every built-in template into `.simplix/templates`; with a relative path, that template only |
| `--force` | with `--eject`, overwrites a project file that exists |

## version

```bash
simplix-boot version [--json] [--write] [--update [--to <X.Y.Z>]]
```

Reports the running version, the version the project records and the newest version published on the same release line. It also runs outside a project.

| Option | Effect |
|---|---|
| `--json` | prints the report as one JSON line |
| `--write` | records the running version as `generator.version`, leaving the rest of the file byte for byte |
| `--update` | installs the newest version of the same release line globally |
| `--to <X.Y.Z>` | with `--update`, the version to install |

| `status` in `--json` | Meaning |
|---|---|
| `match` | the running version equals the recorded one |
| `ahead` | the running version is newer; commands run and say so |
| `outdated` | the running version is older; `config`, `generate` and `promote` refuse to run |
| `unrecorded` | the project records no version |
| `unknown` | the recorded value cannot be read as a version |

## Related documents

- [Configuration reference](en/cli/configuration-reference.md)
- [Template reference](en/cli/template-reference.md)
- [Troubleshooting](en/cli/troubleshooting.md)
