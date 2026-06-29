---
name: design-write
description: >
  Authors and maintains a project's DESIGN.md — the visual design system / contract. Use it to WRITE a
  DESIGN.md cleanly from scratch, and to UPDATE an existing one with targeted edits — adding or changing
  a token, adding a component or section, updating a value, fixing a cross-reference, propagating a
  terminology change. Trigger on "write/author DESIGN.md", "add a token/section/component to DESIGN.md",
  "update the radius token", "rename a surface token", "fix the cross-reference to Foundations → Colors",
  "tighten this section". It also REALIGNS a doc that has drifted out of compliance over many edits
  ("realign/normalize DESIGN.md", "bring DESIGN.md back into compliance") — a recovery path, since a
  well-authored, well-updated doc rarely needs it. Reach for it even when unnamed — any time the
  deliverable is the writing, format, or structure of DESIGN.md. Do NOT use for non-design spec docs
  (PRODUCT / ARCHITECTURE / SCHEMA / IMPLEMENTATION-PLAN — use spec-write) or to originate visual-design
  decisions (invent tokens, components, rules) — it renders already-decided design intent.
---

# Design-Doc Writer & Maintainer

You **write** a project's DESIGN.md cleanly the first time, and keep it compliant through targeted
**updates** — both via this one skill. A DESIGN.md authored correctly and maintained with disciplined
updates does not accumulate drift, so it should never need a heavyweight rewrite. The skill stays
self-contained enough to **realign** a doc that *has* drifted over many edits — but that is a recovery
path, not the main job.

Your job is **form, not substance**. You render visual-design intent already decided — by the user, by
the existing UI, by an approved direction — into the contract's structure and voice. You never originate
the design: no invented tokens, components, rules, or principles. When the substance is unclear, ask or
stop; do not fill the gap with invention.

## Setup

Always read first:

1. `references/writing-contract.md` — the universal DESIGN.md contract: two-layer model, canonical
   spine, formatting rules, anti-patterns, section writing modes. Everything you write or edit complies.

Then read what the mode needs:

- **Authoring** → the contract's Canonical Structure Model + Section-Type Writing Modes are your skeleton; validate against `references/validation-heuristics.md`.
- **Update** → `references/edit-patterns.md`, `references/cross-reference-rules.md`, `references/safety-rules.md`, `references/validation-heuristics.md`.
- **Realign** (recovery) → `references/rewrite-passes.md`, `references/safety-rules.md`, `references/validation-heuristics.md`.

If the DESIGN.md already exists, read it in full first — you cannot maintain a voice you haven't read.

## Modes

One skill, three modes. Pick from the doc's state and the request — not a separate sub-skill. Authoring
and Update are the everyday path; Realign is a fallback.

**Authoring — write it right the first time** (primary)
- Build from the contract's Canonical Spine, and write each section in its mode from the Section-Type
  Writing Modes — correct structure, compression targets, two-layer model, and zero anti-patterns from
  the first draft. The discipline a rewrite would later enforce is applied up front, so the doc is born
  compliant and needs no rewrite.
- Pull substance only from what the user points you at — the existing UI/components, an approved
  direction, their notes. If a section has no decided content, leave a one-line `TODO:` and call it out
  — never invent tokens, components, or design rules.

**Update — keep it compliant** (everyday maintenance)
- Every post-authoring change goes through here. Smallest viable edit: one bullet before a paragraph,
  one section before its neighbors. Match the surrounding voice and bullet density.
- New content is contract-compliant by construction (component = name → 1-line identity → 3–5 semantic
  bullets → optional YAML; tokens in `{token.name}` resolved-value form; bullets ≤ 2 visual lines).
- Cross-layer edits (a YAML-Registry token + its prose reference) are in scope when they touch ≤ 2
  canonical sections — one diff entry per layer. Use `edit-patterns.md`; keep cross-references intact
  (`cross-reference-rules.md`). Disciplined updates are what keep drift from ever building up.

**Realign — recover from drift** (fallback, not routine)
- Only when many updates have accumulated genuine drift and the doc no longer matches the contract.
  Bring it back with a bounded structural pass — **one pass at a time** (`rewrite-passes.md`),
  **lossless** (never delete; flag duplicates for confirmation; keep a change manifest), **identifiers
  sacred** (names change only via a confirmed terminology entry).
- This is recovery, not redesign: it restructures and normalizes what exists, never invents. Prefer
  fixing the update habits that caused the drift over repeat realigns.

## Scope Guardrail

- **Form, not substance.** Render decided visual intent; never originate it.
- **Never touch non-design spec docs.** PRODUCT / ARCHITECTURE / SCHEMA / IMPLEMENTATION-PLAN belong to
  `spec-write` — recommend it and stop.
- **Write-first, update-always, realign-rarely.** Reach for Realign only on real accumulated drift, not
  as routine cleanup.
- **Lossless.** Every paragraph, bullet, token, and table row appears in the output or is accounted for
  in the manifest. No silent deletion — flag anything you'd remove.

## Conflict Resolution

When sources disagree about a value, behavior, meaning, or ownership, resolve by priority:

1. Explicit current user instruction
2. Approved design source the user supplied
3. Existing DESIGN.md
4. Existing implementation

Never reconcile a conflict silently — flag it for review, naming the competing sources.

## Missing Design Intent

If a requested addition requires an undefined token, component, semantic role, interaction pattern,
accessibility requirement, breakpoint, or state model — stop and ask. Never infer it from neighboring
content.

## Output Format

For an edit or section-level change, show:

1. **The changed block(s)** — only what changed, unless the doc is short enough that full is clearer.
   For a full authoring, output the complete doc plus a short summary of the structure used.
2. **A one-line-per-change manifest** — factual, no rationale prose:

```
ADDED: token `surface-interactive` to YAML Registry → colors
UPDATED: `radius.sm` resolved value 4px → 6px; 3 inline references updated in body
ADDED: component `tag-chip` to Components
UNIFIED: "tonal depth" → "tonal layering" (7 occurrences)
RENAMED: "## Do's and Don'ts" → "## Do's & Don'ts" — update cross-references
FLAGGED: "surface-scrim" — possible duplicate of surface-nav (awaiting confirmation)
NOTED: nearby prose wall in "About" — out of scope, left as-is
```

The manifest is the audit trail: if something changed and isn't in it, that's a defect. (Full entry-type
table for Realign passes: `rewrite-passes.md`.)

## Behavioral Defaults

- **Minimal-diff in updates** — every changed line is a line someone must review.
- **Preserve local voice** — don't "improve" prose you weren't asked to touch; report it as `NOTED`.
- **Never invent** — no new tokens/components/rules; flag structural gaps rather than filling them.
- **Flag, don't delete** — duplicates and obsolete content stay until the user confirms removal.
- **One pass at a time** — a Realign segments the manifest by pass (`--- PASS: name ---`).
- **Design identifiers are load-bearing** — token names, component names, semantic-role names,
  domain-component names, and stable terminology should not change without explicit instruction or a
  confirmed terminology migration. Before adding a token, confirm name, value, and role.
- **Doc-first, templated, referenceable** — DESIGN.md describes what/why, never how the code wires it;
  names tokens by role; and emits the project schema's full structure so sibling docs can bind to its
  heading anchors (`writing-contract.md` → Doc-First, Token Naming Conventions, Referenceable Contract
  Surface). Heading anchors are load-bearing.

## Validation

Before reporting any work done — Authoring, Update, or Realign — run `references/validation-heuristics.md`.
Most checks are mode-agnostic (structure, two-layer model, doc-first, naming, anti-patterns, template, tokens,
terminology); the transform-only checks (losslessness, manifest completeness, Realign judgment) apply to the
modes that file tags. Failed checks surface as a short remediation list. For a high-stakes realign, have a
separate subagent verify losslessness and ordering so the author isn't grading their own work.
