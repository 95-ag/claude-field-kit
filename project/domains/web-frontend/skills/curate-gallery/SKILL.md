---
name: curate-gallery
description: >
  Use when the user says "build/curate the design-system gallery", "set up a component
  gallery/catalog", "render the design system", "show all components", "gallery-first on
  this project", "inventory the components", or "see what components exist" — and on any
  equivalent intent: scaffolding components visually before building pages, keeping a
  living visual reference synced to DESIGN.md, or making a messy/undocumented codebase
  visible enough to author its DESIGN.md from (code-first discovery). Stack-agnostic
  (adapters EXERCISED: Next.js/React in Build and Sync, static-HTML in Inventory). Do NOT use to author DESIGN.md (use
  design-write) or to generate production component/foundation code (that is the
  scaffold-design-system hand-off).
---

# curate-gallery

Builds and maintains a dev-only design-system gallery — a live catalog that renders
the project's design system so a human can see it. Three jobs:

1. **Scaffold-first** — finalize components visually before building pages; the gallery
   confirms every token, component, and pattern looks right before page work starts.
2. **Living reference** — see DESIGN.md rendered in the browser. `[standalone]` entries
   render live; `[inline]` ones are listed with their page location, never recreated; entries still pending
   design show a placeholder card.
   Drift surfaces when the parity gate runs (`parity-review.md` → Gate 0) — it is a
   gate the skill performs, not a property the gallery has by existing. A gallery
   left unreviewed contradicts its doc while typechecking, linting and rendering clean.
3. **Code-first discovery** — make a messy or undocumented codebase visible enough to
   author its DESIGN.md from (the gallery catalogs what exists, then design-write
   documents it).

**When to use (gallery-first):** stand up the gallery early on any new or messy
front-end project — before building pages. On a new project with a clean DESIGN.md,
build the gallery first to validate the design system is real and renderable before
committing to page composition. On a messy or undocumented project, run the gallery
in Inventory mode to surface what exists before authoring the doc.

The gallery renders the design system **with** the design system (dogfooding), so the
gallery itself can't silently drift from it. It never authors DESIGN.md (that is
`design-write`), never generates production code (that is `scaffold-design-system`), and never tunes a
value by eye before it is decided (that is `design-tweak`).

---

## Mode-decision flow

Run `references/modes.md` → Mode-decision flow at the start of every invocation, before any gallery
work. It detects the stack, DESIGN.md, code and an existing gallery, and picks one of four modes —
**Build**, **Sync**, **Inventory** or **Bootstrap** — each with its own item-list source and procedure in
the same file. On any mismatch the gallery informs only, never auto-fixes (Boundary + handoff below).

---

## Build order

Fixed order; do not reorder:

```
scaffold-kit  →  visualizer-kit  →  sections  →  page  →  parity review  →  sample-asset ask
```

After `page`, run the **doc→gallery parity review** (`references/parity-review.md` → Gate 0) — by a
reviewer that did not make the edits, never as a self-review: walk
every section against its DESIGN.md sub-section + the reference implementation and self-correct
per-item drift (visualizer choice, token-data fidelity, item completeness, prose-vs-box, inline-vs-
standalone, component home, no construction leaks) BEFORE the render / build gates. A green build
does not guarantee per-section fidelity — this catches what slips through.

**Sample-asset ask (last step):** specimens needing image/diagram/media samples get a placeholder + gap
note during the build; once the gallery is built, present the needed-asset list and **ASK the user**
(generate each via the project's asset system, or keep the placeholder) — never block the build.
Detail → `references/demo-placement-and-media.md` → Sample assets.

**Generic↔instance split:** `scaffold-kit/` and `visualizer-kit/` are project-agnostic
and templated nearly verbatim across projects. `sections/` and `page.tsx` are the
per-project instance — they supply this project's token data and compose the kits.

---

## Pinned structure (per-stack law)

**Concept pins are stack-neutral; the file tree is per-stack.** What every gallery must contain regardless
of stack — the catalog primitives, the 9 visualizer roles, the section spine, the build order — is
universal law. The physical file/folder tree is the **layout pin**, selected by the same stack detection
that picks the adapter (`modes.md` → Mode-decision flow, step 1). Reproduce your stack's tree exactly.

- **React/Next (EXERCISED in Build and Sync; Inventory SPECIFIED)** — `architecture.md`, which holds the annotated tree and the
  generic↔instance split. **The tree is stated there and only there**; a second copy drifts from it.
- **Static-HTML (EXERCISED in one Inventory shakedown)** — `stack-adapter-static-html.md` → Static-HTML pinned structure (equal-authority
  sibling).
- `page.tsx` and `gallery.css` contents → `page-and-css.md`.

## Section spine (one h2 per DESIGN.md sub-section)

In Build mode the gallery follows DESIGN.md document order exactly. Each gallery `<h2>` maps to one
DESIGN.md leaf sub-section. Title format: `{Bucket} · {Sub-section}` (e.g. `Foundations · Colors`).
Section ids are `ds-{slug}` (namespaced to prevent collision with the rail's text-derived h2 ids).

**The complete ordered list lives in `section-spine.md` → Appendix: Complete Section Order**, with each
bucket's per-section template in its own `spine-*.md` file. It is not repeated here: the count is
DESIGN.md's, not this skill's, and a second copy of the order is a second thing to keep in step.

## Boundary + handoff in brief

**Read-only on production code.** The gallery writes only inside its own gallery area. It never
edits production components, foundation CSS, or tokens — not on first build, not during Sync,
not when DESIGN.md changes.

**Carve-out (the only exception):** demoing chrome / fixed-position / page-coupled components may
require a minimal demo affordance in the production component. Permitted only with explicit per-case
user agreement, kept minimal (prefer a prop or a presentational sub-component extraction over logic
changes). See `references/boundaries-and-handoff.md` for the carve-out rules and the two sanctioned patterns.

**Inform-only handoff:** the gallery detects and reports — the user decides and confirms which fixer
runs. The fixer per mismatch, the carve-out and the handoff protocol: `references/boundaries-and-handoff.md`.

---

## Reference index

Read each reference when the run enters that area — do not pre-load all of them.

| Reference | Read when… |
|---|---|
| `references/modes.md` | Deciding the mode (Build / Sync / Bootstrap / Inventory); each mode's procedure and item-list source; classifying components; **discovering components and tokens in code** when no DESIGN.md exists yet |
| `references/build-coverage.md` | Build and Sync: deriving coverage from DESIGN.md, the strict spine mapping, what goes in or stays out, Domain sections, the real-component import rule |
| `references/architecture.md` | The pinned file/folder tree, the generic↔instance split, data binding, `ds-{slug}` ids |
| `references/page-and-css.md` | Writing the route file and the gallery stylesheet |
| `references/section-spine.md` | The three-layer contract, the pins that apply to every section, the strict DESIGN.md→spine mapping, and the complete section order — **routes to the four `spine-*.md` bucket files** |
| `references/spine-foundations-base.md` | Building Colors · Typography · Prose · Spacing · Shapes |
| `references/spine-foundations-visual.md` | Building Elevation & Depth · Motion · Layout · Imagery · Iconography |
| `references/spine-background-components.md` | Building Background · Shell · UI · Document, including the **Components Shell/UI/Document sub-grouping** |
| `references/spine-domain-technical.md` | Building the project's own page/feature areas — their order and the **`[inline]` vs `[standalone]`** treatment — plus Responsive Behavior · Z-Index Scale |
| `references/scaffold-kit.md` | The section and group wrappers — **routes to the other `scaffold-*.md` files** |
| `references/scaffold-specimen.md` | The specimen and card primitives — prop types, exact card/layout structure, field order; local kit extensions and the restatement risk they carry |
| `references/scaffold-chrome-theme.md` | Staging a demo in page chrome, or showing one in both themes at once |
| `references/scaffold-guards.md` | Stopping a demo navigating or mutating, and how the guards nest |
| `references/visualizer-kit.md` | The visualizers' shared three-layer contract, pinned filenames, generic fallbacks — **routes to the per-visualizer files** |
| `references/visualizer-scales.md` | SwatchGrid (colors) · BarScale (spacing) |
| `references/visualizer-type.md` | TypeScaleList |
| `references/visualizer-depth.md` | DepthGrid (elevation) · LayerStack (z-index) |
| `references/visualizer-motion.md` | DurationScale · EasingCurves |
| `references/visualizer-layout.md` | ShapeRow · DeviceRuler · SpanTable |
| `references/visualizer-dogfood.md` | The gate every visualizer must pass before its section is done |
| `references/hard-to-demo.md` | A component that resists a bounded frame: fixed chrome, side-effects, breakpoint-gated, build-time transforms, **a component absolutely positioned in production within another's bounds** |
| `references/demo-placement-and-media.md` | **The TOC rail**, the theme selector and which specimen takes which click guard; sample assets via the project's own generators; live-vs-screenshot |
| `references/parity-review.md` | **Gate 0 parity review** by a reviewer that did not make the edits; **the gallery is a visual partner to the doc, not a second copy of it**; item-level coverage |
| `references/verification.md` | The gate sequence; render and build gates; the maintainer self-test; stack-proof status |
| `references/final-checks.md` | Finishing: the dogfood gate and the validation checklist |
| `references/boundaries-and-handoff.md` | The read-only code-write boundary; the demo-affordance carve-out and its two patterns; **the fixer triad** and the inform-only handoff that dispatches `scaffold-design-system`; where this skill's authority ends and `design-write`'s begins |
| `references/stack-adapters.md` | Any stack-specific seam: a dev-only route, rendering a component, theme flip, production exclusion — the seams and the React/Next adapter |
| `references/stack-adapter-static-html.md` | The same seams on a static-HTML project: its pinned structure, output-parity map and each seam |

## Finishing a run

Two lists close a run and neither is optional — **the dogfood gate** (the gallery obeys the design system
it displays) and **the validation checklist** (every pinned requirement is present). Both are in
`final-checks.md`, and they sit after the gates in `parity-review.md` and `verification.md`, never instead of them. The run ends
in **the run report** (`final-checks.md` → The run report), where every "report it" rule discharges.
