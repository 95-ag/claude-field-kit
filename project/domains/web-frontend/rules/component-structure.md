# Component Structure

How a component tree is organized and named, and how it maps to `docs/DESIGN.md` — so doc↔code navigation is
trivial and a component's home is predictable from what it is. Read before adding, moving, or renaming a
component. The component inventory and its doc mapping live in DESIGN.md → Components and DESIGN.md → Domain
Components — reference them, never duplicate here.

## Organization

Mirror the design spine's split (DESIGN.md → Components vs Domain Components): portable first, then
domain-bound. Each folder has one job.

**Portable components** — no page, route, or data-shape assumptions (DESIGN.md → Components):

- `icons/` — icon library; one icon per file.
- `ui/` — portable primitives (buttons, tags, headings, inputs, links). Reusable anywhere.
- `layout/` — structural and spacing primitives (container, grid, stack, section, divider).

**App frame:**

- `shell/` — site-wide chrome mounted in the root layout (navigation, footer, app-wide providers).
  Single instance, not page-bound; composes portable components.

**Background subsystem:**

- `background/` — a standalone, full-viewport ambient background subsystem, when the project has one.
  Not portable, not a feature, not chrome — its own top-level group. Omit when there is no ambient background.

**Domain components** — page-, route-, or data-bound compositions (DESIGN.md → Domain Components):

- `<feature>/` — named for the feature (e.g. `project/`, `about/`). May assume a page context, content
  schema, or editorial purpose.

**Document components** — blocks composed by authors in long-form content (DESIGN.md → Components → Document):

- `document/` — authored-content components (Callout, Figure, Diagram, Code, …) plus the renderer registry.
  Present **only** when the project renders authored content (MDX / rich text); omit otherwise.

Additional rules:

- Place a component in the lowest layer that accurately reflects its responsibility.
- Promote a component upward only once it is genuinely reused across multiple features.
- Organize by responsibility, never by visual size, file count, or implementation detail.

## Where does a new component go?

1. An icon? → `icons/`.
2. Portable (no page, route, or data assumptions)?
   - structural or spacing primitive → `layout/`
   - rendered inside authored content (MDX projects only) → `document/`
   - otherwise → `ui/`
3. Part of the app frame — mounted as a single instance in the root layout (navigation, footer,
   app-wide provider)? → `shell/`. The test is **mounted vs composed**: a layout-mounted singleton is
   shell even without a nav/footer role; a primitive the shell merely composes (e.g. a theme toggle)
   stays in `ui/` per step 2.
4. The ambient background (when the project has one)? → `background/`.
5. Bound to one page, route, or data shape? → a domain/feature folder named for it. If used by exactly
   one route, keep it inline until an extract trigger fires (see Inline vs extract).

## Dependencies

- Portable layers (`icons/`, `ui/`, `layout/`) never import domain/feature components.
- Domain components may depend on portable layers.
- Avoid circular dependencies.
- Move shared behavior downward into a portable layer only when the abstraction is genuinely reusable.

## Canonical mapping (code ↔ DESIGN.md)

The DESIGN.md section names are the standard; folder names are the project's to choose (keep them precise).

| Code folder | DESIGN.md section |
|---|---|
| `shell/` | Components → Shell |
| `ui/` | Components → UI |
| `document/` (authored-content) | Components → Document |
| `layout/` | Foundations → Layout |
| `icons/` | Foundations → Iconography |
| `background/` | Background (top-level) |
| `<feature>/` | Domain Components |

## Component sub-groups

Under DESIGN.md → Components, **UI** and **Document** are sub-grouped by role. This is the general
vocabulary; a system instantiates only the sub-groups it populates.

- **UI** — Controls/Actions · Links · Display · Inputs · Feedback/Status
- **Document** (authored-content blocks) — Annotations · Figures & Media · Diagrams & Charts · Code · Embeds

Boundary (format-agnostic): **UI** = primitives composed by engineers in application code; **Document** =
blocks composed by authors in long-form content (registered in the content renderer's registry). The
dividing line is the **authoring registry**, not the file format. A primitive re-exported for authoring
convenience keeps its canonical home (e.g. a layout primitive stays in `layout/`) — being reachable from
authored content doesn't make it a Document member. **Folder is the home.**

**Prose** — the base long-form text styling layer — is NOT a component; it's a Foundations concern
(DESIGN.md → Foundations → Prose), with no entry in the component folders.

## Foldering rule

A layer folder (`ui/`, `layout/`, `document/`, …) stays **flat** while small. When adding a component
would push a flat group past ~10 members, the SAME change splits that group into sub-folders matching the
sub-group vocabulary above (`ui/controls/`, `ui/display/`, …). Not optional — part of the addition; the
split axis is pre-defined, so it's mechanical. The threshold is tunable.

## Ownership

- A component has one canonical home.
- Do not duplicate nearly identical components across features.
- If ownership becomes unclear, move the shared behavior into the lowest layer that can legitimately own it.

## Server vs client

- Place the client boundary as small and as low in the tree as possible — a single client leaf should
  not force its ancestors into the client bundle.
- The framework rule for when a client boundary is required lives in nextjs.md → Rendering.

## Naming

- One canonical name per component: **DESIGN.md heading = `kebab-file` = `PascalExport`**.
- File names use kebab-case; component exports use PascalCase.
- Names state function — not shape, visual style, or generic role. No abbreviations.
- Avoid versioned names such as `V2`, `New`, `Final`, `Updated`, or `Temp`.
- One component per file where practical. A tight family may share a file under one parent name.
- Co-locate component-specific assets (styles, tests, stories) when present.

## Inline vs extract

Default to inline JSX in the page or parent. Extract only when a trigger fires:

- **Reuse** — used in 2+ places.
- **Own state/behavior** — has its own hooks or handlers.
- **Testability** — worth testing in isolation.
- **Unscannable parent** — the parent has grown hard to read; a named section restores clarity.

Do not extract for a 1:1 doc mapping. Single-use static sections stay inline, documented as page sections.

## Doc ↔ code bridge

- The shared name is the bridge: doc→code = grep the `PascalExport`; code→doc = search DESIGN.md.
- Tag each domain-component/page-section entry in DESIGN.md as **`[inline]`** (lives in a page) or
  **`[standalone]`** (has its own file).
- Folder ↔ DESIGN.md section mapping lives in the Canonical mapping table above.
