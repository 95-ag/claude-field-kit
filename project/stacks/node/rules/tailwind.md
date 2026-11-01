# Tailwind

Tailwind v4 mechanics. The framework-agnostic token rules live in the project's design-system rule;
whether a utility survives the build is `build-verification.md` → Node / Next specifics.

## Variants and the cascade

- A fully arbitrary variant such as `[@media(min-width:…)]:` is emitted in **string order**, not
  breakpoint order — `1000px` sorts before `600px` — so the wrong band can win where two overlap. Use
  `min-[…]:` / `max-[…]:`, which sort by value, or bound the lower band explicitly.
- A plain CSS rule on a utility-shaped selector (`.bg-x { … }`) matches only the unprefixed class — a
  variant is its own class (`md:bg-x` → `.md\:bg-x`). Define it with `@utility bg-x { … }` so every
  variant Tailwind generates carries the whole rule.

## Tokens in utilities

- A shadow utility **inlines** its token's value, so overriding the `--shadow-*` custom property changes
  nothing. Override the framework's own `--tw-shadow` on the painting element and confirm with
  `getComputedStyle().boxShadow`.
- A renamed or retired scale key can fall back to Tailwind's own default value rather than compiling to
  nothing (that case → `build-verification.md` → Node / Next specifics), so a wrong value ships instead of
  a missing one (retiring → `web-frontend/design-system.md` → Token discipline).

## Transitions

- `transition-colors` includes `outline-color`, so on an element with a focus ring the ring fades in from
  `currentColor` instead of appearing in its own color. Name the transitioned properties:
  `transition-[color,background-color,border-color]`.
- An ungated `duration-*` sets only `transition-duration`, leaving `transition-property` at its initial
  `all` — with only the property list behind `motion-safe:`, the element still animates every property
  under reduced motion. Put the duration behind `motion-safe:` too.

## Content scanning

- **Tailwind scans test files too**, so a test holding a utility class as a literal keeps that class in
  the build on its own, and a built-CSS check for it can never fail. Compose the class at run time in
  the test, and prove the check fails against a build with the class removed from every other source.
