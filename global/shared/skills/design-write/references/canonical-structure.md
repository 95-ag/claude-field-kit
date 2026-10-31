# Canonical Structure Model

The canonical spine every DESIGN.md follows, and the policy for each spine section.

## Canonical Spine

The canonical spine provides the organizing structure for any substantial design system. `# Semantic Systems` is an optional organizing layer, not a forced extraction target.

* **Required sections** — a top-level section marked optional may be omitted; every other top-level section is required. A project schema may require an optional one (`project-schema.md` → Schema Rules).
* **Empty required section** — never padded. Once the user confirms it has nothing to document, it holds one line saying so (e.g. `None — no page-bound compositions.`). Until then it carries the Authoring `TODO:` line (`SKILL.md` → Modes), or, met empty in an existing doc, stays an empty placeholder.
* **Canonical ordering** — top-level sections appear in the block's order; an optional section, when present, takes its slot.
* **Subsection order** — the project schema's where it pins one; otherwise the block's Foundations, Interaction Rules and Iteration Notes lists and Components Sub-Taxonomy's Shell → UI → Document. Any other section keeps the doc's own order.

```
YAML Registry              ← globally reusable tokens/scales/aliases/systems only
# Overview
# Foundations              (Colors, Typography, Prose, Spacing, Layout, Imagery, Motion, Shapes, Elevation & Depth, Iconography)
# Semantic Systems         (optional — populate only when semantic concerns benefit from a dedicated home)
# Background               (optional — ambient background subsystem; promote here when present)
# Components               ← reusable / portable UI systems
# Domain Components        ← page/domain-bound compositions and layouts
# Interaction Rules        (shared baselines: Hover, Focus, Disabled, Loading, Responsive Behavior)
# Accessibility Rules
# Cross-Cutting Rules
# Technical Conventions    (narrowed — rendering, MDX, build/runtime, performance UX, animation-rendering, Z-Index Scale)
# Iteration Notes          (Open Decisions, Known Gaps)
```

## Foundations Template

`# Foundations` is the system's primitive and base rendering layer. A project instantiates the subsections it needs from this canonical set; each documents one concern, in the shape noted. Pin exact subsection/H4 names in the Project-Specific Schema (`project-schema.md`) — other rules reference them. Writing *style* per subsection follows the Foundation Sections writing mode (`section-writing-modes.md`); this template fixes *what each documents*.

| Subsection | Documents (shape) |
|---|---|
| Colors | palette/primitive tokens + a semantic-role mapping (token → role) |
| Typography | type scale (family, size, weight, line-height) + semantic roles |
| Prose | rendered long-form content — headings, blockquotes, lists, tables, inline code, links — consuming type/color tokens; base rendering layer, after Typography, not a component |
| Spacing | spacing scale + semantic application |
| Layout | grid, containers, reading column, layout primitives (architectural) |
| Imagery | image/figure treatment — framing, ratios, placement |
| Motion | duration + easing tokens + motion principles/limits |
| Shapes | the radius/shape scale |
| Elevation & Depth | elevation levels, per-level surface treatment, any blur/shadow carve-outs (stacking order → Technical Conventions → Z-Index Scale) |
| Iconography | the icon system — size, stroke, source |

Rows other than Colors and Typography hold no token values: they name and describe their tokens, whose values live in the YAML Registry (`design-writing-contract.md` → Two-Layer Document Model).

A base style/rendering layer (no component, not in the authoring registry) is a Foundations concern — classify by responsibility before placing it under `# Components`.

## Background Policy

An ambient background subsystem — a full-viewport visual layer the product renders behind content — is its own top-level section, placed between Foundations and Components when present. It is standalone: not a Foundation primitive, not a reusable Component, not page-bound chrome — so it is never buried inside Domain Components. Omit the section entirely when the system has no ambient background.

**Components vs Domain Components:**

- **Components** — reusable, portable UI systems with no page-specific assumptions. MUST NOT assume a route, schema, or editorial purpose.
- **Domain Components** — page- or domain-bound compositions that orchestrate Components and Foundations into product surfaces. MAY assume a specific page context, content schema, or editorial purpose.

## Components Sub-Taxonomy

`# Components` is organized by composition layer, not visual function. Groups progress from application shell to reusable UI primitives to author-authored document blocks: **Shell → UI → Document**.

- **Shell** — site-wide application chrome mounted once per application. Composes UI primitives; assumes no page/route/schema. (Shell→UI is an accepted forward-reference.)
- **UI** — portable primitives composed by engineers in application code; no page/route/schema assumptions.
- **Document** — blocks composed by authors through the system's authoring registry (MDX, CMS, rich text, etc.). A system with no authored content omits the Document group.

**Boundary = who composes, not file format.** The UI/Document boundary is the authoring registry. An engineer-placed snippet primitive belongs in UI even if it looks like code; an author-fenced block belongs in Document. The same concept may exist in both layers because composition context differs.

**Sub-group vocabulary** — instantiate only the sub-groups a system populates; omit empty slots:

- **UI** — Controls/Actions · Links · Display · Inputs · Feedback/Status
- **Document** — Annotations · Figures & Media · Diagrams & Charts · Code · Embeds

Sub-groups are first-class in the doc. How code folders mirror them — and when a flat folder must split — is a code-structure rule, out of scope for DESIGN.md.

## Semantic Systems Policy

`# Semantic Systems` is an optional organizing layer — not a mandatory destination for every semantic role table.

Migrate a semantic table out of Foundations *only* when consolidation under Semantic Systems improves clarity (e.g., cross-foundation state semantics, surface hierarchy that references both colors and elevation). A semantic role table that reads well inside its parent Foundation (e.g., the Colors semantic-role table) may stay colocated.

**Anti-fragmentation rule:** if a semantic concern gains a dedicated canonical home under Semantic Systems, duplicate restatements elsewhere must collapse to references or be retained only as localized exceptions to the canonical mapping. Semantic truth must not fork across Foundations, Semantic Systems, and Components.

## Interaction Rules Policy

`# Interaction Rules` defines *shared behavioral baselines* — hover, focus, disabled, loading, responsive behavior, and any behavior two or more components share. One component's own behavior is never a baseline.

Component sections MUST reference shared interaction baselines rather than restating them. What may live with the component: a **deviation from or specialization of** a baseline, or behavior no baseline covers (the component's own sequencing or affordances) — never the baseline restated. This keeps Interaction Rules canonical while preserving component-local nuance.

## Cross-Cutting Rules Policy

`# Cross-Cutting Rules` is narrowly scoped: it contains only rules that genuinely span multiple foundations, components, or interaction contexts and cannot reasonably live in any single canonical home.

Examples: "no shadows anywhere in v1," "all interactive elements meet 44×44px touch target."

Aesthetic preference lists and stylistic do/don’t bullets do not qualify unless they are operationally enforceable as system-wide constraints. This prevents Cross-Cutting Rules from becoming a Do’s & Don’ts dumping ground.

## Technical Conventions Policy

`# Technical Conventions` survives as a *narrowed implementation-policy section* covering rendering constraints, MDX conventions, build/runtime constraints affecting UX, performance-sensitive policy (LCP/FOUT, lazy loading), and animation-rendering constraints.

It does not hold token *values* (those belong in the YAML Registry) or component specs. Reduced-motion *behavioral* rules join Interaction Rules; reduced-motion *implementation policy* stays in Technical Conventions. Token-usage conventions move to Cross-Cutting Rules.

One subsection is sanctioned here — `Z-Index Scale`, one level below the `# Technical Conventions` heading:

* required when the YAML Registry defines a `z-index:` group, omitted when it does not
* a table with one row per stacking layer, lowest level first
* two columns — the layer's token name, and the role it occupies
* values stay in the YAML Registry — none are restated here

## Domain Components Policy

`# Domain Components` is a first-class spine section placed immediately after `# Components`. It holds page- and domain-bound composition systems that orchestrate Components and Foundations into product surfaces.

Domain Components MUST:

* primarily compose, specialize, or extend one or more canonical spine systems
* assume a specific page context, content schema, or editorial purpose

Domain Components MUST NOT:

* introduce a parallel taxonomy that fragments the spine
* restate a token value outside its one home (`design-writing-contract.md` → Two-Layer Document Model)
* contain globally reusable components (those belong in `# Components`)
