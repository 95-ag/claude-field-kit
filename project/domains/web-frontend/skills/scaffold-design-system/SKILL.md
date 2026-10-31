---
name: scaffold-design-system
description: >
  Use when the user says "scaffold the Button from spec", "align the nav to DESIGN.md",
  "build all missing primitives", "generate the token layer", "materialize the design
  system" — and on any equivalent intent: turning documented design decisions into real
  code, or bringing drifted code back in line with the doc. Materializes the design
  system's code layer — foundations (token/theme CSS) and reusable components — from
  DESIGN.md, under the target repo's own rules and verification gate. It emits only
  what DESIGN.md already states — token names and values are added to the doc by
  design-write first. Do NOT use to author or edit DESIGN.md (that is design-write) or to
  build the dev-only component gallery (that is curate-gallery).
---

# scaffold-design-system

Materializes the design system's **code layer** from DESIGN.md — the foundations and
components the doc describes, written into the project's real component tree.

Complement to `design-write`: that skill owns the doc, this one owns the code the doc
describes. It never authors design intent.

Two operations, one scope question:

- **Fresh** — DESIGN.md describes it, no code exists; create from spec.
- **Align** — code exists and has drifted; apply the minimum change that matches the spec.
- **Scope** — one item, a named subset, or every documented-but-missing item.

Full procedure for both, and the invocation paths: `references/operations.md`.

---

## Scope

| Touches | Never touches |
|---|---|
| Foundations — token/theme CSS, framework token mappings, the type-scale layer | `[inline]` domain components |
| Reusable components — `ui/` `layout/` `shell/` `icons/` `background/` `document/` | Page composition |
| `[standalone]` domain components | Content wiring and content population |
| Framework configuration, narrowly — see `references/verification.md` → Framework configuration the gate cannot report | The gallery's own area |
| A page's export of a fragment the gallery demos, narrowly — `references/component-set.md` → Demo affordances | |
| An out-of-scope file's forced typecheck edit, narrowly — `references/foundations-boundaries.md` → Exhaustive replacement | |
| | DESIGN.md itself — that is `design-write` |

This skill owns its own scope; the table above is canonical for it. The **gallery's** side of
the seam — its read-only code-write boundary and the inform-only handoff that dispatches this
skill — is defined once in `curate-gallery/references/boundaries-and-handoff.md`.

**Demo affordances are this skill's to emit.** That file's per-case user gate binds the gallery;
this skill is pre-authorized for the two patterns in `curate-gallery/references/boundaries-and-handoff.md`
→ Carve-out, on a component matching one of that section's triggers. The procedure — which pattern applies, how each touch-point is named and
recorded → `references/component-set.md`. Exporting a fragment private to a page
needs neither a pattern nor a trigger; its own rule is in the same file.

---

## The page-bound test, operationalized

The repo's component-structure rule requires every domain entry in DESIGN.md to carry a
placement tag: `[inline]` or `[standalone]`. A doc may instead mark an entry as a placeholder
whose design is not finished, under a token its legend defines (e.g. `[pending design]`).

**Both tags mark page-bound components** — the tag distinguishes **file existence**, not
page-boundness. No separate judgment is made at generation time:

| Tag | Meaning | This skill |
|---|---|---|
| `[standalone]` | has its own file | **in scope** — generate it |
| `[inline]` | composed inside a page | out of scope — skip and report |
| pending design (e.g. `[pending design]`) | placeholder; design not finished | out of scope — skip and report as a design gap |

An untagged domain entry is doc drift, not a judgment call: report it and hand off to
`design-write` rather than guessing the placement.

Skip-and-report procedure and the pending-design case → `references/operations.md` → Documented ≠
generatable.

---

## Project-native contract

The skill generates **into a specific repo under that repo's rules**, not from a built-in
house style. Before writing anything, resolve each input from its owner:

| Input | Owner |
|---|---|
| Where a component file goes, and its name | the repo's component-structure rule |
| Token values | DESIGN.md → YAML Registry (a color or typography value may instead be defined in a Foundations table) |
| Token names and roles, and every other visual constant | DESIGN.md → Foundations (z-index layers: Technical Conventions → Z-Index Scale) |
| Which stylesheet a concern lives in, and when it splits | the repo's design-system rule |
| Server/client boundary, imports, fonts, images | the repo's framework rule |
| Accessibility floors and motion obligations | the repo's accessibility and motion rules |
| The commands that prove the work | the repo's build-verification rule |

**A structure rule names layers, not roots.** The component tree's root and the stylesheet directory
are usually stated nowhere, yet every emitted import path depends on them. Resolve both before
emitting, in this order: **existing convention** (where components, stylesheets and the framework's
own entry files already sit) → **the project's declared path aliases** (an alias names the root it
resolves to) → **the framework's documented default**. Where all three are silent, ask — a guessed
root is a whole-tree rewrite to correct, not an edit. **Record the resolved roots in the report.**

Two consequences that hold on every run:

- **Rules win over the doc on placement.** Where DESIGN.md files a component under a
  section the structure rule maps elsewhere, the rule decides where the file goes — and
  the disagreement is reported for `design-write`, never silently absorbed. A disagreement the
  component's **props** create is not one of these: flatten the props so both authorities hold,
  rather than relocating the file (`references/component-shape.md` → Prop shape, prop type, and element
  choice).
- **The gate is the repo's, run after every write.** A generator writes files
  programmatically, so it inherits no on-edit formatting; it runs the repo's fix pass
  and then the gate explicitly. Detail → `references/verification.md`.

*Example:* placement from `rules/web-frontend/component-structure.md`, tokens
from `.claude/docs/DESIGN.md`, stylesheet split from `rules/web-frontend/design-system.md`,
framework conventions from `rules/node/nextjs.md`, gate from `rules/node/build-verification.md`.

---

## Operation-decision flow

Run this at the start of every invocation:

1. **Read DESIGN.md whole** — every fenced block *and* every value stated only in prose.
   A doc carries more than one block, and a block's scope is set by the heading above it.
   Triage rules → `references/foundations-mapping.md`.
2. **Read the target repo's rules** — the six inputs in the contract table above.
3. **Resolve scope** — one item, a named subset, or all documented-but-missing items
   (`references/operations.md`).
4. **Pick the operation per item** — no code → Fresh; code exists → Align.
5. **Filter the item list** — drop `[inline]` and pending-design entries, reporting each.
6. **Order the remaining items topologically** over the whole set — never alphabetically
   and never folder by folder, both of which emit a consumer before its dependency.
   Dependency rules → `references/component-set.md`.
7. **Generate**, foundations before the components that consume them.
8. **Verify with compiled evidence**, then run the repo's gate. A green build does not
   prove a utility exists or a first frame is correct → `references/verification.md`.
9. **Write the run report, and fix nothing in the doc.** Every rule in these references that defers
   to the run's record discharges here; its required sections are listed in
   `references/operations.md` → The run report, and a section with nothing to report says so. Doc
   drift, spec gaps, and contradictions hand off to `design-write` on the user's confirmation.

---

## Reference index

Read each reference when the run enters that area — do not pre-load all of them. Each row lists its
reference's sections, in order; the rows state no rules — the rules live in the reference.

| Reference | Read when… |
|---|---|
| `references/operations.md` | Choosing and running an operation, resolving its scope, and reporting. Sections: Fresh — create from spec · Align — bring existing code to the spec · Scope resolution · In scope: the placement tag decides · Documented ≠ generatable · Doc drift is reported, not fixed · The run report · Invocation paths |
| `references/foundations-mapping.md` | Turning documented values into tokens. Sections: Triage the whole document · Which keys become tokens · A token's home is its namespace · Composite typography roles force a class layer · Motion: the layer emits no reduced-motion kill-switch |
| `references/foundations-framework.md` | Writing the token layer against the framework. Sections: `@theme static` — the layer is a published contract · Scale keys that collide with the framework's own scales · Namespace closures remove derived utilities |
| `references/foundations-boundaries.md` | Work that reaches past the token layer's edges. Sections: Exhaustive replacement · A published contract names its mount point · The stylesheet file split |
| `references/component-set.md` | Once per run, for the component set as a whole. Sections: Order the whole set topologically · A dependency edge that points outside the batch · Placement, naming, and the foldering threshold · Demo affordances · Export the real thing; never let the gallery hold a second copy |
| `references/component-shape.md` | Writing one component's signature and markup. Sections: Derive the server/client boundary from described behavior · `'use client'` is file-scoped, so an extraction is a two-file split · Prop shape, prop type, and element choice · Tokens at the point of use |
| `references/component-behavior.md` | Writing one component's effects and motion. Sections: A default value is a claim about the first paint · Effects: dependencies, and work that must not share one · A spec names a side-effect; it rarely describes the technique · Two sanctioned mechanisms are not two valid choices · Prefer the platform's declarative mechanism over a scripted one · The first component to establish a contrast ground rebinds the focus ring · A runtime-state fallback is not a data check · Motion: each component owns its own gate |
| `references/verification.md` | Proving the output. Sections: The gate ladder · A green build never proves a utility exists · The probe harness · Mount, render, drive, and watch the first client frame · Framework configuration the gate cannot report · Command order · Two method rules that govern every finding · Re-run every finding established before a foundational decision changed · Name a cause only once it is isolated by falsification |

---

## Operation status

| Path | Status |
|---|---|
| Foundations / Fresh | EXERCISED — one hand pass plus three cold regenerations, none of them independent (below) |
| Components / Fresh | EXERCISED — one hand pass plus three cold regenerations, none of them independent (below) |
| Align (either) | SPECIFIED — no drift case has existed to exercise it |

**No cold run has been independent.** All three regenerations ran in the target repo, whose
agent-instruction file auto-imports the project's own working notes — session state, task list,
lessons — and those state the prior runs' conclusions verbatim. Stripping worked examples out of these
files was necessary and not sufficient: the answers were still available as ambient project context
before the procedure was read. **A genuinely independent trial requires a different repository.** A
project validating a skill this way checks what its own agent-instruction files auto-load before
treating a run as cold.

**The whole evidence base is a single Next.js / Tailwind v4 pass.** Every framework-specific finding
in these references was measured once, on one stack, on the versions named at the top of each file.
Treat a surprise on another stack — or another major version — as a finding about these files, and
file it as a note against the skill rather than working around it.
