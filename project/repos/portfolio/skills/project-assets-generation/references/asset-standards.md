# Asset Standards

Format table, directory layout, naming, tooling commands, reproducibility rules,
and anti-patterns. Authoritative reference for the project-assets-generation skill.

---

## Format Table

| Asset type | Format | Notes |
|---|---|---|
| Hand-authored SVG diagrams (flow/pipeline/architecture/state) | SVG | Via the shared `_theme.py` build |
| matplotlib charts (source data available) | SVG preferred, PNG acceptable | Must be reproducible from script |
| Legacy PDF crops (no source data) | High-DPI PNG | Crop procedure; source not retained |
| Raster images / photos | WebP | Compress before committing |
| Assets requiring transparency | PNG | WebP if transparency + compression needed |
| tldraw → SVG | SVG | Fallback only — spatial/custom layouts the SVG theme cannot express; no automated path, hand-produce |

---

## Directory Layout

```
/assets-source/
  svg/
    _theme.py                ← shared SVG diagram theme + build() — never edit during a project run
    <slug>/
      <name>.py              ← per-diagram source (body + bbox + meta → build())
  matplotlib/
    _portfolio.mplstyle      ← shared matplotlib style — never edit during a project run
    _portfolio.py            ← shared palette helper — import, never copy
    <slug>/
      <name>.py              ← chart script
      <name>.csv             ← dataset if applicable

/public/projects/<slug>/
  <name>.svg                 ← production diagram export
  <name>.png / <name>.webp   ← production raster export
  hero-cover.webp            ← cover (separate skill)
```

Production assets are final exports only. Editable sources stay in `assets-source/`.

---

## Naming Convention

Production filenames must be:
- Descriptive and stable: `extraction-pipeline.svg`, not `diagram.svg` or `fig1.svg`
- Kebab-case
- No version suffixes (`-v2`, `-final`, `-new`)

Match the `src=` path in the MDX component exactly — filenames drive the MDX reference.

---

## Hand-authored SVG Tooling

Pipeline, architecture, flow, and state diagrams are hand-authored SVG generated from a
shared theme. The theme owns the visual system (node/edge classes, the light/dark
treatment, the arrowhead marker) and the viewBox framing.

**Shared module** (`assets-source/svg/_theme.py`): canonical `DEFS` (style block + `#arr`
marker, including a `@media (prefers-color-scheme: dark)` block), a `FRAME_PAD` constant,
and `build(out_rel, title, aria_label, content_bbox, body)` — writes the production SVG
with the shared `DEFS` and a tight viewBox computed from `content_bbox` + `FRAME_PAD`.

**Per-diagram source** (`assets-source/svg/<slug>/<name>.py`): defines the node/edge `body`
markup, the `content_bbox`, `title`, `aria_label`, and `out_rel` — the production path
relative to the repo root, `public/projects/<slug>/<name>.svg` — then calls `_theme.build(...)`.

**Generation command:**
```
.venv/bin/python3 assets-source/svg/<slug>/<name>.py
```

**Rules:**
- Never copy `DEFS` into a diagram and never hand-edit a production SVG — edit the source `.py` and re-run
- Node geometry is authored in the body; `build()` frames the viewBox tight to `content_bbox` + `FRAME_PAD`
- In the MDX `<Diagram>`, set `aspect` to the generated viewBox ratio and cap desktop with `max-w-[Npx]` for size parity (fluid below)
- The `@media` dark block lives in `DEFS`, so diagrams adapt to the page theme without a runtime filter

---

## matplotlib Tooling

**Script template:**
```python
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import _portfolio  # noqa: F401 — applies shared color palette

import matplotlib.pyplot as plt

plt.style.use(os.path.join(os.path.dirname(__file__), '../_portfolio.mplstyle'))

# ... chart code ...

plt.tight_layout()
plt.savefig('public/projects/<slug>/<name>.svg', bbox_inches='tight')
```

**Rules:**
- Always `import _portfolio` for color palette consistency
- Always `plt.style.use(_portfolio.mplstyle)` for visual consistency
- Use `bbox_inches='tight'` to minimize excess whitespace
- SVG output preferred; PNG acceptable when SVG renders poorly (complex rasters, photos)
- The script must be runnable standalone: `python assets-source/matplotlib/<slug>/<name>.py`
- Include inline comments explaining any non-obvious color or layout choice

**Shared style** (`assets-source/matplotlib/_portfolio.mplstyle`) applies:
- `figure.facecolor: f8f8f7` (matches site background)
- Accent color `006e37` for primary line/bar series
- Inter/system sans font, hairline strokes, transparent spines on top/right
- Grid lines on y-axis only, lightweight

---

## Reproducibility Rules

- Hand-SVG diagrams: reproducible via the per-diagram `.py` + shared `_theme.py` (`build()`)
- matplotlib charts: reproducible via `.py` script + `_portfolio.mplstyle` + `_portfolio.py`
- Crop / composition rasters: source is *not* retained — these scripts read `tmp/` (not in git), so the committed `/public` image is the deliverable, not a reproducible artifact
- Do not commit only the export for a chart or diagram — its `.py` source is always retained

---

## Optimization Checklist

Before committing any asset:
- [ ] File size optimized (no 2MB PNGs for simple charts)
- [ ] No duplicate exports or variant files
- [ ] Labels readable at mobile width (≥375px)
- [ ] Descriptive stable filename
- [ ] Source script retained in `assets-source/` — charts and diagrams only (crop rasters exempt)
- [ ] No embedded raster graphics inside SVGs where vector would work
- [ ] Aspect ratio in MDX `aspect` prop matches actual pixel dimensions
- [ ] **Resampling filter correct** — LANCZOS for charts/plots (smooth lines); NEAREST for
  pixel-level overlays (hard edges). Do not upscale small rasters past readability.
  For full legacy-crop guidance see `references/asset-procedure.md` — Legacy Crop Craft.

---

## Accessibility

Every asset must be usable without relying on color alone to convey meaning:

- **Contrast** — maintain sufficient contrast between data series, labels, and backgrounds.
  Charts must be legible on both the light and dark site theme.
- **Color-only meaning** — never use color as the only way to distinguish data categories.
  Add labels, patterns, or marker shapes so colorblind readers can differentiate series.
- **Label readability** — text labels must remain legible at mobile viewport widths (≥375px).
  If a label becomes unreadable at small sizes, simplify the diagram or increase font size.
- **Vector text** — prefer SVG text elements over rasterized text. Rasterized text blurs on
  high-DPI displays and is not accessible to screen readers in SVG.
- **Alt text** — every asset referenced in MDX via `<Diagram>`, `<Figure>`, or `<Stack>` must
  have a meaningful `alt` prop. Describe what the asset shows, not what it is called.
  Decorative assets use `alt=""`.

---

## Visual System Philosophy

Assets across all projects should feel visually cohesive — part of the same editorial system,
not a collection of independently styled one-offs.

**Shared conventions to maintain across every project:**
- Typography scale — use the shared matplotlib style and SVG theme; never override fonts locally
- Stroke widths — hairline strokes as defined in `_portfolio.mplstyle`; do not introduce heavier strokes
- Color palette — `_portfolio.py` accent and neutral colors; do not add project-specific accent colors
- Dark/light compatibility — assets must remain legible on both the light and dark site surface. There is no runtime dark-mode filter on figures: bake charts/rasters with a light background + dark text (they render as light cards on the dark page); only SVGs with an internal `@media (prefers-color-scheme: dark)` adapt
- Spacing and padding — consistent inner padding (`bbox_inches='tight'`; transparent SVG backgrounds)

Prefer systems (shared theme files, shared scripts) over one-off manual design work. A new project
should plug into the existing visual system, not create a new one.

---

## Anti-Patterns

- Screenshots instead of vector exports
- Inconsistent visual styles across diagrams for the same project
- Oversized PNG charts that should be SVG
- Unreadable labels at small sizes
- Manually edited production files (regenerate from source instead)
- Missing source script for a chart or diagram (export without a corresponding `.py`)
- Generic filenames (`chart.svg`, `diagram1.png`, `output.svg`)
- Copying `_portfolio.mplstyle`, `_portfolio.py`, or the SVG `_theme.py` `DEFS` into project-specific files
