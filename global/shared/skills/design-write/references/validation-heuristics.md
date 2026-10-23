# Validation Heuristics

Run before reporting any DESIGN.md work done — **Authoring, Update, or Realign**. Failed checks surface as a short remediation list. Most checks are mode-agnostic (valid structure, two-layer model, doc-first, tokens, terminology, template). A few are transform-only and tagged below: **Lossless** and **Manifest Completeness** apply to Update + Realign. Realign's judgment heuristics are in `rewrite-passes.md` → Realign Judgment Heuristics.

---

## Structural

- Canonical top-level ordering preserved: `YAML Registry → Overview → Foundations → [Semantic Systems] → [Background] → Components → Domain Components → Interaction Rules → Accessibility Rules → Cross-Cutting Rules → Technical Conventions → Iteration Notes`. Bracketed entries are optional.
- All spine sections required by the contract — and by any project-specific schema — are present. (Project-specific required Domain Components, e.g. a portfolio's `Project Detail` / `About Layouts`, come from the project's own schema, not this generic check.)
- No heading deeper than H4.
- No duplicate section titles within the same parent.

## Two-Layer Model

- Top-of-document YAML Registry present and contains globally reusable canonical tokens (color tokens, typography tokens, spacing/radius/motion/breakpoint/z-index scales, focus-ring spec) — color and typography values may be defined in Foundations instead (next bullet).
- Markdown body does not duplicate token *values* from the registry. Token *names* may be referenced freely, and a name carrying its resolved value is a reference, not a duplication (`design-writing-contract.md` → Token Conventions).
- A color or typography value defined in a Foundations table is a sanctioned home, not a two-layer violation (`design-writing-contract.md` → Two-Layer Document Model). Flag only a value defined in both layers; its owner is set there too.
- Local structural-spec YAML inline (component spec blocks, per-elevation specs, grid specs, semantic-systems mappings) is permitted — this is not a two-layer violation.
- No single monolithic YAML superblock — the registry collects globally reusable tokens, not every YAML block in the document.

## Semantic Systems (advisory)

- When `# Semantic Systems` exists, its subsections SHOULD NOT be silently duplicated in Foundations or Components. If a semantic role table has a canonical home in Semantic Systems, other locations must reference or specialize it — not restate it verbatim. Flag duplicates; do not auto-remove.
- Absence of `# Semantic Systems` is not a violation — semantic role tables may legitimately remain colocated in Foundations.

## Interaction Rules

- Global hover/focus/disabled/loading/responsive *defaults* are consolidated under `# Interaction Rules`. Flag duplication of defaults across multiple locations.
- Component-local interaction content the contract permits (`design-writing-contract.md` → Interaction Rules Policy) may live with the component. Do not flag it as a duplication violation.

## Domain Components

- `## Domain Components` appears between `## Components` and `## Interaction Rules` — not at the end of the document.
- Each domain component SHOULD primarily compose, specialize, or extend one or more canonical spine systems, and MAY assume a specific page context or content schema.
- Domain Components MUST NOT contain globally reusable UI systems — those belong in `## Components`.
- If the project defines a doc↔code tagging convention for Domain Components (e.g. an `[inline]`/`[standalone]` tag bound to a component-structure rule), verify every leaf is tagged and the tag matches reality; parent group headers carry no tag. Projects without such a convention skip this check.

## Technical Conventions Scope

- The `# Technical Conventions` section contains only implementation policy (rendering, MDX, build/runtime, performance UX, animation-rendering constraints).
- Token registries, component specs, and behavioral rules appearing inside Technical Conventions are misplaced — flag for relocation.
- The `Z-Index Scale` subsection is the one sanctioned exception — it names tokens without their values (`design-writing-contract.md` → Technical Conventions Policy).

## Compression

*(All modes — Authoring and Update count the sections they touch; Realign counts the whole doc. In
Update, a miss the edit did not introduce follows `safety-rules.md` → Update posture.)*

- Compression targets satisfied (per `design-writing-contract.md` → Compression Targets); the contract is the source of truth for the specific limits.
- A dense bullet is not automatically a violation — apply the contract's cluster-low-info / split-high-info rule: flag a bullet only when it bundles several independently-explained facts, not merely for length.
- **Count, and report the counts** — one per target in `design-writing-contract.md` → Compression Targets, plus the provenance sweep below. A pass reporting "satisfied" with no numbers has asserted nothing.
- **A zero is a result and is reported as one** — "0 provenance shapes" and a silently skipped sweep look identical otherwise.
- **The no-rule-in-two-sections target compares each counted section against the whole document**, not
  within one section.
- **Each duplicate group is reported once, with the section that owns the fact**, so the output says
  where the rule belongs rather than only that it repeats. A duplicate one of the scoped checks above
  also catches (Two-Layer Model, Semantic Systems, Interaction Rules) is the same group, owned where that
  check places it. Identity vocabulary is exempt
  (`design-writing-contract.md` → Redundancy Rules).

## Tokens & Terminology

- Token references use `{token.name}` (resolved-value) format wherever the contract requires it.
- **Every `{token.name}` (value) pair in the canonical sections matches the token's canonical definition
  (YAML Registry, or a colocated Foundations table); report pairs checked and mismatches.** The carve-out
  above exempts these pairs from the duplication check, so nothing else catches a stale one.
- No new tokens introduced that aren't declared in **the YAML Registry, or a colocated Foundations table**. The registry is the canonical token store; a check that reads only the Foundations section passes a token that exists nowhere.
- Stable vocabulary is consistent across the doc — no synonym drift introduced.

## Doc-First, Anti-Patterns & Template

- **Doc-first** — no banned code references (file paths, code symbols, import/package names, raw framework utility classes, wiring prose); design-token selectors and deliberately-chosen tool names are allowed. Per `design-writing-contract.md` → Doc-First. A one-shot audit under-counts — re-audit after fixing.
- **Anti-patterns** — no decision-history or iteration narration in canonical sections (per `design-writing-contract.md` → Prose Anti-Patterns).
- **Unlocated evidence claims** — no sentence asserts that a measurement, an option set, or a prior decision exists without naming its location or stating the fact inline (per `design-writing-contract.md` → Prose Anti-Patterns). Greppable shape: "is recorded", "is documented", "was measured", "we decided".
- **Classification** — a base style/rendering layer is a Foundations concern, not a Component (per `design-writing-contract.md` → Foundations Template) — confirm before filing under `# Components`.
- **Template completeness** — every subsection the Project-Specific Schema requires is present.
- **Anchor resolution** — every heading anchor sibling rules/docs reference resolves to a real heading.
- **A label that code or a sibling doc cites is load-bearing like a heading.** Rewording it breaks the
  citation and no anchor check sees it, because it is not an anchor. Treat a cited label as a rename
  (`cross-reference-rules.md`), and expect an anchor-resolution pass to report it unresolved — that is the
  checker's limit, not a defect in the label.

## Residue

*(All modes — Authoring and Update sweep the sections they touch; Realign sweeps the whole doc via `rewrite-passes.md` → Residue Pass.)*

The ban on decision-history in canonical sections is a rule about what may be written; this is the check that it has not accumulated anyway. Residue only ever grows, so sweep rather than assume.

- Sweep for these shapes: "we renamed", "chose A over B", "previously", "used to", "no longer", "was removed", and self-justifying absence ("isn't a component, so no file"). Per `design-writing-contract.md` → Prose Anti-Patterns.
- **Sweep the compact provenance shapes too** — a date, an attribution, a before/after pair, a supersession clause. The narration shapes above all miss them, because they tell no story. Sweep `Known Gaps` as well; the shapes and the one exception are defined in `design-writing-contract.md` → Prose Anti-Patterns.
- **Sort every hit before touching it** — a keyword match is not a verdict:

| Class | Test | Action |
|---|---|---|
| Pure history | States only what changed and when. Nothing breaks if a future editor never reads it. | Flag for deletion — version control holds it. Never delete on the model's own judgment (`safety-rules.md` governs, in every mode). |
| Constraint stated as history | The sentence exists to prevent a recurrence. Removing it makes a specific mistake available again. | Reword forward into a present-tense rule. **Never delete.** |

- Rewording forward drops the narration and keeps the prohibition: "we removed the gold-on-gold pairing because it erased the scale" becomes "do not pair gold on gold — it erases the scale".
- An ambiguous hit is the user's call — flag it and leave it in place.
- Report the hit count and the split by class. A hit reworded forward is logged `REWORDED`, never `REMOVED`; a pure-history hit is `FLAGGED` until the user confirms it.

## Lossless

*(Update + Realign — compares output to the input.)*

- Token inventory: every token name present in the input appears in the output (or is logged in the manifest as a terminology unification).
- Table row counts: preserved unless the manifest documents a merge.
- Every input section's semantic content is traceable to an output location or a manifest entry.

**Those three are the floor, not the method.** On a whole-document restructure, traceability has to be
produced rather than asserted. In order:

1. **Inventory the input's facts before the first edit** — tokens, values, table rows, named rules. An
   inventory derived afterwards reconciles with whatever shipped.
2. **Normalise before matching, and choose the normalisation deliberately** — whitespace, backticks,
   `×`/`x`, dash forms. Numbers normalise with their unit and a digit boundary; a bare number
   false-matches dates and list numbering, burying real losses in noise.
3. **Hand-review every partial match** — this is where the losses are. A structure-only change breaks
   literal matching without losing anything, and a genuine loss can match partially.
4. **Sample the false positives before trusting a clean result** — a normalisation that is too generous
   reports 0 unaccounted because it matches everything.
5. **Re-verify landings after the last pass, not as each one runs** — a `MOVED` pointer goes false
   when a later pass removes its target, and a deferred entry can stay unwritten. Both read as complete.
6. **Read the diff.** A mechanical pass cannot see meaning lost inside a matched line — a value that kept
   its number and lost its unit, a requirement that kept its rule and lost its reason.

## Manifest Completeness

*(Update + Realign — every change has a manifest entry.)*

- Every structural change in the output has a corresponding manifest entry.
- No manifest entry references a location that doesn't exist in the output.

## Manifest Entry Types

*(All modes — every mode's manifest draws from this list, so it lives in the file every mode loads.)*

Keep each entry to one line.

| Entry | When to use |
|---|---|
| `ADDED` | New content written into a section |
| `UPDATED` | Existing content changed in place — a value, wording, a cross-reference, or formatting |
| `REMOVED` | Content deleted — only on a user instruction naming it, or where the running operation names the deletion as routine; otherwise `FLAGGED`. Never on the model's own judgment, and never a constraint stated as history (→ Residue) |
| `MOVED` | Content relocated — the entry names source → destination, including out of the canonical sections |
| `RENAMED` | Heading or identifier text changed — cross-references need updating |
| `MERGED` | Sections or bullet clusters consolidated — consolidating *sections* requires user confirmation |
| `SPLIT` | One section divided into two |
| `UNIFIED` | Terminology replaced doc-wide (old → new, count) |
| `REWORDED` | A sentence rewritten forward — narration dropped, prohibition kept |
| `PLACEHOLDER` | Empty heading with no content — flagged, not moved, not deleted |
| `FLAGGED` | Content needing user confirmation before action — duplicative, misplaced, or class unclear |
| `NOTED` | Observation outside the current change's action scope — no action taken |
| `KEPT-LOCAL` | Content evaluated for hoisting and deliberately left colocated |
| `MIRRORS` | A restatement outside this doc that this change invalidates — file and line |
| `SIZE` | The change's net effect on document size, in lines AND bytes |

**This table is the only registry of entry types.** No manifest uses a label the table does not list; a
change needing a type it lacks reports that as a finding instead of coining a label. An invented label is
invisible to any check that reads the manifest by type, so the change it records cannot be verified.

**`SIZE` reports lines and bytes** — they move in opposite directions. Replacing prose with a table adds
rows while removing words, so a line count alone reports compression as growth.

**`PLACEHOLDER` is for empty headings only** — a heading that has content but may be duplicative or misplaced is `FLAGGED`, never `PLACEHOLDER`.

## YAML blocks parse, and carry no comments

*(All modes — every block written or touched.)*

**Parse every YAML block after writing it.** Nothing else in the pipeline does, so an invalid block ships
looking authoritative. The shape that breaks most often is a value opening on a quoted token, where the
quote makes the mapping ambiguous.

- **No inline `#` comments, in any block** (`design-writing-contract.md` → YAML Rules). This needs its own check
  because the ban is easy to break while converting prose to YAML, where the comment feels like the
  explanation being preserved.
- Report the number of blocks parsed, not just the failures — an unparsed block and a passing one are
  indistinguishable in a report that lists only errors.

## Conflict Detection

- Flag conflicting definitions of the same token, component behavior, semantic role, or interaction rule. Do not resolve automatically.
