# Visualizers — token scales

`SwatchGrid` (colors) and `BarScale` (spacing) — the two visualizers that render a flat token scale.
The shared three-layer contract is in `visualizer-kit.md`; the gate they must pass is in
`visualizer-dogfood.md`.

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
Treatment classes appear as `{PLACEHOLDERS}` throughout; P2 resolves them (`visualizer-kit.md`).

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

P3 (the actual token groups) → `spine-foundations-base.md` → Colors.

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

