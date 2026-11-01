# Design System

How to consume the design system. Read DESIGN.md before implementing any UI; reference every value by its token name and never hardcode or duplicate one here.

Where a value lives: spacing, radius, motion, z-index, breakpoint and focus-ring tokens in `docs/DESIGN.md` → YAML Registry; color and typography tokens either there or colocated in `docs/DESIGN.md` → Foundations, whichever that doc uses; elevation levels and per-level surface specs in `docs/DESIGN.md` → Foundations → Elevation & Depth.

## Stylesheet organization

Keep global CSS organized by concern, not in one monolithic file. Typical concerns:
- **Tokens** — design-token definitions (`:root`/theme/mode blocks) and any framework token mapping.
- **Type scale** — the semantic typography classes and their responsive overrides.
- **Content / prose layer** — long-form content styles (the `.prose`-style layer, code highlighting, editorial elements).
- **Base** — the framework import, the concern imports, and unlayered base/global styles.

When to split: start in one global file; move a concern into its own file once it is a distinct self-contained block (a full token set, the type scale, the prose layer) or it exceeds ~150 lines — whichever comes first. Threshold is tunable. Route- or feature-scoped CSS stays with its route, never in the global files.

- An unlayered rule beats any layered one — check a rule's cascade layer before adding an override.

## Token discipline

- Use design-system tokens for every visual value — color, typography, spacing, radius, elevation, z-index, motion, and breakpoints.
- Never use raw hex values, arbitrary pixel values, magic numbers, or one-off visual constants in components.
- Resolve values by token name from their canonical home — never eyeball them from screenshots.
- Never invent a token variant the system does not define. Extend the system in DESIGN.md first, then consume it.
- A retired token fails silently (compiles to nothing, or to the framework's default) — retire a whole
  namespace at once and assert its absence in the built output.

## Color

- Use semantic color tokens only — never raw hex values in components. Token names → DESIGN.md → Foundations → Colors.
- Respect the defined accent system; do not introduce accent variants outside the design system.
- Evaluate color-system changes at the token level, not by patching individual components.
- Verify contrast before adopting palette changes with a token-level pass — work in OKLCH to adjust lightness predictably, compute the WCAG contrast matrix for every text/background pair rather than eyeballing screenshots, and pair the numbers with the `audit-color-contrast` skill for the qualitative read. The requirement itself → accessibility.md → Color & contrast.

## Typography

- Use type-scale tokens for all text. Never set font size, line height, letter spacing, or weight directly when a token exists. Token names → DESIGN.md → Foundations → Typography.
- Never mix font families within a single UI element.
- Reserve monospace or structural typefaces for their defined roles (metadata, code, numerics) — never in body copy, headlines, or prose.

## Spacing & layout

- Use spacing-scale tokens only. Token names → DESIGN.md → Foundations → Spacing.
- Respect the max content width, reading-column width, and layout constraints defined in DESIGN.md → Foundations → Layout.
- Prefer layout primitives over ad hoc spacing and positioning.

## Responsive design

- Use the system's defined breakpoints, container widths, and layout primitives.
- Do not introduce component-specific breakpoint values without first extending the design system.
- Responsive behavior should be driven by the system, not per-component exceptions.
- Derive a component's breakpoint from the space it actually needs, not a generic "desktop" label — e.g. a fixed element beside the reading column should appear only once the viewport clears the max content width + container padding + the element's own width, so it never overlaps the column. Give such a label a fluid max-width for wide screens.

## Scoping reused styles & chrome

- A page-coupled component that styles or scrapes the page DOM can corrupt unrelated content when reused:
  - A broad content-layer style (e.g. a prose wrapper that restyles every `a`/`p`/`ul`/`table`) must wrap only the specific subtree it targets — never a whole page, or it clobbers link/button/card primitives.
  - A component that deep-queries the DOM (e.g. a section-progress nav reading `article h2`) ingests any matching element — render unrelated demos/blocks outside the queried container (e.g. outside `<article>`).

## Shape & radius

- Use radius tokens only; do not introduce arbitrary border-radius values. Token names → DESIGN.md → Foundations → Shapes.

## Elevation & depth

- Communicate depth through the system's defined mechanisms.
- Do not introduce shadows, glows, surface treatments, or depth effects outside the design system.
- Restrict `backdrop-filter` usage to surfaces explicitly sanctioned by the design system.

## Interaction states

- Interactive states (hover, focus, active, selected, disabled) derive from design-system tokens and patterns.
- Do not create one-off interaction styling outside the system.
- State changes should remain visually consistent across components.
- Disable text selection (`user-select: none`) only on chrome, control labels, decorative SVG text, and structural-metadata type; content — prose, headings, captions, code, tables — stays selectable. Never disable selection on content a reader may want to copy.

## Motion

- Motion token discipline and the reduced-motion requirement live in motion.md → Tokens and
  motion.md → Reduced motion.

## Z-index

- Use z-index scale tokens only; never raw z-index values. Layer names and order → DESIGN.md → Technical Conventions → Z-Index Scale; values → DESIGN.md → YAML Registry.

## Consistency

- Similar problems should use the same visual solution.
- Prefer extending an existing pattern over creating a new one.
- If a design need cannot be satisfied using existing tokens or patterns, update the design system first and then consume the new definition.
