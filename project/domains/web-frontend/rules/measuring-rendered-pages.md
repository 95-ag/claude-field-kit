# Measuring Rendered Pages

Taking a number off a rendered page and knowing what it means. That a visual claim needs a real render is
`visual-verification.md` → Render-backed verification; runner, capture and settle mechanics are the stack's
browser-testing rule.

## The viewport

- Read the viewport the layout uses — `matchMedia`, `documentElement.clientWidth` — never `window.innerWidth`,
  which reports a different width under mobile emulation.
- A viewport is not a screen: browser chrome takes height.
- A headless browser resolves a dynamic viewport unit only in its static case — say when a behaviour is out of
  reach rather than measuring a proxy for it.
- Probe a requirement on the axis it constrains, at a size a real device has — a tall synthetic viewport passes a
  layout that overflows a short real screen.

## What a rect is

- Bounding boxes measure wrappers and a `Range`'s client rects measure line boxes; neither measures ink.
- Name the rect you measured, and prefer the tree the user's software reads — the accessibility tree when the
  claim is about what a reader gets.
- `getClientRects()` on a block returns one rect however many lines it wraps; count lines by distinct `top` values
  from a `Range` over its contents.

## Reading a colour

- Resolve a colour by painting it into a 1×1 canvas and reading the pixel — `getComputedStyle` returns the
  engine's form (`oklab(…)` for a `color-mix()`), whose numbers are not RGB channels.
- A computed background colour ignores any image painted over it.
- `transparent` is an ancestor's paint seen from the child, and a canvas renders it black — resolve a ground colour
  from its token, not from the element, or every ratio comes out against black.

## Identifying what you measured

- Read a value off the element that carries or paints it, never the value you wrote; an empty read fails loudly
  instead of returning a default.
- A value read back out of CSS is not the value you wrote — the build may re-serialise it (`400ms` ships as
  `.4s`), so `parseFloat` reads the wrong unit and nothing fails. Parse the unit wherever script reads a CSS
  value, in one shared helper.
- A number computed from the model proves self-consistency, not the page — measure pixels, or say which you
  measured.
- Identify an element by what it contains, not by a selector you expect to be unique.
- A substring class match cannot separate a wrapper from a prefix-named child, so a probe can act on both and
  double a treatment — bisect the pipeline before blaming the asset.
- Transform a local coordinate with the element's own screen matrix (`getScreenCTM()` for SVG), not by adding an
  origin by hand.
- A measurement during the first render is 0 — bound any loop sized from one.
- Guard the zero case before dividing by a measurement: `Infinity` can kill the renderer with no stack and no
  console error.
- A detached or cloned subtree inherits no custom properties and re-evaluates no media or container query, so a
  sweep over clones can read every variant identical. Measure in place, or state what the clone does not carry.
- Measure an overlapping pair as bands across their union — the first ink inside the second box is the first box's
  overhang.

## Deriving a value you cannot compute

- Never model a cascading layout chain arithmetically — apply each step and measure.
  - A clamped part stops responding past its floor or cap, so every formula over-compensates.
  - *Example:* a smaller padding widens content, which reflows and shortens it again, so it saves less than
    computed; a constrained band can even cost width and select the larger type step.
- A readout's baseline strips everything the readout measures, or the change hides in the layer left in.
- Engines quantise layout (Blink to 1/64px), so a unit conversion is converged — write, render, measure the
  residual — not computed.

## The scope of a figure

- One viewport is not the range it sits in. Where a property depends on content fitting its container, sample both
  sides of the fit boundary — the size at which content stops fitting.
- A rule stated per breakpoint still changes at the fit boundary, which can sit inside one breakpoint.
- Read the code's predicate rather than generalising a range from the windows you tested.
- A one-off is not a worst case — sweep for the extreme before quoting a bound.
- Record the sweep's step: a regime narrower than it is invisible, and a content edit can create one.

## What the number means

- Falsify a statistic against constructed inputs whose answer is known before trusting it on real ones.
- Assert distance from the token's own value and record the bound with the figure. A hue test fails on a page that
  legitimately carries nearby colour; an exact-value test fails on antialiased edges.
- Count a filled area by geometry, not colour — an element can take the surface's fill and paint nothing.
- A proportion needs the denominator its quantity is expressed in; a length along a path is not a length down a
  page.
- Render before acting on a number: it says how different, not whether it matters — a set that differs measurably
  can still hold together.
- Judge a mark at its real size by rasterising it there and magnifying the raster.

## A figure's shelf life

- A figure written before the code lands is an estimate; re-measure once it has landed.
- A figure goes void when its subject is replaced, and nothing announces it — grep the subject's name across the
  whole repository.
- Record what a value that merely clears a bound was settled against, with the method and statistic; strip a
  figure that cannot be re-derived.
