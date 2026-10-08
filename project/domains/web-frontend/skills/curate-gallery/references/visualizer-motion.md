# Visualizers — motion

`DurationScale` and `EasingCurves` — paired, because a motion section reads duration and easing
together. Shared contract → `visualizer-kit.md`; gate → `visualizer-dogfood.md`.

---

## 6. DurationScale + EasingCurves

**File:** `motion-scale.tsx` (both visualizers in one file)

Two visualizers composed under the Motion `GallerySection` as sibling `SpecimenGroup`s — "Durations"
(`DurationScale`) + "Easing" (`EasingCurves`). Both **static** — neither animates, so they satisfy
`prefers-reduced-motion` trivially. Treatment classes appear as `{PLACEHOLDERS}` throughout; P2 resolves them (`visualizer-kit.md`).

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

(P3 — the actual duration/easing token values — lives in `spine-foundations-visual.md` → Motion.)

---

