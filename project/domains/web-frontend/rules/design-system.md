# Design System

How to consume the design system. Token values (color, typography, spacing, radius, motion, z-index, elevation, breakpoints) live in DESIGN.md → Foundations — reference them by name, never hardcode or duplicate values here.

## Token discipline

- Use design-system tokens for every visual value — color, typography, spacing, radius, elevation, z-index, motion, and breakpoints.
- Never use raw hex values, arbitrary pixel values, magic numbers, or one-off visual constants in components.
- Resolve values from DESIGN.md → Foundations by token name — never eyeball them from screenshots.
- Never invent a token variant the system does not define. Extend the system in DESIGN.md first, then consume it.

## Color

- Use semantic color tokens only.
- Never use raw hex values in components.
- Respect the defined accent system; do not introduce accent variants outside the design system.
- Evaluate color-system changes at the token level, not by patching individual components.
- Verify accessibility and contrast requirements before adopting palette changes.

## Typography

- Use type-scale tokens for all text.
- Never set font size, line height, letter spacing, or weight directly when a token exists.
- Never mix font families within a single UI element.
- Reserve monospace or structural typefaces for their defined roles (metadata, code, numerics, etc.).

## Spacing & layout

- Use spacing-scale tokens only.
- Respect the max content width, reading-column width, and layout constraints defined in DESIGN.md → Foundations → Layout.
- Prefer layout primitives over ad hoc spacing and positioning.

## Responsive design

- Use the system's defined breakpoints, container widths, and layout primitives.
- Do not introduce component-specific breakpoint values without first extending the design system.
- Responsive behavior should be driven by the system, not per-component exceptions.

## Shape & radius

- Use radius tokens only.
- Do not introduce arbitrary border-radius values.

## Elevation & depth

- Communicate depth through the system's defined mechanisms.
- Do not introduce shadows, glows, surface treatments, or depth effects outside the design system.
- Restrict `backdrop-filter` usage to surfaces explicitly sanctioned by the design system.

## Interaction states

- Interactive states (hover, focus, active, selected, disabled) derive from design-system tokens and patterns.
- Do not create one-off interaction styling outside the system.
- State changes should remain visually consistent across components.

## Motion

- Motion token discipline and the reduced-motion requirement live in motion.md → Tokens and
  motion.md → Reduced motion.

## Z-index

- Use z-index scale tokens only.
- Never use raw z-index values.

## Consistency

- Similar problems should use the same visual solution.
- Prefer extending an existing pattern over creating a new one.
- If a design need cannot be satisfied using existing tokens or patterns, update the design system first and then consume the new definition.
