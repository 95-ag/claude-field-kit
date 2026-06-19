# Project Docs — Structure

The docs a project keeps under `.claude/docs/`. Each doc has a **single primary owner concern** — keep
content in its owner to minimize overlap.

**Mandatory: `PROJECT.md` + `IMPLEMENTATION-PLAN.md`.** `ARCHITECTURE`, `SCHEMA`, `DESIGN` are **optional** —
add one only when the project's domain, scope, or complexity warrants it; until then its content lives in
`PROJECT.md`. Never create a near-empty doc to "complete the set." (Write/maintain with the `spec-write` skill.)

Canonical names may vary — `PRODUCT.md` ≈ `PROJECT.md`; match whatever the project already uses.

## Documents

| File | Required? | Purpose | Owns | Out of scope / fold-rule |
|---|---|---|---|---|
| **PROJECT.md** | Mandatory | Define the project | Problem, goals, users, requirements, scope, constraints, success criteria, features, non-goals, high-level flows. **Absorbs** stack / schema / design notes while each is too small to warrant its own doc. | Detailed phases & tasks → IMPLEMENTATION-PLAN |
| **IMPLEMENTATION-PLAN.md** | Mandatory | Define execution | Phases, milestones, dependencies, task breakdown, acceptance criteria, rollout sequence | Requirements, architecture rationale, schemas, design |
| **ARCHITECTURE.md** | Optional | Define the system | Components, integrations, tech stack, deployment, external services, security, technical decisions, system boundaries | Requirements → PROJECT; entities → SCHEMA; UI → DESIGN. **Fold:** if the only content is the stack, keep it in PROJECT — don't create this file. |
| **SCHEMA.md** | Optional | Define the information structure | Entities, data/content structures, metadata, relationships, validation rules, API contracts, storage | Stack/deploy → ARCHITECTURE; goals → PROJECT. **Fold:** a small/simple schema or content model stays in PROJECT. |
| **DESIGN.md** | Optional | Define user experience | User journeys, screen/page structure, navigation, interaction patterns, visual design, component behavior, UX decisions. Small **design-scoped** technical conventions (z-index, layout shell, font smoothing, code highlighting) may live here. | Heavy/system-wide architecture → ARCHITECTURE; data/content schemas → SCHEMA; phases → IMPLEMENTATION-PLAN |

## Fold vs split
- Start every project with **PROJECT + IMPLEMENTATION-PLAN**.
- Promote a section to its own optional doc **only when it grows substantial** for the project's
  domain/complexity — a web app earns `DESIGN`, a data pipeline earns `SCHEMA`, a CLI may earn neither.
- Until a section earns its file, it lives in `PROJECT.md`. Don't create near-empty docs.

## Where common documents fit

| Traditional document | Destination |
|---|---|
| PRD | PROJECT.md |
| TRD (Technical Requirements) | ARCHITECTURE.md (or PROJECT if stack-only) |
| App Flow | PROJECT.md (high-level) or DESIGN.md (detailed UX flow) |
| Backend Schema / Database Design / Content Model / API Contracts | SCHEMA.md (or PROJECT if small) |
| UI/UX Brief | DESIGN.md |
| Implementation Roadmap | IMPLEMENTATION-PLAN.md |

## Mental model

| File | Question answered |
|---|---|
| PROJECT.md | What are we building, and why? |
| IMPLEMENTATION-PLAN.md | What gets built, and in what order? |
| ARCHITECTURE.md | How is the system structured? |
| SCHEMA.md | What information exists, and how is it organized? |
| DESIGN.md | How should users experience it? |

Single primary owner per doc → minimal overlap.

**Maintenance:** any change to an archetype or its scope must be propagated to the `spec-write` skill and
the design skills (`design-*`) — they depend on this structure.
