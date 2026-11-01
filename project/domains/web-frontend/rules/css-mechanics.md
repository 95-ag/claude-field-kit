# CSS Mechanics

Browser behaviour that decides whether a CSS rule does what it says. Token and cascade-layer discipline is
`design-system.md`; taking a number off a rendered page is `measuring-rendered-pages.md`.

## Stacking and containing blocks

- Moving an element to another ancestor can change its containing block and re-base every percentage it resolves —
  measure the rendered box before trusting a coordinate derived from one.
- A blend mode isolates to the nearest ancestor that is a stacking context.
  - Assert the property — no ancestor between the blended element and its backdrop forms one, by any means — never
    a list of property names. Raising `z-index` on an ancestor recreates the bug.
  - The element's own transform is harmless; an ancestor's is fatal.
- `contain: paint` clips and forms a stacking context, so it ends any blend reaching past it.

## Boxes and layout modes

- A clip needs a box — `display: contents` has none.
- `overflow: hidden` clips both axes; name the axis when one is meant.
- An in-flow box is a grid or flex item whatever its height; only an out-of-flow box takes no space.
- `grid-row: 1 / -1` reaches the explicit grid only.
- A "zero layout impact" claim holds per layout mode — assert it in every mode the component mounts in.
- A component that sizes itself from its own measured width needs a definite track — in a content-sized one it
  measures its own output and clips.
- Space a full-width item with padding; a margin runs it past its track.

## Gaps, line boxes and baselines

- Own a gap on the container (`gap`, padding), never a sibling's margin — hiding the sibling takes the margin.
- A line box is as tall as its inline boxes' leading, so a smaller nested `font-size` can make the line taller —
  pin `line-height: 1` on such an inline.
- Between tight-leading rows a gap is set box to box and read ink to ink. Each row's box carries an unused
  descender and half-leading above its cap, so a small `row-gap` reads as several times its value.
  - Measure it cap to cap (canvas `actualBoundingBox*`), not by rect
    (`measuring-rendered-pages.md` → What a rect is).
  - Closing it past zero needs a negative margin on the next row — a negative `gap` is invalid and a negative
    `calc()` in `row-gap` clamps to 0, both silently.
- A flex or grid container takes its baseline from its first item; one with no text baseline (an `<svg>`) gets one
  synthesised from its margin box. Put `align-items: baseline` on the wrapper and `align-self: center` on that
  child.
- Two type sizes on one baseline move one of them — re-measure anything positioned from its box.
- A typeface's default figures may be oldstyle, dropping below the baseline. `font-variant-numeric: lining-nums`
  aligns them but changes their advance widths, so re-check anything measured from a numeral's box.

## Inheritance and scope

- Scope a document-wide policy to the selectors it is for, not the easiest element to hang it on. Which content
  may be suppressed is `design-system.md` → Interaction states.
  - *Example:* selection suppression hung on `html` to stop one control being copied makes every name, date and
    passage uncopyable.
- An exemption restoring an inherited property must reach every element inside the target (`<selector> *`) — a
  direct declaration beats an inherited one.
  - *Example:* an exemption naming only a control's anchor and label leaves its icon suppressed, so behaviour
    depends on where the finger lands.
- An inherited `pointer-events: none` disables any hit layer inside it; a cover layer states its own
  `pointer-events: auto`.

## Compositing and cost

- Removing an occluding layer changes what the covered content is seen against — re-check its contrast
  (`accessibility.md` → Color & contrast).
  - A collision in one viewport band is a few pixels' margin — fix it across the range, not at the width that
    caught it.
- An effect's cost is the offscreen buffer the compositor sizes, not the geometry inside it — the drawing itself is
  usually free.
  - Shrink the buffer: one filtered group instead of many, a smaller mask, a stroke instead of a large translucent
    shadow.
  - A cost figure describes an arrangement — re-measure when the arrangement moves.
  - How far a figure holds is the stack's browser-testing rule → Performance measurement.
- Raster decoration is upscaled by the device pixel ratio unless drawn at device resolution — a tile authored at 1×
  is soft at 2× and 3×.
- A build-time image tool's parameter named after a CSS function is not that function — verify the operation before
  carrying a value across. *Example:* an HSL saturation adjustment is not `filter: saturate()`.

## Class names

- A dynamic class lookup (`styles[key]`, a name built at run time) outlives the rules it named and resolves to
  `undefined` with no error — grep the consumers whenever a stylesheet's rules go.
