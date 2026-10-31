# Prose and Doc-First Rules

How DESIGN.md prose is written, and why it names no code.

## Prose Rules

The document SHOULD use:

* dense declarative writing
* semantically grouped writing
* stable terminology
* local reinforcement of a section's own vocabulary

The document SHOULD avoid:

* marketing tone
* rhetorical filler
* excessive abstraction
* implementation dumps without context

Technical prose SHOULD favor compressed semantic clusters over decomposed specification lists.

Closely related implementation details SHOULD be merged into compact semantic clusters rather than separated into mechanically isolated bullets.

**But cluster only low-information attributes.** When a single concept carries high information — several facts that each need their own explanation — split it into multiple bullets or nested sub-bullets rather than cramming one overloaded bullet. The trigger is visual length: once a bullet exceeds the bullet length (`design-writing-contract.md` → Compression Targets), split it. Clustering related facts and splitting loaded ones serve the same goal — bounded reading load — applied to opposite inputs.

Preferred (cluster — low-info attributes; under the caveat in `token-and-yaml-rules.md` → Token Conventions):
- Background `{surface-tag}`, text `{colors.on-surface}`, type `tag-chip`, rounded `{radius.sm}` (4px).

Avoid (over-decomposed):
- Background `{surface-tag}`
- Text `{colors.on-surface}`
- Radius `{radius.sm}` (4px)

Avoid (over-loaded — split a high-information concept into a parent + sub-bullets):
- One bullet that bundles a component's container styling, its responsive column behavior, its hover/active states, and its loading/empty states → instead lead with the component, then sub-bullet styling, responsive behavior, and states.

### A requirement, never a derived fact

**The document states requirements. A figure that follows from values already in the document is not one,
and is not stated.** A contrast ratio follows from two hexes; a measured spread follows from a scale; a
pixel count follows from a layout. Each goes stale the moment its inputs move and nothing recomputes it,
so it survives as a confident sentence that is quietly false.

- **Keep a figure only where it bounds a deliberate exception** — a value the system knowingly violates,
  where the number IS the limit of the exception — or where it is an `Iteration Notes → Known Gaps`
  measurement, which is a dated observation rather than a rule.
- **Prefer the constraint to the figure.** "Meets AA against every surface it is used on" survives a
  palette change; a stated ratio does not.
- **"This value is not in the doc" is not yet a finding.** Ask whether it is a requirement a redesigner
  would need, or tuning that serves a requirement already written. Only the first belongs here.

### Cross-Cutting Rules Before Tables

Cross-cutting interpretation rules, global overrides, and exceptions that affect multiple rows or entries in a table or spec block belong as intro bullets before the table — not as post-table footnotes or detached notes sections. Readers need the interpretive frame before entering the table.

---

### Redundancy Rules

Intentional repetition of identity-bearing **vocabulary** is permitted — the terms and named qualities a section needs to read standing alone.

Those terms MAY be repeated locally inside sections rather than referenced abstractly from earlier sections.

This improves:

* independent section readability
* AI retrieval quality
* terminology consistency
* implementation clarity

Examples:

* tonal layering
* restrained motion
* architectural containers
* structural whitespace
* editorial reading flow
* raised surfaces
* sunken surfaces

A rule or a value is not vocabulary: Compression Targets (`design-writing-contract.md`) governs where a rule lives, the YAML Registry where a value lives.

Avoid relying entirely on earlier philosophy sections for contextual understanding.

### Affirmative Rules Over Defensive Prohibitions

Prefer affirmative canonical rules over defensive prohibition phrasing when exclusivity is already implied. "All blur surfaces use X" makes "do not use Y or Z" redundant. Defensive prohibitions are warranted only when the prohibited alternative is genuinely plausible and not already ruled out by the affirmative rule.

### Avoiding Redundant Interpretive Prose

When a canonical table or spec block already expresses behavior clearly, interpretive prose that restates the same information adds noise rather than clarity. Explanatory prose earns its place when it adds interpretation not already structurally encoded — not when it paraphrases what the table shows.

---

## Doc-First — No Code References

DESIGN.md describes **what the design does and why — never how the code wires it.** Code follows the doc; the doc never points back at code. The test: state the design intent and rationale, not the implementation.

**Ban** (implementation, not design):
- File paths — `src/...`, `globals.css`, `footer.tsx`, `/public/...`.
- Code symbols presented as code — component / registry / hook / provider / variable names.
- Import / package / framework-API names — `next/image`, `next/font`, `@shikijs/rehype`.
- Raw framework utility classes used as spec — `lg:flex-1`, `min-h-dvh`, `grid-cols-2`.
- Mount-order / wiring prose — "mounted before the nav", "in the root layout", "re-exported from".

**Allow:**
- Design-token selectors & CSS custom properties — they *are* the token system (`[data-theme]`, `{radius.sm}`, `var(--accent)`). Prefer the `{token}` form for token references.
- A deliberately-chosen tool/library *name* where the choice affects design semantics — not a library merely used by the implementation. The system name only, never its API, package, or wiring.

**Where implementation detail belongs:**
- Rendering/build/runtime *policy* lives in Technical Conventions, stated conceptually (what happens + why), naming no files, symbols, or packages.
- No design information is lost: rewrite implementation details as conceptual behavior.
- The doc↔code bridge is the naming convention (heading = export = file), not inline paths.
- Pure implementation caveats belong in code comments or Technical notes, never in DESIGN.md.
