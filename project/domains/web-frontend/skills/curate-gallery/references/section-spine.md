# Section Spine — shared contract

The three-layer contract every section obeys, the pins that apply to all of them, and the complete
section order. **Each bucket's per-section template is in its own file**, so a build loads only the
bucket it is working through:

| Bucket | File |
| --- | --- |
| Foundations — colors, typography, prose, spacing, shapes | `spine-foundations-base.md` |
| Foundations — elevation, motion, layout, imagery, iconography | `spine-foundations-visual.md` |
| Background · Components (shell, UI, document) | `spine-background-components.md` |
| Domain · Technical | `spine-domain-technical.md` |

**The section order and the bucket→section mapping are universal** — every project's spine follows
its own DESIGN.md document order (same discipline, its own sub-sections and components). **The count
is DESIGN.md's, never this file's:** the template is worked through one reference doc and yields 21
sections for it, which is an example and not a target (`modes.md` → Coverage derivation). A project
whose doc carries more or fewer sub-sections is not short of sections.

Each section's content is specified in the **three layers** below, which is what keeps the universal
template cleanly separated from any one project's instance values.

---

## The three layers (P1 · P2 · P3)

- **P1 — Composition template (universal).** Which visualizer or prose structure renders the section,
  the prose-vs-box decision, specimen grouping, and ordering. The same shape for every project.
- **P2 — Visual alignment (dogfood, from DESIGN.md).** The section honors THIS project's spacing/rhythm,
  and the visualizer adopts the project's own treatments (radius, depth, semantic type) — all resolved
  from DESIGN.md, never hardcoded. Per-visualizer P2 detail lives in that visualizer's `visualizer-*.md`
  file; the P2 principles common to all of them are in `visualizer-kit.md`.
- **P3 — Actual inputs (instance).** The real data fed to the section (the actual token list, the real
  component set). Whether the concrete values are written here as a worked example or stated
  generically is decided per section. **Completeness:** P3 captures everything DESIGN.md defines for that
  section — miss nothing. Completeness means **all items / all key points**, captured concisely: the
  gallery is a visual catalog with key info injected, NOT a verbatim copy of DESIGN.md prose. Tokens and
  specimens: every one. Prose "rules" sections: every category + its **key points** (condensed), not
  every sub-bullet verbatim. If code and DESIGN.md disagree (a token/component in code but not the doc,
  or vice-versa), surface it to the user when the gallery is finished (inform-only handoff) — never
  silently drop or invent. Missing-but-intended tokens fall back per `visualizer-kit.md` → Generic
  fallbacks.
- **Values (P3).** A section reads tokens and roles from its DESIGN.md section and each value from the YAML
  Registry — or, for color and typography, the Foundations table that defines it (the Registry wins a value
  in both) — joined on the token's name, unless the section's own P3 names another source. A missing required
  value, or a value no token names, is an open design gap for `design-write`, surfaced as above.
- **Ordering (all layers).** Within a section, items render in the **same order DESIGN.md lists them**
  (color groups, shapes, elevation levels, components, domain items, …). Section headings and their
  order also match DESIGN.md. Never reorder for visual preference.

> Migration in progress: sections are being moved to this P1/P2/P3 labelling one at a time. Un-migrated
> entries still show the older mixed form.

---

## How to read this template

Each entry specifies a small identity block + the three layers:
- **id** — the `<GallerySection id="…">` value; the section element's `id` is `ds-{id}` (see
  `architecture.md` → Section-id namespacing).
- **title** — the `<GallerySection title="…">` value, bucket-prefixed.
- **mapsTo** — the full DESIGN.md heading path (the `<GallerySection mapsTo="…">` eyebrow).
- **source** — the `<GallerySection source="…">` value (omit when none).
- **intro** — a one-line description of the section, rendered by `GallerySection` (the intro paragraph
  under the title — see `scaffold-kit.md` → GallerySection). This is **P3 instance text**:
  derive it from the section's DESIGN.md content; every section has one.
- **P1 / P2 / P3** — the three layers (composition · visual alignment · actual inputs) per the legend
  above. Older un-migrated entries still show the previous "Renders as / Boxed-prose / Specimen
  structure" form instead.

Visualizer components are from `visualizer-kit/` (re-exported via `visualizer-kit/index.ts`). Scaffold
primitives are from `scaffold-kit/`; for their exact pseudocode see `scaffold-kit.md`
(`GallerySection`, `SpecimenGroup`), `scaffold-specimen.md` (`Specimen`, `Card`),
`scaffold-chrome-theme.md` (`ChromeFrame`, `ThemeShot`, `ThemeVideo`) and `scaffold-guards.md`
(`DemoViewOnly`, `InertDemo`).

---

## Cross-section pins (apply to EVERY section)

These hold across every section. Prior rebuilds drifted on each, so the parity review
(`verification.md` → Gate 0) checks them before the gallery is declared done.

### `source` points to REAL artifacts — never the gallery's own files

The `source` prop on `GallerySection`/`Specimen` (and the `mapsTo` eyebrow) reference the **project's
real** component / CSS file / token selector / DESIGN.md heading path — e.g. `@/components/ui/button`,
`src/styles/theme.css → :root`, `--spacing-*`, `DESIGN.md → Foundations → Colors`,
`src/app/page.tsx · [inline]`. They NEVER reference the gallery's own construction files
(`scaffold-kit/catalog.tsx`, `visualizer-kit/swatch-grid.tsx`, `sections/foundations.tsx`). The
gallery's own kit/section paths must not appear anywhere in the rendered output — that is a
construction leak. Conceptual sections (Z-Index, Responsive, Elevation) use a token/DESIGN.md
reference, not a code path.

**Never cite a path that is not in the repo.** No committed gallery text, rendered or in a comment,
points at a working-notes file, a scratch harness, a plan or an ignored directory — every such pointer
is dead for anyone who clones. This is wider than the construction leak, which covers only the
gallery's own kit paths.

**A declared package is a real artifact.** A `source` may name a package the project declares as a
dependency, written exactly as the component imports it (e.g. `@radix-ui/react-dialog`) — never a
path into `node_modules/`, which is an ignored directory.

**Code path vs design path.** Every component/domain `Specimen` shows its **code file path** — `source`
= the real import path *where the component is called from* (e.g. `@/components/ui/button`). The **design
path** loads at the section level — `GallerySection` `mapsTo` = the DESIGN.md heading (the `→ DESIGN.md →
…` eyebrow). So: code path per specimen, design path per section.

**Never catalog the gallery's OWN items.** The scaffold-kit / visualizer-kit primitives (GallerySection,
ChromeFrame, SwatchGrid, …) and the gallery's section files are **construction — never specimens, never
list entries, never catalogued anywhere.** The gallery catalogs only the project's real design system.

### Property/spec metadata blocks are Foundations/Technical-only

The structured per-item property metadata — the name → token → usage → value blocks rendered by the
Foundations/Technical **visualizers** (SwatchGrid ColorCard, TypeScaleList rows, ShapeRow, DepthGrid,
DeviceRuler, SpanTable) — belongs ONLY to those token visualizers. **Never wrap a Component or Domain specimen
in a token-visualizer-style metadata grid.** They carry lighter annotation only: the `Specimen` `source`
(mono-code) + a one-line `description` (body-primary); an optional single trailing `spec` note (e.g.
`Tag` — "mono uppercase chip · surface-tag · radius-sm"); and — for a **multi-variant** specimen laid out
as a grid (buttons, theme selector) — a concise per-variant `name · token · usage` caption (usage info —
what it's for / where used, like the icon-sizes cell). The caption is allowed; the structured property
grid is not.

### Component home is read from DESIGN.md, not guessed from appearance

Each component renders in the gallery section matching the **home DESIGN.md documents for it** (its
Components → Shell/UI/Document placement, or its Domain feature), confirmed against the project's
component-structure rule. Read the placement from the doc + the real import path — never infer it from how
the component looks. The universal taxonomy:

| Documented home | Gallery section |
|---|---|
| Shell (root-layout singletons) | Components · Shell |
| UI (portable primitives) | Components · UI |
| Document (author-composed) | Components · Document |
| a Domain feature | the matching Domain section |

A fixed-chrome-LOOKING component is not necessarily Shell — a component's **documented home wins over its
visual appearance**. Resolve every placement from DESIGN.md.

### Sample/display content is always self-documenting

**Sample text** is self-documenting descriptive text in EVERY section — never lorem, never filler. The
only variable is HOW descriptive, by usage location: **labels** (buttons, controls, tags) = simple
self-documenting (e.g. "Primary"); **content** (annotations, display blocks, prose samples) = more
descriptive (says what it is / where used). **Sample images** follow the parallel rule — self-representative
(read as their content kind) in DESIGN.md colors, color count scaling with the image area (see
`hard-to-demo.md` → Sample assets).

---

## Appendix: Complete Section Order (reference)

```
#   id             title                             mapsTo
──  ─────────────  ────────────────────────────────  ─────────────────────────────────────
 1  colors         Foundations · Colors              Foundations → Colors
 2  typography     Foundations · Typography          Foundations → Typography
 3  prose          Foundations · Prose               Foundations → Prose
 4  spacing        Foundations · Spacing             Foundations → Spacing
 5  shapes         Foundations · Shapes              Foundations → Shapes
 6  elevation      Foundations · Elevation & Depth   Foundations → Elevation & Depth
 7  motion         Foundations · Motion              Foundations → Motion & Interaction
 8  layout         Foundations · Layout              Foundations → Layout
 9  imagery        Foundations · Imagery             Foundations → Imagery
10  iconography    Foundations · Iconography         Foundations → Iconography
11  background     Background                        Background
12  shell          Components · Shell                Components → Shell
13  ui             Components · UI                   Components → UI
14  document       Components · Document             Components → Document
15  home           Domain · Home Page                Domain Components → Home Page
16  work           Domain · Work Index               Domain Components → Work Index
17  project        Domain · Project Detail           Domain Components → Project Detail
18  about          Domain · About Layouts            Domain Components → About Layouts
19  not-found      Domain · 404 Not Found            Domain Components → 404 Not Found
20  responsive     Interaction · Responsive Behavior Interaction Rules → Responsive Behavior
21  z-index        Technical · Z-Index Scale         Technical Conventions → Z-Index Scale
```

Total for this reference doc: 21 sections — 10 Foundations + 1 Background + 3 Components + 5 Domain
+ 2 Technical. A project's own total is whatever its DESIGN.md yields.

DESIGN.md sections with no gallery entry (describe rules, not visual specimens): Overview / Design
Philosophy / Core Principles / Things to Avoid · Accessibility Rules · Cross-Cutting Constraints.

---

## Cross-references

- Visualizer pseudocode (exact data contracts + layouts) → the per-visualizer `visualizer-*.md` files;
  shared contract and generic fallbacks → `visualizer-kit.md`
- Scaffold primitive pseudocode — `GallerySection`, `SpecimenGroup` → `scaffold-kit.md`; `Specimen`,
  `Card` → `scaffold-specimen.md`; `ChromeFrame`, `ThemeShot`, `ThemeVideo` →
  `scaffold-chrome-theme.md`; `DemoViewOnly`, `InertDemo` → `scaffold-guards.md`
- Hard-to-demo techniques (ChromeFrame, demo-prop, Shiki pipeline, overlaid components, sample assets,
  `InlineThemeSelector` placement) → `hard-to-demo.md`
- Pinned file/folder structure → `architecture.md`; `page.tsx` and `gallery.css` contents →
  `page-and-css.md`
- Mode-decision flow and strict DESIGN.md → spine mapping → `modes.md`
