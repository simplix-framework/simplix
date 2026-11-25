# SimpliX Documentation Templates

The page shape of each document kind named in `documentation-guidelines.md`. Headings are given in English with the Korean heading after the slash. A section that has nothing to say for a module is left out rather than filled.

## Introduction (`README.md`, `README.ko.md`)

```markdown
**English** | [한국어](./README.ko.md)

# SimpliX {Module}

{One or two sentences: what the reader can do with it.}

![{The claim of the figure as a sentence}](../docs/assets/figures/{area}-readme-{what}.en.svg)

## When to use it / 언제 사용하나

{The situations it fits, and one line on when another module is the better choice.}

## Requirements / 요구 사항

{A table with a row per release line when the lines differ.}

## Install / 설치

{The dependency or the install command, without a patch version.}

## Quick start / 빠른 시작

{The shortest path to a visible result: three to five numbered steps, each a command or a block and what it produces.}

## Documentation / 문서

{A table: the reader's question in the first column, the document that answers it in the second.}

## License / 라이선스
```

## Getting started (`getting-started.md`)

```markdown
# {Getting started with X} / {X 시작하기}

{What the reader will have built at the end, and how long the page is in steps.}

## Before you begin / 준비

{What must already exist: versions, a project, credentials.}

## Step 1. {Verb phrase} / 1단계. {동작}

{The command or code, then the output or the file the reader should now see.}

## Step N. ...

## Check the result / 결과 확인

{How the reader verifies it worked.}

## Next steps / 다음 단계

{Links to the guides the reader is most likely to need next.}
```

## Guide (`{task}.md`)

```markdown
# {Task as a verb phrase} / {작업 이름}

{The situation in which the reader needs this, and the result.}

## {The task, split into the reader's steps}

{Command or code first, explanation after. A figure where the flow branches or several inputs meet.}

## {Variations the reader may need}

## Related documents / 관련 문서
```

## Reference (`*-reference.md`)

```markdown
# {Surface} reference / {대상} 레퍼런스

{What the page lists and where each item is used.}

## {Group}

| Name | Type | Default | Description |
|---|---|---|---|

{One group per heading, in the order a reader looks things up. Each entry says what it does, its default, and its effect when changed. An example block per group.}
```

## Concepts (`how-it-works.md`)

```markdown
# How {X} works / {X}의 동작 원리

{The question this page answers.}

## {The flow end to end}

{One figure for the whole flow, then a paragraph per stage.}

## {Each mechanism a user has to understand to make a decision}

## Related documents / 관련 문서
```

## Troubleshooting (`troubleshooting.md`)

```markdown
# Troubleshooting / 문제 해결

## {The message or symptom, quoted as the reader sees it}

**Cause / 원인**: {one or two sentences}

**Fix / 해결**: {the command or change}
```
