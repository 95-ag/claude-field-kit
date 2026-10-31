# Universal DESIGN.md Writing Contract

The core of the DESIGN.md contract — purpose, the two-layer model, locality and formatting. The rest
of the contract is split by topic: `token-and-yaml-rules.md`, `prose-rules.md`,
`component-and-validation-rules.md`, `anti-patterns.md`, `canonical-structure.md`,
`section-writing-modes.md`, `product-type-extensions.md`, `project-schema.md`.

## Purpose

`DESIGN.md` defines how a product or system looks, behaves, and composes visually.
It acts as:

* a design-system reference
* an implementation-aligned visual specification
* a durable AI-readable design contract

The document MUST optimize for:

* scanability
* consistency
* implementation clarity
* semantic retrieval
* long-term maintainability

---

## Two-Layer Document Model

`DESIGN.md` operates as two distinct layers — logical roles, not file regions:

**YAML Registry layer** — globally reusable canonical tokens at the top of the document. Single source of truth for token *values*: color tokens, typography tokens, spacing scale, radius scale, motion duration and easing tokens, breakpoints, z-index scale, focus-ring spec. Inline YAML may reference registry tokens by name but must not duplicate their values. A color or typography token's value may instead be defined in a Foundations table that maps name to value — a definition, not the role-to-token mapping of category 2 below; a value has one home, so a value defined in both layers is a duplicate owned by the registry.

**Markdown Body layer** — canonical for *meaning*: semantic intent, role, operational constraints, and **a bounded reason**. Markdown is where behavior is described, not where values are stored.

**Bounded, and it is the word the body most often loses.** State the requirement; add a reason only where a future reader would otherwise undo the rule, and cap it at one clause. The alternatives considered, the measurements behind a choice (a `Known Gaps` observation is not one), and the decision's history stay out of the doc — version control holds them; unbounded, this one word turns a contract into a decision log.

Local-spec YAML is still permitted inline when locality aids comprehension — per-elevation-level surface specs, component spec blocks, semantic-systems mappings. The two-layer model separates *roles* (canonical tokens vs. semantic meaning), not file regions. There is no single monolithic YAML superblock.

---

## Canonical Does Not Mean Centralized

The top YAML registry is for primitive/token systems only — not for every reusable semantic mapping.

Three distinct categories guide placement decisions:

**1. Primitive/Token Registries → top YAML registry** (a color or typography value may instead be defined in a Foundations table: → Two-Layer Document Model)
Color tokens, typography tokens, spacing scale, radius scale, motion duration + easing tokens, breakpoints, z-index scale, focus-ring spec.

**2. Semantic Interpretation Systems → colocated by default; hoist only when broadly reused**
Semantic typography-role matrix, surface hierarchy mapping, color semantic-role table, state semantics. Hoist to a `# Semantic Systems` section only when the same mapping is referenced from three or more structural places and locality no longer aids comprehension.

**3. Local Structural Specs → stay colocated**
Component spec blocks, per-elevation-level surface specs, grid/layout structural specs, domain-specific composition specs, role maps used only within a single section.

---

## Locality Principle

Structural locality beats theoretical purity when the semantic relationship is tight.

When deciding whether a YAML block, role table, or rule should be hoisted to a global layer or remain colocated: the question is not "where does this fit in the canonical taxonomy?" but "where is this most readable and maintainable?" Tight semantic coupling between a structural spec and its surrounding prose argues for keeping them together. Loose coupling — a token referenced from many places, a default applied across many components — argues for hoisting.

---

## Formatting Rules

### Headings

* Prefer shallow hierarchy.
* Spine sections are H1; avoid nesting deeper than H4.
* Avoid unnecessary subsection fragmentation.

### Paragraphs

Paragraphs SHOULD:

* stay within the paragraph length (→ Compression Targets)
* communicate one primary idea
* appear mainly in philosophy, composition, or imagery sections

Paragraphs MUST NOT:

* become prose walls
* duplicate nearby bullets or tables
* explain obvious implementation mechanics

### Bullets

Bullets are the primary format for technical sections.

Bullets MUST:

* remain concise and scannable
* avoid excessive nesting

Bullets MUST express one semantically grouped concept cluster.

A single bullet MAY combine:
- visual identity
- dimensions/tokens
- typography
- spacing
- surface treatment
- closely related interaction behavior

when those details form one coherent visual/system concept.

Related implementation details SHOULD be semantically grouped rather than split into excessively granular bullets.

Preferred (under the caveat in `token-and-yaml-rules.md` → Token Conventions):

- Height `{height-interactive-md}` (44px), radius `{radius.sm}` (4px).

Avoid:

- Height 44px.
- Radius 4px.

Maximum nesting depth:

* 2 levels


### Compression Targets

The document MUST optimize for vertical scan speed.

Targets:

* **paragraph length** — ≤ 5 visual lines
* **bullet length** — ≤ 2 visual lines
* **component bullets** — ≤ 6 before YAML/spec
* most sections SHOULD remain readable within one screen height
* a reason attached to a requirement ≤ one clause (see Two-Layer Document Model)
* no provenance shape anywhere in a canonical section (`anti-patterns.md` → Prose Anti-Patterns)
* no bullet restating a table or YAML block adjacent to it
* no rule stated in more than one section

Every target above is counted, not eyeballed — a judgment target by the instances found (`validation-heuristics.md` → Compression).

Avoid:

* prose walls
* excessive heading nesting
* giant uninterrupted YAML blocks
* deeply nested bullet trees
* repeated implementation details across prose and specs

These constraints exist to reduce verbosity drift and maintain fast scanning behavior during long-term iteration.
