# Anti-Patterns

The following patterns SHOULD be avoided across all `DESIGN.md` systems.

## Structural Anti-Patterns

Avoid:

* excessive heading nesting
* deeply fragmented subsection trees
* orphaned subsections
* duplicated sections across categories
* inconsistent section ordering
* giant uninterrupted YAML blocks

---

## Prose Anti-Patterns

Avoid:

* prose walls
* marketing-style language
* rhetorical filler
* implementation-heavy paragraphs
* excessive abstraction without grounding
* repeating identical information across prose and YAML
* process/source metadata in canonical sections — cross-doc citations ("see PRODUCT.md §7.4"), open-question markers, and self-containment notes ("Restated from X for self-containment") are transient authoring artifacts, not design-system content. Open decisions belong in `Iteration Notes → Open Decisions`; gaps belong in `Iteration Notes → Known Gaps`.
* decision-history / iteration narration in canonical sections — "we renamed X→Y", "chose A over B", "previously…", migration residue, and self-justifying placement ("isn't a component, so no file"). Canonical content states the current decision, not the path to it; decision history stays out of the doc — version control holds it.
* **provenance of any shape, in any canonical section, `Known Gaps` included.** The narration ban above reads as covering only sentences that tell a story, so provenance survives it in compact forms. The shapes, each a decision's *origin* rather than its content: **a date** in any format; **an attribution** ("an owner decision", "per the review", "as agreed"); **a before/after pair** ("was X, now Y"); **a supersession clause** naming what a rule replaced. The one exception is a `Known Gaps` measurement, where the date IS part of the observation — the only place a date belongs.
* **a pointer into a path that is not in the repository** — a working-notes file, a plan, a scratch harness, an ignored directory. It is dead for anyone who clones and reads as a real source until someone follows it, so nothing surfaces it. State the fact inline instead.
* unlocated evidence claims — a sentence asserting that a measurement, a rationale, an option set, or a prior decision *exists* without naming where it lives (a file path, a named heading, a commit) and without stating the fact inline. DESIGN.md is the design contract, so an unverifiable claim in it propagates into code. Prefer stating the fact inline; a pointer is only as durable as its target's next prune.

---

## Component Anti-Patterns

Avoid:

* component sections beginning with YAML/specs
* components without identity statements
* components without usage context
* raw implementation dumps without semantic framing
* bullets fragmented into excessively granular implementation details

Avoid:

```md
- Height 44px.
- Radius 4px.
- Padding 24px.
```

Prefer (under the caveat in `token-and-yaml-rules.md` → Token Conventions):

```md
- Height `{height-interactive-md}` (44px), radius `{radius.sm}` (4px), with `{spacing.lg}` (24px) horizontal padding.
```

---

## Terminology Anti-Patterns

Avoid:

* synonym drift for core concepts
* inconsistent naming between sections
* introducing multiple phrases for the same system behavior

Preferred:

* stable repeated terminology
* local reinforcement of core terminology
* consistent semantic vocabulary

---

## Formatting Anti-Patterns

Avoid:

* breaking a Compression Target — bullet length, paragraph length or component bullets (`design-writing-contract.md` → Compression Targets)
* mixing editorial and technical prose styles within the same local section

---

## Token Anti-Patterns

Avoid:

* raw values without semantic linkage when reusable tokens exist
* token-only prose without resolved values where readability benefits
* implementation-token overload in editorial sections

Avoid:

```md
padding-inline-md
```

Prefer:

```md
padding `{spacing.md}` (16px)
```

---

## YAML Anti-Patterns

Avoid:

* YAML duplicating prose directly
* deeply nested YAML hierarchies
* YAML used before semantic explanation
* implementation specs without contextual understanding

Inline body YAML SHOULD support prose, not replace it. This applies to YAML blocks in the markdown body — the top-level YAML Registry is the canonical token store and operates independently of prose.

This file is valuable because it teaches:

* what failure looks like
* what drift looks like
* what to reject during review

which dramatically improves agent consistency.
