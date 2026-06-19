# Doc Archetypes

The non-design spec docs this skill owns, each with its required structure, writing mode, ownership
boundary, and whether a project must have it. Use this to decide *what shape* a doc takes; use
`writing-contract.md` to decide *how it reads*. This reference is **self-contained** — it does not depend
on any repo-side doc.

DESIGN.md is deliberately absent — it is owned by `design-update` / `design-rewrite`, never by this skill.
Design-scoped technical conventions (z-index, layout shell, font smoothing, code highlighting) also belong
in DESIGN.md — never park them in ARCHITECTURE's technical decisions.

---

## The Set

| Archetype | Canonical file | Required? | Mode | Owns |
|---|---|---|---|---|
| Product | `PRODUCT.md` (or `PROJECT.md`) | mandatory | Tier-1 | what to build and why |
| Implementation plan | `IMPLEMENTATION-PLAN.md` | mandatory | procedural | how it gets built, in order |
| Architecture | `ARCHITECTURE.md` | optional | Tier-2 | how the system is structured |
| Schema | `SCHEMA.md` | optional | Tier-2 | the information structure (data + content) |
| Other prose docs | varies | optional | inherit nearest tier | one project-specific concern each |

- **Mandatory** in every project: a product doc and an implementation-plan doc. Canonical names may vary
  (`PRODUCT.md` vs `PROJECT.md`; `IMPLEMENTATION-PLAN.md` vs a build-flow file) — match whatever the
  project already uses; don't rename an existing file as a side effect of an edit.
- **Optional** docs (Architecture, Schema, other) appear only when the concern grows substantial. Until
  then their content folds into the product doc — stack-only architecture → product doc; a small/simple
  schema → product doc. Never create a near-empty doc to "complete the set"; split a section out once it
  earns its own file.
- Other prose docs (a glossary, an API guide, a migration guide) follow the same house style, taking the
  tier closest to their purpose.

---

## Ownership Boundaries

Each doc owns one lane. Content outside its lane is cross-referenced by named path, never restated. A fact
two docs both seem to want belongs to exactly one — decide the owner, cross-reference from the other. Two
copies that drift apart is the failure this prevents.

- **Product doc** — *what* and *why*: problem, goals, users, requirements, scope and **non-goals**,
  constraints, success criteria, features, and high-level user/system flows, with the reasoning behind
  non-obvious choices. **Not** how it looks (→ DESIGN.md), build order (→ implementation-plan), system
  internals (→ ARCHITECTURE), or field-level data/content structure (→ SCHEMA). While the optional docs are
  unwarranted, it also absorbs their content (small stack notes, a small schema).
- **Implementation-plan doc** — the build *order*: phases/steps, dependencies, task breakdown, milestones,
  rollout sequence, and a verification gate per phase. **Not** product rationale, architecture, or visual specs.
- **Architecture doc** — *how the system is built*: components and system boundaries, tech stack,
  integrations and external services, deployment, security, and technical decisions. **Not** product
  requirements (→ product), entity/field structure (→ SCHEMA), or UI (→ DESIGN).
- **Schema doc** — the *information structure*: entities and data structures, content/frontmatter
  structures, metadata, relationships, validation rules, API contracts, and storage/directory layout.
  **Not** why a field exists in product terms (→ product), the stack/deployment (→ ARCHITECTURE), or how
  content renders (→ DESIGN).

---

## Required Structure per Archetype

Starting skeletons for authoring mode, not rigid mandates — a project may add or drop sections. They exist
so a fresh doc starts in the right shape, and each skeleton covers everything that archetype owns.

### Product doc (Tier-1)
- **Header / ownership note** — what this doc owns; which docs win on visuals (DESIGN), system
  (ARCHITECTURE), and data/content (SCHEMA) when they disagree.
- **Overview / positioning** — the problem, what the product is, who it's for, the core intent. Prose
  allowed; this is where the *why* lives.
- **Goals & success criteria** — what success looks like; measurable where possible.
- **Requirements & scope** — what's in scope, key constraints, and explicit **non-goals**.
- **Features / surfaces** — one subsection per feature, page, or surface: behavior + reasoning for
  non-obvious decisions. Design specifics cross-reference DESIGN.md.
- **High-level flows** — primary user/system flows at a behavioral level (detailed UX flows → DESIGN).
- **Cross-cutting product rules** — constraints spanning surfaces (min supported width, accessibility
  intent, what the product deliberately does *not* do).

Voice: present-tense declarative, design-agnostic, reasoning kept for non-obvious decisions.

### Implementation-plan doc (procedural)
- **Implementation rules** — what to read first, what not to do (invent requirements, over-engineer), what
  to prioritize. Sets the frame before the phases.
- **Phases / ordered steps** — ordered, dependencies explicit; each with **Goals**, a **task breakdown**,
  and a **verification gate** (acceptance criteria to advance). Milestones called out where they exist.
- **Rollout sequence** — the order things ship / are enabled (when the project has one).
- **Gates summary** (optional) — a quick table of always-required checks.

Voice: procedural. Goals read Tier-1-clear; steps/gates read Tier-2-terse. Forward-looking tense is fine.

### Architecture doc (Tier-2)
- **Header / ownership note** — what this doc owns; cross-refs product (requirements), SCHEMA (entities),
  DESIGN (UI).
- **System overview & boundaries** — the components and how they fit; what's in vs out of the system.
- **Stack** — languages, frameworks, key libraries, tooling.
- **Integrations & external services** — APIs, third-party services, data sources, deployment targets.
- **Deployment** — how and where it runs and ships.
- **Security** — auth, secrets handling, trust boundaries.
- **Technical decisions** — non-obvious choices + brief rationale (a decision log).

Voice: Tier-2 terse; a technical decision may carry one or two lines of rationale.

### Schema doc (Tier-2)
- **Header / ownership note** — what this doc owns; that it wins over the product doc on data/content fields.
- **Entities & data structures** — per entity: a field table (name, type, required/optional, notes), plus
  relationships and metadata.
- **Content / frontmatter schema** — per content type: a field table + validation rules (build-fail vs build-warn).
- **Validation rules** — cross-field/structural rules not tied to a single table.
- **API contracts** (when the project has them) — request/response shapes, status/error conventions.
- **Storage / directory conventions** — where data and content live; naming; slug derivation.

Voice: terse, specific, affirmative prohibitions ("never add a `slug` field"). No reasoning padding.

---

## Cross-Reference Resolution

- Every cross-doc reference is a named path: `TARGET.md → Section → Subsection`.
- A path must resolve to a real heading in the target doc. When you author or edit, verify each path you
  write still points at an existing heading — headings move, paths must move with them.
- When a doc you're editing references a heading you're renaming, update the back-references in the same
  pass, and list each one in the diff summary.
