---
name: design-write
description: >
  Authors and maintains a project's DESIGN.md — the visual design system / contract. WRITE one
  from scratch; UPDATE an existing one with targeted edits — add or change a token, add a
  component or section, update a value, fix a cross-reference, propagate a terminology change.
  Trigger on "write/author DESIGN.md", "update the radius token", "rename a surface token", "fix
  the cross-reference to Foundations → Colors", "tighten this section". It also REALIGNS a doc
  that has drifted over many edits ("realign/normalize DESIGN.md", "bring DESIGN.md back into
  compliance") — a recovery path, rarely needed on a well-maintained doc. Reach for it even when
  unnamed — whenever the deliverable is the writing, format, or structure of DESIGN.md. Do NOT use
  for non-design spec docs (PRODUCT / ARCHITECTURE / SCHEMA / IMPLEMENTATION-PLAN — use
  spec-write) or to originate visual-design decisions (invent tokens, components, rules) — it
  renders already-decided design intent.
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

1. `references/design-writing-contract.md` — the universal DESIGN.md contract: two-layer model, canonical
   spine, formatting rules, anti-patterns, section writing modes. Everything you write or edit complies.

Then read what the mode needs:

- **Authoring** → the contract's Canonical Structure Model + Section-Type Writing Modes are your skeleton; then `references/safety-rules.md`, `references/validation-heuristics.md`.
- **Update** → `references/edit-patterns.md`, `references/cross-reference-rules.md`, `references/safety-rules.md`, `references/validation-heuristics.md`.
- **Realign** (recovery) → `references/rewrite-passes.md`, `references/cross-reference-rules.md`, `references/safety-rules.md`, `references/validation-heuristics.md`.

`safety-rules.md` and `validation-heuristics.md` load in all three modes — the former's Shared rules and the
latter's entry-type registry bind everywhere. Individual checks apply per their own mode tag, so read the tag
before skipping one.

If the DESIGN.md already exists, read it in full first — you cannot maintain a voice you haven't read.

**Confirm the content before writing it — section by section, in Authoring and Update alike.** "Docs before
code" assumes the substance is decided, and it frequently is not. Walk the sections you are about to write or
change with the user and confirm each one's content first. A review that lands after the write becomes a
rewrite. Realign is exempt: it restructures what exists and originates nothing.

**Pre-approved batch.** A user who has settled every value already, with one review scheduled at the end,
can instruct you to skip the section-by-section confirmation; that instruction overrides the rule above.
Proceed, then report what was written for that review. It changes *when* the content is confirmed, never
*whether* — anything the brief does not decide is still flagged, never originated (`safety-rules.md` →
Never originate).

**A user's decision record is a brief, not a draft.** Dates, measurements and rejected options are
context, not content. Write the requirement; list what you deliberately left out under `NOTED:` so the
user can see the judgment and object to it.

## Modes

One skill, three modes. Pick from the doc's state and the request — not a separate sub-skill. Authoring
and Update are the everyday path; Realign is a fallback.

**Authoring — write it right the first time** (primary)
- Build from the contract's Canonical Spine, and write each section in its mode from the Section-Type
  Writing Modes — correct structure, compression targets, two-layer model, and zero anti-patterns from
  the first draft. The discipline a rewrite would later enforce is applied up front, so the doc is born
  compliant and needs no rewrite.
- Pull substance only from what the user points you at — the existing UI/components, an approved
  direction, their notes. If a section has no decided content, leave a one-line `TODO:` and list it under
  Questions — never invent tokens, components, or design rules.

**Update — keep it compliant** (everyday maintenance)
- Every post-authoring change goes through here. Smallest viable edit: one bullet before a paragraph,
  one section before its neighbors. Match the surrounding section's terminology and its category's
  writing mode (`design-writing-contract.md` → Section-Type Writing Modes).
- New content is contract-compliant by construction (component = name → 1-line identity → semantic
  bullets → optional YAML; tokens in `{token.name}` resolved-value form; lengths per
  `design-writing-contract.md` → Compression Targets).
- Cross-layer edits (a YAML-Registry token + its prose reference) are in scope when they touch ≤ 2
  canonical sections — one manifest entry per layer. Use `edit-patterns.md`; keep cross-references intact
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

Every run ends in one report with four sections, in this order. **A section with nothing to report
says "none"** — an omitted section and a forgotten one look the same.

1. **Changed blocks** — only what changed, unless the doc is short enough that full is clearer. For a
   full authoring, the complete doc plus a short summary of the structure used; for a pre-approved
   batch, what was written for that review.
2. **Manifest** — one line per change, factual, no rationale prose; every `FLAGGED`, `NOTED`,
   `PLACEHOLDER` or `MIRRORS` entry the references call for lands here — including a retired token's
   consumer (`edit-patterns.md` → Remove a section or component) and each duplicate group, once.

*Example:* — under the caveat in `design-writing-contract.md` → Token Conventions.

```
ADDED: token `surface-interactive` to YAML Registry → colors
UPDATED: `radius.sm` resolved value 4px → 6px; 3 inline references updated in body
ADDED: component `tag-chip` to Components
UNIFIED: "tonal depth" → "tonal layering" (7 occurrences)
RENAMED: "## Do's and Don'ts" → "## Do's & Don'ts" — update cross-references
FLAGGED: "surface-scrim" — possible duplicate of surface-nav (awaiting confirmation)
NOTED: nearby prose wall in "About" — out of scope, left as-is
MIRRORS: "surface / section / ground" vocabulary — restated in the design-system gallery; not edited
```

The manifest is the audit trail: if something changed and isn't in it, that's a defect. A full authoring is
itself the record of what was written, so its manifest carries only the observations made while writing
(for example `FLAGGED`, `NOTED`, `REWORDED`, `MIRRORS`) — never an `ADDED` line per section. (Full
entry-type registry, binding in every mode: `validation-heuristics.md` → Manifest Entry Types.)

**Name the mirrors.** A doc's rules are frequently restated in prose elsewhere — a gallery, a README, an
onboarding page. Those copies typecheck, lint and render while asserting the opposite of the doc, so
nothing detects the mismatch afterwards. At the end of a run, add a `MIRRORS:` entry for each changed rule
that has a restatement elsewhere. Naming it is the whole job — the mirror is outside this skill's scope.

**Code comments are mirrors too, and a prose sweep misses them.** A comment may quote a doc sentence
verbatim, or cite a section as the source of a figure: rewording falsifies the first, removing the figure
breaks the second. Before rewording, grep the code for quoted doc phrases and for section names cited as a
source — keep the quoted text verbatim, or list each as `MIRRORS:` with file and line. A table conversion
has the same trap: a state label a comment cites must survive as the row key.

3. **Check results** — the remediation list for failed checks, and every count a check requires:
   zeros, pairs checked, blocks parsed, hits by class, both boundary sweeps, and each figure stripped
   until its code lands (`validation-heuristics.md`; `edit-patterns.md` → Change a boundary).
4. **Questions** — every `TODO:` left while authoring, and each decision only the user can make, with a
   recommendation (Behavioral Defaults → Ask whether the change is visual or behavioural).

## Behavioral Defaults

- **Minimal-diff in updates** — every changed line is a line someone must review.
- **Preserve local voice** — don't "improve" prose you weren't asked to touch; report it as `NOTED`.
- **Never invent** — no new tokens/components/rules; flag structural gaps rather than filling them.
- **Flag, don't delete** — duplicates and obsolete content stay until the user confirms removal.
- **One pass at a time** — a Realign segments the manifest by pass (`--- PASS: name ---`).
- **Design identifiers are load-bearing** — token names, component names, semantic-role names,
  domain-component names, and stable terminology should not change without explicit instruction or a
  confirmed terminology migration. Before adding a token, confirm name, value, and role.
- **Ask whether the change is visual or behavioural** — at the end of a run, ask for each changed entry
  whether it alters only how something looks, or also what it does: described behaviour, scope, or a named
  surface. A behavioural change hands off to `spec-write` — recommend it and name the entry. The Scope
  Guardrail owns the boundary; this is the prompt that makes you notice it was crossed.
- **Doc-first, templated, referenceable** — DESIGN.md describes what/why, never how the code wires it;
  names tokens by role; and emits the project schema's full structure so sibling docs can bind to its
  heading anchors (`design-writing-contract.md` → Doc-First, Token Naming Conventions, Referenceable Contract
  Surface). Heading anchors are load-bearing.

## Validation

Before reporting any work done — Authoring, Update, or Realign — run `references/validation-heuristics.md`.
Most checks are mode-agnostic (structure, two-layer model, doc-first, naming, anti-patterns, template, tokens,
terminology); the transform-only checks (losslessness, manifest completeness) apply to the modes that file
tags, and Realign's judgment heuristics are in `references/rewrite-passes.md`. Failed checks go to the
report's Check results (Output Format). For a high-stakes realign, have a separate subagent verify
losslessness and ordering so the author isn't grading their own work.
