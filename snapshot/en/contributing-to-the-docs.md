# Contributing to the documentation

How the documents of this repository are organised, how to preview the site, and what to check before you send a change.

## Where a document lives

| Document | English | Korean |
|---|---|---|
| Repository introduction | `README.md` | `README.ko.md` |
| Framework-wide documents | `docs/en/*.md` | `docs/ko/*.md` |
| Module introduction | `<module>/README.md` | `<module>/README.ko.md` |
| Module documents | `<module>/docs/en/*.md` | `<module>/docs/ko/*.md` |
| Figures | `docs/assets/figures/<id>.en.svg` | `docs/assets/figures/<id>.ko.svg` |

Every document exists in English and Korean with the same headings, the same code blocks and the same figures. A change to one language file is made in the other in the same change.

## What kind of document to write

| Kind | Answers | File |
|---|---|---|
| Introduction | what it is and how to start | `README.md` |
| Getting started | how to get a first working result | `getting-started.md` |
| Guide | how to do one task | named after the task |
| Reference | what an option, command or property does | `*-reference.md` |
| Concepts | how it works | `how-it-works.md` |
| Troubleshooting | what to do when it fails | `troubleshooting.md` |

Write for a developer who uses SimpliX: start from the task, show a command or code that really runs, then the result. Requirements that differ between the release lines go in a table with a row per line.

## Figures

A figure is an SVG drawn by a Python module under `docs/figures`, saved once per language. Edit the module and rebuild; an SVG edited by hand is overwritten by the next build. The commands are in `docs/figures/README.md`.

## Preview the site

```bash
# Assemble the site under build-docs/
./scripts/build-docs.sh

# Serve it
cd build-docs && python3 -m http.server 3000
```

Open `http://localhost:3000`. The site is built by Docsify; `docs/ko/_sidebar.md` and `docs/en/_sidebar.md` list its pages, so add a new document to both.

## Check before you send

```bash
# Language parity, links, images, symbols
node .claude/scripts/validate-docs.mjs

# Links and images of the built site
./scripts/build-docs.sh && node .claude/scripts/validate-docs.mjs --site
```

- No emoji; status marks are ✔ ✖ ⚠ ℹ.
- No patch version in a document: write `${version}` or leave it out.
- When you rename or remove a document, update the sidebars and every link that names it.

## How the site is published

The workflow **Deploy Documentation** builds the site and publishes it at <https://simplix-framework.github.io/simplix/> whenever a push to `main` changes a document, a figure, the site files under `docs` or the build scripts. Nothing has to be done by hand after a merge.

To publish the documents of a release again, run the workflow from the Actions tab and give it the version: it then builds from the tag of that release instead of `main`.

## The look and navigation of the site

The site shares its shell, its style and its behaviour with the documentation of Searchable JPA, SimpliX React and the UI Kits, so the sites look alike and lead to one another. This repository holds the original of the shared files.

| File | Holds |
|---|---|
| `docs/index.html` | the shell every page loads |
| `docs/assets/site/` | the style, the behaviour of the header and the sidebar, the list of libraries and the logo |
| `docs/assets/version-selector.js` | the path arithmetic of the version folders |
| `scripts/prepare-docs.mjs` | the script that combines the versions for GitHub Pages |
| `docs/assets/site-config.js` | what this site is; each repository has its own |

After you change a shared file, copy it to the other repositories and check the copies:

```bash
node scripts/sync-docs-site.mjs ../searchable-jpa ../simplix-react ../simplix-react-ui-kits
node scripts/sync-docs-site.mjs --check ../searchable-jpa ../simplix-react ../simplix-react-ui-kits
```

The site keeps the newest release of each release line beside the development version. The version switch of the header moves between them and stays on the page being read when the other version has it.
