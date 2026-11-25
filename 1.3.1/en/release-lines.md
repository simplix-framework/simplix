# Release lines

SimpliX is developed on a release line per Spring Boot generation. This page tells you which line to use, what the lines share, and where each artifact is published.

## Which line to use

| Your project runs on | Use SimpliX | Branch | searchable-jpa |
|---|---|---|---|
| Spring Boot 4 | 2.x | `main` | 2.x |
| Spring Boot 3 | 1.x | `spring-boot-3x` | 1.x |

The line is decided by the Spring Boot generation of your application and nothing else. Every line needs Java 17 or later.

## What the lines share

A feature or a fix made on one line is carried to the other, so the lines offer the same modules, the same API and the same documents. They differ in the Spring Boot generation they build on and in the dependencies that follow from it. A change that exists on one line only is one that cannot apply to the other, such as an adjustment to a Spring Boot 4 API.

## Where the artifacts are

| Artifact | Published to | How a line is selected |
|---|---|---|
| Java modules (`dev.simplecore.simplix:*`) | GitHub Packages of `simplix-framework/simplix` | by version: 2.x or 1.x |
| Command line tool (`@simplix-boot/cli`) | npm | by dist-tag: `latest` for 2.x, `spring-boot-3x` for 1.x |

```bash
# Spring Boot 4 projects
npm install -g @simplix-boot/cli

# Spring Boot 3 projects
npm install -g @simplix-boot/cli@spring-boot-3x
```

The modules and the command line tool of one release carry the same version number. Released versions are listed on the [releases page](https://github.com/simplix-framework/simplix/releases).

## Moving from 1.x to 2.x

Moving an application to the 2.x line is a Spring Boot 3 to 4 migration first. Upgrade Spring Boot as its migration guide describes, change the SimpliX and searchable-jpa versions to the 2.x line in the same step, and install the CLI of the 2.x line.

## Related documents

- [Getting started](en/getting-started.md)
- [Changelog](en/changelog.md)
- [SimpliX CLI](en/cli/readme.md)
