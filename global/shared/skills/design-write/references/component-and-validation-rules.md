# Component and Validation Rules

The component section format, the rules every section must satisfy, and how conflicts are flagged.

## Component Writing Contract

Every reusable component section MUST contain:

1. component name
2. 1-line identity statement
3. semantic bullets, within the component bullets limit (`design-writing-contract.md` → Compression Targets)

Component bullets SHOULD collectively communicate:

* visual identity
* dimensions/tokens
* usage context
* interaction behavior
* important constraints

These categories SHOULD be semantically grouped into dense, readable bullets rather than mechanically separated into one category per bullet.

Not every component requires every category, but reusable components SHOULD communicate enough information to understand role and behavior without reading implementation specs.

A component's YAML spec block carries its variants, states and structure — never a value its bullets already state (`token-and-yaml-rules.md` → YAML Rules).

Components SHOULD include contextual examples.

Preferred:

```md
Used for the primary home CTA, project navigation, and contact actions.
```

*Example:* the preferred component format, under the caveat in `token-and-yaml-rules.md` → Token Conventions:

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
* exceed the component bullets limit before implementation detail (`design-writing-contract.md` → Compression Targets)
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
* avoid restating a token *value* outside its one home (`design-writing-contract.md` → Two-Layer Document Model) — token *names* may be referenced freely in markdown, and a name carrying its resolved value (`{radius.sm}` (4px)) is a reference, not a duplication
* satisfy defined Compression Targets (`design-writing-contract.md`)

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
