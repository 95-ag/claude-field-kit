# Architecture

How the gallery is structured. Covers the spine-vs-adapters model, the pinned file/folder structure,
generic↔instance split, data-binding rules, `ds-{slug}` id namespacing, the `page.tsx` template,
and `gallery.css` contents.

Stack-specific seams (route creation, dev-only exclusion, theme flip, component discovery) are adapter
concerns — see `stack-adapters.md`.

---

## Spine vs adapters

The gallery has two layers:

**Spine (stack-neutral)** — the catalog model; dogfooding gate; visualizer concepts; build order; mode
logic; theme rules; TOC requirement; render-verification requirement; handoff protocol; code-write
boundary. This layer is what makes the gallery a gallery regardless of tech stack.

**Adapters (stack-specific)** — the six seams that vary per framework: (a) make a dev-only route,
(b) render a component live, (c) run build-time transforms, (d) flip themes, (e) exclude from
production, (f) discover components/tokens in code. See `stack-adapters.md` for the React/Next adapter
(verified) and the static-HTML adapter contract (specified, unverified).

The spine is stable. Adapters change per project. Do not bake adapter specifics into the spine files.

---

## Pinned file/folder structure

The gallery produces exactly this directory tree. Names are law — reproduce them exactly, always.

```
<gallery-route>/
├── page.tsx                   ← thin route: metadata, imports 5 section exports, mounts rail + header
├── gallery.css                ← dev-only rules: ThemeShot swap + .ds-reading reading-mode scope
│
├── scaffold-kit/              ← GENERIC — zero project/schema assumptions
│   ├── catalog.tsx            ← GallerySection · SpecimenGroup · Specimen · Card
│   ├── chrome-frame.tsx       ← ChromeFrame
│   ├── click-guards.tsx       ← DemoViewOnly · InertDemo (+ SuppressionTip portaled to <body>)
│   └── theme-media.tsx        ← ThemeShot · ThemeVideo
│   (NO index.ts in scaffold-kit — 4 files exactly)
│
├── visualizer-kit/            ← GENERIC — data-driven; all project values come from sections/
│   ├── index.ts               ← barrel re-export of ALL 9 visualizers
│   ├── swatch-grid.tsx        ← SwatchGrid
│   ├── type-scale.tsx         ← TypeScaleList
│   ├── bar-scale.tsx          ← BarScale
│   ├── shape-row.tsx          ← ShapeRow
│   ├── depth-grid.tsx         ← DepthGrid
│   ├── motion-scale.tsx       ← DurationScale + EasingCurves (two exports, one file)
│   ├── layer-stack.tsx        ← LayerStack
│   ├── device-ruler.tsx       ← DeviceRuler
│   └── span-table.tsx         ← SpanTable
│   (9 visualizer files + 1 index.ts = 10 files exactly)
│
└── sections/                  ← PER-PROJECT instance: token data + kit composition
    ├── foundations.tsx        ← FoundationsSections() — 10 GallerySections (colors through iconography)
    ├── background.tsx         ← BackgroundSection() — 1 GallerySection
    ├── components.tsx         ← ComponentsSections() — 3 GallerySections (shell · ui · document)
    ├── domain.tsx             ← DomainSections() — 5 GallerySections
    └── technical.tsx          ← TechnicalSections() — 2 GallerySections (responsive · z-index)
    (5 section files exactly)

public/<gallery-route>/        ← dev-only static assets (not shipped to production)
├── background-ascii-light.png ← ThemeShot light (AsciiField capture)
├── background-ascii-dark.png  ← ThemeShot dark (AsciiField capture)
├── meteor-light.mp4           ← ThemeVideo light clip
├── meteor-dark.mp4            ← ThemeVideo dark clip
├── meteor-light-poster.jpg    ← ThemeVideo still, light (pre-hydration + reduced-motion fallback)
├── meteor-dark-poster.jpg     ← ThemeVideo still, dark
└── samples/                   ← neutral project-agnostic sample assets for specimen demos
    ├── figure.svg             ← Figure specimen
    ├── diagram.svg            ← Diagram specimen
    ├── panel-a.svg            ← DiagramRow panel A
    ├── panel-b.svg            ← DiagramRow panel B
    ├── logo-a.svg             ← HeroMetaOverlay logos
    ├── logo-b.svg
    ├── avatar-a.svg           ← HeroMetaOverlay contributors
    └── avatar-b.svg
```

**Count summary:** scaffold-kit = 4 files (no index.ts); visualizer-kit = 9 component files + 1 index.ts;
sections/ = 5 files; gallery h2 sections = 21 total.

Avoid framework-reserved filenames for section/kit modules — see `stack-adapters.md`.

### File-content pinning (not just names)

Names alone aren't enough — each file must CONTAIN its designated code. The recurring drift is creating
the right filename but inlining its logic elsewhere (e.g. `click-guards.tsx` left empty while the guard
logic gets folded into `catalog.tsx`). Pin both the name AND its contents:

- `scaffold-kit/catalog.tsx` — `GallerySection`, `SpecimenGroup`, `Specimen`, `Card`. Nothing else.
- `scaffold-kit/chrome-frame.tsx` — `ChromeFrame`.
- `scaffold-kit/click-guards.tsx` — `DemoViewOnly`, `InertDemo`, and the `SuppressionTip` portal helper.
  This file is NOT empty, and the guard logic is NOT inlined into `catalog.tsx`.
- `scaffold-kit/theme-media.tsx` — `ThemeShot`, `ThemeVideo`.
- `visualizer-kit/<name>.tsx` — exactly the one visualizer the filename names (`motion-scale.tsx` holds
  both `DurationScale` and `EasingCurves`); `index.ts` is barrel re-exports only.
- `sections/<bucket>.tsx` — that bucket's GallerySections + its token data, composing the kits.
- **Section render helpers stay INLINE in the bucket file — never a 6th `sections/` module.** A section
  needing helper rendering (e.g. Iconography's icon grid + size table) keeps that helper as a local
  function/component **inside** its bucket file (`foundations.tsx`), not a separate file. `sections/` is
  exactly 5 files (the 5 buckets) — the count is law; a private helper does not earn its own module.

A file that compiles but holds the wrong contents (or is empty) is a failure even when the build
is green.

---

## Generic↔instance split

**`scaffold-kit/` and `visualizer-kit/` are project-agnostic.** The skill templates them nearly verbatim
for every project. They contain zero project-specific values — no token values, no component imports, no
slug strings.

**`sections/` and `page.tsx` are the per-project instance.** They declare this project's token data,
import the project's real components, and compose the kits.

Build order follows the split:

```
scaffold-kit  →  visualizer-kit  →  sections  →  page
```

Each layer depends on the one before. Never reorder.

---

## Data binding

**`visualizer-kit/` visualizers own the prop types** — they define what data they accept (a list of color
token entries, a list of spacing steps, etc.) but contain zero project-specific values.

**`sections/` modules own the token data** — they declare this project's actual values and pass them into
the visualizers as props.

This means a visualizer is never edited when a token changes; only the section module is.

**Co-location rule:** token data lives in the section module that consumes it. A separate `tokens/` folder
is only justified when the same dataset feeds two or more section modules.

---

## Section-id namespacing (`ds-{slug}`)

Every gallery section wrapper carries an `id` attribute for scroll navigation. The section-nav rail
(TOC) also derives ids from heading text — a section whose `<h2>` text is "Background" gets a
text-derived id `#background`. If the section wrapper also used `id="background"`, the ids would collide.

**Rule:** every gallery section wrapper id is prefixed `ds-`: `id="ds-background"`, `id="ds-colors"`,
etc. The `GallerySection` component applies this prefix automatically — there is no per-section decision.

The text-derived h2 id (from the rail) and the `ds-{slug}` section id are now different by construction
and can never collide. See `scaffold-kit.md` for the `GallerySection` pseudocode that enforces this.

---

## `page.tsx` template

The gallery page is a thin server component. Reproduce this structure exactly:

```
// File: <gallery-route>/page.tsx
// Route: dev-only; NOT accessible in production builds

// imports (in this order):
import type { Metadata } from "next"        ← metadata export
import "./gallery.css"                       ← route-scoped CSS (ThemeShot swap + .ds-reading)
// layout primitives
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
// live rail (scrapes DemoViewOnly <article> h2s)
import { SectionProgressNav } from "@/components/project/section-progress-nav"
// UI primitives
import { Heading } from "@/components/ui/heading"
import { InlineThemeSelector } from "@/components/ui/theme-selector"
// click-guard (DemoViewOnly wraps ALL gallery sections)
import { DemoViewOnly } from "./scaffold-kit/click-guards"
// 5 section exports (named exports, one per bucket file)
import { BackgroundSection }   from "./sections/background"
import { ComponentsSections }  from "./sections/components"
import { DomainSections }      from "./sections/domain"
import { FoundationsSections } from "./sections/foundations"
import { TechnicalSections }   from "./sections/technical"

export const metadata: Metadata = {
  title: "Design System",
  robots: { index: false, follow: false },   // NOINDEX — dev-only, excluded from search
}

export default function DesignSystemPage() {
  return (
    <Section>
      <Container>

        // 1. LIVE TOC RAIL (only if the project has one) — position:fixed (renders in the gutter);
        //    mounted OUTSIDE the scraped DemoViewOnly article so it doesn't ingest itself
        <SectionProgressNav />

        // 2. HEADER — outside DemoViewOnly so InlineThemeSelector stays interactive
        <header class="mb-[--spacing-3xl] flex flex-col gap-[--spacing-lg]">
          <Heading level={1} type="display-title">Design System</Heading>
          <p class="body-lead">
            Components and tokens rendered live, mirroring the DESIGN.md structure.
            Inline page sections are listed, not previewed; background layers are
            static captures. Switch themes with the Theme control below.
          </p>
          {/* InlineThemeSelector is OUTSIDE DemoViewOnly — stays fully interactive.
              The UI catalog references this instance rather than duplicating it. */}
          <div class="flex items-center gap-[--spacing-sm]">
            <span class="mono-anchor">Theme</span>
            <InlineThemeSelector />
          </div>
          <div class="body-caption">
            Dev-only reference, excluded from the production build. Components render
            on the page background; fixed and route-aware chrome render live in
            bounded frames.
          </div>
        </header>

        // 3. GALLERY BODY — DemoViewOnly is the <article> the rail scrapes for h2s
        <DemoViewOnly class="flex flex-col gap-[--spacing-4xl]">
          <FoundationsSections />
          <BackgroundSection />
          <ComponentsSections />
          <DomainSections />
          <TechnicalSections />
        </DemoViewOnly>

      </Container>
    </Section>
  )
}
```

> Component + type-token names in this template are the project's — portfolio examples shown. Substitute
> the project's own **theme-control component** and **display / lead / eyebrow / caption** type tokens; the
> page **structure** (wrappers, rail-outside-article, header, uniform-gap article, section order) is what's
> fixed.

**Key invariants:**

- Page title: `"Design System"` at `display-title` type token — never a raw font-size.
- `robots: { index: false, follow: false }` — always noindex; this is a dev tool.
- **Live TOC rail (conditional).** Use the project's section-nav / TOC rail **if it has one** — mounted
  `position: fixed` (renders in the gutter), **outside** the `<DemoViewOnly>` article it scrapes (so it
  reads the article's h2s without ingesting itself; DOM mount order doesn't affect where it renders). **No
  such rail in the project → omit it; the gallery has no TOC.**
- `<InlineThemeSelector />` is in the header, OUTSIDE `<DemoViewOnly>` — this is the only theme
  control on the page; the UI catalog section references it, never duplicates it.
- Section order inside `<DemoViewOnly>`: Foundations → Background → Components → Domain → Technical.
  This order mirrors DESIGN.md document order exactly.
- Ambient background is NOT suppressed — the gallery renders on the normal page background. The
  Background section shows static captures (`ThemeShot` / `ThemeVideo`), not a live background layer.
- **Reading-page styling** — the page is wrapped in the project's standard content-page primitives
  (here `Section` › `Container`), exactly like a normal reading/content page, so it inherits the
  editorial reading column (max content width + responsive padding) and vertical rhythm. "Reading-page
  style" here means these standard wrappers — NOT the long-form `data-read="long"` reading *mode* (that
  is for MDX deep-dives only and is NOT applied to the gallery).
- **Uniform section spacing** — sections inside `<DemoViewOnly>` are separated by a single uniform gap
  (`flex flex-col gap-[--spacing-4xl]`); within a section, `GallerySection` uses `gap-[--spacing-2xl]`.
  One inter-section gap value — do not vary it per section.
- **No gallery file paths rendered** — `source`/`mapsTo` props reference the project's real components /
  CSS / tokens / DESIGN.md only, never the gallery's own kit/section files (see `section-spine.md` →
  Cross-section pins → `source` points to REAL artifacts).

---

## Page hierarchy & headings

The gallery page has one heading hierarchy; never skip levels:

```
h1   Page title — the gallery name, at the project's display/title heading token, in the header
h2     Each GallerySection title — bucket-prefixed: "{Bucket} · {Sub-section}"
h3       A SpecimenGroup eyebrow, OR a section-level Specimen name
h4         A Specimen nested inside a SpecimenGroup
```

**Header typography (dogfood + fallback).** Headings use the project's defined heading treatment, resolved
in this order: the project's **heading component** (its defined h1–h6 → type-token mapping) → the project's
**prose heading** styling → the raw **typography** heading tokens.

**Section-group label.** A `SpecimenGroup` label is a **structural eyebrow** — rendered as an `<h3>` for
the document outline, styled with the project's eyebrow / structural-metadata token (outline weight, not
display weight).

---

## `gallery.css` contents

The route-scoped stylesheet is imported by `page.tsx` and applies on this route only. It contains
exactly three rule blocks — no more:

```css
/* Dev-only styles for the /<gallery-route> gallery. Imported only by the gallery page, so these
   rules ship and apply on that route alone — they're kept out of globals.css to avoid
   prod-stylesheet noise. They reference the global token vars defined in globals.css. */

/* JS-free theme swap for ThemeShot screenshot pairs (background layers shown as static captures).
   Only the active theme's shot is displayed. */
[data-theme="dark"]  .ds-shot-light { display: none }
[data-theme="light"] .ds-shot-dark  { display: none }

/* Element-scoped mirror of the reading-mode surface overrides (the :root[data-read="long"] blocks
   in globals.css) so the color cards can preview reading mode live and theme-adaptive.
   Keep in sync with the globals.css data-read="long" blocks. */
.ds-reading {
  --surface: #f8f8f9;
  --surface-floating: #f8f8f9d9;
}
[data-theme="dark"] .ds-reading {
  --surface: #1a1a1a;
  --surface-elevated: #292929;
  --surface-deep: #141414;
  --surface-floating: #1f1f1fd9;
}

/* Reading cards that only differ from showcase in dark — hide them in light, where they hold. */
[data-theme="light"] .ds-reading-darkonly { display: none }
```

**Maintenance rule:** the hardcoded values in `.ds-reading` mirror the `[data-read="long"]` blocks in
`globals.css`. When the reading-mode surface tokens change in `globals.css`, update `gallery.css` to
match. Light leaves raised/sunken surfaces at their showcase values (unchanged in reading mode).

---

## Theme-based single view

Each component renders once on the page at the current theme, with a real theme toggle in the header.

The alternative — rendering each component twice side-by-side, one per theme — is not used. Side-by-side
dual-theme forces a theme scope per container (e.g. forced `data-theme` attribute) that breaks JS-aware
components: any component reading global theme state (a theme hook, a system-preference listener, a
dynamic background layer) disagrees between the forced scope and the real global state. The result is
components that appear broken in the gallery, or require workarounds that add maintenance debt and break
the dogfooding principle.

The single-view model avoids this: the theme is real, the components are live, switching the real toggle
updates everything together.

---

## Cross-references

- Adapter seams (route creation, theme flip, production exclusion, code discovery) → `stack-adapters.md`
- `GallerySection` / `SpecimenGroup` / `Specimen` / `Card` / `ChromeFrame` / click-guards /
  theme-media pseudocode → `scaffold-kit.md`
- All 9 visualizer pseudocodes + dogfooding gate → `visualizer-kit.md`
- 21-section ordered template (which visualizer per sub-section, prose vs box) → `section-spine.md`
- Mode derivation (Build/Inventory/Sync/Bootstrap) and item-list source per mode → `modes.md`
- Demo techniques (ChromeFrame, demo-prop, Shiki pipeline, overlay-on-hero, TOC rail) → `hard-to-demo.md`
- Render-backed verification + gates → `verification.md`
