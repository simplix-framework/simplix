# SimpliX Documentation Guidelines

How the documentation of this repository is planned, written, illustrated and checked. Read this file before creating or changing a document; the per-kind page shapes are in `documentation-templates.md`.

## Who the documents are for

A document answers one question a reader arrives with. The reader is a developer who uses SimpliX in an application: they have a task (install, generate, configure, fix) and want the shortest reliable path to it. Every document is planned from that task, never from the list of classes a module contains.

- Open with what the reader can do after the page, in one or two sentences.
- Order the content by what the reader does first, not by how the code is organised.
- Show a real command or a complete code block, then the result the reader sees.
- Explain a concept at the point a decision needs it, and link to the concept page for the rest.
- State a limit, a requirement or a failure where the reader meets it, with what to do next.

## Document kinds

Each document is exactly one kind. A page that mixes kinds is split.

| Kind | The reader's question | File name |
|---|---|---|
| Introduction | What is this, is it for me, how do I start | `README.md`, `README.ko.md` |
| Getting started | How do I get a first working result | `getting-started.md` |
| Guide | How do I do this one task | named after the task, verb first in English: `customizing-templates.md` |
| Reference | What exactly does this option, command or property do | `*-reference.md` |
| Concepts | How does it work and why | `how-it-works.md` |
| Troubleshooting | It failed, what now | `troubleshooting.md` |

A module has an introduction and a getting-started page at least. It adds a guide per task a user performs, a reference per surface (configuration properties, commands, API), one concepts page, and a troubleshooting page once it has failures worth listing.

## Languages and locations

Every document exists in English and in Korean with the same structure.

| Document | English | Korean |
|---|---|---|
| Repository introduction | `README.md` | `README.ko.md` |
| Framework-wide documents | `docs/en/*.md` | `docs/ko/*.md` |
| Module introduction | `{module}/README.md` | `{module}/README.ko.md` |
| Module documents | `{module}/docs/en/*.md` | `{module}/docs/ko/*.md` |
| Sidebar of the documentation site | `docs/en/_sidebar.md` | `docs/ko/_sidebar.md` |

- The two files of a pair carry the same headings in the same order, the same code blocks and the same figures. Only prose, alt text and figure labels differ.
- An introduction opens with a language switch line: `**English** | [한국어](./README.ko.md)` and its mirror.
- File names are lowercase with hyphens and are the same in both languages. The only language suffix is `README.ko.md`.
- Korean documents follow `GLOSSARY.md` and the `simplecore:korean-docs` skill. Manuals are written in 합니다체.
- Code blocks are identical in both languages: English identifiers, English comments, English output.

## Release lines

`main` and `spring-boot-3x` carry the same documents. A document never states one line's requirement as the only one: requirements that differ are written as a table with a row per line (Spring Boot generation, SimpliX major line, install command). A document names a major line (`2.x`, `1.x`) and never a patch version.

## Figures

Every figure is an SVG drawn by a Python module with the document-figure library of the `simplecore:svg-diagrams` skill. Mermaid blocks and ASCII drawings of architecture are not used. A directory tree is the one drawing written as a text block.

| Path | Holds |
|---|---|
| `docs/figures/document-figures.json` | board width, type ladder, strokes, theme, fonts |
| `docs/figures/<area>.py` | one module per module or documentation area |
| `docs/assets/figures/<figure-id>.<lang>.svg` | generated figures, committed |

- An SVG is a build output. Edit the module and rebuild; never edit the SVG.
- A figure id is `<area>-<document-slug>-<what>`. One draw function takes the language and reads every label from a per-language table, so each figure is saved as `<id>.en.svg` and `<id>.ko.svg`.
- A figure is drawn from the claim its section makes: write the claim in one sentence, name what the reader must see that a list cannot say, then choose the form. A figure that restates a table is removed and the table stays.
- The caption is the Markdown alt text, written per language as a full sentence that states the claim. The prose reads completely without the figure.
- A document references its own language's file with a relative path from the source file: `![...](../assets/figures/x.ko.svg)` from `docs/ko`, `![...](../../../docs/assets/figures/x.ko.svg)` from `{module}/docs/ko`, `![...](../docs/assets/figures/x.en.svg)` from `{module}/README.md`.
- Commands are in `docs/figures/README.md`. `verify.py` ends with `verdict: pass` before a figure is used, and both language renders are read.

Place a figure where a reader has to see a relation: a flow with a branch, a merge of several inputs, a decision with more than two outcomes, containment, a lifecycle. An introduction carries one figure that shows what the module does end to end.

## Writing rules

- **Examples are real.** A command and its output come from running it (for the CLI, against `simplix-cli/test/fixtures/library`). A property, class or option name is copied from the source, and the document is re-read against the code when the code changes.
- **Versions.** No patch version is written. A dependency block omits the version or uses `${version}`.
- **Symbols.** Status marks are ✔ ✖ ⚠ ℹ only. No emoji. The em dash is never written.
- **Counts.** A heading, sentence or caption does not say how many items a list has.
- **History.** A document states how things are. What changed belongs in `docs/*/changelog.md`.
- **Admonitions** are blockquotes that open with a symbol: `> ℹ ...`, `> ⚠ ...`.
- **Links** between documents of one module are relative (`./configuration-reference.md`). A link to another module's document is `../../../{module}/docs/{lang}/{file}.md` from a module document. The build converts both for the site.
- **Headings.** One H1 per document. Titles are noun phrases or task names, without a full stop.

## Coverage and depth

A module's documents cover everything a user of the module touches. Plain sentences are not short documents: a page is complete before it is brief.

- **Every user-facing feature has a place.** A public class, an annotation and each of its attributes, an extension interface, an endpoint, a property, a bean an application can replace: each is explained in a guide or listed in a reference. A type that is internal on purpose is recorded in `scripts/docs/doc-coverage-ignore.txt` as `<module>:<Type>  # reason`.
- **A guide carries the whole task.** It states the situation the reader is in, shows a complete example that compiles (class declaration, the fields the example uses, the call), says what each option does and what its default is, shows the output or the stored result, and names what goes wrong and how it shows up.
- **A module has these pages**, unless one has nothing to say: an introduction, getting started, a guide per task, a configuration reference with every property, a how-it-works page (the components, what is registered when, the order things happen in) and troubleshooting.
- **Behaviour is stated, not implied.** Defaults, limits, ordering, what happens on failure, what is shared between instances and what is not.
- **Examples come from code that ran.** The snippet is compiled against the module, and output is copied from a run. A statement taken from the source without a run is still checked against the source, never against an earlier document.

`node scripts/docs/validate-doc-coverage.mjs [module]` lists the public types, the configuration properties, the names of beans an application replaces by name and the public methods of the types the documents name, where the English documents of a module never mention them. A method the module calls itself is recorded in `scripts/docs/doc-coverage-ignore.txt` as `<module>:<Type>.<method>` or `<module>:<Type>.*` with its reason. The check also covers the public methods of nested types and the accessors a record or Lombok generates, which a document may name as the field or as its getter or setter. A name matches anywhere in the module's documents, so the check says a name is present, not that its description is right. Read the list before calling a module done: each entry is documented or recorded as internal.

**A property is written as having no effect only after a grep.** `--unread` compares accessor names, so it misses a field read inside the properties class (a `resolveX(...)` helper) and a key read through a `${...}` placeholder or a condition. Before writing "no effect", grep the field name, its accessors and the kebab-case key across `src/main` of every module, the properties class included.

## Documentation site

`scripts/build-docs.sh` assembles `build-docs/` for Docsify: `docs/{lang}` and each `{module}/docs/{lang}` are copied to `{lang}/` and `{lang}/{module-short}/`, `README.md` and `README.ko.md` become `readme.md` of their language, and `docs/assets` is copied to `assets`. A module that has no `README.ko.md` yet keeps its Korean `README.md` under `ko`.

When a document is added, renamed or removed, update both sidebars and every link that names it (`changelog.md` included).

## Checks

Run all of these after a documentation change and before reporting it done.

| Check | Command |
|---|---|
| Structure, language parity, links, images, symbols | `node scripts/docs/validate-docs.mjs [module]` |
| Documents against the code | `node scripts/docs/validate-code-sync.mjs [module]` |
| Korean wording | `node <korean-docs skill>/scripts/l10n.mjs sweep <files>` |
| Figures | `python3 <svg-diagrams skill>/scripts/docfigures/verify.py --config docs/figures/document-figures.json` |
| Site | `./scripts/build-docs.sh`, then `node scripts/docs/validate-docs.mjs --site` |

`validate-docs.mjs` lists the modules whose documents have not been rewritten to this structure. That list is the record of what remains.
