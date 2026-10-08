# Visualizer kit — shared contract

The three-layer contract every visualizer obeys, the pinned filenames, and what to do when a
semantic token is missing. **Each visualizer's own spec lives in its own file** so a section's build
loads only the one it renders with:

| Visualizer | File |
| --- | --- |
| SwatchGrid · BarScale | `visualizer-scales.md` |
| TypeScaleList | `visualizer-type.md` |
| DepthGrid · LayerStack | `visualizer-depth.md` |
| DurationScale · EasingCurves | `visualizer-motion.md` |
| ShapeRow · DeviceRuler · SpanTable | `visualizer-layout.md` |

The dogfooding gate every visualizer must pass is in `visualizer-dogfood.md`.

**Every visualizer is generic and data-driven, and that is the layer's defining constraint.** Each one
owns its type definitions and rendering structure and carries **zero baked project data** — the
per-project `sections/` modules declare the token arrays and pass them in as props. A visualizer that
knows a project's values is no longer a visualizer.

- **File:** `visualizer-kit/index.ts` — a barrel re-exporting all nine.
- **Files:** nine component files, one visualizer per file, names pinned in the index below.
- **These files are stack-agnostic pseudocode.** Stack-specific rendering detail — live `var()`
  resolution, JSX versus HTML SVG syntax, portal targets — belongs in `stack-adapters.md`, not here.
- **Treatment classes appear as `{PLACEHOLDERS}` in every per-visualizer spec** — P2 resolves them to the
  project's own classes. This applies to every `visualizer-*.md` file.

---

## The three layers (P1 · P2 · P3)

Every visualizer is specified in three SEPARATED layers. Keep them distinct — conflating them is what
makes a rebuild either reinvent structure (too little pinning) or hardcode this project's values (too
much pinning):

- **P1 — Template (universal).** The fixed structure the visualizer ALWAYS has, identical for every web
  project: DOM shape, dimensions, grid / responsive / count, and the info order (e.g. ColorCard =
  name → token → usage). This is what the visualizer *component* builds. It carries NO project values.
- **P2 — Visual alignment (dogfood, derived from DESIGN.md).** The visualizer adopts THIS project's own
  visual treatments, each resolved from the project's DESIGN.md — never hardcoded: card radius = the
  project's card radius, depth/elevation = the project's card depth, each text role → the semantically
  correct project type token, spacing/grid → the project's spacing rules. Project values appear only as
  worked *examples* ("Example: radius-none, because ProjectCard is 0px"); the instruction
  is always "resolve from DESIGN.md → §X".
- **P3 — Actual inputs (instance).** The real token data fed into the visualizer. This does NOT live
  here — visualizers carry zero baked data. It lives in the project's `sections/` modules and is
  catalogued in `section-spine.md` per section.

Each visualizer entry below separates P1 and P2; the universal **Dogfooding gate** at the end of this
file states the P2 principles that apply to every visualizer. P3 → `section-spine.md`.

> Migration in progress: per-visualizer P1/P2 labelling is being applied section-by-section. Entries not
> yet migrated still show the older mixed form.

---

## Visualizer index (pinned filenames)

```
visualizer-kit/
├── index.ts          ← barrel re-exports ALL 9 visualizers
├── swatch-grid.tsx   ← SwatchGrid (SwatchToken, SwatchGroup types)
├── type-scale.tsx    ← TypeScaleList (TypeToken type)
├── bar-scale.tsx     ← BarScale (BarItem type)
├── shape-row.tsx     ← ShapeRow (ShapeItem type)
├── depth-grid.tsx    ← DepthGrid (DepthLevel type)
├── motion-scale.tsx  ← DurationScale (DurationToken) + EasingCurves (EasingToken)
├── layer-stack.tsx   ← LayerStack (LayerItem type)
├── device-ruler.tsx  ← DeviceRuler (RulerStop type)
└── span-table.tsx    ← SpanTable (SpanZone type)
```

Names are law — never "similar" or renamed.

---

## Generic fallbacks (when a semantic token is missing)

P2 resolves each treatment from the project's DESIGN.md. A lean design system may not define every
semantic token a visualizer wants. When the intended token is missing, fall back to the closest basic —
**never invent a token, never hardcode a raw value.** Prefer the real token always; a fallback is the
lowest-fidelity option and may signal a design-system gap worth flagging (inform-only handoff).

Universal fallbacks (every project has these basics):

| Intended (missing) | Fallback |
|---|---|
| any specific **type** role (code/identifier, caption, eyebrow, emphasis…) | the **primary body** token — guaranteed to exist in every project |
| **accent / brand** color | the project's primary text color |
| **border / hairline** token | the project's default border/divider color; last resort `currentColor` at low opacity |
| **raised / elevated card** (lifted panel) | the project's card / elevated-surface treatment; else a border + the lightest available raised surface; else a border on the base surface |
| **sunken / deep well** (recessed inset) | the project's well / deep-surface treatment; else a border + the deepest available surface; else a border on the base surface |
| **radius** (card / control) | the project's default control radius, else `0` (sharp) |
| a **spacing** step | the nearest defined step |

**Raised vs sunken:** a surface element intends EITHER a raised/elevated card (lifted panel) OR a
sunken/deep well (recessed inset). Resolve the **intended** one from DESIGN.md first; only if the project
doesn't define it, fall back to whatever card/surface look IS available, then to the basic (border on the
base surface). Don't substitute a raised card where a well is intended (or vice-versa) unless nothing
else exists.

**Surface + border = one level.** Each elevation/depth level defines BOTH its surface fill AND its border
*together* — they are a pair, applied as a unit. A visualizer that adopts a raised or sunken treatment
adopts the **whole level** (surface + its paired border), NEVER a surface from one level with a border
from another. Radius is independent (adopted separately). The pairs are defined in DESIGN.md → Elevation;
align every "surface" + "border" placeholder to the same level.

The chain is always: intended token → closest semantic → basic. If a fallback is used, note it so the
gap surfaces to the user when the gallery is finished.

---

## Cross-references

- **Token data arrays** for the project's instances → `sections/` bucket modules
- **Stack-specific rendering** (inline-style syntax, SVG in JSX vs HTML, portal targets) → `stack-adapters.md`
- **Missing token → add a token** → invoke `design-write` (see `boundaries-and-handoff.md → fixer triad`)
- **Section composition** (which visualizer goes in which GallerySection) → `section-spine.md`
- **Prose-content scoping rule** (where `.prose-content` wraps are required and where they corrupt) → `hard-to-demo.md`
