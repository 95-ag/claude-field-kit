# Motion

Motion policy for product-focused websites and applications. Creative, storytelling, or brand-driven experiences may define an alternative motion policy.

How motion is used and implemented. Timing, easing, and duration tokens live in DESIGN.md → Foundations → Motion.

## Reduced motion (non-negotiable)

- Gate every animation on `prefers-reduced-motion`.
- When reduced motion is preferred, transitions are removed or made effectively instant without loss of content or functionality.
- Autoplaying visual media honors `prefers-reduced-motion` and provides a static fallback.
- Any animated graphic (SVG, canvas, Lottie, WebGL, or similar) that cannot honor `prefers-reduced-motion` is replaced with a static equivalent.

## Tokens

- Use motion duration and easing tokens only.
- Never use arbitrary duration values, easing curves, or animation timing.
- Token names and values are defined in DESIGN.md → Foundations → Motion.

## Permitted

- Opacity transitions (fade in/out).
- Small transforms within the system's defined limits and motion tokens.
- Color transitions (border, background, text).
- Purposeful UI transitions that reinforce state changes, navigation, or spatial relationships.

## Prohibited

- Scroll-jacking.
- Parallax effects.
- Per-section entrance animations triggered on scroll.
- Continuous ambient motion, except a single explicitly sanctioned ambient layer.
- Cursor-tracking effects.
- Page-load reveal sequences.
- Motion used purely for decoration.

## Principles

- Motion serves comprehension, feedback, continuity, and spatial orientation.
- Prefer the smallest motion that communicates the change.
- Motion never blocks interaction or delays content availability.
- Motion must not cause layout shifts, jank, or measurable degradation of interaction performance.
