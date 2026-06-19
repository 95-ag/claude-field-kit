# Accessibility

Reusable accessibility requirements for web UI. Spec values (focus-ring token, exact contrast targets, motion durations, etc.) live in DESIGN.md → Accessibility — reference it, never duplicate those values here.

## Semantic HTML

- Use semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
- Exactly one meaningful `<h1>` per page.
- Heading hierarchy is logical and sequential — never skip levels.
- Prefer native HTML elements over ARIA equivalents whenever possible.

## Focus & keyboard

- Every interactive element is keyboard reachable in logical DOM order.
- All functionality is available without a mouse or hover interaction.
- Use `:focus-visible`, not `:focus`, for visible keyboard focus indication.
- Never remove focus styles without providing an accessible replacement.
- Never create an unintended keyboard trap.
- Modals and overlays trap focus while open and restore focus to the triggering element when closed.

## Touch targets

- Minimum 44×44px for every interactive element on touch devices.

## Forms

- Every form control has an associated visible label.
- Placeholder text never serves as the only label.
- Validation errors are programmatically associated with the affected field.
- Required fields are identified without relying on color alone.
- Form instructions and constraints are available to assistive technologies.

## Color & contrast

- All text/background pairs meet WCAG AA requirements in every theme.
- Never convey information by color alone.
- Interactive states remain distinguishable for users with color-vision deficiencies.

## Images & media

- Meaningful images require descriptive `alt` text.
- Decorative images use `alt=""`.
- Audio must never autoplay.
- Video captions are provided when speech is essential to understanding content.

## Dialogs & overlays

- Modals use proper dialog semantics and an accessible title.
- Background content is not reachable while a modal is open.
- Dialogs are dismissible via keyboard where appropriate.

## Dynamic content

- Status, success, warning, and error messages are announced to assistive technologies when appropriate.
- Loading states communicate progress without relying solely on visual indicators.

## Links & navigation

- Link text describes the destination or action.
- Avoid generic link labels such as "Click here" or "Read more" without context.
- Each `<nav>` has an accessible label when multiple navigation landmarks exist.
- Mark the current navigation item with `aria-current="page"`.

## Tables

- Use tables only for tabular data.
- Data tables use proper header cells (`<th>`) and header associations.

## ARIA

- Use ARIA only when native HTML semantics are insufficient.
- Icon-only buttons require an accessible name (for example via `aria-label`).
- Stateful controls expose and update their current state.
- ARIA attributes must accurately reflect the current UI state.

## Motion

- Motion accessibility requirements are defined in motion.md → Reduced motion.

## Layout & reflow

- Pages remain usable at 200% zoom without unnecessary horizontal scrolling.
- Content reflows correctly across supported viewport sizes.
- Text remains readable when users increase browser text size.
