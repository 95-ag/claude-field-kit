# Visualizers — depth and stacking

`DepthGrid` (elevation) and `LayerStack` (z-index) — the two visualizers that render a layered order
rather than a flat scale. Shared contract → `visualizer-kit.md`; gate → `visualizer-dogfood.md`.

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

Treatment classes appear as `{PLACEHOLDERS}` throughout; P2 resolves them (`visualizer-kit.md`). Each card's elevation `className` is P3
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
  eyebrow / metadata · usage = caption. **Type role only — no color.** The card's surface is P3 data,
  so its text must inherit and let a dark level set its own ink; see Dogfooding gate → Never pin a
  foreground color on a caller-supplied surface.
- **`{sp}`** — grid gap + card padding from the spacing scale.

The per-card elevation treatments themselves are **P3** — read each level's surface / border / blur from
DESIGN.md → Elevation, in document order. See `spine-foundations-visual.md` → Elevation & Depth.

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

The layers ARE the main visual.

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
  render that no text is hidden; scale with the project's type. *(Example: PLANE_H 150 · dy
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

