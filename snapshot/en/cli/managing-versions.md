# Managing versions

The CLI is released together with SimpliX and carries the framework's version. This page shows how to install the CLI that belongs to your project, how to make a team and its CI use the same version, how to update, and how to run the CLI straight from a framework checkout.

## Install the line of your project

SimpliX has one release line per Spring Boot generation, and each line publishes its CLI under its own npm tag. The templates of a line call framework classes of that line, so install the one your project builds on.

| Your project | SimpliX line | npm tag | Install |
|---|---|---|---|
| Spring Boot 4 | 2.x | `latest` | `npm install -g @simplix-boot/cli` |
| Spring Boot 3 | 1.x | `spring-boot-3x` | `npm install -g @simplix-boot/cli@spring-boot-3x` |

The same package spec works with `npx`, which runs the CLI without installing it.

```bash
npx @simplix-boot/cli generate Author
npx @simplix-boot/cli@spring-boot-3x generate Author
```

## Pin the version for the team

```bash
simplix-boot version --write
```

This records the running CLI's version as `generator.version` in `.simplix/simplix-boot.json` and changes nothing else in the file. Commit it. `config`, `generate` and `promote` then compare the running CLI with the recorded version before they write anything.

| Running CLI | What happens |
|---|---|
| older than the recorded version | the command stops before writing anything and prints how to update |
| same version | the command runs |
| newer than the recorded version | the command runs and reminds you to record the new version |
| no version recorded | the command runs and prints a one-line notice |

```
✖ Generator <running> is older than the version this project requires (<required>).
  latest on npm: <latest>
  update: npm install -g @simplix-boot/cli@<required>
  or:     simplix-boot version --update
  skip:   rerun with --skip-version-check
```

Versions are compared by their `X.Y.Z` part. An older CLI is refused because templates and yml keys change together: it would write code the project no longer expects, without an error. `--skip-version-check` lets one run through.

## Check and update

```bash
simplix-boot version
```

```
SimpliX Boot CLI version status

  package:  @simplix-boot/cli
  running:  <X.Y.Z>
  required: <X.Y.Z>
  latest:   <X.Y.Z>
  config:   <project>/.simplix/simplix-boot.json

✔ The running CLI matches this project.
```

`latest` is the newest version published on the running CLI's own line, so a 1.x CLI is never told to move to 2.x.

```bash
# Install the newest version of the same line
simplix-boot version --update

# Install one exact version
simplix-boot version --update --to <X.Y.Z>

# Then record it for the team
simplix-boot version --write
```

After an update, bring promoted files up to date as [Updating generated code](en/cli/updating-generated-code.md) describes, and compare your project templates with the built-in ones.

## Run the CLI from a framework checkout

When you have the SimpliX repository checked out, you can make its `simplix-cli` folder the global `simplix-boot` command. npm creates a symbolic link to the folder, so the command runs the checkout's source as it is on disk.

```bash
cd <simplix checkout>/simplix-cli

# Install the runtime dependencies of the CLI
npm ci

# Register simplix-boot as a global command that points at this folder
npm link

# The link target is shown after "->"
npm ls -g --depth=0
```

| Situation | What to do |
|---|---|
| You pulled new commits | nothing: the link runs the new source |
| The dependencies in `simplix-cli/package.json` changed | run `npm ci` in the folder again |
| You switched the Node.js version | run `npm link` again: a version manager keeps one global folder per Node.js version |
| You checked out the other release line | the command now runs that line's CLI |
| You moved or deleted the checkout | run `npm link` in the new location |
| You want the link gone | `npm unlink -g @simplix-boot/cli` |

> ⚠ A linked CLI runs a development build. Pin a project with `version --write` from a linked CLI only when the whole team and CI can run that version too.

## Related documents

- [Command reference](en/cli/command-reference.md#version)
- [Updating generated code](en/cli/updating-generated-code.md)
