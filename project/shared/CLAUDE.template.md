@work/session.md
@work/tasks.md
@work/lessons.md

# `<Project Name>`

<!-- One line: what this project is and who it's for. -->

## Read first

| Doc                       | Owns                                           |
| ------------------------- | ---------------------------------------------- |
| `.claude/docs/<DOC>.md` | `<what this doc is the source of truth for>` |

Current state → `.claude/work/session.md`.

## Stack

- <language, framework, key libraries, tooling>

## Commands

| Task             | Command  |
| ---------------- | -------- |
| Build            | `<…>` |
| Test             | `<…>` |
| Lint / typecheck | `<…>` |
| Dev / run        | `<…>` |

## Rules

Read the relevant rule before working in that area:

| Rule file                        | Covers     |
| -------------------------------- | ---------- |
| `.claude/rules/<x>.md`         | `<area>` |
| `.claude/rules/<stack>/<x>.md` | `<stack-specific rule area>` |

## Project constraints

<!-- Rules that apply only to this repo: framework quirks, data invariants, phase gates, domain limits.
     Put anything reusable across projects in a rule file instead. -->

- <…>

<!-- Keep this file under ~200 lines. If Project constraints plus optional sections grow past that, move
     them into their own file (a local rule for rule-like content, a docs/ file for reference). Project-
     specific content can get its own file too — a separate file is not only for reusable content.

     Add an optional section only when no rule already covers it:
       Architecture — brief layout, or link a docs/ file
       Conventions  — repo-specific naming/patterns; reusable ones go in a rule file
       Gotchas      — footguns, generated or do-not-touch files
       Environment  — machine/OS notes not already covered by a rule -->
