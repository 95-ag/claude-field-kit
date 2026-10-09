# Visualizers — shape and layout

`ShapeRow` (radii), `DeviceRuler` (breakpoints) and `SpanTable` (grid spans) — the visualizers that
render geometry. Shared contract → `visualizer-kit.md`; gate → `visualizer-dogfood.md`.

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

Treatment classes appear as `{PLACEHOLDERS}` throughout; P2 resolves them (`visualizer-kit.md`).

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

## 8. DeviceRuler

**File:** `device-ruler.tsx`

### Types

```
RulerStop = {
  px: string      // breakpoint floor as string: "0", "640", "768", "1024", "1280", "1536"
  device: string  // human device label: "Mobile", "Tablet", "Laptop", "Desktop", "Wide"
  token: string   // breakpoint token name: "base", "sm", "md", "lg", "xl", "2xl"
  used: boolean   // true = project uses this breakpoint (sunken/deep level);
                  // false = part of the scale but unused (raised level)
  boxW: number    // silhouette width in px (proportional, not scale)
  boxH: number    // silhouette height in px (proportional)
}
```

### P1 — Template (universal structure)


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
  64×128 … 264×152) is pinned in `spine-domain-technical.md` → Responsive Behavior → `ZONE_BARS` — reproduce
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
zone.

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

