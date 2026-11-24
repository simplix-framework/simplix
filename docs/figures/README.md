# Document figures

Every diagram in the documentation (`docs/en`, `docs/ko`, each module's `docs/en` and `docs/ko`, and the introductions) is an SVG drawn by a Python module in this folder with the document-figure library of the svg-diagrams skill (`<skill>/scripts/docfigures/`, from the `simplecore` plugin). The library is imported, never copied. An SVG is a build output: edit its module and rebuild, never the SVG.

## Layout

| Path | Holds |
| --- | --- |
| `docs/figures/document-figures.json` | the settings: board, type ladder, strokes, theme, fonts |
| `docs/figures/<area>.py` | one module per SimpliX module or documentation area |
| `docs/assets/figures/<figure-id>.<lang>.svg` | generated figures, committed |

The settings file is passed to every command with `--config`. Relative paths in it resolve against `docs/figures/`.

## Naming

A figure id is `<area>-<document-slug>-<what>`, lowercase with hyphens. The area is the short module name (`cli`, `core`, `auth`) or `start` for the framework-wide documents. `cli-readme-pipeline` is written as `cli-readme-pipeline.en.svg` and `cli-readme-pipeline.ko.svg`. A document references its own language's file with a path relative to itself.

## Adding a figure

1. In the area's module, add an entry to `LABELS` keyed by the figure id, with an `en` and a `ko` table that hold every label the figure prints. Korean labels follow `.claude/GLOSSARY.md`; code identifiers are the same in both languages.
2. Write one function that takes `lang`, reads only `LABELS[fid][lang]`, draws on `canvas(1200, h)` and ends with `save(c, f"{fid}.{lang}")`.
3. Call it for each entry of `LANGS` at the bottom of the module.
4. Build, verify, render and read both PNGs.

## Commands

Run from the repository root, with `SVG_DIAGRAMS` set to the svg-diagrams skill directory (`.../plugins/simplecore/skills/svg-diagrams`).

```bash
# build every module (or name one: ... build.py --config ... cli)
python3 "$SVG_DIAGRAMS/scripts/docfigures/build.py" --config docs/figures/document-figures.json

# every check, plus PNGs to read
python3 "$SVG_DIAGRAMS/scripts/docfigures/verify.py" --config docs/figures/document-figures.json --render <scratch dir>
```

`verify.py` ends with `verdict: pass` before a figure is placed in a document.
