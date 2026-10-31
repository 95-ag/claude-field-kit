# Token and YAML Rules

How DESIGN.md names, references and registers tokens and other design identifiers, and the rules for its YAML blocks.

## Token Conventions

Semantic tokens SHOULD appear in prose when:

* they communicate reusable system meaning
* they represent identity-bearing primitives
* they map to shared design vocabulary

*Example:* the preferred format — names and values adapt per project; the shape is fixed:

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

## Token Naming Conventions

Token names are **semantic — by usage/role, not value or appearance** — across every group (color, spacing, radius, motion, z-index, breakpoints, typography). A name says what the token is *for*, so it survives a value change.

- **Name by role, not value.** `surface-elevated`, not `gray-100`; `duration-fast`, not `150ms`.
- **One value → one token.** Don't mint two names for the same resolved value, or overload one name across distinct roles. Names must be distinct enough not to collide.
- **Foreground pairs name their ground.** A text/icon token names the surface it sits on — e.g. an `ink` / `ink-on-accent` pairing.
- **Responsive tiers use device + breakpoint-token names.** Name them by device (mobile, tablet, laptop, desktop, wide, ultrawide) and the framework's breakpoint tokens (e.g. sm, md, lg, xl, 2xl) — never ad-hoc scale words ("mid").
- **A table of tier-suffixed tokens states the naming pattern once above it; the cells carry values only.** Repeating the full token name in every cell invites a cell to invent one that resolves to nothing, in a table that still reads as authoritative. State any exception beside the pattern, not in the cell that takes it.

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

The top of the document holds a YAML registry for globally reusable canonical tokens — the single source of truth for token values. See `design-writing-contract.md` → Two-Layer Document Model and → Canonical Does Not Mean Centralized for what belongs in the registry vs. colocated inline.

YAML SHOULD only appear (inline or in registry) when:

* hierarchy matters
* structured systems are being defined
* multiple variants exist
* prose becomes less readable than structured data

YAML MUST NOT:

* replace semantic explanation
* appear before identity/behavior description
* restate information already communicated in prose
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
  variants:
    compact:
      height: "{height-interactive-sm}"
  states:
    pressed:
      backgroundColor: "{colors.accent-pressed}"
  structure:
    - icon (optional, leading)
    - label
```

When a reusable token already exists, component and local specs SHOULD reference the token rather than restating the resolved value. Local structural specs that are genuinely self-contained (not derived from a registry token) may include their own values.
