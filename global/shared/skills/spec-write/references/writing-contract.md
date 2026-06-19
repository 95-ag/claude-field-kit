# Spec-Doc Writing Contract

The house style for non-design spec docs. Every doc this skill writes or edits optimizes for one
goal: **a person scanning cold and an agent retrieving a single section both understand it
unambiguously.** That goal drives every rule below.

This is the prose-doc writing contract — parallel to, but separate from, the DESIGN.md writing
contract (`design-writing-contract.md`, owned by the design skills). It governs PRODUCT/PROJECT, the
implementation-plan doc, ARCHITECTURE, SCHEMA, and similar prose docs — never DESIGN.md.

---

## The Two-Tier Voice

These docs are not all written the same way. Two tiers, picked by what the doc is *for*:

**Tier 1 — Product / intent docs (PRODUCT.md, PROJECT.md).**
- Design-agnostic. Describe *what* exists and *why*, never *how it looks*. No design tokens, no pixel
  values, no component internals, no framework specifics. Those live in DESIGN.md / SCHEMA.md
  and are reached by named cross-reference.
- Reasoning is welcome — and expected — for non-obvious or unique decisions. If a choice would
  puzzle a reader who only sees the outcome, keep the one or two sentences that explain it. This is
  the one place prose earns its keep.
- Present-tense declarative: "The hero integrates its CTAs" — not "We will integrate" or "The hero
  should integrate." The doc describes the product as it is meant to be, not a future plan.

**Tier 2 — Companion / reference docs (ARCHITECTURE.md, SCHEMA.md, and most optional prose docs).**
- Terse and specific. State the rule, the field, the constraint — skip the justification unless it
  prevents a real mistake.
- Affirmative prohibitions where exclusivity matters: "Slug is derived from the filename — never add
  a `slug` field." "No raw HTML in the body." The prohibition *is* the spec.
- No reasoning padding. If a reader needs the *why*, it belongs in the Tier-1 doc, cross-referenced.

The implementation-plan doc is **procedural** — a third mode, not a third tier. See
`doc-archetypes.md` for its shape. It borrows Tier-2 terseness for steps and Tier-1 clarity for goals.

**Rule of thumb:** if a sentence explains a *reason*, it belongs in Tier 1. If it states a *rule*,
Tier 2. A companion doc that starts explaining itself has drifted toward the product doc — move the
reasoning there and leave a cross-reference.

---

## Structure

**No section numbering.** Never write `## 1.`, `## 7.2`, `### 3.5`. Numbers rot the moment a section
is inserted or moved, and they invite `§`-style cross-references that rot with them. Use plain
descriptive headings. On any doc you touch, strip existing numbers from the headings you edit.

**Named-path cross-references.** Point at a heading by its path, not a number:
- Good: `DESIGN.md → Foundations → Colors`, `PRODUCT.md → Page Specifications → Project Detail`
- Bad: `DESIGN.md §4.2`, `see section 7`, `(§3.5)`

A named path survives reordering and tells the reader where they're going. Every cross-reference must
resolve to a real heading in the target doc — verify it before finishing.

**Shallow hierarchy.** Prefer `H2 → H3 → H4`. Avoid deeper nesting and orphaned single-child
subsections. If a section has one subsection, fold it up.

**One concern per doc.** Each doc owns one lane (see `doc-archetypes.md` → ownership boundaries).
Content that belongs to another doc is cross-referenced, not duplicated. Drift across docs — the same
fact stated two ways in two files — is a defect.

---

## Formatting

**Bullets are the default for anything enumerable.** Rules, fields, constraints, steps, options —
bullets, not paragraphs. Prose is for the rare connective reasoning a Tier-1 doc needs.

**One idea per bullet, complete sentence, grouped semantically.**
- Keep a bullet to ≤ 2 visual lines.
- Split a wall of prose by *idea*, not by sentence count — each bullet should stand as one coherent
  point a reader can lift out of context.
- Group tightly-related details into one bullet rather than fragmenting:
  - Preferred: "Slug derives from the MDX filename — never add a `slug` field, and never rely on a
    `title`-based slug."
  - Avoid: three bullets each stating one clause of the same rule.
- Max nesting depth: 2 levels.

**Paragraphs ≤ 5 visual lines, one primary idea.** They appear mainly in Tier-1 reasoning. They must
not become walls, restate adjacent bullets, or explain the obvious.

**Tables for field/value or comparison data.** A frontmatter field list, a per-archetype matrix, a
required/optional grid — table, not repeated prose. Put any cross-cutting rule that governs the whole
table as an intro line *before* it, not as a footnote after.

**Scan target.** Most sections should be readable within one screen. If a section sprawls, it is
probably carrying content that belongs in another doc or another tier.

---

## Anti-Patterns

Reject these on sight — they're the failure modes this contract exists to prevent.

- **Design tokens, raw style values, or framework specifics in a product doc.** Illustrative of
  what to keep out: token names (e.g. `display-primary`, `surface-raised`), raw values (e.g.
  `clamp(...)`, `1024px`), framework class syntax (e.g. a utility prefix like `lg:`). The exact
  vocabulary varies by stack — the rule is universal: none of it belongs in Tier 1. Restate the
  *intent* ("portrait hidden on mobile") and cross-reference DESIGN.md for the mechanics. (A
  product-level constraint like "must work at 375px minimum width" is intent, not a token — allowed.)
- **Reasoning padding in a companion doc.** A Tier-2 doc explaining *why* a field exists, at length,
  is drift. State the rule; move the rationale to the product doc.
- **Section numbers and `§` references.** Both rot. Named paths only.
- **Prose walls.** A multi-line paragraph enumerating things that should be bullets.
- **Cross-doc duplication.** The same fact maintained in two docs. Pick the owner, cross-reference
  from the other.
- **Boundary leakage.** Build steps in the product doc, product reasoning in the schema doc, visual
  specs anywhere but DESIGN.md.
- **Invented substance.** A requirement, metric, or decision that no source supports. If it isn't
  decided, mark it `TODO:` and flag it — never manufacture it to fill a section.
- **Future-tense product description.** "We will build…" in a doc that should declare what the
  product *is*. (The implementation-plan doc is the exception — it is legitimately forward-looking.)

---

## Validation Checklist

Before calling a write or edit done:

- Voice matches the doc's tier (Tier-1 reasoning-friendly / Tier-2 terse / plan procedural).
- No `## N.` numbers and no `§`/`section N` references remain in touched sections.
- Every cross-reference is a named path that resolves to a real heading.
- Enumerable content is bulleted; bullets are ≤ 2 lines, one idea each.
- No content that belongs to another doc — boundaries clean.
- Nothing invented; any gap is an explicit `TODO:`.
- Each touched section reads correctly on its own, lifted out of context.
