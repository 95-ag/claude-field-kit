# Rewrite Passes

Seven pass types. Run one per invocation unless explicitly combined.

---

## 1. Structure-Only Pass

**Purpose:** Reorganize section hierarchy and ordering without altering prose content.

What changes:
- Top-level and subsection order aligned to `design-writing-contract.md` → Canonical Spine (Canonical ordering, Subsection order).
- Orphaned subsections relocated to correct parent.
- Heading levels normalized (no deeper than H4).
- Duplicate section titles resolved.

What does NOT change:
- Paragraph content, bullet text, token values, tables — untouched.
- Terminology — unchanged (use the Terminology pass for that).

**Empty placeholder headings** — headings with no content are a distinct category. Do not classify them as structural violations requiring moves or merges. Flag them using `PLACEHOLDER` (`validation-heuristics.md` → Manifest Entry Types) and leave them in place.

Manifest entries: MOVED (source → destination), RENAMED (heading only), PLACEHOLDER.

---

## 2. Normalization Pass

**Purpose:** Apply the contract's formatting rules to prose, bullets, and YAML.

What changes:
- Prose walls broken into bullets or compressed to ≤ 5 lines.
- Bullets exceeding 2 visual lines compressed.
- Components reordered to: identity statement → semantic bullets → YAML spec.
- YAML blocks that duplicate prose removed (prose preserved, YAML removed).
- Semantically fragmented bullets merged into compact clusters.
- Token references reformatted to `{token.name}` (resolved-value) style.

What does NOT change:
- Section structure, heading text, ordering — use Structure pass first.
- Terminology — use Terminology pass.

Manifest entries: UPDATED (naming what was reformatted), MERGED (bullet clusters), REMOVED (duplicate YAML).

---

## 3. Section-by-Section Rewrite Pass

**Purpose:** Deep rewrite of one named section (or all sections sequentially) for contract compliance.

Section rewrite changes presentation and organization within the section. It does not change meaning, tokens, ownership, or heading hierarchy.

Scope: user specifies target section(s). If whole-doc, process top-level sections one at a time and list each in the manifest.

What changes:
- Section content rewritten to match writing mode for its category (see contract § Section-Type Writing Modes).
- Anti-patterns removed.
- Component sections brought to: name → 1-line identity → 3–5 semantic bullets → optional YAML.
- **Doc-first applied** — code references (paths, symbols, framework classes, wiring) rephrased as conceptual behavior, per contract § Doc-First. A one-shot audit under-counts; re-audit after the pass.
- **Intros lead with the design concept** — every moved or new section intro checked against a sibling intro; implementation paths and self-justifying placement stripped.

What does NOT change:
- Canonical ordering, heading text, tokens — structural changes go in Structure pass.

Manifest entries: UPDATED (section or component name), REMOVED (anti-pattern).

---

## 4. Migration / Reorganization Pass

**Purpose:** Move content from one structural layout to another — e.g., adopting a new top-level taxonomy.

Use when: the user wants to adopt the contract's canonical spine, merge subsections across sections, or split an oversized section.

Rules:
- Prefer section-preserving migrations. Keep existing section boundaries unless duplication is substantial and explicit.
- Every content move is logged with source → destination anchor.
- Content that doesn't fit the new layout is flagged, not discarded.

Manifest entries: MOVED (source → destination), SPLIT, MERGED (only when approved), FLAGGED.

---

## 5. Terminology Consistency Pass

**Purpose:** Unify synonym drift across the whole document.

What changes:
- Identifies multiple phrases used for the same concept.
- Proposes canonical term (from contract stable-terminology vocabulary or project-local vocabulary).
- Replaces all occurrences after user confirms the mapping.

Output before replacement:
- List proposed unifications: `"tonal depth" → "tonal layering" (5 occurrences)`
- Ask for confirmation before applying.

Manifest entries: UNIFIED (old → new, count).

---

---

## 6. Architectural Migration Pass

**Purpose:** Restructure an existing document into the two-layer model and new canonical spine. One-time use per architectural transition — distinct from the ordinary Migration / Reorganization Pass.

Scope: document-wide. Operates across all section boundaries simultaneously.

What changes:
- Globally reusable canonical tokens extracted into a top-of-document YAML Registry (see *Canonical Does Not Mean Centralized* in the contract).
- Sections relocated to new spine positions per an approved migration mapping table.
- Sections reclassified as Domain Components are relocated to `# Domain Components`, placed between `# Components` and `# Interaction Rules`.

What does NOT change:
- Token names and values — preserved verbatim (Tokens Are Sacred still applies).
- Content that cannot be cleanly mapped is flagged, never silently deleted.

Carve-out: the Section-Preserving Migrations default is suspended for this pass. Cross-section restructuring is the entire point. This suspension applies to this pass only.

Every structural move is logged `MOVED: source → destination`; content deliberately left colocated is logged `KEPT-LOCAL`.

**Default disposition for ambiguous placement decisions:** flag in the manifest and keep in place. Migration's job is to adopt the new spine — not to maximize architectural extraction.

This pass runs alone. It MUST NOT be combined with other passes.

---

## 7. Residue Pass

**Purpose:** Clear accumulated decision-history out of canonical sections without destroying the
constraints buried inside it.

The contract bans residue (`design-writing-contract.md` → Prose Anti-Patterns) but nothing sweeps for it, so it
only ever accumulates. In one recorded sweep, ten of seventeen hits were load-bearing — which is why this
pass sorts before it deletes.

Scope: document-wide. The shapes to sweep for and the two-class sort live in `validation-heuristics.md`
→ Residue, because every mode needs them; this pass applies them across the whole doc rather than only
the sections an edit happens to touch.

What does NOT change: token names and values — Design Identifiers still applies.

Manifest entries: REMOVED (pure history, once the user confirms), REWORDED (constraint kept, narration
dropped), FLAGGED (pure history awaiting confirmation, or class unclear).

A pass that reports only deletions on a mature doc has almost certainly destroyed a constraint.

---

## Combined Passes

If the user requests more than one pass, run them in this order:
1. Architectural Migration (always alone — never combined)
2. Structure-Only
3. Migration / Reorganization (if needed)
4. Normalization
5. Residue
6. Section-by-Section Rewrite
7. Terminology

Segment the manifest by pass type with a `--- PASS: name ---` divider.

---

## Realign Judgment Heuristics

*(Realign only.)*

These are preferences and guidelines, not hard rules. Apply them with judgment — context overrides heuristic.

**Subsection density.** If a subsection's content has been reduced to ≤3 bullets and carries no independent spec or structure warranting future expansion, consider collapsing it into the parent section. Flag rather than act unilaterally.

**Labelled groups vs headings.** Small parallel rule clusters (≤3 bullets each, similar weight) often read better as bold-label bullet groups (`**Photography**` / `**Diagrams**`) than as H3/H4 headings. Prefer the group form when the clusters are genuinely parallel and brief.

**Where the heading set is frozen, a bold label is the sub-group form at any size.** The ≤3-bullet
guidance above assumes a heading is available; where a pass may not add one — a frozen anchor set, a depth
cap — a labelled group is the only sub-structure left, and capping it at three bullets removes the
structure instead. Size stops being the test.

**Prose removal threshold.** Remove interpretive prose when the nearby table or spec already expresses the behavior clearly. Do not remove prose that adds framing, interpretive context, or cross-cutting rules not visible in the table itself.

**Content-sufficiency language.** Do not describe sections as "thin", "underdeveloped", or "near-empty" in pass output or manifests. A short section is not a structural problem. Use `PLACEHOLDER` for empty headings; otherwise leave content-sufficiency judgments out of the manifest entirely.

**Unused / reserved tokens.** A token registry should hold tokens that are in use. When a token appears unused (no component or rule consumes it), prefer flagging it; removal requires confirmation. "Unused" is a code claim — verify against the code before flagging, and never delete on the model's own judgment. Carve-out: a token the project *intentionally* maintains as a reserved scale slot is labeled as such, not flagged.
