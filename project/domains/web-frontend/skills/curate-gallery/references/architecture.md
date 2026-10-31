# Architecture

How the gallery is structured. Covers the spine-vs-adapters model, the pinned file/folder structure,
generic↔instance split, data-binding rules and `ds-{slug}` id namespacing. What the route file and the
stylesheet must CONTAIN is owned by `page-and-css.md`; this file owns the tree they sit in.

Stack-specific seams (route creation, dev-only exclusion, theme flip, component discovery) are adapter
concerns — see `stack-adapters.md` and `stack-adapter-static-html.md`.

---

## Spine vs adapters

The gallery has two layers:

**Spine (stack-neutral)** — the catalog model; dogfooding gate; visualizer concepts; build order; mode
logic; theme rules; TOC requirement; render-verification requirement; handoff protocol; code-write
boundary. This layer is what makes the gallery a gallery regardless of tech stack.

**Adapters (stack-specific)** — the six seams that vary per framework: (a) make a dev-only route,
(b) render a component live, (c) run build-time transforms, (d) flip themes, (e) exclude from
production, (f) discover components/tokens in code. See `stack-adapters.md` for the React/Next adapter
and `stack-adapter-static-html.md` for the static-HTML adapter contract; each one's maturity and limit → `verification.md` → Stack-proof status.

The spine is stable. Adapters change per project. Do not bake adapter specifics into the spine files.

---

## Pinned file/folder structure

The gallery produces exactly this directory tree. Names are law — reproduce them exactly, always.

```
<gallery-route>/
├── page.tsx                   ← thin route: metadata, imports 5 section exports, mounts rail + header
├── gallery.css                ← dev-only rules: ThemeShot swap + any scoped-override mirror
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
    ├── foundations.tsx        ← FoundationsSections() — one GallerySection per Foundations sub-section
    ├── background.tsx         ← BackgroundSection() — 1 GallerySection
    ├── components.tsx         ← ComponentsSections() — one per Components sub-group (Shell · UI · Document)
    ├── domain.tsx             ← DomainSections() — one per Domain Components sub-section
    └── technical.tsx          ← TechnicalSections() — Responsive Behavior · Z-Index Scale
    (5 section files exactly)

public/<gallery-route>/        ← dev-only static assets (not shipped to production)
├── <layer>-light.png · -dark.png          ← ThemeShot pair, per captured background layer
├── <layer>-light.mp4 · -dark.mp4          ← ThemeVideo pair, per animated layer
├── <layer>-light-poster.jpg · -dark-poster.jpg  ← ThemeVideo stills (pre-hydration + reduced-motion fallback)
└── samples/                   ← neutral project-agnostic sample assets, one per specimen that needs one
```

The `public/` names are the project's; only the light/dark pairing is fixed. Example:
`background-ascii-light.png` for a captured ASCII layer, `meteor-dark.mp4` and its poster for an animated
one, `figure.svg` · `panel-a.svg` · `logo-a.svg` · `avatar-a.svg` under `samples/`.

**Count summary:** scaffold-kit = 4 files (no index.ts); visualizer-kit = 9 component files + 1 index.ts;
sections/ = 5 files; gallery h2 sections = one per DESIGN.md sub-section, however many that is
(`build-coverage.md` → Coverage derivation).

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

- What `page.tsx` and `gallery.css` contain → `page-and-css.md`, stated there only; this file owns where
  they sit in the tree
- Adapter seams (route creation, theme flip, production exclusion, code discovery) → `stack-adapters.md`
- Scaffold primitive pseudocode — `GallerySection` / `SpecimenGroup` → `scaffold-kit.md`; `Specimen` /
  `Card` → `scaffold-specimen.md`; `ChromeFrame` / theme-media → `scaffold-chrome-theme.md`;
  click-guards → `scaffold-guards.md`
- Visualizer pseudocode → the per-visualizer `visualizer-*.md` files (shared contract and generic
  fallbacks in `visualizer-kit.md`); dogfooding gate → `visualizer-dogfood.md`
- Ordered section template (which visualizer per sub-section, prose vs box) → the `spine-*.md` files; shared
  contract, pins and full order → `section-spine.md`
- Mode derivation (Build/Inventory/Sync/Bootstrap) and item-list source per mode → `modes.md`
- Demo techniques (ChromeFrame, demo-prop, Shiki pipeline, overlaid components) → `hard-to-demo.md`; TOC rail → `demo-placement-and-media.md`
- Gate 0 parity review → `parity-review.md`; render-backed verification + gates → `verification.md`
