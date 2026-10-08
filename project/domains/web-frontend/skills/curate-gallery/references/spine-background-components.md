# Spine — Background and Components

The Background section and the three Component sections (Shell, UI, Document). Shared contract and
cross-section pins → `section-spine.md`.

---

## Bucket 2: Background

### 11. Background

```
id:      "background"
title:   "Background"
mapsTo:  "Background"
source:  (omit)
```

**P1 — Composition + per-layer recipe:** the background subsystem can't render live inline (full-viewport,
fixed, already active around the page), so each layer is demoed **by its nature** — `Specimen`s at h3:
- a **static un-renderable layer** → `ThemeShot` (theme-paired static captures);
- an **animated layer** → `ThemeVideo` (theme-paired clip + poster + reduced-motion fallback);
- **orchestration-only components** (no visual of their own) → a prose list capturing their roles AND the
  subsystem's **conditional-rendering key points** (where each layer renders / is excluded);
- the subsystem's **own color tokens** (if it defines any) → the color-swatch visualizer inline in this
  section — tokens live with the section that owns them, not split into Colors.

Technique detail (`ThemeShot` / `ThemeVideo`, static-capture-for-un-renderable) → `scaffold-chrome-theme.md` +
`hard-to-demo.md`.

**Capture framing:** frame each capture to show that layer's design best — full-viewport where the
composition is the point, a focused crop where the texture/detail is (glyph density, particle color/motion).

**P2 — Visual alignment:** `ThemeShot` / `ThemeVideo` frame = the project's **media-surface** treatment
(border + media radius); only the active theme's capture shows. The orchestration prose follows the prose
layer.

**P3 — Actual inputs:** the background layers/components the project defines (DESIGN.md → Background), each
mapped to its demo by nature. Sample captures / clips / posters are **dev-only, theme-paired**, sourced via
the asset pipeline. *(Example specimens, in order:* `AsciiField` (id `ascii-field`) → `ThemeShot`
(light+dark PNG) · `MeteorShower` (id `meteor-shower`) → `ThemeVideo` (light+dark mp4 + posters) ·
`particle color tokens` (id `background-particle-tokens`) → `SwatchGrid` (meteor RGB via `swatchValue`) ·
`BackgroundLayer · SurfaceContext` (id `background-orchestration`) → prose: roles + the key conditional
points — meteor excluded on reading/project routes, below the mobile breakpoint, under reduced-motion, and
on low-CPU/touch devices; ASCII masked to the gutters on desktop, sparser full-bleed on mobile, omitted on
project-detail pages.*)

---

## Bucket 3: Components

Components sections follow the Shell → UI → Document sub-taxonomy from
`rules/web-frontend/component-structure.md`. Each
maps to one `GallerySection`. Sub-groups within UI and Document become `SpecimenGroup` h3 eyebrows; their
specimens render at h4. Shell and flat Foundations sections render specimens at h3 with no sub-group layer.

### 12. Shell

```
id:      "shell"
title:   "Components · Shell"
mapsTo:  "Components → Shell"
source:  (omit)
```

**P1 — Composition + recipe:** one live `Specimen` per shell component (h3, no `SpecimenGroup`). Shell =
site-wide chrome (fixed / page-coupled), already live around the page — so each renders inside a
`ChromeFrame` (bounded containing block via `transform`, trapping `position:fixed` children) with
`ariaHidden` (the live landmark already exists; avoid AT duplicates). Recipe by component nature:
- **Floating / fixed bar** → `ChromeFrame height={…} ariaHidden`; add `InertDemo` only if it has buttons.
- **Auto-height flow chrome** (e.g. a footer) → `ChromeFrame ariaHidden` with NO `height` (sizes to content).
- **Scroll-gated element** → `ChromeFrame` + a **demo-affordance** prop (e.g. `forceVisible`) so it
  renders unconditionally; `InertDemo` for the button. `ariaHidden` only if it duplicates a live landmark
  at that position.
- **Slide-out panel** → `ChromeFrame` with the panel positioned + a scrim div; `InertDemo`. Often needs a
  **presentational sub-component** extracted from the trigger (a production carve-out).
- **Fixed section-nav / TOC rail** → `ChromeFrame` + a **demo-affordance prop** feeding a posed list (live
  scroll-tracking needs a scrolling page; a long sample list so the rail caps + scrolls). Such a rail **can
  be a *domain* component** (its home is per DESIGN.md → it may render in a Domain section, not Shell) — the
  demo technique is the same.

ChromeFrame pseudocode → `scaffold-chrome-theme.md`; click-guard pseudocode → `scaffold-guards.md`; the demo-affordance / presentational-extraction
carve-out → `boundaries-and-handoff.md` + `hard-to-demo.md`.

**P2 — Visual alignment:** shell components are real and bring their own styling; `ChromeFrame` is a
neutral bounded frame (its border/surface from the project's tokens, frame height a gallery constant). No
further token resolution.

**P3 — Actual inputs:** the shell components the project defines — read each component's home from
DESIGN.md → Components → Shell (root-layout singletons), confirmed against the component-structure rule
(see Cross-section pins → Component home). Each → a `Specimen` in a `ChromeFrame` with the height + guard
appropriate to its nature.
*(Example, in order:* `PillNav` (`shell-nav`, `height 120`, no InertDemo) · `MobileNav`
(`shell-mobile-nav`, `height 420 ariaHidden`, scrim + positioned `MobileNavPanel`, InertDemo) · `Footer`
(`shell-footer`, no height) · `ScrollToTop` (`shell-scroll-to-top`, `height 160`, `forceVisible`,
InertDemo, no ariaHidden).*)

**Component home:** Shell = root-layout singletons only. A fixed-chrome-LOOKING component may belong to a
Domain feature instead — resolve from DESIGN.md (Cross-section pins → Component home).

---

### 13. UI

```
id:      "ui"
title:   "Components · UI"
mapsTo:  "Components → UI"
source:  (omit)
```

UI is the **richest** component category — its recipe is a general menu; a project instantiates only the
kinds it has, so this section carries more general rules than any other.

**P1 — Composition + recipe (the general menu):** `SpecimenGroup`s by the project's UI sub-taxonomy (read
from DESIGN.md → Components → UI), Specimens at **h4**, components rendered **live directly** (no
ChromeFrame — UI is portable, not fixed chrome). Recipe by component KIND:
- **Multi-variant control** (Button, segmented) → all variants in a grid — **2-up when the sample fits the
  cell, else one per row**; each cell = the live control + a `name · token · usage` caption (the icon-sizes
  pattern). Sample text stays **simple + self-documenting** (e.g. "Primary", "Email me") — short, not a
  sentence.
- **Inputs** (text field, select, checkbox, radio, toggle) → render **live** (typing/toggling is harmless
  local state) with a **visible label**; show key states as variants where they differ (default · focus ·
  filled · disabled · error).
- **Form** → the composed form, fields live; the **submit** is inert.
- **Links** → live under the page anchor guard (`DemoViewOnly`); no per-item guard.
- **Display** (Heading, Tag, Badge, avatar) → a component with a **bounded `type`/variant set** (e.g.
  Heading's type levels) shows **all** of them; a purely illustrative component (e.g. Tag chips) shows a
  few representative instances with **descriptive** sample text (self-documenting; realistic, not lorem).
  **Semantic-level trap:** when a variant prop ALSO sets real DOM semantics (a `Heading`'s `level` emits a
  real `h1`–`h6`), vary only the **visual** variant (its `type`) and keep the semantic level fixed at the
  specimen's leaf heading depth — never let demo instances inject out-of-order headings into the page outline.
- **Feedback / Status** (alert, badge, toast, progress) → live static instances across the variants
  (info / success / warn / error).
- A component with **multiple visual variants** (e.g. theme selector's Pill + Inline) → show **all**
  variants, same grid + `name · token · usage` caption as a multi-variant control.

**Basic usage info (every specimen):** each component `Specimen` carries a one-line **usage description**
(what it's for / where it's used) via the Specimen `description`. *(General to ALL component + domain
specimens, not UI-only.)*

**Interaction states:** interactive components demonstrate their **states** (DESIGN.md → Interaction
Rules) — hover / focus stay **live**; disabled / selected / loading / error shown as **explicit variants**
where supported.

**InertDemo boundary (NOT all items):** guard with `InertDemo` ONLY interactions that **change app state,
navigate, or submit** (theme toggle, form submit, mutating buttons). Keep **live** the harmless ones —
copy-to-clipboard, hover, focus, typing into a local-state input. Anchor navigation is caught by the
page-level `DemoViewOnly`. Full rule → `scaffold-guards.md` → click-guards.

**P2 — Visual alignment:** components are real (own styling); variant-grid layout + labels use project
spacing + code/caption tokens; input labels use the project's form/label token; Specimen names use the
project's heading treatment (Full-page header rule). No token resolution beyond layout.

**P3 — Actual inputs:** the UI components + their **sub-groups, read from DESIGN.md → Components → UI**
(the sub-taxonomy is a general vocabulary — Controls/Actions · Inputs · Links · Display · Feedback/Status
— populate the subset the project has). *(Example, 3 sub-groups:*
- **Controls / Actions** — `Button` (id `ui-button`; 4 variants primary/secondary/primary+icon/as-link,
  2-up, `InertDemo`) · `ThemeSelector` (id `ui-theme-selector`; both variants Pill + Inline side-by-side,
  `InertDemo`; the live Inline instance is the page header's — this is the framed copy).
- **Links** — `LinkPill` (id `ui-link-pill`; 2 instances ext/int, no guard) · `CopyLink` (id
  `ui-copy-link`; live copy, no guard).
- **Display** — `Heading` (id `ui-heading`; all `type` levels) · `Tag` (id `ui-tag`; a few sample chips) ·
  `CopyableCode` (id `ui-copyable-code`; live copy, no guard).
*This example has no Inputs/Forms/Feedback — those general-only sub-groups are omitted.)*

`ThemeSelector` is in Controls/Actions (an interactive control), not Display.

---

### 14. Document

```
id:      "document"
title:   "Components · Document"
mapsTo:  "Components → Document"
source:  (omit)
```

Document is a **rich** component category like UI — its recipe is a general menu; a project populates the
sub-groups it has.

**P1 — Composition + recipe (the general menu):** `SpecimenGroup`s by the project's Document sub-taxonomy
(read from DESIGN.md → Components → Document), Specimens at **h4**, rendered **live directly, no Card** —
each Document component is its **own visual container** (a callout has its own border/fill; a figure its
own frame). Recipe by component KIND:
- **Annotations** (Callout, Highlight, aside) → render directly with self-documenting sample content.
- **Figures & Media** (Figure, image, video embed) → a **sample asset** (representative — see below).
- **Diagrams & Charts** (Diagram, DiagramRow, chart) → a **sample asset** (flow / graph-like).
- **Code** (CodeBlock) → **if DESIGN.md requires build-time / real-pipeline highlighting**, demo through
  the real MDX + highlighter pipeline; otherwise a simpler live render is fine (conditional — not always).
- **Embeds** (general-only: video, iframe, tweet) → a representative placeholder/sample.

**Sample assets** (figures, diagrams, media): source via the project's **asset system if it has one**
(announce when generating), else a **simple borderless SVG** in DESIGN.md colors/type, **representative of
the content kind** (figure = image, diagram = flow, chart = graph). Full rule → `hard-to-demo.md` → Sample
assets.

**Basic usage info (every specimen):** each `Specimen` carries a one-line usage `description` (general to
all component/domain specimens).

**Membership** is per DESIGN.md → Components → Document headers (resolve from the doc, don't infer). A
primitive merely reachable from the author registry (e.g. a re-exported Layout primitive) is NOT a Document
member — its folder/doc home wins.

**CodeBlock real-pipeline detail (when required):** render a real fenced block (`SAMPLE_CODE_MDX`) through
the project's MDX + build-time highlighter inside a `.prose-content` wrapper. *Example: Shiki
dual-theme `vitesse-light`/`vitesse-dark`, `defaultColor: false` (CSS vars only, so the dark override
works via cascade), scoped to `.prose-content` (without the wrapper the colors don't map).* Full technique
→ `hard-to-demo.md` → demo through the real pipeline + `.prose-content` scope caveat.

**P2 — Visual alignment:** components are real (own styling); sample assets dev-only / representative;
CodeBlock colors come from the project's highlighter theme (scoped per its requirement). No token
resolution beyond layout.

**P3 — Actual inputs:** the Document components + sub-groups, read from DESIGN.md → Components → Document.
*(Example: **Annotations** — `Callout` (id `mdx-callout`) · `Highlight` (id `mdx-highlight`); **Figures &
Media** — `Figure` (id `mdx-figure`, sample `figure.svg`); **Diagrams & Charts** — `Diagram` (id
`mdx-diagram`, sample `diagram.svg`) · `DiagramRow·DiagramPanel` (id `mdx-diagram-row`, samples
`panel-a/b.svg`); **Code** — `CodeBlock` (id `mdx-code-block`, real Shiki pipeline — DESIGN.md requires
build-time highlighting). No Embeds.)*

---

