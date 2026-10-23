# Spine — Foundations: depth, motion and form

Elevation & Depth, Motion & Interaction, Layout, Imagery and Iconography — the Foundations sections
whose subject is not a flat scale. Continues `spine-foundations-base.md`; shared contract and pins in
`section-spine.md`.

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
padding from spacing (full rules → `visualizer-depth.md` → DepthGrid → P2).

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
z-index stack) belongs to `LayerStack`, never here. *(Example: 6 levels, 0–5.)*

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
the project's **sunken/deep well**; labels by role; gaps from spacing (full rules → `visualizer-motion.md` →
DurationScale + EasingCurves → P2).

**P3 — Actual inputs:** read **complete** from DESIGN.md → Motion (Duration & Easing); values per `section-spine.md` → The three layers.
- `DURATION_TOKENS` — each `{ token, ms }` (resolved millisecond value).
- `EASING_TOKENS` — each `{ token, curve: [x1,y1,x2,y2] }`. The cubic-bezier tuple **is** the token's
  value (P3 data, like ms or hex). **Note:** DESIGN.md may only NAME the easings; the curve numbers then
  come from the code (theme/CSS) — a doc↔code gap to flag. The rendering math (coordinate transforms) is
  P1, not P3.
- Counts project-determined. *(Example: 3 durations, 2 easings.)*

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
layout primitive visible — the one sanctioned use of demo-scaffolding cells (see `visualizer-dogfood.md` →
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
*(Example: `Stack` (3 cells) · `Grid` (12 numbered cells) · `Divider` · combined
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
every sub-bullet verbatim). *(Example: **Photography** — monochrome/muted, restrained, editorial;
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
  real icons. *(Example: Material/system + Brand.)*
- **Catalog grid size** = the largest contextual size *(example: 20px)*.
- **Icon-sizes** = the project's contextual size→context table, read **complete** *(example: 20px
  standalone · 18px buttons/mobile-nav · 16px nav/LinkPill/chevron · 12–14px inline)*.
- **Usage principles** (key points from DESIGN.md → Iconography): icons communicate function; nav pairs
  icon + text; buttons use leading icons; Material for system, distinct monochrome marks for brands.

---

