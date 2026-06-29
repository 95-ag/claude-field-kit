# Validation Heuristics

Run before reporting any DESIGN.md work done — **Authoring, Update, or Realign**. Failed checks surface as a short remediation list. Most checks are mode-agnostic (valid structure, two-layer model, doc-first, tokens, terminology, template). A few are transform-only and tagged below: **Lossless** and **Manifest Completeness** apply to Update + Realign; the **Realign Judgment Heuristics** apply to Realign.

---

## Structural

- Canonical top-level ordering preserved: `YAML Registry → Overview → Foundations → [Semantic Systems] → [Background] → Components → Domain Components → Interaction Rules → Accessibility Rules → Cross-Cutting Rules → Technical Conventions → Iteration Notes`. Bracketed entries are optional.
- All spine sections required by the contract — and by any project-specific schema — are present. (Project-specific required Domain Components, e.g. a portfolio's `Project Detail` / `About Layouts`, come from the project's own schema, not this generic check.)
- No heading deeper than H4.
- No duplicate section titles within the same parent.

## Two-Layer Model

- Top-of-document YAML Registry present and contains globally reusable canonical tokens (color tokens, typography tokens, spacing/radius/motion/breakpoint/z-index scales, focus-ring spec).
- Markdown body does not duplicate token *values* from the registry. Token *names* may be referenced freely.
- Color and typography tokens MAY remain colocated as role-based semantic tables in Foundations (Locality Principle) instead of hoisted to the top registry — a legitimate placement, not a two-layer violation. Flag only if the same tokens are duplicated across both layers.
- Local structural-spec YAML inline (component spec blocks, per-elevation specs, grid specs, semantic-systems mappings) is permitted — this is not a two-layer violation.
- No single monolithic YAML superblock — the registry collects globally reusable tokens, not every YAML block in the document.

## Semantic Systems (advisory)

- When `# Semantic Systems` exists, its subsections SHOULD NOT be silently duplicated in Foundations or Components. If a semantic role table has a canonical home in Semantic Systems, other locations must reference or specialize it — not restate it verbatim. Flag duplicates; do not auto-remove.
- Absence of `# Semantic Systems` is not a violation — semantic role tables may legitimately remain colocated in Foundations.

## Interaction Rules

- Global hover/focus/disabled/loading/responsive *defaults* are consolidated under `# Interaction Rules`. Flag duplication of defaults across multiple locations.
- Component-local interaction nuances (deviations from or specializations of the baseline) may live with the component. Do not flag component-local nuance as a duplication violation.

## Domain Components

- `## Domain Components` appears between `## Components` and `## Interaction Rules` — not at the end of the document.
- Each domain component SHOULD primarily compose, specialize, or extend one or more canonical spine systems, and MAY assume a specific page context or content schema.
- Domain Components MUST NOT contain globally reusable UI systems — those belong in `## Components`.
- If the project defines a doc↔code tagging convention for Domain Components (e.g. an `[inline]`/`[standalone]` tag bound to a component-structure rule), verify every leaf is tagged and the tag matches reality; parent group headers carry no tag. Projects without such a convention skip this check.

## Technical Conventions Scope

- The `# Technical Conventions` section contains only implementation policy (rendering, MDX, build/runtime, performance UX, animation-rendering constraints).
- Token registries, component specs, and behavioral rules appearing inside Technical Conventions are misplaced — flag for relocation.

## Compression

- Compression targets satisfied (per `writing-contract.md` → Compression Targets); the contract is the source of truth for the specific limits.
- A dense bullet is not automatically a violation — apply the contract's cluster-low-info / split-high-info rule: flag a bullet only when it bundles several independently-explained facts, not merely for length.

## Tokens & Terminology

- Token references use `{token.name}` (resolved-value) format wherever the contract requires it.
- No new tokens introduced that aren't declared in the Foundations section.
- Stable vocabulary is consistent across the doc — no synonym drift introduced.

## Doc-First, Anti-Patterns & Template

- **Doc-first** — no banned code references (file paths, code symbols, import/package names, raw framework utility classes, wiring prose); design-token selectors and deliberately-chosen tool names are allowed. Per `writing-contract.md` → Doc-First. A one-shot audit under-counts — re-audit after fixing.
- **Anti-patterns** — no decision-history or iteration narration in canonical sections (per `writing-contract.md` → Prose Anti-Patterns); history lives in Iteration Notes.
- **Classification** — a base style/rendering layer is a Foundations concern, not a Component (per `writing-contract.md` → Foundations Template) — confirm before filing under `# Components`.
- **Template completeness** — every subsection the Project-Specific Schema requires is present.
- **Anchor resolution** — every heading anchor sibling rules/docs reference resolves to a real heading.

## Lossless

*(Update + Realign — compares output to the input.)*

- Token inventory: every token name present in the input appears in the output (or is logged in the manifest as a terminology unification).
- Table row counts: preserved unless the manifest documents a merge.
- Every input section's semantic content is traceable to an output location or a manifest entry.

## Manifest Completeness

*(Update + Realign — every change has a manifest entry.)*

- Every structural change in the output has a corresponding manifest entry.
- No manifest entry references a location that doesn't exist in the output.

## Conflict Detection

- Flag conflicting definitions of the same token, component behavior, semantic role, or interaction rule. Do not resolve automatically.

---

## Realign Judgment Heuristics

*(Realign only.)*

These are preferences and guidelines, not hard rules. Apply them with judgment — context overrides heuristic.

**Subsection density.** If a subsection's content has been reduced to ≤3 bullets and carries no independent spec or structure warranting future expansion, consider collapsing it into the parent section. Flag rather than act unilaterally.

**Labelled groups vs headings.** Small parallel rule clusters (≤3 bullets each, similar weight) often read better as bold-label bullet groups (`**Photography**` / `**Diagrams**`) than as H3/H4 headings. Prefer the group form when the clusters are genuinely parallel and brief.

**Prose removal threshold.** Remove interpretive prose when the nearby table or spec already expresses the behavior clearly. Do not remove prose that adds framing, interpretive context, or cross-cutting rules not visible in the table itself.

**Content-sufficiency language.** Do not describe sections as "thin", "underdeveloped", or "near-empty" in pass output or manifests. A short section is not a structural problem. Use `PLACEHOLDER` for empty headings; otherwise leave content-sufficiency judgments out of the manifest entirely.

**Unused / reserved tokens.** A token registry should hold tokens that are in use. When a token appears unused (no component or rule consumes it), prefer flagging it; removal requires confirmation. "Unused" is a code claim — verify against the code before flagging, and never delete on the model's own judgment. Carve-out: a token the project *intentionally* maintains as a reserved scale slot is labeled as such, not flagged.
