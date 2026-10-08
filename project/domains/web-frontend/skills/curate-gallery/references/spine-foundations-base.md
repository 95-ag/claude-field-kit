# Spine — Foundations: the base scales

Colors, Typography, Prose, Spacing and Shapes — the Foundations sections that render a token scale.
The shared contract and the cross-section pins are in `section-spine.md`; the remaining Foundations
sections are in `spine-foundations-visual.md`.

---

## Bucket 1: Foundations

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
project's card treatment + semantic type tokens (full rules → `visualizer-scales.md` → SwatchGrid → P2).

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
(dogfood). Full rules → `visualizer-type.md` → TypeScaleList → P2.

**P3 — Actual inputs (`TYPE_TOKENS`):** one entry per the project's semantic type token, read from
DESIGN.md → Typography. Each `{ token, family, size, weight, lh?, sample, responsive? }`. `sample` =
a one-line description of **where the token is used** (from the DESIGN.md "Role" column) — not lorem,
not an alphabet run. `responsive` only for tokens that resize across tiers. The token count and values
are project instance (example: 19) — they live in `sections/`, not pinned here.

**`lh` is optional, and per-tier line heights are their own fields** (`tabletLh?`, `mobileLh?` beside
`responsive`). Both follow from one rule: **a required field forces a fabricated value.** A doc that
leaves a role's line height unstated has to be rendered as unstated — making `lh` required means the
builder supplies a plausible number, and a plausible number on a type-scale specimen is indistinguishable
from a documented one. Likewise a single `lh` cannot express a role whose leading changes across tiers,
so the choice would be one invented figure or a silently wrong one. Where the doc states no value, the
row shows none.

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
a horizontal rule, and a closing paragraph. Zero the top margin of the wrapper's first child (example: `[&>*:first-child]:mt-0`) so it sits flush — otherwise that first element's own top margin stacks on the GallerySection gap and doubles the space above the sample.

**P2 — Visual alignment:** wrap the sample in the **project's prose-layer class** (here `.prose-content`)
plus the P1 first-child margin reset, and add NO OTHER overrides — that layer owns every type token,
margin, list marker, and border. The reset is the sole exception (a layout-collision fix, not a style
override); the prose otherwise styles itself (dogfood).

**P3 — Actual inputs:** the **element set** = whichever elements the project's prose layer styles, read
from DESIGN.md → Prose (example: `h3`, `h4`, `p` + inline `a`/`strong`/`code`, `ul`, `ol`,
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
spacing scale (full rules → `visualizer-scales.md` → BarScale → P2).

**P3 — Actual inputs:** the spacing token list, read **complete** from DESIGN.md → Spacing. Each
`{ token, px }`; `varPrefix` names the CSS var prefix. Bars read live `var(--<prefix><token>)`.
- **Base step scale** (always) — every step the project defines.
- **Optional extra groups** — non-step spacing the project defines (e.g. layout gutter/margins), each
  under its own sub-label.
*(Example: base `xs…5xl` (9 steps) + layout `gutter`/`margin-mobile`/`margin-desktop`.)*

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
code/identifier token; usage = caption; gaps from spacing (full rules → `visualizer-layout.md` → ShapeRow → P2).

**P3 — Actual inputs (`RADIUS_TOKENS`):** **one item per distinct radius the project defines** — named
radius tokens OR unnamed-but-distinct radius values used across the design — read **complete** from
DESIGN.md → Shapes. The count is project-determined, not fixed. Each `ShapeItem =
{ token, radius (CSS value), value (human), usage }`; for an unnamed radius, `token` is its usage-category
label. *(Example: 4 — `none` · `sm` · `md` · `pill`.)*

---

