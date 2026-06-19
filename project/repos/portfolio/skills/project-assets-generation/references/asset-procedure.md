# Asset Procedure

Step-by-step operating guide for categorizing, generating, framing, and placing
portfolio assets. Authoritative reference for the project-assets-generation skill.

---

## Content Analysis Pass

This is how the required asset list is derived from content — not from MDX slots.

### Inputs

- **Source visual inventory** — the candidate list built from paper/report/slides (page by page)
- **MDX content** — the approved MDX read section by section (component refs noted as reference only)

### Per-section evaluation

For each MDX section (H2 and its body), work through these questions in order:

1. **Does a visual add something the prose cannot?**
   Check the prose 3–5 lines around any candidate placement. If the prose already covers
   the same information — same structure, same takeaway — the visual is decorative. Do not
   include it. Only include visuals where the reader gets something the text does not give them.

2. **Does an adequate source figure exist?**
   Scan the source inventory. Does any candidate figure from the paper, slides, or defense
   cover this content clearly at ~760px portfolio width? If yes, use it (legacy crop).
   If no adequate source figure exists and a visual is still warranted, generate one.

3. **Score the candidate on 4 criteria:**
   - *Recruiter/scanning value* — does a non-technical reader understand domain, approach,
     or outcome faster with this visual?
   - *Technical/deep-read value* — does a technical reader get information the prose does not?
   - *Rendered legibility* — is the image readable at ~760px? Is the aspect ratio workable?
   - *Uniqueness* — does this visual show something no other element on the page conveys?

   Drop any candidate that scores low on all four. A visual earns its place on uniqueness
   plus at least one other criterion.

### Building the required asset list

After evaluating every section, produce a table with one row per evaluated candidate —
including dropped ones:

| Section | Proposed visual | Source (page/slide or "generate") | Type | Score | Decision |
|---|---|---|---|---|---|

- **Score** — which of the 4 criteria apply: recruiter value / technical value / legibility /
  uniqueness. List the ones that are satisfied.
- **Decision** — `Keep` with a one-line rationale, or `Drop` with the reason (prose covers it /
  scores low on all criteria / illegible at rendered width / etc.).

Including dropped candidates makes the reasoning auditable. A table that only lists kept
assets cannot be reviewed for whether the pass was done correctly.

This table is presented to the user for approval. No source files are written, no generation
starts, and no MDX is modified until the user has approved the list (or revised it).

If the approved list differs from the MDX component refs (slots added, slots removed),
update the MDX after approval — before generation begins.

---

## Asset Categorization

Before generating any asset, categorize every visual in the approved asset list:

| Type | When to use | Output format |
|---|---|---|
| Hand-SVG (shared theme) | Sequential pipelines, stage diagrams, selection processes, architecture/state diagrams | SVG |
| matplotlib | Any result that has source numbers (metrics, comparisons, curves, heatmaps) | SVG preferred, PNG acceptable |
| Legacy crop | Figure exists in PDF but no raw data available for regeneration | High-DPI PNG crop |
| Composition | Annotated layouts, side-by-side image comparisons, raster panels | PNG |

**Source-authoritative figures beat reconstructed diagrams.** Before assigning a type, check
whether the source material (paper, thesis, defense slides) already contains a figure covering
the same content. A direct PDF crop is more accurate than a hand-SVG/matplotlib reconstruction,
avoids dimension/label errors, and cannot drift from the reference project's visual style.
Assign a "Legacy crop" type and use the source figure. Generate from scratch only when no
adequate source figure exists for the content you need to convey.

**Candidate evaluation** — score each visual using the four criteria and drop rule defined
in Content Analysis Pass — Per-section evaluation above. Drop rule: uniqueness plus at least
one other criterion; otherwise drop.

**Drop visuals that duplicate nearby prose.** Check each placement against the prose 3–5 lines
above and below. If the prose covers the same information, the visual is decorative — not
communicative. Drop it.

**Do not generate an asset without a source file.** The only exception is legacy PDF crops —
document the crop procedure explicitly (tool, coordinates, padding applied) in a comment or
notes file alongside the production asset.

**Shared tooling — invoke, never duplicate:**
- SVG diagram theme: `assets-source/svg/_theme.py` (`DEFS` + `build()`)
- matplotlib style: `assets-source/matplotlib/_portfolio.mplstyle`
- matplotlib palette helper: `assets-source/matplotlib/_portfolio.py`

These files are shared across all projects. Never copy their content into a project script.
Never modify them during a project asset pass.

---

## Figure Composition and Framing

Apply these principles before generating or cropping any figure.

> After all assets are generated and placed, the **Visual Review Gate** in `SKILL.md` must
> pass before handoff. Gate checks 3 (readability at rendered size), 5 (visual hierarchy
> and density), 6 (responsive behavior), and 7 (reader comprehension) are enforced by the
> framing and composition principles in this section.

### Audit before generating

Measure the content bounds of every existing asset before deciding to regenerate.
Use PIL or equivalent to detect non-white pixel extents. Know exactly what whitespace
is present and whether it is symmetric, intentional, or a matplotlib margin artifact.

Do not re-export or regenerate without this baseline. It is easy to make framing worse
under the assumption you are making it better. Audit first; only then decide whether
to regenerate.

For assets being generated for the first time, sketch the expected composition before
writing the source file: expected aspect ratio, content density, label count. A hand-SVG
diagram or matplotlib figure that cannot render legibly at ~760px column width should be
redesigned before any source file is written — not after.

**Judge every figure at its actual rendered column width** — approximately 760px for the
prose column, or whatever `width` prop is set in the MDX component. A figure legible at
1600px source resolution may be illegible at 760px. Source resolution is irrelevant; only
rendered readability matters. This applies to all figures, including legacy crops.

### Responsive framing for scale

Baked-in margin wastes container width and shrinks the *content* on small screens — an
image scales as a whole, so empty space scales with it. Keep framing tight to content, then
cap desktop size:

- **SVG** — `build()` already frames the viewBox tight to `content_bbox` + `FRAME_PAD`; do
  not author large empty margins into the body.
- **Raster** — crop the source tight to its content (see Crop normalization); leave no
  whitespace padding around the subject.
- **All figures** — set `aspect` to the real ratio and cap desktop with `max-w-[Npx]` in the
  MDX component. It holds at the cap on wide screens (centred within padding) and goes fluid
  on narrower columns, so content stays as large as possible at every width. To match a prior
  size after tightening: `max-w ≈ newViewBox/oldViewBox × column width` (measure the column —
  the diagram column is wider than the prose column).

### Treat multi-subplot figures as single figures

If a matplotlib figure was designed with multiple subplots (e.g., CIFAR-10 / CIFAR-100
side by side, (a)/(b) comparison panels), display it as one composed figure — not split
into separate panels.

Splitting forces you to fight asymmetric y-axis margins, unequal content heights, and
differing internal padding. The original composition already encodes subplot semantics
and labels. Respect it.

Split-panel display is appropriate only for figures that were independently composed and
need side-by-side presentation for a specific comparison reason. It is not a default
layout tool for anything wide.

Conversely, do not bake *independent* figures (e.g. an original image and its heatmap, or
two separate examples) into a single static raster — that is PDF thinking and cannot adapt
to the viewport. Place them as separate images in a responsive `<DiagramRow>` (side-by-side
on desktop, stacked on mobile). The single-figure rule applies only to a genuinely atomic
unit — a multi-subplot figure or a left-to-right comparison strip that must stay together.

### Width hierarchy — full width is the exception

Establish a width hierarchy before placing any figure. Default is constrained/centered.
Full-width is reserved for the most complex, information-dense assets where the detail
requires the horizontal span.

Apply `max-w-[Npx]` based on figure density:
- Simple bar charts, small heatmaps, narrow ROC curves → `max-w-[420–520px]`
- Medium complexity diagrams → `max-w-[560–700px]`
- Complex multi-node pipeline diagrams with dense labeling → full prose width

The rule: denser figures can be wider. Simple figures should not span full width.

**Technical diagrams default to inset sizing.** Architecture, workflow, and process diagrams
use `width="narrow"` unless readability genuinely requires more. Full-width treatment is
*earned* by outcome and result visuals (full reconstructions, comparison figures, dense
multi-series charts). This enforces hierarchy: supporting evidence reads small, conclusions
read large.

### Technical inset vs editorial visual

Small raster crops (example images, training screenshots) are technical insets — not
editorial visuals. Do not stretch them into hero-like panels. Keep them compact and
proportionate; the informational density does not warrant large presentation.

Matplotlib charts on white backgrounds read as embedded research figures. This is
acceptable. The white background is part of the figure's content. It does not need to
be eliminated — only the excess outer margins need cropping.

### Crop normalization

When cropping figures for publication:
- Always start from content bounds (measured, not estimated)
- Apply consistent padding on all sides: typically 15–28px depending on figure type
- For multi-subplot figures: use unified y-bounds across both halves so both subplots
  share the same top/bottom crop
- Symmetric padding is the goal; when the source prevents symmetry (e.g., y-axis labels
  on one side only), prefer a single-figure crop over splitting
- Verify the final crop at 100% zoom before committing — aspect ratios in the MDX
  `aspect` prop must match actual pixel dimensions
- `<Figure>` uses `object-cover` and defaults to `aspect="16/9"` — it clips the sides of a
  wider image unless `aspect` matches the real ratio. Set `aspect` to actual dimensions, or
  use `<Diagram>`/`<DiagramPanel>` (`object-contain`) for compositions that must never crop

### Multi-panel captions

Any figure with a/b/c/d, left/right, or grid sub-images must have a caption that explains
each panel individually. Readers should not need to refer to the source paper to understand
what each panel represents. A caption that only names the figure type ("training curves")
without explaining what the reader should learn from each panel is insufficient. Captions
reduce interpretation effort — they do not restate the figure title.

### Diagram system consistency

All diagrams come from the shared SVG theme (`assets-source/svg/_theme.py`), so node
dimensions, CSS class vocabulary, the dark-mode media query, marker definitions, and
arrowhead style are inherited automatically — never fork them per project. Author the
node/edge `body`, the `content_bbox`, and the diagram's `title` / `aria_label` / `out_rel`;
`build()` supplies the shared `DEFS` and the framing.

`build()` frames the viewBox tight to `content_bbox` + `FRAME_PAD`, so proportions are
driven by the authored geometry, not a layout engine. Keep node sizes and the row grid
consistent with the existing diagrams (compare against `model-extraction-attacks` as the
reference) so a new diagram reads as part of the same set.

### Figure numbering

Only number figures if the prose cites them by number ("see Figure 1"). Decorative
numbering — numbers in captions that are never referenced from the body text — adds
visual noise without navigation value. Use descriptive captions instead.

### Component abstractions

Fix composition and framing first. Add layout abstractions (e.g., DiagramRow/DiagramPanel)
only after the underlying figure is correctly framed as a standalone. If the figure
requires a wrapper to look acceptable, the crop is wrong. Wrappers cannot correct
asymmetric margins, mismatched heights, or wrong scale choices.

---

## Legacy Crop Craft

Detailed guidance for cropping figures directly from PDF source material.

**Verify content before writing alt text.** PDF image extraction (pypdf, pdfplumber) may
yield raw model inputs — small rasters used as network inputs — rather than annotated output
visualizations. Confirm what an extracted image actually shows before writing alt text or
building any composition around it.

**Resampling filter by source type:**
- Charts, plots, line figures → `Image.LANCZOS` for downscaling (smooth lines)
- Pixel-level overlays, rasterized predictions → `Image.NEAREST` (preserves hard edges)
- Avoid heavy upscaling of small rasters (e.g., 224×224 → 672×672): the result is blocky
  and illegible at portfolio widths regardless of resampling method. If the source is too
  small to read at portfolio scale, replace it with a different visual.

**Matplotlib PDF crops — detect the axes border correctly.** The first non-white row after
a ≥40-row completely blank gap marks the true axes border. Do not use "first row with ≥50
non-white pixels" — that may land 20–30 rows below the border edge, cutting off the frame.

**Title-retention heuristic.** Drop a matplotlib title only when it is *both* redundant
(caption already names the configuration) *and* it materially harms composition (e.g., the
title creates a large blank gap between itself and the axes that is visible at rendering
size). If only one condition is true, keep the title. A figure with a clean readable title
is better than one with asymmetric whitespace from an awkward crop.

**Corrupted source invalidates downstream work.** If an extracted file came from the wrong
page, the wrong image object, or a failed extraction pipeline, all crops derived from it
must be discarded. Re-extract from the original PDF — do not patch corrupted assets.

**Add panel labels via the component, not the image.** When a cropped panel needs a label
(e.g. "Original" / "Grad-CAM"), render it with `<DiagramPanel label=...>` (a sub-figure
`figcaption`). Do not re-wrap the crop in matplotlib to bake a title — that injects
figure-margin padding around the image.

---

## Three-Figure Comparison Layout

When three related figures are intended to be compared as a set (training curves, ablations,
model variants, dataset samples), use this layout:

**Component:** `<DiagramRow layout="2+1">` with three `<DiagramPanel>` children
(`src/components/mdx/diagram-row.tsx`).

- Desktop: first two panels side-by-side; third panel centered below at half the row width.
- Mobile: all three stack vertically.

**Shared caption on `DiagramRow` (not on individual panels) must:**
- name what differs across the three figures (the variable being compared)
- tell the reader what to look for in the comparison
- call out the key takeaway visible from the three figures together

Do not put individual captions on the panels — a single row-level caption enforces that the
reader treats them as a comparison set, not three independent figures.
