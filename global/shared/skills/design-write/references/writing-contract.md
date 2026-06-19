# Universal DESIGN.md Writing Contract

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

**YAML Registry layer** — globally reusable canonical tokens at the top of the document. Single source of truth for token *values*: color tokens, typography tokens, spacing scale, radius scale, motion duration and easing tokens, breakpoints, z-index scale, focus-ring spec. Inline YAML may reference registry tokens by name but must not duplicate their values.

**Markdown Body layer** — canonical for *meaning*: semantic intent, role, operational constraints, rationale. Markdown is where behavior is described, not where values are stored.

Local-spec YAML is still permitted inline when locality aids comprehension — per-elevation-level surface specs, component spec blocks, semantic-systems mappings. The two-layer model separates *roles* (canonical tokens vs. semantic meaning), not file regions. There is no single monolithic YAML superblock.

---

## Canonical Does Not Mean Centralized

The top YAML registry is for primitive/token systems only — not for every reusable semantic mapping.

Three distinct categories guide placement decisions:

**1. Primitive/Token Registries → top YAML registry**
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
* Avoid nesting deeper than:

  * `H2 → H3 → H4`
* Avoid unnecessary subsection fragmentation.

### Paragraphs

Paragraphs SHOULD:

* remain under 5 visual lines
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

Preferred:

- Height `{height-interactive-md}` (44px), radius `{radius.sm}` (4px).

Avoid:

- Height 44px.
- Radius 4px.

Maximum nesting depth:

* 2 levels


### Compression Targets

The document MUST optimize for vertical scan speed.

Targets:

* paragraphs ≤ 5 visual lines
* bullets ≤ 2 visual lines
* components ≤ 6 bullets before YAML/spec
* most sections SHOULD remain readable within one screen height

Avoid:

* prose walls
* excessive heading nesting
* giant uninterrupted YAML blocks
* deeply nested bullet trees
* repeated implementation details across prose and specs

These constraints exist to reduce verbosity drift and maintain fast scanning behavior during long-term iteration.

---

## Token Conventions

Semantic tokens SHOULD appear in prose when:

* they communicate reusable system meaning
* they represent identity-bearing primitives
* they map to shared design vocabulary

Preferred format:

```md
radius `{radius.sm}` (4px)
height `{height-interactive-md}` (44px)
background `{colors.accent}` (#006e37)
```

Resolved values SHOULD accompany tokens when visually meaningful.

Avoid:

```md
radius-sm
spacing-md
44px radius
```

without semantic linkage.

---

## Design Identifiers

These identifiers are load-bearing:

* token names
* component names
* semantic role names
* domain component names
* stable terminology

Changing any of them requires explicit instruction or an approved terminology migration.

---

## YAML Rules

The top of the document holds a YAML registry for globally reusable canonical tokens — the single source of truth for token values. See *Two-Layer Document Model* and *Canonical Does Not Mean Centralized* for what belongs in the registry vs. colocated inline.

YAML SHOULD only appear (inline or in registry) when:

* hierarchy matters
* structured systems are being defined
* multiple variants exist
* prose becomes less readable than structured data

YAML MUST NOT:

* replace semantic explanation
* appear before identity/behavior description
* restate information already sufficiently communicated in prose unless structural hierarchy or implementation precision requires it
* contain inline `#` comments of any kind — value annotations and conditional/responsive specs become proper keys; all interpretive semantics belong in prose or bullets above the block
* form a single monolithic superblock — the registry collects globally reusable tokens, not every YAML block in the document

YAML blocks are spec registries: token/value mappings, structural hierarchies, and variant definitions — with no inline `#` comments. A comment that annotates a value (`# 16px`) is redundant with the value and is deleted; a comment that smuggles a conditional or responsive spec (`right: 16px  # lg+: max(...)`) becomes a proper key (`right-lg: max(...)`); a comment that explains meaning moves to prose above the block.

Exception: foundational token systems (spacing scale, motion tokens, breakpoints) must preserve a canonical YAML block even when prose explains the semantics. Prose establishes meaning; YAML is the spec registry. They serve different roles and coexist.

Pure spec blocks need minimal operational framing (1–2 bullets) when the semantics are not self-evident from raw values alone. Do not leave naked YAML without interpretive context.

Preferred order:

1. identity statement
2. semantic bullets
3. YAML/spec block (optional)

### YAML Schema Conventions

These conventions define how tokens and specs are encoded in the registry. Primitive/token groups are strongly standardized. Component and local-spec groups are lightly standardized — enough for interoperability, not so rigid as to over-constrain richer systems.

**Token types**

| Type | Format | Example |
|---|---|---|
| Color | `#` + hex (sRGB) | `"#1A1C1E"` |
| Dimension | number + unit (`px`, `em`, `rem`) | `"48px"`, `"-0.02em"` |
| Token Reference | `{path.to.token}` | `{colors.primary}` |

Token references point to another value in the YAML tree. For most token groups, references must resolve to a primitive value (e.g., `{colors.primary-60}`). Within component spec YAML blocks, references to composite values (e.g., `{typography.label-md}`) are permitted.

**Recommended registry structure**

Typography objects carry `fontFamily`, `fontSize`, `fontWeight` (numeric, e.g. `400`), `lineHeight` (unitless multiplier preferred, e.g. `1.6`), `letterSpacing` (optional), and optionally `fontFeature` / `fontVariation`. Scale level keys (`xs`, `sm`, `md`, `lg`, `xl`) SHOULD be consistent across `spacing`, `rounded`, and any other scale groups; avoid mixing numeric and named keys within the same scale.

```yaml
colors:
  <token-name>: <Color>

typography:
  <token-name>:
    fontFamily: <string>
    fontSize: <Dimension>
    fontWeight: <number>
    lineHeight: <Dimension | number>
    letterSpacing: <Dimension>

spacing:
  <scale-level>: <Dimension>

rounded:
  <scale-level>: <Dimension>

motion:
  duration:
    <name>: <Dimension>
  easing:
    <name>: <string>

breakpoints:
  <name>: <Dimension>

z-index:
  <name>: <number>
```

**Component spec blocks (lightly standardized)**

Component specs SHOULD remain colocated with their component entry unless the same specification becomes broadly reused across multiple structural contexts. A component block may reference registry tokens:

```yaml
button-primary:
  backgroundColor: "{colors.accent}"
  textColor: "{colors.accent-on}"
  height: "{spacing.interactive-md}"
  rounded: "{rounded.md}"
```

When a reusable token already exists, component and local specs SHOULD reference the token rather than restating the resolved value. Local structural specs that are genuinely self-contained (not derived from a registry token) may include their own values.

---

## Prose Rules

The document SHOULD use:

* dense declarative writing
* semantically grouped writing
* stable terminology
* local reinforcement of important concepts

The document SHOULD avoid:

* marketing tone
* rhetorical filler
* excessive abstraction
* implementation dumps without context

Important system concepts MAY be intentionally repeated locally inside sections.

Technical prose SHOULD favor compressed semantic clusters over decomposed specification lists.

Closely related implementation details SHOULD be merged into compact semantic clusters rather than separated into mechanically isolated bullets.

**But cluster only low-information attributes.** When a single concept carries high information — several facts that each need their own explanation — split it into multiple bullets or nested sub-bullets rather than cramming one overloaded bullet. The trigger is visual length: once a bullet exceeds ~2 visual lines, split it. Clustering related facts and splitting loaded ones serve the same goal — bounded reading load — applied to opposite inputs.

Preferred (cluster — low-info attributes):
- Background `{surface-tag}`, text `{colors.on-surface}`, type `tag-chip`, rounded `{radius.sm}` (4px).

Avoid (over-decomposed):
- Background `{surface-tag}`
- Text `{colors.on-surface}`
- Radius `{radius.sm}` (4px)

Avoid (over-loaded — split a high-information concept into a parent + sub-bullets):
- One bullet that bundles a component's container styling, its responsive column behavior, its hover/active states, and its loading/empty states → instead lead with the component, then sub-bullet styling, responsive behavior, and states.

### Cross-Cutting Rules Before Tables

Cross-cutting interpretation rules, global overrides, and exceptions that affect multiple rows or entries in a table or spec block belong as intro bullets before the table — not as post-table footnotes or detached notes sections. Readers need the interpretive frame before entering the table.

---

### Redundancy Rules

Intentional repetition of identity-bearing concepts is permitted.

Important system concepts MAY be repeated locally inside sections rather than referenced abstractly from earlier sections.

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
* no shadows

Avoid relying entirely on earlier philosophy sections for contextual understanding.

### Affirmative Rules Over Defensive Prohibitions

Prefer affirmative canonical rules over defensive prohibition phrasing when exclusivity is already implied. "All blur surfaces use X" makes "do not use Y or Z" redundant. Defensive prohibitions are warranted only when the prohibited alternative is genuinely plausible and not already ruled out by the affirmative rule.

### Avoiding Redundant Interpretive Prose

When a canonical table or spec block already expresses behavior clearly, interpretive prose that restates the same information adds noise rather than clarity. Explanatory prose earns its place when it adds interpretation not already structurally encoded — not when it paraphrases what the table shows.

---

## Component Writing Contract

Every reusable component section MUST contain:

1. component name
2. 1-line identity statement
3. 3–5 semantic bullets

Component bullets SHOULD collectively communicate:

* visual identity
* dimensions/tokens
* usage context
* interaction behavior
* important constraints

These categories SHOULD be semantically grouped into dense, readable bullets rather than mechanically separated into one category per bullet.

Not every component requires every category, but reusable components SHOULD communicate enough information to understand role and behavior without reading implementation specs.

Components SHOULD include contextual examples.

Preferred:

```md
Used for the primary home CTA, project navigation, and contact actions.
```

Preferred component format:

```md
### `button-primary`

Primary committed action using tonal contrast rather than elevation.

- Background `{colors.accent}`, text `{colors.accent-on}`.
- Height `{height-interactive-md}` (44px), radius `{radius.sm}` (4px).
- Used for the primary home CTA, contact actions, and project navigation.
- Hover reduces opacity only; focus uses `{colors.focus-ring}`.
```

Components MUST NOT:

* begin with YAML
* exceed 6 bullets before implementation detail
* rely entirely on implementation specs for understanding

### Contextual Usage Rules

Reusable components SHOULD include contextual usage examples whenever practical.

Preferred:

```md
Used for the primary home CTA, project navigation, and contact actions.
```

Avoid:

```md
Used for primary actions.
```

Contextual examples improve:

* scanability
* grounding
* implementation confidence
* AI interpretation quality

---

## Validation Rules

A valid `DESIGN.md` SHOULD:

* expose identity before implementation
* remain scannable top-to-bottom
* avoid dense prose walls
* maintain stable terminology
* keep inline body YAML secondary to prose — the top-level YAML Registry is the canonical token store, not a prose support structure
* use semantic-token + resolved-value formatting consistently
* avoid excessive heading nesting
* avoid duplicating registry token *values* in prose — token *names* may be referenced freely in markdown
* preserve consistent cadence across sections
* satisfy defined Compression Targets

A valid component SHOULD:

* be understandable within ~10 seconds of scanning
* communicate role before implementation
* expose constraints clearly
* avoid over-fragmentation

### Stable Terminology Rules

Projects SHOULD define stable repeated vocabulary for identity-bearing concepts.

Preferred terminology SHOULD remain consistent across the document.

Avoid:

* synonym drift
* multiple phrases for the same concept
* inconsistent naming between sections

Example stable terminology:

* tonal layering
* structural whitespace
* architectural containers
* restrained motion
* raised surfaces
* sunken surfaces

Consistent terminology improves:

* readability
* retrieval quality
* implementation consistency
* long-term maintainability

Sections SHOULD remain understandable when read independently outside full document context.

---

## Conflict Detection

When multiple sections define different values, behaviors, meanings, or ownership for the same token, component, semantic role, or interaction state, the conflict must be flagged. Conflicts are never silently reconciled.

---

# Anti-Patterns

The following patterns SHOULD be avoided across all `DESIGN.md` systems.

## Structural Anti-Patterns

Avoid:

* excessive heading nesting
* deeply fragmented subsection trees
* orphaned subsections
* duplicated sections across categories
* inconsistent section ordering
* giant uninterrupted YAML blocks

---

## Prose Anti-Patterns

Avoid:

* prose walls
* marketing-style language
* rhetorical filler
* implementation-heavy paragraphs
* excessive abstraction without grounding
* repeating identical information across prose and YAML
* process/source metadata in canonical sections — cross-doc citations ("see PRODUCT.md §7.4"), open-question markers, and self-containment notes ("Restated from X for self-containment") are transient authoring artifacts, not design-system content. Open decisions belong in `Iteration Notes → Open Decisions`; gaps belong in `Iteration Notes → Known Gaps`.

---

## Component Anti-Patterns

Avoid:

* component sections beginning with YAML/specs
* components without identity statements
* components without usage context
* raw implementation dumps without semantic framing
* bullets fragmented into excessively granular implementation details

Avoid:

```md
- Height 44px.
- Radius 4px.
- Padding 24px.
```

Prefer:

```md
- Height `{height-interactive-md}` (44px), radius `{radius.sm}` (4px), with `{spacing.lg}` (24px) horizontal padding.
```

---

## Terminology Anti-Patterns

Avoid:

* synonym drift for core concepts
* inconsistent naming between sections
* introducing multiple phrases for the same system behavior

Preferred:

* stable repeated terminology
* local reinforcement of core concepts
* consistent semantic vocabulary

---

## Formatting Anti-Patterns

Avoid:

* bullets longer than 2 visual lines
* paragraphs longer than 5 visual lines
* more than 6 bullets before implementation details
* mixing editorial and technical prose styles within the same local section

---

## Token Anti-Patterns

Avoid:

* raw values without semantic linkage when reusable tokens exist
* token-only prose without resolved values where readability benefits
* implementation-token overload in editorial sections

Avoid:

```md
padding-inline-md
```

Prefer:

```md
padding `{spacing.md}` (16px)
```

---

## YAML Anti-Patterns

Avoid:

* YAML duplicating prose directly
* deeply nested YAML hierarchies
* YAML used before semantic explanation
* implementation specs without contextual understanding

Inline body YAML SHOULD support prose, not replace it. This applies to YAML blocks in the markdown body — the top-level YAML Registry is the canonical token store and operates independently of prose.

This section is valuable because it teaches:

* what failure looks like
* what drift looks like
* what to reject during review

which dramatically improves agent consistency.

---

# Canonical Structure Model

## Canonical Spine

The canonical spine provides the organizing structure for any substantial design system. Not every section is mandatory in every product — the inner ontology of `# Semantic Systems` in particular is an optional organizing layer, not a forced extraction target.

```
YAML Registry              ← globally reusable tokens/scales/aliases/systems only
# Overview
# Foundations              (Colors, Typography, Spacing, Layout, Motion, Shapes, Elevation & Depth)
# Semantic Systems         (optional — populate only when semantic concerns benefit from a dedicated home)
# Components               ← reusable / portable UI systems
# Domain Components        ← page/domain-bound compositions and layouts
# Interaction Rules        (global defaults: Hover, Focus, Disabled, Loading, Responsive Behavior)
# Accessibility Rules
# Cross-Cutting Rules
# Technical Conventions    (narrowed — rendering, MDX, build/runtime, performance UX, animation-rendering)
# Iteration Notes          (Open Decisions, Known Gaps)
```

**Components vs Domain Components:**

- **Components** — reusable, portable UI systems with no page-specific assumptions. MUST NOT assume a route, schema, or editorial purpose.
- **Domain Components** — page- or domain-bound compositions that orchestrate Components and Foundations into product surfaces. MAY assume a specific page context, content schema, or editorial purpose.

## Semantic Systems Policy

`# Semantic Systems` is an optional organizing layer — not a mandatory destination for every semantic role table.

Migrate a semantic table out of Foundations *only* when consolidation under Semantic Systems improves clarity (e.g., cross-foundation state semantics, surface hierarchy that references both colors and elevation). A semantic role table that reads well inside its parent Foundation (e.g., the Colors semantic-role table) may stay colocated.

**Anti-fragmentation rule:** if a semantic concern gains a dedicated canonical home under Semantic Systems, duplicate restatements elsewhere must collapse to references or be retained only as localized exceptions to the canonical mapping. Semantic truth must not fork across Foundations, Semantic Systems, and Components.

## Interaction Rules Policy

`# Interaction Rules` defines *shared behavioral baselines* (hover, focus, disabled, loading, responsive behavior) — global defaults only.

Component sections SHOULD reference shared interaction baselines rather than restating them verbatim, unless local restatement materially improves clarity, scanability, accessibility emphasis, or exception handling. This keeps Interaction Rules as the canonical baseline while preserving component-local nuance where it genuinely aids comprehension.

## Cross-Cutting Rules Policy

`# Cross-Cutting Rules` is narrowly scoped: it contains only rules that genuinely span multiple foundations, components, or interaction contexts and cannot reasonably live in any single canonical home.

Examples: "no shadows anywhere in v1," "all interactive elements meet 44×44px touch target," "no client-side syntax highlighting."

Aesthetic preference lists and stylistic do/don’t bullets do not qualify unless they are operationally enforceable as system-wide constraints. This prevents Cross-Cutting Rules from becoming a Do’s & Don’ts dumping ground.

## Technical Conventions Policy

`# Technical Conventions` survives as a *narrowed implementation-policy section* covering rendering constraints, MDX conventions, build/runtime constraints affecting UX, performance-sensitive policy (LCP/FOUT, lazy loading), and animation-rendering constraints.

It does not hold tokens (those belong in the YAML Registry) or component specs. Reduced-motion *behavioral* rules join Interaction Rules; reduced-motion *implementation policy* stays in Technical Conventions. Token-usage conventions move to Cross-Cutting Rules.

## Domain Components Policy

`# Domain Components` is a first-class spine section placed immediately after `# Components`. It holds page- and domain-bound composition systems that orchestrate Components and Foundations into product surfaces.

Domain Components MUST:

* primarily compose, specialize, or extend one or more canonical spine systems
* assume a specific page context, content schema, or editorial purpose

Domain Components MUST NOT:

* introduce a parallel taxonomy that fragments the spine
* duplicate token values from the registry
* contain globally reusable components (those belong in `# Components`)

---

## Section-Type Writing Modes

Content SHOULD adopt the writing mode of its parent section category.

Avoid mixing editorial, technical, and implementation-heavy prose styles within the same local section.

Different section categories SHOULD maintain distinct writing modes.

### Overview Sections

Mode:

* editorial and conceptual

Characteristics:

* prose-first
* minimal implementation detail
* minimal YAML
* dense declarative writing

---

### Foundation Sections

Mode:

* semantic-system documentation

Characteristics:

* table-first where appropriate
* token-oriented
* concise explanatory prose
* implementation vocabulary permitted

Foundations sections should remain implementation-agnostic unless explicitly defining technical conventions. Framework-specific setup code (imports, config boilerplate, framework initialization) belongs in Technical Conventions or implementation docs, not conceptual design foundations.

Exception: implementation-policy decisions that materially affect UX or rendering behavior (e.g. font self-hosting for LCP/FOUT, build-time syntax highlighting) may appear in Foundations as a compact policy note — not as raw framework code.

---

### Foundations — Layout Subsections

Mode:

* architectural and compositional

Applies to: `Foundations → Layout` (grid, containers, imagery) and `Interaction Rules → Responsive Behavior`.

Characteristics:

* spatial behavior focused
* reading-flow oriented
* concise structural rules
* responsive behavior descriptions

---

### Component Sections

Mode:

* compact semantic spec

Characteristics:

* identity-first
* semantic bullets before implementation
* contextual examples encouraged
* YAML secondary to prose

Component prose SHOULD read like a compressed editorial systems manual rather than API reference documentation.

---

### Technical Convention Sections

Mode:

* dense technical reference

Characteristics:

* compact
* highly structured
* minimal prose
* implementation-oriented

---

### Iteration Sections

Mode:

* short practical notes

Characteristics:

* concise
* bullet-first
* non-defensive
* future-oriented without speculation

---

### Semantic Systems Sections

Mode:

* role-based, table-oriented

Characteristics:

* semantic mapping first — roles before values
* minimal prose (the table carries primary load)
* cross-references to Foundations rather than restating token values

---

### Interaction Rules Sections

Mode:

* declarative global defaults

Characteristics:

* affirmative behavioral rules (what happens, not what is forbidden)
* cross-component baseline — not per-component nuance
* component-specific deviations live in the component section, not here

---

### Cross-Cutting Rules Sections

Mode:

* system-wide constraints

Characteristics:

* operationally enforceable rules only
* no aesthetic preferences unless they are architectural constraints
* each rule must span multiple structural contexts to qualify

---

### Domain Component Sections

Mode:

* compositional and editorial

Characteristics:

* assumes a specific page context, content schema, or editorial purpose
* references spine primitives (Components, Foundations) by token name
* product-specific composition narratives — not generic design-system rules
* may introduce page-specific structural conventions (reading grids, editorial hierarchies, layout logic)

---

# Product-Type Extensions

## Portfolio Extension

Portfolio systems SHOULD prioritize:

* editorial reading flow
* project storytelling
* restrained interaction
* architectural composition
* narrative hierarchy

Portfolio systems SHOULD include:

* long-form reading layout
* project detail structure
* editorial composition rules
* imagery treatment
* About layouts

Portfolio systems SHOULD avoid:

* SaaS-style dashboard density
* growth-marketing aesthetics
* decorative motion systems

Preferred terminology:

* editorial
* architectural
* tonal layering
* narrative hierarchy
* structural whitespace

---

## SaaS Extension

SaaS systems SHOULD prioritize:

* information clarity
* operational efficiency
* dense workflows
* state communication
* scalability

SaaS systems SHOULD include:

* forms
* data display
* navigation systems
* feedback states
* tables
* filtering/sorting patterns

SaaS systems SHOULD define:

* state systems
* empty/loading/error states
* permissions and hierarchy indicators

Preferred terminology:

* workflows
* operational surfaces
* data density
* feedback states
* system status

---

## Docs-Site Extension

Documentation systems SHOULD prioritize:

* reading ergonomics
* information hierarchy
* navigation clarity
* code readability
* progressive disclosure

Docs systems SHOULD include:

* prose composition rules
* code block standards
* navigation hierarchy
* sidebar behavior
* content-width rules

Docs systems SHOULD optimize for:

* skimming
* anchor navigation
* reference retrieval
* long-session readability

Preferred terminology:

* reading flow
* content hierarchy
* navigation depth
* reference surfaces
* progressive disclosure

---

# Project-Specific Schema

## Purpose

Project-specific schema defines:

* exact required sections
* canonical ordering
* required terminology
* local structural conventions

This layer specializes the universal contract for a specific product.

---

## Schema Rules

Project schemas MAY:

* require specific sections
* define canonical ordering
* enforce terminology
* introduce specialized modules
* define local constraints

Project schemas MUST NOT:

* violate universal writing rules
* replace semantic-first structure
* remove component-writing requirements

---

## Portfolio Schema Example

### Canonical Spine (Required)

```
YAML Registry
# Overview
# Foundations              (Colors, Typography, Spacing, Layout, Motion, Shapes, Elevation & Depth)
# Semantic Systems         (optional organizing layer)
# Components               ← reusable / portable UI systems
# Domain Components        ← page/domain-bound compositions
# Interaction Rules        (Hover, Focus, Disabled, Loading, Responsive Behavior)
# Accessibility Rules
# Cross-Cutting Rules
# Technical Conventions   (narrowed — rendering, MDX, build/runtime, performance UX, animation-rendering)
# Iteration Notes          (Open Decisions, Known Gaps)
```

### Required Domain Components (Portfolio-Specific)

```
# Domain Components
  ## Project Detail
  ## About Layouts
```

### Canonical Ordering

Sections SHOULD appear in this order:

1. YAML token registry
2. identity/philosophy
3. foundational primitives (colors, typography, spacing, motion, elevation)
4. optional semantic organizing layer
5. reusable components
6. page/domain-bound compositions (Domain Components)
7. interaction baselines
8. accessibility rules
9. cross-cutting system constraints
10. implementation infrastructure (Technical Conventions)
11. iteration notes

---

## Local Terminology Rules

Projects SHOULD define stable vocabulary for repeated concepts.

Preferred terminology SHOULD remain consistent across the document.

Example portfolio vocabulary:

* architectural containers
* tonal layering
* editorial layout
* structural whitespace
* restrained motion
* raised surfaces
* sunken surfaces

Avoid introducing multiple terms for the same concept.

---

## Structural Validation Rules

A valid project-specific `DESIGN.md` MUST:

* preserve canonical ordering
* contain all required sections
* avoid orphaned subsections
* maintain consistent heading hierarchy
* keep related concepts grouped semantically

Agents MAY:

* add optional subsections when justified
* reorganize content within valid sections
* extend component groups

Agents MUST NOT:

* casually rename canonical sections
* duplicate sections across categories
* introduce unnecessary hierarchy depth
* move content into semantically unrelated sections
* place page-specific implementation details inside foundational system sections — page-specific policy (e.g. a single page's image treatment) belongs near the component or layout section that owns the page context, not in global Foundations rules
* place responsive infrastructure (breakpoints, viewport constraints, nav behavior thresholds) as isolated siblings to layout specs — these belong under `Interaction Rules → Responsive Behavior`
