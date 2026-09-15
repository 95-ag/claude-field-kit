---
name: curate-gallery
description: >
  Use when the user says "build/curate the design-system gallery", "set up a component
  gallery/catalog", "render the design system", "show all components", "gallery-first on
  this project", "inventory the components", or "see what components exist" — and on any
  equivalent intent: scaffolding components visually before building pages, keeping a
  living visual reference synced to DESIGN.md, or making a messy/undocumented codebase
  visible enough to author its DESIGN.md from (code-first discovery). Stack-agnostic
  (Next.js/React verified; static-HTML specified). Do NOT use to author DESIGN.md (use
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
   Drift surfaces when the parity gate runs (`verification.md` → Gate 0) — it is a
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
`design-write`) and never generates production code (that is `scaffold-design-system`).

---

## Mode-decision flow

Run this at the start of every invocation:

1. **Detect stack** → which adapter applies (React/Next, static-HTML, other). See
   `references/stack-adapters.md`.
2. **Detect DESIGN.md** — does it exist? Is it structurally healthy (correct bucket
   structure, sub-sections populated)? A missing or skeletal doc pushes toward
   Inventory or Bootstrap.
3. **Detect code presence** — are components and tokens already in the codebase?
4. **Pick mode** from the matrix:

   | Mode | Situation | Item-list source |
   |---|---|---|
   | **Build** | Clean DESIGN.md + code exists | DESIGN.md sub-sections |
   | **Inventory** | Messy/no doc, code exists | Code discovery |
   | **Sync** | Both exist, drift has accumulated | DESIGN.md ↔ code cross-check |
   | **Bootstrap** | Clean DESIGN.md, no code yet | DESIGN.md → scaffold hand-off |

5. **Confirm dev-only vs shipped** with the user (default: dev-only). The exclusion
   mechanism is adapter-specific — see `references/stack-adapters.md`.
6. **Build or refresh** the gallery following the build order and pinned structure below.
7. **On any mismatch** (doc says X, code does Y; component exists in code but not in
   doc; token referenced but undefined): **inform only** — never auto-fix. See
   Boundary + Handoff below.

For the full procedure per mode, coverage derivation, and classification rules, read
`references/modes.md`.

---

## Build order

Fixed order; do not reorder:

```
scaffold-kit  →  visualizer-kit  →  sections  →  page  →  self-review  →  sample-asset ask
```

After `page`, run the **builder doc→code self-review** (`references/verification.md` → Gate 0): walk
each of the 21 sections against its DESIGN.md sub-section + the reference implementation and self-correct
per-item drift (visualizer choice, token-data fidelity, item completeness, prose-vs-box, inline-vs-
standalone, component home, no construction leaks) BEFORE the render / build gates. A green build
does not guarantee per-section fidelity — this catches what slips through.

**Sample-asset ask (last step):** specimens needing image/diagram/media samples get a placeholder + gap
note during the build; once the gallery is built, present the needed-asset list and **ASK the user**
(generate each via the project's asset system, or keep the placeholder) — never block the build.
Detail → `references/hard-to-demo.md` → Sample assets.

**Generic↔instance split:** `scaffold-kit/` and `visualizer-kit/` are project-agnostic
and templated nearly verbatim across projects. `sections/` and `page.tsx` are the
per-project instance — they supply this project's token data and compose the kits.

---

## Pinned structure (per-stack law — reproduce exactly)

**Concept pins are stack-neutral; the file tree is per-stack.** What every gallery must contain regardless
of stack — the catalog primitives, the 9 visualizer roles, the 21-section spine, the build order — is
universal law (below + `architecture.md`). The physical file/folder tree is the **layout pin**, selected by
the same stack detection that picks the adapter (mode-decision step 1). Reproduce your stack's tree exactly:

- **React/Next (VERIFIED)** — the tree below; full annotated version in `architecture.md`.
- **Static-HTML (SPECIFIED)** — `stack-adapters.md` → Static-HTML pinned structure (equal-authority sibling).

The React/Next gallery produces exactly these files with exactly these names:

```
<gallery-route>/
├── page.tsx
├── gallery.css
├── scaffold-kit/
│   ├── catalog.tsx        ← GallerySection · SpecimenGroup · Specimen · Card
│   ├── chrome-frame.tsx   ← ChromeFrame
│   ├── click-guards.tsx   ← DemoViewOnly · InertDemo · SuppressionTip
│   └── theme-media.tsx    ← ThemeShot · ThemeVideo
│   (NO index.ts)
├── visualizer-kit/
│   ├── index.ts           ← barrel re-export
│   ├── swatch-grid.tsx
│   ├── type-scale.tsx
│   ├── bar-scale.tsx
│   ├── shape-row.tsx
│   ├── depth-grid.tsx
│   ├── motion-scale.tsx   ← DurationScale + EasingCurves (two exports)
│   ├── layer-stack.tsx
│   ├── device-ruler.tsx
│   └── span-table.tsx
│   (9 files + index.ts)
└── sections/
    ├── foundations.tsx    ← 10 GallerySections
    ├── background.tsx     ← 1 GallerySection
    ├── components.tsx     ← 3 GallerySections
    ├── domain.tsx         ← 5 GallerySections
    └── technical.tsx      ← 2 GallerySections
    (5 files exactly)
```

For the full annotated tree, public assets list, and rationale, read
`references/architecture.md`.

---

## Section spine (21 h2 sections)

In Build mode the gallery follows DESIGN.md document order exactly. Each gallery `<h2>` maps to one
DESIGN.md leaf sub-section. Title format: `{Bucket} · {Sub-section}` (e.g. `Foundations · Colors`).
Section ids are `ds-{slug}` (namespaced to prevent collision with the rail's text-derived h2 ids).

The 21 sections in order:

| Gallery h2 | DESIGN.md path | id |
|---|---|---|
| Foundations · Colors | Foundations → Colors | `ds-colors` |
| Foundations · Typography | Foundations → Typography | `ds-typography` |
| Foundations · Prose | Foundations → Prose | `ds-prose` |
| Foundations · Spacing | Foundations → Spacing | `ds-spacing` |
| Foundations · Shapes | Foundations → Shapes | `ds-shapes` |
| Foundations · Elevation & Depth | Foundations → Elevation & Depth | `ds-elevation` |
| Foundations · Motion | Foundations → Motion & Interaction | `ds-motion` |
| Foundations · Layout | Foundations → Layout | `ds-layout` |
| Foundations · Imagery | Foundations → Imagery | `ds-imagery` |
| Foundations · Iconography | Foundations → Iconography | `ds-iconography` |
| Background | Background | `ds-background` |
| Components · Shell | Components → Shell | `ds-shell` |
| Components · UI | Components → UI | `ds-ui` |
| Components · Document | Components → Document | `ds-document` |
| Domain · Home Page | Domain Components → Home Page | `ds-home` |
| Domain · Work Index | Domain Components → Work Index | `ds-work` |
| Domain · Project Detail | Domain Components → Project Detail | `ds-project` |
| Domain · About Layouts | Domain Components → About Layouts | `ds-about` |
| Domain · 404 Not Found | Domain Components → 404 Not Found | `ds-not-found` |
| Interaction · Responsive Behavior | Interaction Rules → Responsive Behavior | `ds-responsive` |
| Technical · Z-Index Scale | Technical Conventions → Z-Index Scale | `ds-z-index` |

For the per-section visualizer mapping, prose-vs-box rules, Components sub-grouping, and Domain
ordering, read `references/section-spine.md`.

---

## Dogfood gate (non-negotiable)

The gallery renders the design system **with** the design system. These rules are enforced in every
section, every visualizer, and every specimen:

**Typography — no overrides.** All text uses the project's type-scale token classes directly
(e.g. `body-primary`, `mono-anchor`, `heading-component`). Never add raw Tailwind utilities
(`text-sm`, `font-medium`, `text-[--ink]`) alongside a token class. The token class IS the style.
A needed text pairing with no token → add a token to the design system first, then consume it.

**Prose stays prose — no gratuitous boxes.** Prose content (rules, lists, notes) renders as
plain `.prose-content` markup. Wrapping prose in a `Card`, bordered `div`, or visual well when the
design system itself has no such treatment is a violation. Visualizer cards and `Card` primitives
are used only where the design itself uses them (color swatches, depth cards, icon grids, etc.).

**Real components, real sample data.** Component and Domain specimens import and render the REAL
production component with representative sample data. Never hand-fake markup that approximates the
component's output.

**Every rendered affordance traces to a doc rule.** The other rules govern HOW something renders; this
one governs WHETHER it may render at all. A gallery may frame its own demo — labels, inert wrappers,
chrome, click guards, "this control is disabled in the preview" — but it may NEVER invent product
behavior. An action, link, field, or state with no rule behind it in DESIGN.md or the product doc is
drift that a build, a linter, and a type checker all report as fine.

**Sample data is bounded by the content schema.** Schema-valid is the floor, not the test. Sample data
may not introduce a field the real schema does not have — a demo field manufactures the affordance
built on top of it. Where a shape is missing
and the demo needs one, that is a gap to report, not to fill.

**Real imports.** Every import path resolves in the actual codebase. Fabricated or placeholder
imports fail the build.

---

## `page.tsx` requirements

The gallery page is a thin server component with this structure:

```
export const metadata = { title: "Design System", robots: { index: false, follow: false } }

export default function DesignSystemPage() {
  return (
    <Section><Container>
      <SectionProgressNav />          {/* LIVE rail — above the header; scrapes DemoViewOnly article */}
      <header>
        <Heading level={1} type="display-title">Design System</Heading>
        <p class="body-lead">...</p>
        <div class="flex items-center gap-[--spacing-sm]">
          <span class="mono-anchor">Theme</span>
          <InlineThemeSelector />     {/* OUTSIDE DemoViewOnly — stays interactive */}
        </div>
        <div class="body-caption">Dev-only reference, excluded from the production build.</div>
      </header>
      <DemoViewOnly class="flex flex-col gap-[--spacing-4xl]">
        <FoundationsSections />
        <BackgroundSection />
        <ComponentsSections />
        <DomainSections />
        <TechnicalSections />
      </DemoViewOnly>
    </Container></Section>
  )
}
```

Invariants: `robots: { index: false, follow: false }` always present; `SectionProgressNav` above the
header (not inside `DemoViewOnly`); `InlineThemeSelector` in the header outside `DemoViewOnly` (the
UI catalog references this instance, never duplicates it); section order Foundations → Background →
Components → Domain → Technical. Full template with annotated imports → `references/architecture.md`.

---

## `gallery.css` requirements

The route-scoped stylesheet contains exactly three rule blocks:

```css
/* ThemeShot theme swap — only the active theme's screenshot is shown */
[data-theme="dark"]  .ds-shot-light { display: none }
[data-theme="light"] .ds-shot-dark  { display: none }

/* Reading-mode surface scope — mirrors globals.css data-read="long" blocks */
.ds-reading { --surface: #f8f8f9; --surface-floating: #f8f8f9d9; }
[data-theme="dark"] .ds-reading {
  --surface: #1a1a1a; --surface-elevated: #292929;
  --surface-deep: #141414; --surface-floating: #1f1f1fd9;
}

/* Reading-mode-only cards — hidden in light where they hold */
[data-theme="light"] .ds-reading-darkonly { display: none }
```

The `.ds-reading` values must stay in sync with `globals.css`'s `[data-read="long"]` blocks.
No other rules belong in this file. Full contents with comments → `references/architecture.md`.

---

## Boundary + handoff in brief

**Read-only on production code.** The gallery writes only inside its own gallery area. It never
edits production components, foundation CSS, or tokens — not on first build, not during Sync,
not when DESIGN.md changes.

**Carve-out (the only exception):** demoing chrome / fixed-position / page-coupled components may
require a minimal demo affordance in the production component. Permitted only with explicit per-case
user agreement, kept minimal (prefer a prop or a presentational sub-component extraction over logic
changes). See `references/boundaries-and-handoff.md` for the carve-out rules and verified patterns.

**Inform-only handoff:** the gallery detects and reports — the user decides and confirms.

| Mismatch detected | Fixer (invoke on user confirmation) |
|---|---|
| Doc out of line with intent/code | `design-write` |
| Code out of line with doc | `scaffold-design-system` (align mode) |
| Code missing | `scaffold-design-system` (fresh mode) |
| Repeats in code but not extracted | Both — `scaffold-design-system` (extract) + `design-write` (document) |

Full boundary rules, the carve-out, and handoff protocol: `references/boundaries-and-handoff.md`.

---

## Reference index

Read each reference when the task enters that area — do not pre-load all of them.

| Reference | Read when… |
|---|---|
| `references/architecture.md` | Understanding the spine-vs-adapter model; the **pinned file/folder structure + exact names**; generic↔instance split; data-binding; `ds-{slug}` namespacing; the `page.tsx` template (title, rail mount, theme-selector placement, noindex, section order, background handling); `gallery.css` exact contents |
| `references/modes.md` | Running Build, Inventory, Sync, or Bootstrap; deriving the item list; classifying components; strict DESIGN.md → spine mapping |
| `references/section-spine.md` | The **fixed 21-section template**: ordered sub-sections, which visualizer/structure renders each, prose-vs-box rule; Components Shell/UI/Document sub-grouping; Domain order + `[inline]`/`[standalone]`; real-import + sample-data requirement |
| `references/scaffold-kit.md` | Building the project-agnostic scaffolding — `GallerySection` / `SpecimenGroup` / `Specimen` / `Card` as pseudocode; `ChromeFrame`; click-guards (`DemoViewOnly` / `InertDemo`); theme-media (`ThemeShot` / `ThemeVideo`) |
| `references/visualizer-kit.md` | Building or consuming any token visualizer (SwatchGrid, TypeScaleList, BarScale, ShapeRow, DepthGrid, DurationScale, EasingCurves, LayerStack, DeviceRuler, SpanTable); the dogfooding gate; prop types; exact card/layout structure |
| `references/boundaries-and-handoff.md` | The code-write boundary; the production carve-out and its patterns; the inform-only handoff; the fixer triad; design-write and scaffold-design-system interaction boundaries |
| `references/hard-to-demo.md` | Demoing a fixed/page-coupled component (ChromeFrame, demo-affordance prop, presentational extraction); the Shiki/MDX pipeline (REQUIRED for code specimens) + `.prose-content` scope caveat; overlay-on-hero (separate specimen); TOC rail handling; live-vs-screenshot; sample assets via the project's generators |
| `references/stack-adapters.md` | Any stack-specific seam: creating a dev-only route; rendering a component live; running build-time transforms; flipping themes; excluding from production; discovering components/tokens in code. React/Next (verified); static-HTML (specified, unverified) |
| `references/verification.md` | The **builder per-section doc→code self-review (Gate 0)**; render-backed verification (playwright, theme-flip, rAF freeze, PNG diff); build gate; the maintainer-only skill self-test (parity dogfood — needs a reference gallery) |

---

## Validation checklist

Before handing off to the user, confirm all items pass:

- [ ] Mode chosen matches the evidence (DESIGN.md state + code state)
- [ ] Dev-only vs shipped confirmed with the user
- [ ] Build order followed: `scaffold-kit → visualizer-kit → sections → page`
- [ ] **Pinned structure reproduced exactly** — file names, folder names, and counts match
      (`references/architecture.md`)
- [ ] **21 sections present in DESIGN.md document order** — bucket-prefixed titles, `ds-{slug}` ids
      (`references/section-spine.md`)
- [ ] **Dogfooding gate passes** — no raw hex, no typography overrides (no `text-sm`, `font-medium`,
      `text-[--ink]` alongside a token class), no gratuitous boxes around prose, all visual details
      resolve from the project's own design-system tokens
- [ ] **Real components imported** — every import path resolves; no hand-faked markup
- [ ] **Sample assets handled** — every specimen needing an image/diagram/media sample has one or a
      placeholder + gap note; the needed-asset list was surfaced and the user asked (generate / placeholder)
- [ ] **Doc→gallery parity review done** — every section (Build) or every changed section (Sync)
      compared against its mapped DESIGN.md sub-section, rule for rule, **by something that did not
      make the edits**: claim fidelity, visualizer choice, per-item token-data fidelity, item coverage
      in both directions, new shapes exercised, prose-vs-box, inline-vs-standalone, component home,
      property-block scope, no construction leaks (`references/verification.md` → Gate 0). Where no
      separate reviewer was available, that is stated rather than the gate being recorded as fully met.
- [ ] **No invented affordance** — every rendered action, link, field and state traces to a rule in
      DESIGN.md or the product doc; sample data introduces no field the real schema lacks
- [ ] Render-backed verification done — real browser render at relevant viewport(s) and both themes
- [ ] Build gate green — linter, typecheck, and production build pass; gallery route prerenders; zero
      duplicate ids
- [ ] Code-write boundary respected — no edits to production code without explicit per-case user agreement
- [ ] Every mismatch reported to the user; no auto-fixes applied
