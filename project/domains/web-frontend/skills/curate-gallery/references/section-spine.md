# Section Spine — 21-Section Template

The gallery's 21 `<h2>` sections, in DESIGN.md document order. The **section order and the
bucket→section mapping are universal** — every project's spine follows its own DESIGN.md document order
(same discipline, its own sub-sections and components). Each section's content is then specified in the
three layers below, so the universal template stays cleanly separated from this project's instance values.

## The three layers (P1 · P2 · P3)

- **P1 — Composition template (universal).** Which visualizer or prose structure renders the section,
  the prose-vs-box decision, specimen grouping, and ordering. The same shape for every project.
- **P2 — Visual alignment (dogfood, from DESIGN.md).** The section honors THIS project's spacing/rhythm,
  and the visualizer adopts the project's own treatments (radius, depth, semantic type) — all resolved
  from DESIGN.md, never hardcoded. Visualizer-level P2 detail lives in `visualizer-kit.md`.
- **P3 — Actual inputs (instance).** The real data fed to the section (the actual token list, the real
  component set). Whether the concrete values are written here as a portfolio answer-key or stated
  generically is decided per section. **Completeness:** P3 captures everything DESIGN.md defines for that
  section — miss nothing. Completeness means **all items / all key points**, captured concisely: the
  gallery is a visual catalog with key info injected, NOT a verbatim copy of DESIGN.md prose. Tokens and
  specimens: every one. Prose "rules" sections: every category + its **key points** (condensed), not
  every sub-bullet verbatim. If code and DESIGN.md disagree (a token/component in code but not the doc,
  or vice-versa), surface it to the user when the gallery is finished (inform-only handoff) — never
  silently drop or invent. Missing-but-intended tokens fall back per `visualizer-kit.md` → Generic
  fallbacks.
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
- **intro** — a one-line description of the section, rendered by `GallerySection` (a `body-primary`
  paragraph under the title — see `scaffold-kit.md` → GallerySection). This is **P3 instance text**:
  derive it from the section's DESIGN.md content; every section has one.
- **P1 / P2 / P3** — the three layers (composition · visual alignment · actual inputs) per the legend
  above. Older un-migrated entries still show the previous "Renders as / Boxed-prose / Specimen
  structure" form instead.

Visualizer components are from `visualizer-kit/` (re-exported via `visualizer-kit/index.ts`). Scaffold
primitives (`GallerySection`, `SpecimenGroup`, `Specimen`, `Card`, `ChromeFrame`, `DemoViewOnly`,
`InertDemo`, `ThemeShot`, `ThemeVideo`) are from `scaffold-kit/` — see `scaffold-kit.md` for their
exact pseudocode.

---

## Cross-section pins (apply to EVERY section)

These hold across all 21 sections. Prior rebuilds drifted on each, so the builder self-review
(`verification.md` → Builder doc→code self-review) checks them before the gallery is declared done.

### `source` points to REAL artifacts — never the gallery's own files

The `source` prop on `GallerySection`/`Specimen` (and the `mapsTo` eyebrow) reference the **project's
real** component / CSS file / token selector / DESIGN.md path — e.g. `@/components/ui/button`,
`src/styles/theme.css → :root`, `--spacing-*`, `DESIGN.md → Foundations → Colors`,
`src/app/page.tsx · [inline]`. They NEVER reference the gallery's own construction files
(`scaffold-kit/catalog.tsx`, `visualizer-kit/swatch-grid.tsx`, `sections/foundations.tsx`). The
gallery's own kit/section paths must not appear anywhere in the rendered output — that is a
construction leak. Conceptual sections (Z-Index, Responsive, Elevation) use a token/DESIGN.md
reference, not a code path.

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

## Bucket 1: Foundations (10 sections)

### 1. Colors

```
id:      "colors"
title:   "Foundations · Colors"
mapsTo:  "Foundations → Colors"
source:  "src/styles/theme.css → :root / [data-theme]"
```

**P1 — Composition:** a single `<SwatchGrid groups={COLOR_GROUPS} />` directly inside `GallerySection` —
no `Specimen`/`SpecimenGroup` wrapper, no outer `Card`. The visualizer IS the section content.

**P2 — Visual alignment:** the group/grid rhythm uses the project's spacing; the ColorCard adopts the
project's card treatment + semantic type tokens (full rules → `visualizer-kit.md` → SwatchGrid → P2).

**P3 — Actual inputs (`COLOR_GROUPS`):** one `SwatchGroup` per role-cluster, read from DESIGN.md → Colors.
- **Always:** Surfaces · Text · Borders · Accent / brand colors
- **If present:** Semantic (interaction/state tokens — grouped separately from Accent even when their
  value derives from accent) · Reading-mode (scoped — `scopeClassName` + a `gallery.css` rule + `darkOnly`
  on cards that change in one theme only)

Each `SwatchToken` = `{ token, name, usage, swatchValue?, darkOnly? }`; use `swatchValue` for non-color
tokens (RGB triples). The concrete token list is project instance — it lives in the `sections/` module,
not pinned here.

---

### 2. Typography

```
id:      "typography"
title:   "Foundations · Typography"
mapsTo:  "Foundations → Typography"
source:  "src/styles/typography.css"
```

**P1 — Composition:** a single `<TypeScaleList tokens={TYPE_TOKENS} />` directly inside `GallerySection`
— no `Specimen`/`SpecimenGroup` wrapper, no `Card`.

**P2 — Visual alignment:** left-column metadata uses the project's semantic type tokens by role; row
dividers + spacing from the project's tokens; the right-column sample renders at `class={token}` only
(dogfood). Full rules → `visualizer-kit.md` → TypeScaleList → P2.

**P3 — Actual inputs (`TYPE_TOKENS`):** one entry per the project's semantic type token, read from
DESIGN.md → Typography. Each `{ token, family, size, weight, lh, sample, responsive? }`. `sample` =
a one-line description of **where the token is used** (from the DESIGN.md "Role" column) — not lorem,
not an alphabet run. `responsive` only for tokens that resize across tiers. The token count and values
are project instance (portfolio: 19) — they live in `sections/`, not pinned here.

---

### 3. Prose

```
id:      "prose"
title:   "Foundations · Prose"
mapsTo:  "Foundations → Prose"
source:  "src/styles/prose.css → .prose-content"
```

**P1 — Composition:** a single live block of the project's prose layer directly inside `GallerySection`
— no `Specimen`/`SpecimenGroup`/`Card`. The prose IS the demo. One representative instance of each prose
element the layer styles: a heading and a sub-heading (h3, h4), a paragraph (with an inline link, bold,
and inline code), an unordered list, an ordered list, a blockquote, a table (header + a couple of rows),
a horizontal rule, and a closing paragraph. Zero the top margin of the wrapper's first child (portfolio: `[&>*:first-child]:mt-0`) so it sits flush — otherwise that first element's own top margin stacks on the GallerySection gap and doubles the space above the sample.

**P2 — Visual alignment:** wrap the sample in the **project's prose-layer class** (here `.prose-content`)
plus the P1 first-child margin reset, and add NO OTHER overrides — that layer owns every type token,
margin, list marker, and border. The reset is the sole exception (a layout-collision fix, not a style
override); the prose otherwise styles itself (dogfood).

**P3 — Actual inputs:** the **element set** = whichever elements the project's prose layer styles, read
from DESIGN.md → Prose (portfolio: `h3`, `h4`, `p` + inline `a`/`strong`/`code`, `ul`, `ol`,
`blockquote`, `table` with `thead` + two rows, `hr`). The body **text is descriptive of each element and
its usage** (self-documenting — e.g. "A blockquote, an aside set off from the body copy"); never lorem
or filler.

---

### 4. Spacing

```
id:      "spacing"
title:   "Foundations · Spacing"
mapsTo:  "Foundations → Spacing"
source:  "--spacing-*"
```

**P1 — Composition:** one or more `BarScale` groups stacked in a `flex flex-col gap-[{sp}]` wrapper, no
`Specimen`/`Card`. A group of non-step tokens gets a sub-label (an eyebrow above its `BarScale`).

**P2 — Visual alignment:** bar fill = the project's accent; label = code/identifier token; gaps from the
spacing scale (full rules → `visualizer-kit.md` → BarScale → P2).

**P3 — Actual inputs:** the spacing token list, read **complete** from DESIGN.md → Spacing. Each
`{ token, px }`; `varPrefix` names the CSS var prefix. Bars read live `var(--<prefix><token>)`.
- **Base step scale** (always) — every step the project defines.
- **Optional extra groups** — non-step spacing the project defines (e.g. layout gutter/margins), each
  under its own sub-label.
*(Portfolio: base `xs…5xl` (9 steps) + layout `gutter`/`margin-mobile`/`margin-desktop`.)*

---

### 5. Shapes

```
id:      "shapes"
title:   "Foundations · Shapes"
mapsTo:  "Foundations → Shapes"
source:  "--radius-*"
```

**P1 — Composition:** a single `<ShapeRow items={RADIUS_TOKENS} />` directly inside `GallerySection` —
no `Specimen`/`Card`.

**P2 — Visual alignment:** box adopts the project's card-like surface (border + raised fill); label =
code/identifier token; usage = caption; gaps from spacing (full rules → `visualizer-kit.md` → ShapeRow → P2).

**P3 — Actual inputs (`RADIUS_TOKENS`):** **one item per distinct radius the project defines** — named
radius tokens OR unnamed-but-distinct radius values used across the design — read **complete** from
DESIGN.md → Shapes. The count is project-determined, not fixed. Each `ShapeItem =
{ token, radius (CSS value), value (human), usage }`; for an unnamed radius, `token` is its usage-category
label. *(Portfolio: 4 — `none` · `sm` · `md` · `pill`.)*

---

### 6. Elevation & Depth

```
id:      "elevation"
title:   "Foundations · Elevation & Depth"
mapsTo:  "Foundations → Elevation & Depth"
source:  "DESIGN.md → Elevation & Depth"
```

**P1 — Composition:** a single `<DepthGrid levels={DEPTH_LEVELS} />` directly inside `GallerySection` —
no `Specimen`/`Card`. The `source` points to DESIGN.md (elevation is defined architecturally, not as one
CSS rule).

**P2 — Visual alignment:** card label text uses the project's type tokens by role; grid gap + card
padding from spacing (full rules → `visualizer-kit.md` → DepthGrid → P2).

**P3 — Actual inputs (`DEPTH_LEVELS`):** **one card per elevation level the project defines**, read
**complete and in DESIGN.md order** from DESIGN.md → Elevation. Each `{ name, spec, className, usage }`,
where **`className` is that level's actual treatment** translated from the doc (surface fill + border +
blur). Count = the project's number of levels.

Fidelity (translate each level's treatment exactly — these drifted before; verify against the project's
real elevation tokens):
- a **blur** level → floating surface + border + the blur filter; a **raised** level → elevated surface +
  border. Keep them distinct — don't swap.
- a **sunken** level → deep surface + its border (bordered in the grid card, even if borderless when
  nested in production).
- an **accent-edge** level → a single-side accent border (e.g. `border-l-2` accent), not a full border.

All levels render in `DepthGrid`; any "exclude this level" rule (e.g. a sunken level dropped from a
z-index stack) belongs to `LayerStack`, never here. *(Portfolio: 6 levels, 0–5.)*

---

### 7. Motion & Interaction

```
id:      "motion"
title:   "Foundations · Motion"
mapsTo:  "Foundations → Motion & Interaction"
source:  "--duration-* / --ease-*"
```

**P1 — Composition:** two sibling `SpecimenGroup` blocks — "Durations" (`DurationScale`) + "Easing"
(`EasingCurves`) — no outer `Specimen`. Omit a group if the project doesn't define that token kind.

**P2 — Visual alignment:** bar/curve = accent; track bg + reference lines = border token; easing canvas =
the project's **sunken/deep well**; labels by role; gaps from spacing (full rules → `visualizer-kit.md` →
DurationScale + EasingCurves → P2).

**P3 — Actual inputs:** read **complete** from DESIGN.md → Motion (Duration & Easing).
- `DURATION_TOKENS` — each `{ token, ms }` (resolved millisecond value).
- `EASING_TOKENS` — each `{ token, curve: [x1,y1,x2,y2] }`. The cubic-bezier tuple **is** the token's
  value (P3 data, like ms or hex). **Note:** DESIGN.md may only NAME the easings; the curve numbers then
  come from the code (theme/CSS) — a doc↔code gap to flag. The rendering math (coordinate transforms) is
  P1, not P3.
- Counts project-determined. *(Portfolio: 3 durations, 2 easings.)*

---

### 8. Layout

```
id:      "layout"
title:   "Foundations · Layout"
mapsTo:  "Foundations → Layout"
source:  (omit — no single source file)
```

**P1 — Composition + per-primitive demo recipe:** one live `Specimen` per layout primitive (h3, no
`SpecimenGroup`), importing and rendering the REAL primitive. A primitive is invisible alone, so each
demo composes throwaway cells to make its behavior visible. Recipe by primitive **kind**:
- **Stack / sequencing** → the primitive wrapping **3 visible cells** (the gaps show the spacing).
- **Grid** → **N numbered cells** filling a row (e.g. 12) so columns + reflow show.
- **Divider / rule** → "above" text / the divider / "below" text (no cells).
- **Page-shaper (Container/Section)** → a **prose note** that the page itself is wrapped in them (can't
  isolate; no boxed demo).
- **Sticky / pin** → a bounded scroll box (fixed height, `overflow-y-auto`) with the pinned element +
  several scrolling lines, so the pin is observable.
Page-shapers + Sticky usually combine into one "scaffold" specimen.

**Why the cells are bordered:** throwaway demo cells carry a border + fill ONLY to make an invisible
layout primitive visible — the one sanctioned use of demo-scaffolding cells (see `visualizer-kit.md` →
Dogfooding gate → No gratuitous boxes). Never box anything else.

**P2 — Visual alignment:**
- **Stack / Grid demo cells** = the project's **sunken/deep elevation level** (surface + border as a pair
  — recessed, reads as demo scaffolding, not real content), caption-token label inside.
- **Sticky**: the scroll **container** = the sunken/deep level; the **pinned element** = the project's
  **raised/elevated level** (so it pops above the well as it pins). Surface + border are always paired
  (see `visualizer-kit.md` → Generic fallbacks → Surface + border = one level).
- Cell + scrolling-line text = caption token; gaps + padding from the spacing scale. (The `200px` scroll
  box and `h-12` grid-cell heights are gallery layout constants.)

**P3 — Actual inputs:** the **primitive set** = the layout primitives the project's layout layer defines
(DESIGN.md → Layout), each mapped to its recipe by kind. Ids and exact demo content are instance.
*(Portfolio: `Stack` (3 cells) · `Grid` (12 numbered cells) · `Divider` · combined
`Container · Section · Sticky` scaffold — ids `layout-stack` / `layout-grid` / `layout-divider` /
`layout-scaffold`.)*

---

### 9. Imagery

```
id:      "imagery"
title:   "Foundations · Imagery"
mapsTo:  "Foundations → Imagery"
source:  "DESIGN.md → Foundations → Imagery"
```

**P1 — Composition:** a plain `<div class="prose-content">` inside `GallerySection` — no `Specimen`/`Card`.
Each category = a sub-heading (the project's emphasis type token) + its own `<ul>` of individual bullets
(one point per `<li>`, never a whole category crammed into one line). Rules listed for completeness, not
visual specimens.

**P2 — Visual alignment:** wrap in the project's prose-layer class; no overrides.

**P3 — Actual inputs:** the imagery guidance, read from DESIGN.md → Imagery, grouped by the project's
categories — **each category's key points captured** (expand past a single line, but key info only, not
every sub-bullet verbatim). *(Portfolio: **Photography** — monochrome/muted, restrained, editorial;
supportive not decorative; avoid stock/oversaturated. **Diagrams** — production-quality + consistent;
hand-authored SVG (primary), matplotlib charts, tldraw fallback.)*

**Specimen structure:** no `Specimen`, no `SpecimenGroup`, no `Card` — the section content is the
per-category sub-heading + `<ul>` blocks, directly inside `GallerySection`.

---

### 10. Iconography

```
id:      "iconography"
title:   "Foundations · Iconography"
mapsTo:  "Foundations → Iconography"
source:  (omit — icons live in multiple files)
```

**P1 — Composition + recipe:** live icon `Specimen`s (h3, no `SpecimenGroup`), each importing real icon
components and carrying a usage `description`:
- **One grid per icon family** — a responsive grid of `icon + name`, all at a **single catalog size**
  (the largest contextual size). One cell per real icon. Cells are **unboxed** — a plain `icon + name` stack,
  NO border/fill (icons are not a boxed treatment).
- **Icon-sizes view** — a **two-per-row** grid (`sm:grid-cols-2`); each cell is a **vertical stack** (icon
  on top): the demo icon at that size (in an `h-8` align wrapper), then the size label `icon · {label}`,
  then the context string. Cells are **left-aligned** (`items-start`) — icon, label, and context stacked to
  the left, never centered; the family grids' cells are left-aligned too.
- **Usage principles** — a bare `.prose-content` note (NOT a `Specimen`) placed before the grids,
  capturing the project's icon usage principles **as a bullet list** (`<ul>`, one point per `<li>` — like
  Imagery), never a run-on paragraph.

All three (family grids, icon-sizes view, usage note) render **inline in `foundations.tsx`** — no separate
helper module (`sections/` is exactly 5 files; see `architecture.md` → File-content pinning).

**P2 — Visual alignment:** icons inherit **currentColor** = the project's primary ink token; name = code
token; size label = eyebrow; context = caption. Grid gaps from the spacing scale; the `h-8` size-cell
align wrapper is a gallery layout constant.

**P3 — Actual inputs:**
- **Icon families** = the families the project defines (DESIGN.md → Iconography), each → a grid of ALL its
  real icons. *(Portfolio: Material/system + Brand.)*
- **Catalog grid size** = the largest contextual size *(portfolio: 20px)*.
- **Icon-sizes** = the project's contextual size→context table, read **complete** *(portfolio: 20px
  standalone · 18px buttons/mobile-nav · 16px nav/LinkPill/chevron · 12–14px inline)*.
- **Usage principles** (key points from DESIGN.md → Iconography): icons communicate function; nav pairs
  icon + text; buttons use leading icons; Material for system, distinct monochrome marks for brands.

---

## Bucket 2: Background (1 section)

### 11. Background

```
id:      "background"
title:   "Background"
mapsTo:  "Background"
source:  (omit)
```

**P1 — Composition + per-layer recipe:** the background subsystem can't render live inline (full-viewport,
fixed, already active around the page), so each layer is demoed **by its nature** — `Specimen`s at h3:
- a **static un-renderable layer** → `ThemeShot` (theme-paired static captures);
- an **animated layer** → `ThemeVideo` (theme-paired clip + poster + reduced-motion fallback);
- **orchestration-only components** (no visual of their own) → a prose list capturing their roles AND the
  subsystem's **conditional-rendering key points** (where each layer renders / is excluded);
- the subsystem's **own color tokens** (if it defines any) → the color-swatch visualizer inline in this
  section — tokens live with the section that owns them, not split into Colors.

Technique detail (`ThemeShot` / `ThemeVideo`, static-capture-for-un-renderable) → `scaffold-kit.md` +
`hard-to-demo.md`.

**Capture framing:** frame each capture to show that layer's design best — full-viewport where the
composition is the point, a focused crop where the texture/detail is (glyph density, particle color/motion).

**P2 — Visual alignment:** `ThemeShot` / `ThemeVideo` frame = the project's **media-surface** treatment
(border + media radius); only the active theme's capture shows. The orchestration prose follows the prose
layer.

**P3 — Actual inputs:** the background layers/components the project defines (DESIGN.md → Background), each
mapped to its demo by nature. Sample captures / clips / posters are **dev-only, theme-paired**, sourced via
the asset pipeline. *(Portfolio specimens, in order:* `AsciiField` (id `ascii-field`) → `ThemeShot`
(light+dark PNG) · `MeteorShower` (id `meteor-shower`) → `ThemeVideo` (light+dark mp4 + posters) ·
`particle color tokens` (id `background-particle-tokens`) → `SwatchGrid` (meteor RGB via `swatchValue`) ·
`BackgroundLayer · SurfaceContext` (id `background-orchestration`) → prose: roles + the key conditional
points — meteor excluded on reading/project routes, below the mobile breakpoint, under reduced-motion, and
on low-CPU/touch devices; ASCII masked to the gutters on desktop, sparser full-bleed on mobile, omitted on
project-detail pages.*)

---

## Bucket 3: Components (3 sections)

Components sections follow the Shell → UI → Document sub-taxonomy from `component-structure.md`. Each
maps to one `GallerySection`. Sub-groups within UI and Document become `SpecimenGroup` h3 eyebrows; their
specimens render at h4. Shell and flat Foundations sections render specimens at h3 with no sub-group layer.

### 12. Shell

```
id:      "shell"
title:   "Components · Shell"
mapsTo:  "Components → Shell"
source:  (omit)
```

**P1 — Composition + recipe:** one live `Specimen` per shell component (h3, no `SpecimenGroup`). Shell =
site-wide chrome (fixed / page-coupled), already live around the page — so each renders inside a
`ChromeFrame` (bounded containing block via `transform`, trapping `position:fixed` children) with
`ariaHidden` (the live landmark already exists; avoid AT duplicates). Recipe by component nature:
- **Floating / fixed bar** → `ChromeFrame height={…} ariaHidden`; add `InertDemo` only if it has buttons.
- **Auto-height flow chrome** (e.g. a footer) → `ChromeFrame ariaHidden` with NO `height` (sizes to content).
- **Scroll-gated element** → `ChromeFrame` + a **demo-affordance** prop (e.g. `forceVisible`) so it
  renders unconditionally; `InertDemo` for the button. `ariaHidden` only if it duplicates a live landmark
  at that position.
- **Slide-out panel** → `ChromeFrame` with the panel positioned + a scrim div; `InertDemo`. Often needs a
  **presentational sub-component** extracted from the trigger (a production carve-out).
- **Fixed section-nav / TOC rail** → `ChromeFrame` + a **demo-affordance prop** feeding a posed list (live
  scroll-tracking needs a scrolling page; a long sample list so the rail caps + scrolls). Such a rail **can
  be a *domain* component** (its home is per DESIGN.md → it may render in a Domain section, not Shell) — the
  demo technique is the same.

ChromeFrame + click-guard pseudocode → `scaffold-kit.md`; the demo-affordance / presentational-extraction
carve-out → `boundaries-and-handoff.md` + `hard-to-demo.md`.

**P2 — Visual alignment:** shell components are real and bring their own styling; `ChromeFrame` is a
neutral bounded frame (its border/surface from the project's tokens, frame height a gallery constant). No
further token resolution.

**P3 — Actual inputs:** the shell components the project defines — read each component's home from
DESIGN.md → Components → Shell (root-layout singletons), confirmed against the component-structure rule
(see Cross-section pins → Component home). Each → a `Specimen` in a `ChromeFrame` with the height + guard
appropriate to its nature.
*(Portfolio, in order:* `PillNav` (`shell-nav`, `height 120`, no InertDemo) · `MobileNav`
(`shell-mobile-nav`, `height 420 ariaHidden`, scrim + positioned `MobileNavPanel`, InertDemo) · `Footer`
(`shell-footer`, no height) · `ScrollToTop` (`shell-scroll-to-top`, `height 160`, `forceVisible`,
InertDemo, no ariaHidden).*)

**Component home:** Shell = root-layout singletons only. A fixed-chrome-LOOKING component may belong to a
Domain feature instead — resolve from DESIGN.md (Cross-section pins → Component home).

---

### 13. UI

```
id:      "ui"
title:   "Components · UI"
mapsTo:  "Components → UI"
source:  (omit)
```

UI is the **richest** component category — its recipe is a general menu; a project instantiates only the
kinds it has, so this section carries more general rules than any other.

**P1 — Composition + recipe (the general menu):** `SpecimenGroup`s by the project's UI sub-taxonomy (read
from DESIGN.md → Components → UI), Specimens at **h4**, components rendered **live directly** (no
ChromeFrame — UI is portable, not fixed chrome). Recipe by component KIND:
- **Multi-variant control** (Button, segmented) → all variants in a grid — **2-up when the sample fits the
  cell, else one per row**; each cell = the live control + a `name · token · usage` caption (the icon-sizes
  pattern). Sample text stays **simple + self-documenting** (e.g. "Primary", "Email me") — short, not a
  sentence.
- **Inputs** (text field, select, checkbox, radio, toggle) → render **live** (typing/toggling is harmless
  local state) with a **visible label**; show key states as variants where they differ (default · focus ·
  filled · disabled · error).
- **Form** → the composed form, fields live; the **submit** is inert.
- **Links** → live under the page anchor guard (`DemoViewOnly`); no per-item guard.
- **Display** (Heading, Tag, Badge, avatar) → a component with a **bounded `type`/variant set** (e.g.
  Heading's type levels) shows **all** of them; a purely illustrative component (e.g. Tag chips) shows a
  few representative instances with **descriptive** sample text (self-documenting; realistic, not lorem).
  **Semantic-level trap:** when a variant prop ALSO sets real DOM semantics (a `Heading`'s `level` emits a
  real `h1`–`h6`), vary only the **visual** variant (its `type`) and keep the semantic level fixed at the
  specimen's leaf heading depth — never let demo instances inject out-of-order headings into the page outline.
- **Feedback / Status** (alert, badge, toast, progress) → live static instances across the variants
  (info / success / warn / error).
- A component with **multiple visual variants** (e.g. theme selector's Pill + Inline) → show **all**
  variants, same grid + `name · token · usage` caption as a multi-variant control.

**Basic usage info (every specimen):** each component `Specimen` carries a one-line **usage description**
(what it's for / where it's used) via the Specimen `description`. *(General to ALL component + domain
specimens, not UI-only.)*

**Interaction states:** interactive components demonstrate their **states** (DESIGN.md → Interaction
Rules) — hover / focus stay **live**; disabled / selected / loading / error shown as **explicit variants**
where supported.

**InertDemo boundary (NOT all items):** guard with `InertDemo` ONLY interactions that **change app state,
navigate, or submit** (theme toggle, form submit, mutating buttons). Keep **live** the harmless ones —
copy-to-clipboard, hover, focus, typing into a local-state input. Anchor navigation is caught by the
page-level `DemoViewOnly`. Full rule → `scaffold-kit.md` → click-guards.

**P2 — Visual alignment:** components are real (own styling); variant-grid layout + labels use project
spacing + code/caption tokens; input labels use the project's form/label token; Specimen names use the
project's heading treatment (Full-page header rule). No token resolution beyond layout.

**P3 — Actual inputs:** the UI components + their **sub-groups, read from DESIGN.md → Components → UI**
(the sub-taxonomy is a general vocabulary — Controls/Actions · Inputs · Links · Display · Feedback/Status
— populate the subset the project has). *(Portfolio, 3 sub-groups:*
- **Controls / Actions** — `Button` (id `ui-button`; 4 variants primary/secondary/primary+icon/as-link,
  2-up, `InertDemo`) · `ThemeSelector` (id `ui-theme-selector`; both variants Pill + Inline side-by-side,
  `InertDemo`; the live Inline instance is the page header's — this is the framed copy).
- **Links** — `LinkPill` (id `ui-link-pill`; 2 instances ext/int, no guard) · `CopyLink` (id
  `ui-copy-link`; live copy, no guard).
- **Display** — `Heading` (id `ui-heading`; all `type` levels) · `Tag` (id `ui-tag`; a few sample chips) ·
  `CopyableCode` (id `ui-copyable-code`; live copy, no guard).
*The portfolio has no Inputs/Forms/Feedback — those general-only sub-groups are omitted.)*

`ThemeSelector` is in Controls/Actions (an interactive control), not Display.

---

### 14. Document

```
id:      "document"
title:   "Components · Document"
mapsTo:  "Components → Document"
source:  (omit)
```

Document is a **rich** component category like UI — its recipe is a general menu; a project populates the
sub-groups it has.

**P1 — Composition + recipe (the general menu):** `SpecimenGroup`s by the project's Document sub-taxonomy
(read from DESIGN.md → Components → Document), Specimens at **h4**, rendered **live directly, no Card** —
each Document component is its **own visual container** (a callout has its own border/fill; a figure its
own frame). Recipe by component KIND:
- **Annotations** (Callout, Highlight, aside) → render directly with self-documenting sample content.
- **Figures & Media** (Figure, image, video embed) → a **sample asset** (representative — see below).
- **Diagrams & Charts** (Diagram, DiagramRow, chart) → a **sample asset** (flow / graph-like).
- **Code** (CodeBlock) → **if DESIGN.md requires build-time / real-pipeline highlighting**, demo through
  the real MDX + highlighter pipeline; otherwise a simpler live render is fine (conditional — not always).
- **Embeds** (general-only: video, iframe, tweet) → a representative placeholder/sample.

**Sample assets** (figures, diagrams, media): source via the project's **asset system if it has one**
(announce when generating), else a **simple borderless SVG** in DESIGN.md colors/type, **representative of
the content kind** (figure = image, diagram = flow, chart = graph). Full rule → `hard-to-demo.md` → Sample
assets.

**Basic usage info (every specimen):** each `Specimen` carries a one-line usage `description` (general to
all component/domain specimens).

**Membership** is per DESIGN.md → Components → Document headers (resolve from the doc, don't infer). A
primitive merely reachable from the author registry (e.g. a re-exported Layout primitive) is NOT a Document
member — its folder/doc home wins.

**CodeBlock real-pipeline detail (when required):** render a real fenced block (`SAMPLE_CODE_MDX`) through
the project's MDX + build-time highlighter inside a `.prose-content` wrapper. *Example (portfolio): Shiki
dual-theme `vitesse-light`/`vitesse-dark`, `defaultColor: false` (CSS vars only, so the dark override
works via cascade), scoped to `.prose-content` (without the wrapper the colors don't map).* Full technique
→ `hard-to-demo.md` → demo through the real pipeline + `.prose-content` scope caveat.

**P2 — Visual alignment:** components are real (own styling); sample assets dev-only / representative;
CodeBlock colors come from the project's highlighter theme (scoped per its requirement). No token
resolution beyond layout.

**P3 — Actual inputs:** the Document components + sub-groups, read from DESIGN.md → Components → Document.
*(Portfolio: **Annotations** — `Callout` (id `mdx-callout`) · `Highlight` (id `mdx-highlight`); **Figures &
Media** — `Figure` (id `mdx-figure`, sample `figure.svg`); **Diagrams & Charts** — `Diagram` (id
`mdx-diagram`, sample `diagram.svg`) · `DiagramRow·DiagramPanel` (id `mdx-diagram-row`, samples
`panel-a/b.svg`); **Code** — `CodeBlock` (id `mdx-code-block`, real Shiki pipeline — DESIGN.md requires
build-time highlighting). No Embeds.)*

---

## Bucket 4: Domain — the project's page/feature areas

**The most project-specific bucket.** A project's domain areas (its pages / routes / features) are
whatever DESIGN.md → Domain Components defines — **derive them; don't assume a fixed set.** Everything
below is the generic method; the portfolio appears only as a worked example.

**P1 — Composition + recipe (per domain area):**
- One `GallerySection` per domain area DESIGN.md → Domain Components defines. **Section order = DESIGN.md
  order** (not reorderable).
- Read each item's **[inline] / [standalone]** tag from DESIGN.md:
  - **[inline]** (page-bound composition, no own component file) → an `InlineList`
    (`<div class="prose-content"><ul>…</ul></div>`) naming each — **listed, never recreated** (never
    re-implement the markup).
  - **[standalone]** (own component file, imported by the page) → a live `Specimen`: the real component +
    **placeholder demo data** + a usage `description` + its code-path `source`.
- An **all-inline** area = just an `InlineList` (no specimens). A **mixed** area = standalone specimens +
  a **trailing `InlineList` wrapped in its own `Specimen`** (name "Inline sections", with `source` +
  `description`) — so the inline remainder reads as a labeled sub-section, not a bare list.
- A **site-fixed domain component** (a `position: fixed` chrome element — e.g. a section-nav rail) is
  demoed the **Shell way** (`ChromeFrame` + a demo-affordance prop, *posed* not live), NOT as a plain
  inline specimen. It stays in its Domain section (home per DESIGN.md); only the demo technique is borrowed
  from Shell (see Components · Shell + `hard-to-demo.md`).

**Demo data (generic):**
- Standalone components get **schema-valid placeholder data** — generic, self-documenting text (a
  placeholder title / summary), NOT a real entity's actual content.
- Use a **real identifier only where the component dispatches by it** (e.g. a real slug if a cover/hero
  component looks up registered art by slug). Everything else stays placeholder.
- **Image-bearing domain components** (covers, hero / card media, overlay logos / avatars) → **sample
  assets**, theme-aware where the component exposes theme (logos/avatars fixed-color), via the asset rule
  — same as Document. → `hard-to-demo.md` → Sample assets. A **grid of image/cover specimens** (e.g. every
  registered cover) places each in a **`Card` well** (`scaffold-kit.md` → Card → cover-grid usage) — never a
  hand-rolled box that re-implements Card's border/fill/aspect treatment.

**P2 — Visual alignment:** standalone components are real (own styling + own container); per-component
treatments (a media well for a cover, an overlay over a sunken/deep surface, a fixed rail in a
`ChromeFrame`, …) resolve from DESIGN.md; sample assets representative. A component that is **fluid/
responsive in the app** (cards, media) is demoed in a **fluid container capped at its real width there**
(grid-cell max — an instance value from the project's layout), NOT a fixed small box, so it flexes at true
size. No token resolution beyond what the components bring.

**P3 — Actual inputs:** the domain areas + their components + [inline]/[standalone] tags, ALL read from
DESIGN.md → Domain Components; the demo-data shape from the project's content schema.

> **Example (portfolio) — 5 domain areas, in DESIGN.md order** (ids in parens):
> - **Home Page** (`home`) — all `[inline]` → `InlineList` (Hero · Featured Projects Grid).
> - **Work Index** (`work`) — `[inline]` → `InlineList` (listing grid).
> - **Project Detail** (`project`) — mixed. Standalone specimens (live, fed one `demoProject` constant —
>   a schema-valid `Project` of generic placeholder text, with ONE real `slug` so the cover/hero
>   dispatches): `ProjectCard` · `ProjectHeader` · `HeroMedia` (16:9 in a surface-deep well) ·
>   **`HeroMetaOverlay` — SEPARATE specimen over a plain surface-deep well** (sample logos/avatars, no
>   HeroMedia behind it) · `Covers` (every registered cover, each in a `Card` well) · `ProjectOverview` ·
>   `TechStack` (both wrapped in `.prose-content` for their definition lists) · **`SectionProgressNav` in
>   a `ChromeFrame` via the `demoSections` demo-prop** (posed; long list so the rail caps + scrolls; it's
>   `project/`, NOT shell). Then a trailing `InlineList` (Project Detail · Prose deep-dive · Editorial
>   two-column layouts).
> - **About Layouts** (`about`) — mixed: `ViewDownloadButton` (standalone, `InertDemo`) + `InlineList`
>   (Two-panel Intro · Capabilities · Approach · Work with Me).
> - **404 Not Found** (`not-found`) — `[inline]` → `InlineList`.

---

## Bucket 5: Technical (2 sections)

### 20. Responsive Behavior

```
id:      "responsive"
title:   "Interaction · Responsive Behavior"
mapsTo:  "Interaction Rules → Responsive Behavior"
source:  "DESIGN.md → Responsive Behavior"
```

**P1 — Composition:** no `Specimen`/`SpecimenGroup` — a single `.prose-content` wrapper containing, IN
ORDER: `<SpanTable>` → `<DeviceRuler>` → touch-targets bullet prose → collapsing-strategy bullet prose.
```
<div class="prose-content flex flex-col gap-[{sp}]">
  <SpanTable zones={ZONES} />
  <DeviceRuler stops={ZONE_BARS} />
  <div class="flex flex-col gap-[{sp}]">
    <div class="flex flex-col gap-[{sp}]"><p class="{T_EMPHASIS}">Touch targets</p><ul>…</ul></div>
    <div class="flex flex-col gap-[{sp}]"><p class="{T_EMPHASIS}">Collapsing strategy</p><ul>…</ul></div>
  </div>
</div>
```
The `.prose-content` wrapper is required (SpanTable + the prose lists need its editorial styling).

**P2 — Visual alignment:** SpanTable + the bullet prose inherit the project's prose / editorial table
styling; DeviceRuler per its P2 (used = sunken/deep level, unused = raised level — surface+border paired;
radius 0; horizontal scroll on overflow); the `Touch targets` / `Collapsing strategy` labels = emphasis
token. (Full visualizer rules → `visualizer-kit.md` → SpanTable / DeviceRuler → P2.)

**P3 — Actual inputs:**
- `ZONES` (SpanTable) = the project's responsive zones, read from DESIGN.md → Responsive Behavior; each
  `{ name, width, changes[] }` with the **key** layout changes per zone. *(Portfolio: Desktop(xl) ·
  Tablet(md) · Mobile(base).)*
- `ZONE_BARS` (DeviceRuler) = the fixed silhouette standard (geometry below) + which breakpoints the
  project marks `used`. *(Portfolio: base/md/xl used.)*
- **Touch-targets** + **Collapsing-strategy** = **explicit bullet (`<ul>`) prose**, key points, read
  complete from DESIGN.md → Touch Targets + Collapsing Strategy.

`ZONE_BARS` fixed silhouette standard (reproduce verbatim; only `used` + token vary per project):

  | px | device | token | used | boxW | boxH |
  |---|---|---|---|---|---|
  | 0 | Mobile | base | true | 64 | 128 |
  | 640 | Large mobile | sm | false | 76 | 138 |
  | 768 | Tablet | md | true | 104 | 162 |
  | 1024 | Laptop | lg | false | 168 | 140 |
  | 1280 | Desktop | xl | true | 210 | 150 |
  | 1536 | Ultra wide | 2xl | false | 264 | 152 |

DeviceRuler renders AFTER SpanTable and BEFORE the prose blocks (order pinned above).

---

### 21. Z-Index Scale

```
id:      "z-index"
title:   "Technical · Z-Index Scale"
mapsTo:  "Technical Conventions → Z-Index Scale"
source:  "--z-*"
```

**P1 — Composition:** a single `<LayerStack items={Z_INDEX_LAYERS} />` directly inside `GallerySection` —
no `Specimen`/`Card`. The layers are the main visual (diagonal stack — full template →
`visualizer-kit.md` → LayerStack → P1).

**P2 — Visual alignment:** plane depth is **sign-mapped** (negative → sunken bordered · 0 → no-border ·
positive → raised bordered; uniform fallback) using simple bordered levels; labels role = **primary
text** / token = code / value = eyebrow; radius always 0 (full rules → `visualizer-kit.md` → LayerStack
→ P2).

**P3 — Actual inputs (`Z_INDEX_LAYERS`):** the project's z-index tokens, read **complete** from DESIGN.md
→ Z-Index Scale; each `{ token, value, role }`. `LayerStack` sorts ascending by value internally — pass in
any order. *(Portfolio: 6 — `--z-base` (0) · `--z-sticky-content` (20) · `--z-scroll-to-top` (40) ·
`--z-pill-nav` (50) · `--z-mobile-menu-overlay` (55) · `--z-mobile-menu-panel` (60).)*

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

Total: 21 sections. 10 Foundations + 1 Background + 3 Components + 5 Domain + 2 Technical.

DESIGN.md sections with no gallery entry (describe rules, not visual specimens): Overview / Design
Philosophy / Core Principles / Things to Avoid · Accessibility Rules · Cross-Cutting Constraints.

---

## Cross-references

- Visualizer pseudocode (exact data contracts + layouts) → `visualizer-kit.md`
- Scaffold primitive pseudocode (`GallerySection`, `SpecimenGroup`, `Specimen`, `Card`, `ChromeFrame`,
  click-guards, `ThemeShot`, `ThemeVideo`) → `scaffold-kit.md`
- Hard-to-demo techniques (ChromeFrame, demo-prop, Shiki pipeline, overlay-on-hero, sample assets,
  `InlineThemeSelector` placement) → `hard-to-demo.md`
- Pinned file/folder structure and `page.tsx` template → `architecture.md`
- Mode-decision flow and strict DESIGN.md → spine mapping → `modes.md`
