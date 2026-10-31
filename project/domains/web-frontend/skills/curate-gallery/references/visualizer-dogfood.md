# Visualizer dogfooding gate

The gate every visualizer must pass before its section is declared done: a visualizer that violates
the design system while displaying it is the defect this catches. Applies to all nine, whichever file
each one's spec sits in (`visualizer-kit.md` routes them).

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
columns, flex direction) is fixed per that visualizer's `visualizer-*.md` pseudocode. Visual details — surface fills,
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

Each label role maps to a specific token. The table below shows one project's
type-scale tokens as a concrete example mapping — a different project substitutes its own
equivalent tokens for each label role; the role column is what is fixed, not the token names.

Example:

| Label role | Token |
|---|---|
| Eyebrow / structural identifiers | `mono-anchor` |
| CSS variable names, file paths, class names | `mono-code` |
| Descriptions, secondary text | `body-caption` |
| Primary names and labels | `body-emphasis` |
| Intro / paragraph text | `body-primary` |

### Never pin a foreground color on a caller-supplied surface

Some visualizers render content on a surface that comes from **project data**, not from the visualizer:
`DepthGrid` cards (each card IS the level, styled with that level's real `className`), swatch cells,
stock/surface grids, any cell whose fill is the thing being demonstrated. In these, **text color
inherits — the visualizer sets none.** A level that establishes a dark ground sets its own ink there;
a visualizer that pins one paints the first dark specimen's own label invisible, and the defect only
appears when a dark level is added, long after the visualizer was reviewed.

This is the same failure as a typography override and for a different reason: the override is not
wrong-looking, it is wrong-*scoped*. The visualizer does not know what surface its caller will supply.

- Where the project's **type role already owns a color**, that is the design system's call and stands
  — the visualizer adds nothing either way.
- Where the role owns none, the temptation is to supply one. Do not. Let it inherit, and let the
  surface's own treatment decide.
- **Exercise it:** a visualizer of this kind is not verified until rendered with at least one dark or
  otherwise inverted surface among its data. A grid of uniformly light cells cannot show the bug.

### No gratuitous boxes

Use `Card` / `border` / `bg-[--surface-*]` only where the **design system** itself uses a boxed
treatment (color cards, depth cards). **Icon grids are NOT boxed** — each icon cell is a plain `icon + label`
stack with NO border/fill (see `spine-foundations-visual.md` → Iconography). Plain prose sections (Imagery, InlineList
domain sections, orchestration notes) render as `.prose-content` — no wrapper box, no Specimen children, no Card.

**Sanctioned exception — live layout-primitive demo cells.** A layout primitive (Stack, Grid, Sticky…)
is invisible on its own; its demo borders + fills *throwaway scaffolding cells* purely to make the
primitive's structure visible (a Stack's gap, a Grid's columns). This is the ONLY place demo-scaffolding
boxes are allowed, and it does NOT license boxes elsewhere — prose, token rows, and component specimens
stay unboxed. The per-primitive recipes in `spine-foundations-visual.md` → Layout keep the cell-visibility
need from spreading into gratuitous boxes.

### Documented bare-px exceptions

Two categories of bare pixel values are permitted — they must be documented at the point
of use:

1. **Visualization geometry** — SVG coordinate values (bezier control points, viewBox
   dimensions), diagonal-stack offsets (`dx`, `dy`, `planeHeight`), bar/track widths
   that encode a scale. These are math values, not design tokens.

2. **Gallery-internal layout constants** — fixed column widths (`w-[160px]` for duration label,
   `280px` left column in TypeScaleList), preview container heights (`min-h-[180px]` for DepthGrid
   cards), default canvas size (`180px` for EasingPlot), `min-width: 480px` for LayerStack scroll.
   These are the gallery's own composition constants, not part of the project's design system.

These are exceptions, not a general license. Call them out explicitly in code comments.

### Live var() binding (seam — stack-adapters.md)

Visualizers read live `var(--token)` values via inline styles for their display surfaces:
swatch backgrounds, bar widths, border-radius values. The mechanism for setting
`style="background: var(--token)"` differs by stack (React inline-style object syntax vs
HTML `style` attribute).

---

