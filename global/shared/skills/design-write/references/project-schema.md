# Project-Specific Schema

How a project pins its own instance of the canonical structure, and the structural rules every DESIGN.md keeps.

## Purpose

Project-specific schema defines:

* exact required sections
* subsection ordering within each spine section
* required terminology
* local structural conventions

This layer specializes the universal contract for a specific product.

---

## Referenceable Contract Surface

Sibling documents (rules, component maps, configs) reference DESIGN.md by heading path, often down to H4. Those heading paths form a contract surface rather than internal organization.

- **Stable and complete.** Every section/subsection a sibling rule references must exist and stay present. Heading anchors are load-bearing identifiers — renaming one propagates to every referrer (`cross-reference-rules.md`).
- **Pinned in the project schema.** The Project-Specific Schema fixes the exact subsection headings, the H4 anchors external rules cite, the pinned terminology (e.g. a project's chosen "Motion & Interaction" vs the generic "Motion"), and the doc↔code tagging convention.

The universal contract defines the template. The project schema fixes the concrete instance that sibling rules reference.

---

## Schema Rules

Project schemas MAY:

* require specific sections
* fix subsection order within a spine section — top-level order is the Canonical Spine's (`canonical-structure.md`)
* enforce terminology
* introduce specialized modules
* define local constraints

Project schemas MUST NOT:

* violate universal writing rules
* replace semantic-first structure
* remove component-writing requirements

---

## Portfolio Schema Example

### Spine Instance

* `# Foundations` instantiates Colors, Typography, Spacing, Layout, Motion, Shapes, Elevation & Depth — no Prose, Imagery, or Iconography subsection
* `# Semantic Systems` kept as an optional organizing layer
* `# Background` omitted — the system has no ambient background

### Required Domain Components (Portfolio-Specific)

```
# Domain Components
  ## Project Detail
  ## About Layouts
```

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
* place responsive behavior (what changes at each breakpoint, viewport constraints, nav behavior thresholds) as isolated siblings to layout specs — it belongs under `Interaction Rules → Responsive Behavior`
