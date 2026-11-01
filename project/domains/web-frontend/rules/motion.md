# Motion

How motion is used and implemented.

**Policy is scoped by surface.** The lists below are the product-surface default. A surface read for
interest rather than for evidence — an editorial, storytelling or brand surface — may widen it (→ Widened
surfaces). The invariant floor binds every surface.

## Invariant floor

Binds every surface, including a widened one; no surface permission overrides it.

- Reduced motion is honored (→ Reduced motion).
- Content is fully readable with animation disabled — motion never gates access to content.
- No scroll-jacking: the scrollbar always means what it says.
- No layout shift, jank, measurable degradation of interaction performance, or breach of the project's
  performance budget; an escalated effect animates transform and opacity only.

## Reduced motion (non-negotiable)

- Gate every animation on `prefers-reduced-motion`.
- When reduced motion is preferred, movement is removed, without loss of content or functionality.
  - Color, background and border transitions may stay — they change state without moving anything
    (never a focus indicator → accessibility.md → Focus & keyboard).
- Build motion as an addition to a static base, so reduced motion removes the addition and leaves the
  base.
  - Never a shortened duration: a shortened parallax or reveal still moves content for the reader it was
    meant to protect.
  - Never a second static code path: it drifts from the animated one.
- Autoplaying visual media honors `prefers-reduced-motion` and provides a static fallback.
- Any animated graphic (SVG, canvas, Lottie, WebGL, or similar) that cannot honor `prefers-reduced-motion` is replaced with a static equivalent.

## Tokens

- Use motion duration and easing tokens only.
- Never use arbitrary duration values, easing curves, or animation timing.
- Token names and roles → DESIGN.md → Foundations → Motion; values → DESIGN.md → YAML Registry.
- A timing outside the tokens is an exception DESIGN.md declares with its values — never an inline value.

## Permitted — product surfaces

- Opacity transitions (fade in/out).
- Small transforms within the system's defined limits and motion tokens.
- Color transitions (border, background, text).
- Purposeful UI transitions that reinforce state changes, navigation, or spatial relationships.
- A wayfinding cue on a single element, where a static treatment cannot route the visitor — one element,
  fires once, never loops. DESIGN.md names the treatment and its invariants.

## Prohibited — product surfaces

- Scroll-jacking (→ Invariant floor).
- Parallax effects.
- Per-section entrance animations triggered on scroll, except the sanctioned ambient layer (→ The sanctioned ambient layer).
- Continuous ambient motion, except a single explicitly sanctioned ambient layer (→ The sanctioned ambient layer).
- Cursor-tracking effects.
- Page-load reveal sequences.
- Motion used purely for decoration.

## The sanctioned ambient layer

- A layer is sanctioned only when DESIGN.md names it — an unnamed layer is drift.
- It carries no content, so suppressing it costs a reader nothing.
- Under reduced motion it leaves its static base (→ Reduced motion).
- Its scroll-driven reveal across sections is part of the sanction, since the layer spans sections by
  design.
- Measure its cost against a static control on the assembled page, not from an isolated spike.
- A loop cadence or delay outside the motion tokens is a declared exception (→ Tokens).
- *Example:* a page built around one narrative graphic running its full length.

## Widened surfaces

- A widened policy is **declared, never ambient**: DESIGN.md names the surface and enumerates what it
  adds, with its values. An undocumented departure is drift — "this surface is creative" is not a
  permission.
- An effect that moves body copy — parallax over text, whole-page reveals, motion on running prose — is
  opt-in per instance, never a surface-wide default.
- Declare an escalation where the renderer can read it before paint, so the effect's code loads only where
  it is used — a surface-wide import makes every ordinary page pay for the few that escalate.
- Global chrome keeps the product policy on every route: a widened surface widens its content, not the
  navigation, footer or utility UI around it.

## Principles

- On product surfaces, motion serves comprehension, feedback, continuity, and spatial orientation; on a
  widened surface it may also serve engagement, within that surface's declared policy.
- Prefer the smallest motion that communicates the change.
- A property carrying state, not decoration, is correct on its first frame — never transition one.
- Motion never blocks interaction or delays content availability.
