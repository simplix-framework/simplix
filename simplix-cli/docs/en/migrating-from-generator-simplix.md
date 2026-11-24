# Migrating from generator-simplix

A project that was generated with `generator-simplix` (the Yeoman generator run as `yo simplix:...`) moves to `simplix-boot` without changing its files. This page lists what carries over, the command that replaces each old one, and the differences you will notice.

## What carries over

- `.simplix/generator-simplix.json`
- `.simplix/entity/*.yml`
- the EJS templates under `.simplix/templates/`
- the stored renders under `.simplix/bases/` and the fingerprint lines of promoted files

Your project templates are still used first, so the same input produces the same files.

## Commands

| generator-simplix | simplix-boot |
|---|---|
| `yo simplix` | `simplix-boot help` |
| `yo simplix:init` | `simplix-boot init` |
| `yo simplix:config <Name>` | `simplix-boot config <Name>` |
| `yo simplix:generate <Name>`, `yo simplix:entity <Name>` | `simplix-boot generate <Name>` |
| `yo simplix:promote <Name> --module <module>` | `simplix-boot promote <Name> --module <module>` |
| `yo simplix:generated` | `simplix-boot generated` |
| `yo simplix:version` | `simplix-boot version` |

Option names are unchanged.

## Steps

1. Install the CLI of your project's release line ([Managing versions](./managing-versions.md)).
2. Run `simplix-boot generated`. The same states as before mean the CLI read your templates and configuration as the old generator did.
3. Run `simplix-boot version --write` and commit the configuration file. The CLI's version is the SimpliX version, so the recorded number changes.
4. Uninstall the old generator: `npm uninstall -g generator-simplix yo`.

```bash
simplix-boot generated
simplix-boot version --write
```

## Move to the built-in templates

This step is optional. A template you never changed can be deleted from `.simplix/templates`; the built-in one takes its place. Check with `simplix-boot templates` which files are the project's, delete one, and run `simplix-boot generated` to see what the change does to the promoted files before you keep it.

A project template that imported a class of your application directly needs that class named under `supportClasses` once the built-in template takes over: see [Customizing templates](./customizing-templates.md).

## What behaves differently

| Topic | simplix-boot |
|---|---|
| Where a command runs | in any folder inside the project, not only its root |
| An option the command does not know | refused with exit code 1 instead of ignored |
| A template that fails to render | the command ends with exit code 1, and `generated` stops at that entity |
| Output | progress and reports go to standard output, the reason a command stopped to standard error |
| No controller test template in the project | no controller test is generated and no skip message is printed |
| Recorded version lower than the CLI | every generating command says so until `version --write` records the new one |
| Default controller template paths | `controller/rest/EntityRestController.java.template` and `controller/web/EntityWebController.java.template` |
| Build file | `build.gradle`, `build.gradle.kts` or `pom.xml` is accepted |

> ℹ A template that failed for one entity went unnoticed under the old generator, which still ended with exit code 0. If `simplix-boot generate` or `generated` reports a render failure right after the move, the template was already failing: [Troubleshooting](./troubleshooting.md) shows how to read the message.

## Related documents

- [Managing versions](./managing-versions.md)
- [Command reference](./command-reference.md)
