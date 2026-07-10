# Visualizer Kit

Generic, data-driven visualizers for the project's design-system tokens. Each visualizer
owns its type definitions and rendering structure; it carries **zero baked project data**
— the per-project `sections/` modules declare token arrays and pass them in as props.

**File:** `visualizer-kit/index.ts` (barrel re-exports all 9 visualizers)
**Files:** 9 component files — one visualizer per file (names pinned below)

Stack-specific rendering details (live `var()` resolution, JSX vs HTML SVG syntax, portal
targets) belong in `stack-adapters.md`. This file is stack-agnostic pseudocode.

---

## The three layers (P1 · P2 · P3)

Every visualizer is specified in three SEPARATED layers. Keep them distinct — conflating them is what
makes a rebuild either reinvent structure (too little pinning) or hardcode this project's values (too
much pinning):

- **P1 — Template (universal).** The fixed structure the visualizer ALWAYS has, identical for every web
  project: DOM shape, dimensions, grid / responsive / count, and the info order (e.g. ColorCard =
  name → token → usage). This is what the visualizer *component* builds. It carries NO project values.
- **P2 — Visual alignment (dogfood, derived from DESIGN.md).** The visualizer adopts THIS project's own
  visual treatments, each resolved from the project's DESIGN.md — never hardcoded: card radius = the
  project's card radius, depth/elevation = the project's card depth, each text role → the semantically
  correct project type token, spacing/grid → the project's spacing rules. The portfolio appears only as
  a worked *example* ("Example (portfolio): radius-none, because ProjectCard is 0px"); the instruction
  is always "resolve from DESIGN.md → §X".
- **P3 — Actual inputs (instance).** The real token data fed into the visualizer. This does NOT live
  here — visualizers carry zero baked data. It lives in the project's `sections/` modules and is
  catalogued in `section-spine.md` per section.

Each visualizer entry below separates P1 and P2; the universal **Dogfooding gate** at the end of this
file states the P2 principles that apply to every visualizer. P3 → `section-spine.md`.

> Migration in progress: per-visualizer P1/P2 labelling is being applied section-by-section. Entries not
> yet migrated still show the older mixed form.

---

## Visualizer index (pinned filenames)

```
visualizer-kit/
├── index.ts          ← barrel re-exports ALL 9 visualizers
├── swatch-grid.tsx   ← SwatchGrid (SwatchToken, SwatchGroup types)
├── type-scale.tsx    ← TypeScaleList (TypeToken type)
├── bar-scale.tsx     ← BarScale (BarItem type)
├── shape-row.tsx     ← ShapeRow (ShapeItem type)
├── depth-grid.tsx    ← DepthGrid (DepthLevel type)
├── motion-scale.tsx  ← DurationScale (DurationToken) + EasingCurves (EasingToken)
├── layer-stack.tsx   ← LayerStack (LayerItem type)
├── device-ruler.tsx  ← DeviceRuler (RulerStop type)
└── span-table.tsx    ← SpanTable (SpanZone type)
```

Names are law — never "similar" or renamed.

---

## 1. SwatchGrid

**File:** `swatch-grid.tsx`

### Types

```
SwatchToken = {
  token: string        // CSS custom property: "--surface", "--accent"
  name: string         // human display name: "Surface", "Accent"
  usage: string        // one-line role description
  swatchValue?: string // override for non-color tokens
                       // e.g. "rgb(var(--meteor-accent-rgb))"
                       // omit for standard color tokens — defaults to var(token)
  darkOnly?: boolean   // true = hide card in light theme via darkOnlyClassName
}

SwatchGroup = {
  label: string
  tokens: SwatchToken[]
  note?: ReactNode               // body-caption note rendered above the grid
  scopeClassName?: string        // class applied to grid wrapper
                                 // used for reading-mode scoped token previews
  darkOnlyClassName?: string     // class applied to darkOnly token cards
}
```

### P1 — Template (universal structure)

The fixed structure, identical for every project. The component builds this; no project values baked in.
Treatment classes shown as `{PLACEHOLDERS}` are resolved by P2.

**ColorCard** — a swatch area on top + a text area below, as one card unit:

```
<div class="flex flex-col overflow-hidden {CARD_FRAME} {darkOnlyClass?}">   ← {CARD_FRAME}: border + radius (P2)

  SWATCH AREA — fixed height (h-20 / 80px):
  <span aria-hidden="true" class="h-20 w-full {DIVIDER}"                     ← {DIVIDER}: bottom border (P2)
        style="background: {swatchValue ?? var(token)}" />

  TEXT AREA — three rows, FIXED ORDER name → token → usage:
  <div class="flex flex-1 flex-col gap-[{sp}] p-[{sp}] {CARD_FILL}">                ← {CARD_FILL}: raised surface (P2)
    <span class="{T_NAME}">{name}</span>     ← 1st: human name
    <span class="{T_TOKEN}">{token}</span>   ← 2nd: CSS token string
    <span class="{T_USAGE}">{usage}</span>   ← 3rd: usage description
  </div>

</div>
```

Field order **name → token → usage** is fixed — never reorder. Swatch area (fixed height) and text area
are siblings in a flex-col; the text area is `flex-1`, so it fills the card's height — its surface fill
covers the whole card even when a taller sibling in the same grid row stretches it.

**SwatchGrid** — groups, each an eyebrow label + optional note + a responsive grid:

```
<div class="flex flex-col gap-[{sp}]">
  {groups.map(group =>
    <div class="flex flex-col gap-[{sp}]">
      <span class="{T_EYEBROW}">{group.label}</span>                         ← group label (P2 type role)
      {group.note && <div class="{T_USAGE}">{group.note}</div>}
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[{sp}] {group.scopeClassName?}">
        {group.tokens.map(t =>
          <ColorCard {...t} className={t.darkOnly ? group.darkOnlyClassName : undefined} />)}
      </div>
    </div>)}
</div>
```

Responsive column count **2 → 3 → 4** is fixed.

**Mechanisms** (universal capabilities, not project data):
- **`swatchValue`** — for a token whose raw value isn't a usable CSS color (e.g. an RGB triple
  `"12 34 56"`): set `swatchValue: "rgb(var(<token>))"` so the swatch resolves to a real color. Standard
  color tokens omit it (fill defaults to `var(token)`). The swatch background is an inline style reading
  the **live** CSS variable (theme-adaptive, no baked hex); inline-style syntax per stack →
  `stack-adapters.md`.
- **`scopeClassName` + `darkOnlyClassName`** — to preview **scoped token overrides** live (e.g. a
  reading-mode surface scope): declare a gallery-scoped class in `gallery.css` that re-declares the
  changed tokens (both themes), pass it as the group's `scopeClassName`; cards inside resolve
  `var(--token)` against the scope. BOTH the `scopeClassName` AND the matching `gallery.css` rule are
  required — one without the other renders an inert card. A `darkOnly` card (changed in one theme only)
  is hidden in the other via `darkOnlyClassName`.

### P2 — Visual alignment (resolve from DESIGN.md)

- **`{CARD_FRAME}` · `{CARD_FILL}` · `{DIVIDER}` · radius** — the ColorCard adopts the project's
  **raised/elevated elevation level as a pair**: that level's border on the card frame + the swatch↔text
  divider, its surface fill on the text area (surface + border from the SAME level — never mixed; see
  Generic fallbacks → Surface + border = one level). The radius is the project's card radius, adopted
  **separately**. Fall back per Generic fallbacks → raised/elevated card if the level is absent.
- **`{T_NAME}` · `{T_TOKEN}` · `{T_USAGE}` · `{T_EYEBROW}`** — pick the project's semantically-closest
  type token per role: name = primary label · token = code / identifier · usage = secondary / caption ·
  group label = eyebrow / structural metadata. Choose by role, not by a fixed list (works whether the
  project has 3 type tokens or 19).
- **`{sp}`** — all padding and gaps come from the project's spacing scale.

P3 (the actual token groups) → `section-spine.md` → Colors.

---

## 2. TypeScaleList

**File:** `type-scale.tsx`

### Types

```
TypeToken = {
  token: string                         // CSS class name: "display-primary", "body-lead"
  family: string                        // font family: "Manrope", "Inter", "JetBrains Mono"
  size: number                          // desktop px value
  weight: number                        // 400 | 500 | 600
  lh: number                            // line-height px
  sample: string                        // one-line text describing WHERE the token is used in the
                                        // product (sourced from DESIGN.md Typography "Role" column);
                                        // NOT lorem ipsum, NOT an alphabet run.
                                        // e.g. "Major section headers across the home and work pages."
  responsive?: { tablet: number; mobile: number }  // only for tokens with responsive sizing
}
```

### P1 — Template (universal structure)

Treatment classes shown as `{PLACEHOLDERS}` are resolved by P2.

```
<div class="flex flex-col">             ← no gap; the row border provides rhythm

  {tokens.map(t =>
    <div class="grid grid-cols-1 gap-[{sp}]
                border-b {DIVIDER} py-[{sp}] last:border-b-0
                md:grid-cols-[280px_1fr] md:items-baseline md:gap-[{sp}]">

      LEFT COLUMN — token metadata (280px at md+), stacked in fixed order:
      <div class="flex flex-col gap-[{sp}]">
        <span class="{T_CODE}">.{t.token}</span>                      ← class name, leading dot
        <span class="{T_META}">{t.family} · {t.size}px / {t.weight} / lh {t.lh}</span>
        {t.responsive &&
          <span class="{T_CAPTION}">↘ desktop {t.size}px → tablet {…} → mobile {…}</span>}
      </div>

      RIGHT COLUMN — live sample, class IS the token:
      <div class="{t.token} min-w-0">{t.sample}</div>
      ↑ the class is the token — the sample renders at its own type scale

    </div>)}

</div>
```

Fixed: one row per token; rows separated by `border-b` (no gap); two-column `280px_1fr` at md+, single
column on mobile; left-column stack order **class → metrics → responsive**. The **280px** left-column
width is a gallery layout constant (documented bare-px exception), not a design token.

### P2 — Visual alignment (resolve from DESIGN.md)

- **`{T_CODE}` · `{T_META}` · `{T_CAPTION}`** — left-column metadata text by role: class name = code /
  identifier · the `family·size/weight/lh` line = eyebrow / metadata · responsive steps = secondary /
  caption.
- **`{DIVIDER}`** = the project's hairline / divider token.
- **`{sp}`** — row padding and gaps from the project's spacing scale.
- **Dogfood (ENFORCED):** the right-column sample carries **only** `class={t.token}` — no color, size,
  weight, line-height, or family override. The token class bakes its own color and metrics; any override
  is a violation. This is the section's whole point — render each token AS itself.

---

## 3. BarScale

**File:** `bar-scale.tsx`

### Types

```
BarItem = {
  token: string    // token name WITHOUT prefix: "xs", "md", "2xl"
  px: number       // resolved pixel value for display in the label
}
```

### P1 — Template (universal structure)

Treatment classes shown as `{PLACEHOLDERS}` are resolved by P2.

```
props: items: BarItem[], varPrefix: string   // varPrefix e.g. "--spacing-"

<div class="grid grid-cols-[auto_1fr] items-center gap-[{sp}]">
  {items.map(({token, px}) =>       // each item emits TWO grid children (label, bar) — no row wrapper
    <Fragment key={token}>

      LABEL (col 1, auto width) — token name + resolved value, one line:
      <span class="{T_LABEL} whitespace-nowrap">{token} · {px}</span>

      BAR (col 2, 1fr) — width reads the LIVE token value:
      <span aria-hidden="true" class="{BAR_H} {BAR_FILL}"
            style="width: var({varPrefix}{token})" />

    </Fragment>)}
</div>
```

Fixed: label LEFT, bar RIGHT; the resolved value sits **in the label**, not on the bar; bar width reads
**live** `var({varPrefix}{token})` so it shows the token's literal magnitude. `varPrefix` is passed by
the caller (e.g. `--spacing-`).

**Shared label column** (font-agnostic, no `{LABEL_WIDTH}` constant): the outer element is a 2-column grid
`grid-cols-[auto_1fr]`. The `auto` column sizes to the widest `token · value` label in **any** font (no
per-char math, no hardcoded px, no truncation); every bar starts at the same x (the shared column edge).
The `1fr` column takes the rest; `whitespace-nowrap` keeps each label on one line.

### P2 — Visual alignment (resolve from DESIGN.md)

- **`{BAR_FILL}`** = the project's accent token.
- **`{T_LABEL}`** = code / identifier type token.
- **`{sp}`** — row gap + label-to-bar gap from the project's spacing scale.
- **`{BAR_H}`** (bar height) is a gallery layout constant (e.g. 20px); the live bar **width** is the
  project's real spacing value via `var()`, not a constant.

---

## 4. ShapeRow

**File:** `shape-row.tsx`

### Types

```
ShapeItem = {
  token: string   // token name: "none", "sm", "md", "pill"
  radius: string  // full CSS value passed as inline style: "var(--radius-md)", "9999px"
  value: string   // human-readable value: "0px", "4px", "9999px"
  usage: string   // one-line description
}
```

### P1 — Template (universal structure)

Treatment classes shown as `{PLACEHOLDERS}` are resolved by P2.

```
<div class="flex flex-wrap gap-[{sp}]">
  {items.map(({token, radius, value, usage}) =>
    <div class="flex {COL_W} flex-col items-center gap-[{sp}]">

      SHAPE BOX — fixed square, radius applied INLINE (each item differs):
      <span aria-hidden="true" class="{BOX_SIZE} {BOX_FRAME}"
            style="border-radius: {radius}" />

      LABEL (token · value, never wraps):
      <span class="{T_LABEL} whitespace-nowrap">{token} · {value}</span>

      USAGE (centered caption):
      <span class="{T_CAPTION} text-center">{usage}</span>

    </div>)}
</div>
```

Fixed: a flex-wrap row of centered columns (box + label + usage). The radius is applied **per-item via
inline style** (not a class) because each item differs. `{BOX_SIZE}` (a fixed square, e.g. 64×64) and
`{COL_W}` (a uniform column width ≥ the widest `token · value` label, so no label wraps) are gallery
layout constants.

### P2 — Visual alignment (resolve from DESIGN.md)

- **`{BOX_FRAME}`** — the box adopts the project's **raised/elevated elevation level** (surface + border
  as a pair — never mixed; see Generic fallbacks → Surface + border = one level). Falls back per Generic
  fallbacks → raised/elevated card. The per-item radius is P3 data (applied inline), separate from the level.
- **`{T_LABEL}`** = code/identifier token; **`{T_CAPTION}`** = caption token.
- **`{sp}`** — item + column gaps from the spacing scale.

---

## 5. DepthGrid

**File:** `depth-grid.tsx`

### Types

```
DepthLevel = {
  name: string       // "Level 0 · Flat", "Level 1 · Border only", "Level 5 · Accent left"
  spec: string       // human description of the treatment: "No border, flat surface"
  className: string  // the ACTUAL CSS classes that apply the elevation treatment
                     // e.g. "bg-[--surface] border border-[--hairline]"
                     // the card demonstrates the level by BEING styled with className
  usage: string      // where this level appears in the UI
}
```

### P1 — Template (universal structure)

Treatment classes shown as `{PLACEHOLDERS}` are resolved by P2; each card's elevation `className` is P3
data (the level's actual treatment).

```
<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[{sp}]">
  {levels.map(({name, spec, className, usage}) =>

    CARD — the card IS the demonstration; {className} applies that level's elevation:
    <div class="flex min-h-[{MIN_H}] flex-col justify-between p-[{sp}] {className}">

      TOP — level name:
      <span class="{T_NAME}">{name}</span>

      BOTTOM — spec + usage:
      <div class="flex flex-col gap-[{sp}]">
        <span class="{T_META}">{spec}</span>
        <span class="{T_CAPTION}">{usage}</span>
      </div>

    </div>)}
</div>
```

Fixed: a responsive grid (1 → 2 → 3 cols); each card splits name (top) / spec+usage (bottom) via
`justify-between` within a fixed `min-h`. The card's own `className` IS the level's elevation treatment —
the card demonstrates the level by being styled with it. `{MIN_H}` is a gallery layout constant.

### P2 — Visual alignment (resolve from DESIGN.md)

- **`{T_NAME}` · `{T_META}` · `{T_CAPTION}`** — card label text by role: name = primary label · spec =
  eyebrow / metadata · usage = caption.
- **`{sp}`** — grid gap + card padding from the spacing scale.

The per-card elevation treatments themselves are **P3** — read each level's surface / border / blur from
DESIGN.md → Elevation, in document order. See `section-spine.md` → Elevation & Depth.

---

## 6. DurationScale + EasingCurves

**File:** `motion-scale.tsx` (both visualizers in one file)

Two visualizers composed under the Motion `GallerySection` as sibling `SpecimenGroup`s — "Durations"
(`DurationScale`) + "Easing" (`EasingCurves`). Both **static** — neither animates, so they satisfy
`prefers-reduced-motion` trivially. Treatment classes shown as `{PLACEHOLDERS}` are resolved by P2.

### Types

```
DurationToken = { token: string; ms: number }                 // resolved millisecond value
EasingToken   = { token: string; curve: [x1, y1, x2, y2] }    // cubic-bezier control points
```

### P1 — Template (universal structure)

**Gallery constants (FIXED — not derived per project, not design tokens):** duration **track width**
(`TRACK_W`, e.g. 280px) · token-label width (`LABEL_W`, e.g. 160px) · track height (`TRACK_H`, e.g. 6px) ·
easing **canvas size** (`CANVAS`, e.g. 180px square).

**DurationScale** — rows on a shared 0→max track so durations are comparable:

```
maxMs = max(items.ms);   barPx = round(ms / maxMs * TRACK_W)

<div class="overflow-x-auto"><div class="flex w-fit flex-col gap-[{sp}] p-[{sp}]">
  {items.map(({token, ms}) =>
    <div class="flex items-center gap-[{sp}]">
      <span class="{T_CODE} shrink-0" style="width: {LABEL_W}">{token}</span>     ← token label
      <div class="relative shrink-0" style="width: {TRACK_W}">                    ← track container
        <span class="{T_EYEBROW} absolute bottom-[calc(100%+4px)] -translate-x-1/2 whitespace-nowrap"
              style="left: {barPx}">{ms}ms</span>                                 ← floats above bar tip
        <div class="{TRACK_H} w-full {TRACK_BG}">                                 ← track
          <div class="h-full {BAR_FILL}" style="width: {barPx}" /></div>          ← fill
        <span class="{T_EYEBROW} absolute top-[calc(100%+4px)] left-0">0ms</span>
        <span class="{T_EYEBROW} absolute top-[calc(100%+4px)] right-0">{maxMs}ms</span>
      </div>
    </div>)}
</div></div>
```

Each bar sits on a FULL 0→maxMs track (the slowest fills it). The `{ms}` label floats **above** the bar
tip (at `barPx` from the left); the `0 / max` axis labels sit **below** the track.

**Container padding:** the `p-[{sp}]` vertical padding must contain the `{ms}` tip and `0/max` axis
labels that float above/below the track.

**EasingCurves** — a flex-wrap of per-curve SVG plots:

```
<div class="flex flex-wrap gap-[{sp}]">{items.map(t => <EasingPlot {...t} size={CANVAS} />)}</div>
```

**EasingPlot (per curve)** — the SVG coordinate geometry is **visualization math** (bare-px exceptions),
identical for every project:

```
[x1,y1,x2,y2] = curve;  pad = 12;  inner = CANVAS - pad*2
sx(v) = pad + v*inner;  sy(v) = pad + (1-v)*inner          // y-flipped: 0=bottom, 1=top
path  = "M {sx(0)} {sy(0)} C {sx(x1)} {sy(y1)} {sx(x2)} {sy(y2)} {sx(1)} {sy(1)}"

<div class="flex flex-col gap-[{sp}]">
  <div class="{CANVAS_BOX}" style="width:{CANVAS}; height:{CANVAS}">     ← {CANVAS_BOX}: sunken/deep well (P2)
    <svg width={CANVAS} height={CANVAS} viewBox="0 0 {CANVAS} {CANVAS}" role="img"
         aria-label="Easing {token}: cubic-bezier({x1},{y1},{x2},{y2})">
      diagonal reference line (dashed)          stroke {DIVIDER}, dasharray 2 2
      two control-point handle lines            stroke {DIVIDER}
      bezier <path d={path}>                     stroke {CURVE}, width 2, linecap round
      two endpoint dots          r=3            fill {ENDPOINT}
      two control-point circles  r=2.5          fill none, stroke {DIVIDER}
    </svg>
  </div>
  <span class="{T_CODE}">{token}</span>
  <span class="{T_CAPTION}">cubic-bezier({x1}, {y1}, {x2}, {y2})</span>
</div>
```

**Section composition** — two sibling `SpecimenGroup`s, no outer `Specimen`:

```
<SpecimenGroup title="Durations"><DurationScale items={DURATION_TOKENS} /></SpecimenGroup>
<SpecimenGroup title="Easing"><EasingCurves items={EASING_TOKENS} /></SpecimenGroup>
```

### P2 — Visual alignment (resolve from DESIGN.md)

- **`{BAR_FILL}` · `{CURVE}`** = the project's accent token.
- **`{TRACK_BG}` · `{DIVIDER}`** (track background, reference + handle lines, control-point circles) =
  the project's border/hairline token.
- **`{ENDPOINT}`** (curve endpoint dots) = the project's muted-text token.
- **`{CANVAS_BOX}`** = the project's **sunken/deep elevation level** (surface + border as a pair — see
  Generic fallbacks → Surface + border = one level) + media radius (separate) — NOT a raised card. Fall
  back per Generic fallbacks → sunken/deep well.
- **`{T_CODE}` · `{T_EYEBROW}` · `{T_CAPTION}`** = code / eyebrow / caption type tokens by role.
- **`{sp}`** — gaps + padding from the spacing scale.

(P3 — the actual duration/easing token values — lives in `section-spine.md` → Motion.)

---

## 7. LayerStack

**File:** `layer-stack.tsx`

### Types

```
LayerItem = {
  token: string   // "--z-base", "--z-pill-nav", "--z-mobile-menu-panel"
  value: string   // numeric z-index as string: "0", "50", "60"
  role: string    // one-line description: "Base content flow", "Pill nav"
}
```

### P1 — Template (universal structure)

The layers ARE the main visual. Treatment classes shown as `{PLACEHOLDERS}` are resolved by P2.

```
props: items: LayerItem[]

ordered = items sorted ASCENDING by Number(value)   // back (lowest z) → front (highest z)
count   = ordered.length

<div class="overflow-x-auto pb-[{sp}]">                          ← horizontal scroll on overflow
  <div class="relative" style="height: {PLANE_H + (count-1)*dy}; min-width: {MIN_W}">   ← NO border/fill
    {ordered.map((item, i) =>
      <div class="absolute flex flex-col gap-[{sp}] overflow-hidden p-[{sp}] {PLANE_LEVEL(item.value)}"
           style="top: {i*dy}; left: {i*dx}; width: calc(100% - {(count-1)*dx}); min-height: {PLANE_H}; z-index: {i}">
                                                                 ← radius ALWAYS 0 (no rounding)
        <span class="{T_PRIMARY}">{item.role}</span>            ← role  (primary text)
        <span class="{T_CODE}">{item.token}</span>             ← token (code)
        <span class="{T_EYEBROW}">{item.value}</span>          ← value (eyebrow)
      </div>)}
  </div>
</div>
```

Fixed:
- **Order = z-index value, ascending** (back/top-left → front/bottom-right). Not input order.
- **Diagonal, but lean VERTICAL.** Favor the downward offset (`dy`) over the horizontal (`dx`) so planes
  stay wide. `dy` MUST clear each plane's text band so **no plane's text is ever hidden** by the next
  plane — increase `dy` as the layer count grows; the container height grows with the layers.
- **Full text-width.** Every plane — especially the back (top-left) and front (bottom-right) — stays wide
  enough to show its full text; the horizontal offset never shrinks a plane below text-width.
- **Outer container has NO border / NO fill** — positioning only. Only the planes carry a treatment.
  (Prior rebuilds wrongly bordered the wrapper.)
- **Radius always `0px`** — fixed, NO dogfood (planes are structural, like DeviceRuler silhouettes).
- **Geometry** (gallery layout constants — size to the text band, don't undersize): `PLANE_H` = each
  plane's uniform `min-height` (its 3-line text band + padding); `dy` ≈ that text band so the next plane
  clears the previous plane's label; `dx` < `dy` (lean vertical); `MIN_W` = scroll min-width. Verify in a
  render that no text is hidden; scale with the project's type. *(Example (portfolio): PLANE_H 150 · dy
  104 · dx 44 · MIN_W 480.)*

### P2 — Visual alignment (aesthetic — sign-mapped dogfood)

Plane depth is an **aesthetic layering device**; map each plane's treatment to its z-index VALUE's sign,
using only the project's **simple bordered** elevation levels (surface + border paired):

| z-index value | plane treatment | fallback |
|---|---|---|
| **negative** | the project's simple **sunken bordered** level | any simple bordered level |
| **0** | the project's **no-border** (flat) level | any simple bordered level |
| **positive** | the project's simple **raised bordered** level | any simple bordered level |

If the project's elevation system is **missing any** of these needed level types, use **ONE simple
bordered level for ALL planes** (uniform). Never use a blur / exotic level here.

- **Labels:** role = **primary text** · token = code · value = eyebrow.
- **`{sp}`** — plane padding + inner gap + container pb from the spacing scale.
- Radius stays 0 (not adopted).

### Accessibility — aria-label requires role="img"

The diagram container is a non-semantic `<div>`. A plain `<div>` does not have an implicit
ARIA role, so an `aria-label` on it has no effect and is invalid. If you add a descriptive
label to the container, you MUST also add `role="img"`:

```
// CORRECT
<div role="img" aria-label="Z-index layer stack: 6 layers from z-0 to z-60" …>

// WRONG — aria-label on a plain div is ignored
<div aria-label="Z-index layer stack" …>
```

The outer wrapper needs no `role`/`aria-label` when the diagram is already supplemented by the
text labels inside each plane; add the pair only when the project's accessibility audit requires it.

---

## 8. DeviceRuler

**File:** `device-ruler.tsx`

### Types

```
RulerStop = {
  px: string      // breakpoint floor as string: "0", "640", "768", "1024", "1280", "1536"
  device: string  // human device label: "Mobile", "Tablet", "Laptop", "Desktop", "Wide"
  token: string   // breakpoint token name: "base", "sm", "md", "lg", "xl", "2xl"
  used: boolean   // true = project uses this breakpoint (surface-deep);
                  // false = part of the scale but unused (surface-elevated)
  boxW: number    // silhouette width in px (proportional, not scale)
  boxH: number    // silhouette height in px (proportional)
}
```

### P1 — Template (universal structure)

Treatment classes shown as `{PLACEHOLDERS}` are resolved by P2.

```
<div class="flex items-end gap-[{sp}] overflow-x-auto pb-[{sp}]">   ← items-end bottom-aligns; row scrolls on overflow
  {stops.map(({px, device, token, used, boxW, boxH}) =>

    SILHOUETTE BOX — fixed size; text inside, bottom-aligned; radius ALWAYS 0:
    <div class="flex shrink-0 flex-col items-center justify-end gap-[2px] p-[{sp}] {USE_LEVEL}"
         style="width: {boxW}px; height: {boxH}px">
      <span class="{T_CODE}">{px}</span>                ← breakpoint px value
      <span class="{T_CAPTION} text-center">{device}</span>
      <span class="{T_CODE}">{token}</span>             ← breakpoint token name
    </div>)}
</div>
```

Fixed — the device-silhouette **standard**, the same for every project:
- **Geometry** — `boxW`/`boxH` (size, shape, aspect ratio) are a fixed proportional standard (portrait
  phone = tall+narrow, desktop = wide+short, tablet = tallest). The standard set (6 Tailwind stops,
  64×128 … 264×152) is pinned in `section-spine.md` → Responsive Behavior → `ZONE_BARS` — reproduce
  verbatim; never improvise device sizes. (Bare-px visualization geometry, not design tokens.)
- **Radius always `0px`** — silhouettes are physical screens; this is the one visualizer that does NOT
  adopt the project's radius.
- **Horizontal scroll** — `overflow-x-auto` so the row scrolls when the silhouettes don't all fit the
  container width. `items-end` bottom-aligns the varied-height boxes; text sits INSIDE each box at the
  bottom (`justify-end`), not below.

### P2 — Visual alignment (resolve from DESIGN.md)

- **`{USE_LEVEL}`** — each silhouette adopts a project **elevation level by use-state** (surface + its
  paired border as a unit — see Generic fallbacks → Surface + border = one level): `used` → the project's
  **sunken/deep** level (active, filled); `unused` → the project's **raised** level (passive). The border
  comes WITH the level, never separately. Radius stays 0 (not adopted).
- **`{T_CODE}` · `{T_CAPTION}`** — px value + token name = code token; device name = caption token.
- **`{sp}`** — container gap, box padding, pb from the spacing scale.

---

## 9. SpanTable

**File:** `span-table.tsx`

### Types

```
SpanZone = {
  name: string       // zone label: "Desktop", "Tablet", "Mobile"
  width: string      // breakpoint range: "≥ 1280px", "768px – 1279px", "< 768px"
  changes: string[]  // list of layout changes at this zone; one or more items
}
```

### P1 — Template (universal structure)

A bare `<table>` rendered INSIDE a `.prose-content` wrapper (the caller supplies it) so it inherits the
project's editorial table styling. `Name` and `Width` cells use `rowSpan` to merge the rows within each
zone. Treatment classes shown as `{PLACEHOLDERS}` are resolved by P2.

```
<table>
  <thead><tr><th>Name</th><th>Width</th><th>Key Changes</th></tr></thead>
  <tbody>
    {zones.flatMap(z =>
      z.changes.map((change, i) =>
        <tr>
          {i === 0 && <>
            <td rowSpan={z.changes.length} class="{T_EYEBROW} whitespace-nowrap align-top">{z.name}</td>
            <td rowSpan={z.changes.length} class="{T_EYEBROW} whitespace-nowrap align-top">{z.width}</td>
          </>}
          <td>{change}</td>
        </tr>))}
  </tbody>
</table>
```

The merged Name/Width cells render once (at row i=0). Individual change rows are plain `<td>` (styled by
the `.prose-content` table rules — no class). The `<table>` itself has no class — it inherits everything
from the `.prose-content` wrapper.

### P2 — Visual alignment (resolve from DESIGN.md)

- **`{T_EYEBROW}`** (Name + Width cells) = the project's eyebrow / structural-metadata token.
- Everything else (table borders, cell padding, body text) comes from the project's `.prose-content`
  editorial table styling — the caller MUST wrap `<SpanTable />` in `.prose-content`.

---

## Generic fallbacks (when a semantic token is missing)

P2 resolves each treatment from the project's DESIGN.md. A lean design system may not define every
semantic token a visualizer wants. When the intended token is missing, fall back to the closest basic —
**never invent a token, never hardcode a raw value.** Prefer the real token always; a fallback is the
lowest-fidelity option and may signal a design-system gap worth flagging (inform-only handoff).

Universal fallbacks (every project has these basics):

| Intended (missing) | Fallback |
|---|---|
| any specific **type** role (code/identifier, caption, eyebrow, emphasis…) | the **primary body** token — guaranteed to exist in every project |
| **accent / brand** color | the project's primary text color |
| **border / hairline** token | the project's default border/divider color; last resort `currentColor` at low opacity |
| **raised / elevated card** (lifted panel) | the project's card / elevated-surface treatment; else a border + the lightest available raised surface; else a border on the base surface |
| **sunken / deep well** (recessed inset) | the project's well / deep-surface treatment; else a border + the deepest available surface; else a border on the base surface |
| **radius** (card / control) | the project's default control radius, else `0` (sharp) |
| a **spacing** step | the nearest defined step |

**Raised vs sunken:** a surface element intends EITHER a raised/elevated card (lifted panel) OR a
sunken/deep well (recessed inset). Resolve the **intended** one from DESIGN.md first; only if the project
doesn't define it, fall back to whatever card/surface look IS available, then to the basic (border on the
base surface). Don't substitute a raised card where a well is intended (or vice-versa) unless nothing
else exists.

**Surface + border = one level.** Each elevation/depth level defines BOTH its surface fill AND its border
*together* — they are a pair, applied as a unit. A visualizer that adopts a raised or sunken treatment
adopts the **whole level** (surface + its paired border), NEVER a surface from one level with a border
from another. Radius is independent (adopted separately). The pairs are defined in DESIGN.md → Elevation;
align every "surface" + "border" placeholder to the same level.

The chain is always: intended token → closest semantic → basic. If a fallback is used, note it so the
gap surfaces to the user when the gallery is finished.

---

## Dogfooding gate

Every visualizer must pass this gate. These rules apply at authoring time and at each
Build/Sync pass.

### Tokens only — no raw values

Use semantic design-system tokens for every visual attribute: color, spacing, radius,
elevation, motion. No raw hex values. No arbitrary pixel values except documented bare-px
exceptions (see below).

### Structure is fixed; visual details dogfooded

The visualizer's information layout (DOM structure, element order, column layout, grid
columns, flex direction) is fixed per the pseudocode above. Visual details — surface fills,
border colors, spacing between elements, radius, type treatment — resolve from the project's
tokens. The gallery renders the design system **with** the design system.

### No typography overrides (ENFORCED)

Apply type tokens by class name only. No additional color, size, weight, line-height,
font-family, or letter-spacing utilities alongside a type class.

```
CORRECT:   <div class="body-primary">{text}</div>
WRONG:     <div class="body-primary text-[--ink-muted] text-sm">{text}</div>
```

A needed pairing with no token is a design-system gap. The fix is:
1. Add the token via `design-write`
2. Consume the new token

Never override to fill the gap.

Each label role maps to a specific token. The table below shows the portfolio project's
type-scale tokens as a concrete example mapping — a different project substitutes its own
equivalent tokens for each label role; the role column is what is fixed, not the token names.

Example (portfolio):

| Label role | Token |
|---|---|
| Eyebrow / structural identifiers | `mono-anchor` |
| CSS variable names, file paths, class names | `mono-code` |
| Descriptions, secondary text | `body-caption` |
| Primary names and labels | `body-emphasis` |
| Intro / paragraph text | `body-primary` |

### No gratuitous boxes

Use `Card` / `border` / `bg-[--surface-*]` only where the **design system** itself uses a boxed
treatment (color cards, depth cards). **Icon grids are NOT boxed** — each icon cell is a plain `icon + label`
stack with NO border/fill (see `section-spine.md` → Iconography). Plain prose sections (Imagery, InlineList
domain sections, orchestration notes) render as `.prose-content` — no wrapper box, no Specimen children, no Card.

**Sanctioned exception — live layout-primitive demo cells.** A layout primitive (Stack, Grid, Sticky…)
is invisible on its own; its demo borders + fills *throwaway scaffolding cells* purely to make the
primitive's structure visible (a Stack's gap, a Grid's columns). This is the ONLY place demo-scaffolding
boxes are allowed, and it does NOT license boxes elsewhere — prose, token rows, and component specimens
stay unboxed. (This was the prior "random borders" failure: the cell-visibility need got generalized into
gratuitous boxes. The per-primitive recipes in `section-spine.md` → Layout prevent it.)

### Documented bare-px exceptions

Two categories of bare pixel values are permitted — they must be documented at the point
of use:

1. **Visualization geometry** — SVG coordinate values (bezier control points, viewBox
   dimensions), diagonal-stack offsets (`dx`, `dy`, `planeHeight`), bar/track widths
   that encode a scale. These are math values, not design tokens.

2. **Gallery-internal layout constants** — fixed column widths (`w-[112px]` for bar label,
   `w-[160px]` for duration label, `280px` left column in TypeScaleList), preview
   container heights (`min-h-[180px]` for DepthGrid cards), default canvas size (`180px`
   for EasingPlot), `min-width: 480px` for LayerStack scroll. These are the gallery's
   own composition constants, not part of the project's design system.

These are exceptions, not a general license. Call them out explicitly in code comments.

### Live var() binding (seam — stack-adapters.md)

Visualizers read live `var(--token)` values via inline styles for their display surfaces:
swatch backgrounds, bar widths, border-radius values. The mechanism for setting
`style="background: var(--token)"` differs by stack (React inline-style object syntax vs
HTML `style` attribute). See `stack-adapters.md → Live CSS-variable resolution seam`.

---

## Cross-references

- **Token data arrays** for the project's instances → `sections/` bucket modules
- **Stack-specific rendering** (inline-style syntax, SVG in JSX vs HTML, portal targets) → `stack-adapters.md`
- **Missing token → add a token** → invoke `design-write` (see `boundaries-and-handoff.md → fixer triad`)
- **Section composition** (which visualizer goes in which GallerySection) → `section-spine.md`
- **Prose-content scoping rule** (where `.prose-content` wraps are required and where they corrupt) → `hard-to-demo.md`
