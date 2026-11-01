# SVG

Mechanics of drawing, sizing, animating and tracing SVG. Judging the result needs a real render —
`web-frontend/visual-verification.md` → Render-backed verification; taking a number off one is
`web-frontend/measuring-rendered-pages.md`.

## Animating a stroke

- **`stroke-dasharray` and `stroke-dashoffset` restart at every subpath, so a `<path>` with N subpaths
  has N draw heads advancing together.** Nothing in the dash properties addresses a single subpath. To
  draw one line progressively, emit **one `<path>` per piece** and advance them in sequence.
- Scale each offset by the **whole dash period**, not by the visible length. An offset short of the
  period leaves the dash's own overshoot painted at progress 0, which reads as specks of ink before the
  draw begins.
- `vector-effect="non-scaling-stroke"` moves the whole stroke pipeline into screen space, so
  `pathLength` **stops applying** — a dasharray expressed in `pathLength` units silently becomes one in
  pixels. The two cannot be combined.

## Sizing and coordinates

- An `<svg>` with a `viewBox` and `inset: 0` but no `width`/`height` **sizes its height from the viewBox
  ratio**, not from `bottom: 0`. In a tall wrapper it renders square and the overflow is invisible.
- A stroke width inside a normalised viewBox (`0 0 1 1`) is read in **user-space units**, so a value
  authored in pixels paints at roughly the element's own width. Draw in the real measured pixel box, or
  pin the stroke with `vector-effect` and accept what that costs (above).
- **Round float coordinates to a fixed precision on both sides of a server render.** Un-rounded floats
  cause a hydration mismatch even when the serialised DOM is byte-identical, because the two sides
  format the number differently.
- A drawing fitted into a box is bound by **whichever dimension binds first**, so growing the other one
  is inert and the mark stays the size it was. Grow the binding dimension.
- A component that derives its box from the drawing's **diagonal** renders unequal boxes for equal `size`
  props, because each drawing's aspect differs. Scale the container and let the drawing fit inside it.

## Sub-pixel features

- **A feature thinner than one pixel is entirely antialiasing**, so anything that composites twice shows
  there and nowhere else: the opaque core is unaffected while a tapering end doubles in density. When
  removing a duplicated layer, check the sub-pixel features first — the solid ones will look unchanged
  either way.
- A headless renderer may paint a sub-pixel box as a full pixel at every device ratio, so it cannot
  show a real device's hairline-weight bugs. Report a sub-pixel stroke claim as inferred, pending a
  device check; the evidence gatherable without a device is each feature's measured fractional position.

## Filters

- SVG filters compute in **linear RGB** unless pinned with `color-interpolation-filters="sRGB"`, so a
  blur or blend tuned to match a CSS equivalent will not match until it is pinned. What a filter costs →
  `web-frontend/css-mechanics.md` → Compositing and cost.

## Tracing a drawing into geometry

- **Before tuning a trace, ask whether the thing you want is a line in the source at all.** A centreline
  trace cannot carry a feature the source renders as *mass* — overlapping strands photographed as a
  dense blob collapse to a single node, leaving every strand-end meeting at a point with nothing binding
  them. No tracing parameter recovers it; that feature has to be drawn as geometry.
- **A trace carries its source canvas's clip.** Ink that touches the edge of the source image traces as
  a flat edge, and no rendered box will clip it afterwards, so nothing downstream reveals it. Rasterise
  the source on a padded canvas and inspect every edge the ink touches before trusting the output.
- A converter that outputs filled outlines cannot produce a centreline: an outline can be thickened but
  never thinned on a transparent ground. A path something must travel along needs a centreline step of
  its own.
- **Derive the conversion constant from each source, never carry one between sources.** A traced set can
  only be levelled upward, and a constant read off one drawing applied to another authored at a different
  scale misstates every width it produces.
