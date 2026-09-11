# Rewrite Passes

Seven pass types. Run one per invocation unless explicitly combined.

---

## 1. Structure-Only Pass

**Purpose:** Reorganize section hierarchy and ordering without altering prose content.

What changes:
- Top-level and subsection ordering aligned to canonical schema.
- Orphaned subsections relocated to correct parent.
- Heading levels normalized (no deeper than H4).
- Duplicate section titles resolved.

What does NOT change:
- Paragraph content, bullet text, token values, tables — untouched.
- Terminology — unchanged (use the Terminology pass for that).

**Empty placeholder headings** — headings with no content are a distinct category. Do not classify them as structural violations requiring moves or merges. Flag them using `PLACEHOLDER` (see Manifest Entry Types below) and leave them in place.

Manifest entries: MOVED, REORDERED, RENAMED (heading only), PLACEHOLDER.

---

## Manifest Entry Types

Use these exact entry types across all passes. Keep each entry to one line.

| Entry | When to use |
|---|---|
| `MOVED` | Content relocated from one section to another |
| `REORDERED` | Section moved within its parent without content change |
| `RENAMED` | Heading text changed — cross-references need updating |
| `MERGED` | Two sections consolidated (requires user confirmation) |
| `SPLIT` | One section divided into two |
| `UNIFIED` | Terminology replaced doc-wide (old → new, count) |
| `COMPRESSED` | Prose or bullets reformatted for compression |
| `REFORMATTED` | Token format, YAML, or component structure normalized |
| `MERGED-BULLETS` | Fragmented bullets combined into semantic clusters |
| `REMOVED-DUPLICATE-YAML` | YAML block removed because prose covers same content |
| `PLACEHOLDER` | Empty heading with no content — flagged, not moved, not deleted |
| `FLAGGED` | Potentially duplicative content — user confirmation required before action |
| `NOTED` | Observation outside the pass scope — no action taken |
| `MIGRATED-LAYER` | YAML block extracted from markdown body into the top-level registry |
| `RECLASSIFIED` | Content moved between canonical buckets (e.g., Foundations → Semantic Systems) |
| `RELOCATED-TO-DOMAIN-COMPONENT` | Section relocated to `## Domain Components` (page/domain-bound, not globally reusable) |
| `KEPT-LOCAL` | Content evaluated for hoisting but retained colocated (locality principle applied) |
| `REWRITTEN` | Section content rewritten to its contract writing mode |
| `COMPONENT-REFORMATTED` | Component brought to identity → bullets → optional YAML order |
| `ANTI-PATTERN-REMOVED` | A contract anti-pattern eliminated in place |
| `DEMOTED-TO-EXTENSION` | Content moved into a product-type extension / project-schema layer |

**`PLACEHOLDER` vs `FLAGGED`:** Use `PLACEHOLDER` exclusively for empty headings. Use `FLAGGED` for headings or sections that have content but may be duplicative or misplaced. Never conflate the two.

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

Manifest entries: COMPRESSED, REFORMATTED, MERGED-BULLETS, REMOVED-DUPLICATE-YAML.

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

Manifest entries: REWRITTEN (section name), COMPONENT-REFORMATTED, ANTI-PATTERN-REMOVED.

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
- Sections reclassified as Domain Components are relocated to `## Domain Components`, placed between `## Components` and `## Interaction Rules`.

What does NOT change:
- Token names and values — preserved verbatim (Tokens Are Sacred still applies).
- Content that cannot be cleanly mapped is flagged, never silently deleted.

Carve-out: the Section-Preserving Migrations default is suspended for this pass. Cross-section restructuring is the entire point. This suspension applies to this pass only.

Every structural move is logged with a `MIGRATED-LAYER`, `RECLASSIFIED`, `DEMOTED-TO-EXTENSION`, or `KEPT-LOCAL` manifest entry.

**Default disposition for ambiguous placement decisions:** flag in the manifest and keep in place. Migration's job is to adopt the new spine — not to maximize architectural extraction.

This pass runs alone. It MUST NOT be combined with other passes.

---

## 7. Residue Pass

**Purpose:** Clear accumulated decision-history out of canonical sections without destroying the
constraints buried inside it.

The contract bans residue (`writing-contract.md` → Prose Anti-Patterns) but nothing sweeps for it, so it
only ever accumulates. Example: one sweep of a mature DESIGN.md and PROJECT.md pair found seventeen pieces
of residue — and ten of them were load-bearing.

**The trap:** a passage can read as history and still be the only thing preventing a recurrence — a
mechanical token merge that erased a scale, an override that defeated a type role's own colour, an artefact
in a traced asset that must not be re-traced. Deleting those on a keyword match loses knowledge with no
other home.

**Sort every hit into one of two classes before touching anything:**

| Class | Test | Action |
|---|---|---|
| Pure history | States only what changed and when. Nothing breaks if a future editor never reads it. | Delete, or move to `Iteration Notes`. |
| Constraint stated as history | The sentence exists to prevent a recurrence. Removing it makes a specific mistake available again. | Reword forward into a present-tense rule. **Never delete.** |

Rewording forward drops the narration and keeps the prohibition: "we removed the gold-on-gold pairing
because it erased the scale" becomes "do not pair gold on gold — it erases the scale".

Sweep for these shapes: "we renamed", "chose A over B", "previously", "used to", "no longer", "was
removed", and self-justifying absence ("isn't a component, so no file").

What does NOT change:
- Token names and values — Design Identifiers still applies.
- Any hit whose class is unclear. Flag it and leave it in place; an ambiguous hit is the user's call.

Manifest entries: REMOVED (pure history only), MOVED (to Iteration Notes), REWORDED (constraint kept,
narration dropped), FLAGGED (class unclear).

Report the hit count and the split across classes. A pass that reports only deletions on a mature doc has
almost certainly destroyed a constraint.

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
