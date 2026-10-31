# Section Writing Modes

The writing mode each spine section category takes.

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
* token names and CSS custom properties permitted (`prose-rules.md` → Doc-First — No Code References)

Foundations sections stay framework-agnostic. Framework-specific setup code (imports, config boilerplate, framework initialization) belongs in Technical Conventions or implementation docs, not conceptual design foundations.

Implementation-policy decisions that materially affect UX or rendering behavior (e.g. font self-hosting for LCP/FOUT, build-time syntax highlighting) live in Technical Conventions (`canonical-structure.md` → Technical Conventions Policy); a Foundations section may point to one, never state it.

---

### Foundations — Layout Subsections

Mode:

* architectural and compositional

Applies to: `Foundations → Layout` (grid, containers), `Foundations → Imagery`, and `Interaction Rules → Responsive Behavior`.

Characteristics:

* spatial behavior focused
* reading-flow oriented
* concise structural rules
* responsive behavior descriptions — breakpoints named by token; their values stay in the YAML Registry

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
* cross-references to Foundations rather than restating token values outside their one home

---

### Interaction Rules Sections

Mode:

* declarative shared baselines

Applies to every Interaction Rules subsection except Responsive Behavior, which takes the Foundations — Layout Subsections mode.

Characteristics:

* affirmative behavioral rules (what happens, not what is forbidden)
* cross-component baseline — not per-component nuance
* component-local content (`canonical-structure.md` → Interaction Rules Policy) lives in the component section, not here

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

### Background Sections

Mode:

* descriptive system specification

Characteristics:

* describes the one ambient subsystem
* references tokens by name
* no page-bound placement — the subsystem is standalone (`canonical-structure.md` → Background Policy)

---

### Accessibility Rules Sections

Mode:

* normative requirements

Characteristics:

* each rule is a stated requirement, not a figure derived from the document's values (`prose-rules.md` → A requirement, never a derived fact)
* references the implementing token (e.g. the focus ring) by name (`token-and-yaml-rules.md` → Token Conventions)
