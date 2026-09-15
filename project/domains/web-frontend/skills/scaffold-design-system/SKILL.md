---
name: scaffold-design-system
description: >
  Use when the user says "scaffold the Button from spec", "align the nav to DESIGN.md",
  "build all missing primitives", "generate the token layer", "materialize the design
  system" — and on any equivalent intent: turning documented design decisions into real
  code, or bringing drifted code back in line with the doc. Materializes the design
  system's code layer — foundations (token/theme CSS) and reusable components — from
  DESIGN.md, under the target repo's own rules and verification gate. Project-native
  (Next.js/Tailwind v4 verified; other stacks specified, not yet exercised). It emits only
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
| | DESIGN.md itself — that is `design-write` |

This skill owns its own scope; the table above is canonical for it. The **gallery's** side of
the seam — its read-only code-write boundary and the inform-only handoff that dispatches this
skill — is defined once in `curate-gallery/references/boundaries-and-handoff.md`.

**Demo affordances are this skill's to emit.** That file's per-case user gate binds the gallery;
this skill is pre-authorized for the two patterns `hard-to-demo.md` names, on a component that
matches one of its documented triggers. Both conditions, and the procedure for naming and
recording each touch-point → `references/components.md`.

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
| Token names, values, and every visual constant | DESIGN.md → Foundations |
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
  rather than relocating the file (`references/components.md` → Prop shape, prop type, and element
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
   Dependency rules → `references/components.md`.
7. **Generate**, foundations before the components that consume them.
8. **Verify with compiled evidence**, then run the repo's gate. A green build does not
   prove a utility exists or a first frame is correct → `references/verification.md`.
9. **Report every mismatch; fix none of them in the doc.** Doc drift, spec gaps, and
   contradictions hand off to `design-write` on the user's confirmation.

---

## Reference index

Read each reference when the run enters that area — do not pre-load all of them. Each row
names that reference's full topic set, so a rule is never left without a home.

| Reference | Read when… |
|---|---|
| `references/operations.md` | Choosing and running Fresh or Align; resolving run scope; handling documented-but-not-generatable entries; transcribing rather than inventing, and the one escape hatch — a value rendering requires that the doc omits is inferred narrowly, reported as inferred, and handed to `design-write`, never invented silently and never stalled on; reporting doc drift, with a status **and** an owner on every logged spec gap; the two invocation paths and resolving a dispatched operation from evidence rather than the dispatch label |
| `references/foundations-mapping.md` | Materializing the token layer: fenced-block triage over the whole doc (every block, plus values stated only in prose); which keys become tokens and which resolve at the point of use; composite typography roles and the class layer their unmodifiable properties force; `@theme static` as the requirement for a published contract; scale key names that collide with the framework's own scales; namespace closures and the zero-step utilities they remove; a token's home is its namespace, and a token with no namespace is consumed as `utility-(--token)`, never rehomed into one whose utilities would lie about it; the layer emits **no** global reduced-motion kill-switch — that obligation is reassigned to each motion-attaching component; a habitual best practice can be off-spec, and the doc wins; exhaustive replacement of unsanctioned boilerplate, including naming the collateral breakage it causes in files outside this skill's scope; a published contract names the mount point that satisfies it, when that mount point lies outside the run; the stylesheet file split |
| `references/components.md` | Generating a component: dependency ordering over the whole set, and the prohibition on emitting any component the run's item list does not name, even to satisfy an import — tested by whether the doc gives the thing its own entry, which overrides a "plus whatever they depend on" instruction and exempts only a structural file no entry owns; deriving the server/client boundary from described behavior, and its two naming traps — a component's name is not its behavior, and a section's motion is not the component's; `'use client'` is file-scoped, so a presentational extraction out of a client component is a forced two-file split, not a preference — and the extracted half carries no directive, no hooks and no side-effects, which is the whole point of the split; prop shape and element choice, against what the framework's preflight already supplies — props decide the layer, so a documented portable component needing domain data is flattened, never relocated; multi-value tokens composed into one utility rather than stacked; per-case defaults, because a default is a claim about the first paint; effect dependencies — a callback prop is almost never stable, so acquire/release work is never co-located with work that has real dependencies; a component that locks scroll owns capture and replay, not just `overflow`; two mechanisms a spec sanctions for one effect are candidates, not a free choice — the component's other constraints can eliminate one, so choose by render and record the constraint that forced it; preferring the platform's declarative mechanism over a scripted one where it exists, guarded so an unsupported engine falls through to a correct static state, which makes the reduced-motion gate structural and removes the pre-script default entirely; the first component to establish a contrast ground rebinds the focus ring on its own subtree; checking whether the spec scopes a fallback to a runtime state before branching on data to pick one; each motion-attaching component owning its reduced-motion gate, honored at the source; a fenced block under a component heading, deferred here by the token layer's triage; placement, naming, and evaluating the structure rule's foldering threshold against a bulk run's resulting set rather than per item; demo affordances — the two patterns, their triggers, and how each touch-point is named and recorded |
| `references/verification.md` | Proving the output: the five-gate ladder — authoring self-review, cold-regeneration diff, build, render, human sign-off per visual layer — and that none of it runs after staging; compile-probe evidence and the probe harness's own constraints, since a green build never proves a utility exists; mount-render-drive and watching the first client frame; framework configuration the gate cannot report, the one narrow licence to edit it, and naming each such edit with what breaks without it; command order — the repo's full fix pass, never a format-only one, before the verifying pass — cold-cache traps, and tearing the probe down before the gate; re-running every finding established before a foundational decision changed; naming a cause only once it is isolated by falsification; the operation status table |
