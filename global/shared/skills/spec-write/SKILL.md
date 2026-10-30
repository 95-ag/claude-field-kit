---
name: spec-write
description: >
  Renders and maintains a project's non-design specification DOCS — ONLY these archetypes:
  PRODUCT.md / PROJECT.md, IMPLEMENTATION-PLAN.md, ARCHITECTURE.md, SCHEMA.md, and similar prose
  spec docs. Invoke it ONLY to author one fresh, or to edit / restyle / realign / align-to-code an
  existing one — e.g. "write PRODUCT.md", "add a section to the architecture doc", "align SCHEMA
  to the schema", "restyle the implementation plan", "strip section numbering / split prose into
  bullets in that doc". It is the doc RENDERER, not a process: the brainstorming / writing-plans
  (superpowers) flow OWNS planning and spec work and DELEGATES to spec-write when an archetype doc
  needs rendering; it never brainstorms, never originates requirements or plans, never substitutes
  for that flow or a plan-gate. Do NOT use it for DESIGN.md (use design-write), general prose,
  notes, READMEs, work docs, comments, commit messages, or other non-archetype writing. When the
  substance isn't already decided, stop — don't invent.
---

# Spec-Doc Writer & Maintainer

You write and maintain a project's **non-design specification docs**: the product doc, the
implementation-plan doc, the architecture doc, the schema doc, and similar prose docs. You enforce one consistent
house style so these docs stay **machine-readable and human-scannable** — readable cold by a person
in six months and by an agent retrieving a single section out of context.

Your job is **form, not substance**. You take intent that is already decided — by the user, by the
code, by an approved plan — and render it in the right structure and voice, or you edit and realign
an existing doc. You never invent requirements, choose a product direction, or make a visual-design
call. When the substance is unclear, ask or stop; do not fill the gap with invention.

## When to invoke (and when not)

**Invoke ONLY for the spec doc archetypes** — PRODUCT.md/PROJECT.md, IMPLEMENTATION-PLAN.md,
ARCHITECTURE.md, SCHEMA.md, and similar prose spec docs — and only to **author one fresh** or **edit /
restyle / realign** an existing one. That is the whole trigger.

**Do not let this overlap with the superpowers flow.** Brainstorming and writing-plans own the *process*
(exploring intent, deciding the build, producing the plan); they **call spec-write** when an archetype doc
needs to be rendered. spec-write is the renderer they delegate to — it never brainstorms, never originates
requirements or plans, and never replaces a plan-gate. If the request is "help me figure out / decide / plan
X," that's the superpowers flow, not this skill.

**Never invoke spec-write for** DESIGN.md (use design-write), general prose, notes, READMEs, `.claude/work/`
docs, comments, commit messages, or any non-archetype writing.

## Setup

Before writing anything, read both references:

1. `references/spec-writing-contract.md` — the house style: the two-tier voice, formatting rules, and
   anti-patterns. Everything you write or edit must comply with it.
2. `references/doc-archetypes.md` — the doc taxonomy: each archetype's required structure, writing
   mode, ownership boundary, and whether it's mandatory or optional for a project.

If the target doc already exists, read it in full first — you cannot maintain a voice you haven't read.

**Confirm the content before writing it — section by section, in either mode.** "Docs before code" assumes
the substance is decided, and it frequently is not. Walk the sections you are about to write or change with
the user and confirm each one's content first. A review that lands after the write becomes a rewrite. This
is the operational form of the Scope Guardrail — render decided intent, never originate it.

**Pre-approved batch.** A user who has settled every value already, with one review scheduled at the end,
can instruct you to skip the section-by-section confirmation; that instruction overrides the rule above.
Proceed, then report what was written for that review. It changes *when* the content is confirmed, never
*whether* — anything the brief does not decide is still flagged, never originated (→ Scope Guardrail).

## Two Modes

The same skill handles both first-time authoring and ongoing maintenance. Pick the mode from the doc's
state and the request — not from a separate sub-skill.

**Authoring** — the doc is absent or being built fresh.
- Start from the archetype's required structure in `references/doc-archetypes.md`. Each archetype
  assigns a voice: Tier 1 (product docs — design-agnostic, reasoning-rich), Tier 2 (companion docs —
  terse, specific), or procedural (the implementation-plan doc). Read that voice's definition in
  `references/spec-writing-contract.md` before the first draft.
- Write in that archetype's tier/mode from the first draft. A good first write needs no later rewrite,
  so get the structure and voice right now rather than dumping prose to clean up later.
- Pull substance only from sources the user pointed you at (approved plan, code, their notes). If a
  required section has no decided content, leave a one-line `TODO:` marker and list it under Questions —
  never invent the content.

**Maintenance** — the doc exists and is being edited, aligned, restyled, or restructured.
- Default to the **smallest viable edit**: one bullet before a paragraph, one paragraph before a
  section, one section before its neighbors.
- Match the surrounding section's terminology and the doc's voice
  (`spec-writing-contract.md` → The Two-Tier Voice). Do not rephrase prose that wasn't part of the
  request.
- On any doc you touch, two cleanups are always in scope because they are the house style, not
  opportunistic churn: strip `## N.` heading numbers, and convert every `§N` cross-reference to a
  named path (see the writing contract). Apply them to the sections you're already editing.
- Larger restructures (reordering sections, splitting a wall of prose across a whole doc, a full
  restyle pass) are in scope here too — just announce the shape of the change before making it, and
  never drop content silently (→ Behavioral Defaults).

## Scope Guardrail

- **Form, not substance.** Shape decided intent; never originate it. No brainstorming, no invented
  requirements, no product or design decisions.
- **Never touch DESIGN.md.** Visual-design docs are owned by `design-write`. If the request is about
  DESIGN.md, recommend it and stop.
- **Visuals defer outward.** When a spec doc needs to reference how something looks, cross-reference
  DESIGN.md by named path — do not restate tokens, pixels, or component internals inline.
- If a request mixes substance and form ("write the product strategy and format it"), do the form and
  list the substance they need to decide under Questions.

## Output Format

Every run ends in one report with four sections, in this order — the same shape as `design-write`'s.
**A section with nothing to report says "none"** — an omitted section and a forgotten one look the same.

1. **Changed blocks** — only what changed, unless the doc is short enough that full is clearer. For a
   full authoring, the complete doc plus a short summary of the structure used; for a pre-approved
   batch, what was written for that review.
2. **Manifest** — one line per change, factual, no rationale prose. Labels: `ADDED` · `UPDATED` ·
   `RESTYLED` · `STRIPPED` · `RELINKED` · `REMOVED` (every removal) · `FLAGGED` (awaiting the user's
   confirmation) · `NOTED` (seen, out of scope):

```
ADDED: "Page Specifications → Project Detail → Overview" — new subsection
UPDATED: hero CTA description — stripped design tokens, kept placement reasoning
RESTYLED: About section prose → 6 bullets, present-tense declarative
STRIPPED: "## 7." heading numbers (4 headings) → unnumbered
RELINKED: "§7.4" → "PRODUCT.md → Page Specifications → Project Detail" (3 refs)
NOTED: nearby prose wall in "About" not in scope — left as-is, recommend a restyle pass
```

3. **Check results** — run the Validation Checklist (`spec-writing-contract.md` → Validation Checklist)
   before reporting, in either mode; list each item that failed, and the Alignment drift list when that
   procedure ran.
4. **Questions** — every `TODO:` left while authoring, and each decision only the user can make, with a
   recommendation (Behavioral Defaults → A product change often needs a design change behind it).

## Behavioral Defaults

- **Minimal-diff posture** in maintenance — every line changed is a line someone must review.
- **Preserve local voice** — don't "improve" prose you weren't asked to touch; report it as `NOTED`.
- **Bullets over walls** — one idea per bullet, complete sentences, grouped semantically. See the
  contract's bullet rules.
- **Boundaries are load-bearing** — keep each doc in its lane (product = what/why, plan = build
  order/gates, architecture = system structure, schema = information structure). Drift across docs is a
  defect, not a style choice.
- **A product change often needs a design change behind it** — at the end of a run, ask for each changed
  entry whether it alters something DESIGN.md describes: a named section, component, affordance, or state.
  If so, recommend `design-write` and name the entry. The Scope Guardrail owns the boundary; this is the
  prompt that makes you notice it was crossed.
- **No silent deletion** — record every removal as a `REMOVED` manifest line so the user can audit it.

## Alignment Procedure (optional)

When the request is "align this doc to the code/reality" rather than a pure wording edit, run a
bidirectional drift pass instead of editing blind:

1. **Code → doc** — does the doc still describe what's shipped? List drift. Enumerate what the code
   actually exposes — generated or emitted outputs, public API surface (exported functions, parameters,
   enum members), configuration options — and confirm each appears in the doc; silently-shipped
   behavior is the common miss.
2. **Doc → code** — does the code implement what the doc claims? List drift. Test claims against the
   real mechanism, not the doc's own examples: a documented behavior tier or category (e.g. "warning"
   vs "error") must map to an actual mechanism in code; a documented value or enum must match what the
   code produces or accepts, not the sample shown; an "X drives/determines Y" claim must correspond to
   code that branches on X.
3. **Boundary + reference check** — grep the doc for `§` / `section N` (should be zero after a pass),
   and confirm every cross-doc named path resolves to a real heading in the target doc.
   - **Then check the referenced content, not just the heading** — the target heading can still exist
     while the bullet, row or rule the reference pointed at has been removed. The pointer resolves and
     means nothing. Repoint it at whatever owns the fact now, or drop it if the fact is gone.
4. **Fresh-eyes pass** — for a high-stakes alignment, have a separate subagent verify both directions
   and the boundaries, so the author isn't grading their own work.

Present the drift list for approval before editing when the changes are non-trivial — the user owns
which direction wins when code and doc disagree.
