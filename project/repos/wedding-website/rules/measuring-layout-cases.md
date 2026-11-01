# Measuring Layout — this site's cases

Cases this site meets on top of `web-frontend/measuring-rendered-pages.md`, which owns the general rules.

- **A two-script line can be bound by the second script while every candidate fix targets the first.** Compute the
  fixed cost and state the remaining width budget before offering copy options. Expect the second script to need
  its own type step: scripts differ in apparent height at the same point size.
- **The gap a reader sees between tap targets includes their invisible padding** — measure that gap, not the
  declared one.
- **A wrong root shifts every coordinate by the page's own height** — the page carries several roots matching the
  same attribute.
