---
name: project-assets-generation
description: >
  From an approved portfolio MDX, derives the required asset list from content analysis
  (not from MDX slots), presents it for user approval, then generates each asset from
  a tracked source file using shared tooling, frames and crops per the framing and crop
  normalization principles, and places optimized exports in /public/projects/<slug>/ with
  editable sources retained in assets-source/. Always generates from source — never
  hand-edits production files directly.

  Use this skill after MDX is approved and the user says things like "generate the
  assets for <slug>", "make the diagrams for <slug>", "build the figures", "create
  the pipeline diagram", "generate the charts". Fire on any figure/diagram/chart
  request tied to a portfolio page even without the word "asset". Do NOT fire for
  hero cover generation (separate skill) or MDX content edits (separate skill).
---

# Project Assets Generation

Two-phase skill. **Phase A** derives the required asset list from content analysis and gets
user approval. **Phase B** generates the approved assets. Generation does not begin until
the list is approved.

## Before anything — read these references

1. **`references/asset-procedure.md`** — source-first priority, content analysis procedure,
   categorization decision table, framing principles, legacy crop craft. Read before
   touching any source material or generating any file.

2. **`references/asset-standards.md`** — format table, directory layout, naming convention,
   the shared SVG-theme build, matplotlib shared style usage, reproducibility rules,
   anti-patterns. Read before writing any source file or export command.

---

## Phase A — Derive required asset list (do not generate yet)

### Step 1 — Inventory source visuals

Extract and review every figure, chart, diagram, slide image, and screenshot from the
paper, report, defense slides, and any other source material — page by page. Build a
candidate inventory noting: source reference (page or slide number), what it shows, and
whether it is usable as-is (legacy crop), needs adaptation, or would need to be generated.

Note any assets already committed in `/public/projects/<slug>/` — these are not regenerated
unless the user asks.

**This inventory is one of the two inputs to the content analysis. Do not propose assets
before completing it.**

### Step 2 — MDX component refs (reference only)

Read the approved MDX. List every `<Diagram>`, `<Figure>`, and `<Stack>` component reference.
This list is a reference showing what was proposed at extraction time — it is **not** the
required asset list. Do not treat it as the starting set to prune from.

### Step 3 — Content analysis pass

**This step is mandatory. It cannot be skipped regardless of how obvious the asset set
appears.** Skipping it and treating the MDX slots as the required list is a process
violation — MDX slots are a reference from extraction time, not a validated asset plan.

Read the MDX content section by section. For each section, ask: *"does a visual genuinely
improve comprehension here beyond what the prose provides?"* Derive the required asset list
from this analysis — independent of the MDX slots.

See `references/asset-procedure.md` — Content Analysis Pass — for the full evaluation
procedure: prose-duplication check, source-availability check, 4-criteria scoring, and
how to record the decision per candidate.

The output of this step is a proposed asset table. Table format and column definitions
(including Score and Decision columns, and the requirement to include dropped candidates)
are in `references/asset-procedure.md` — Content Analysis Pass — Building the required
asset list.

**MDX slots are a reference, not a floor.** The required list may have fewer or more assets
than the MDX currently references. If the content analysis removes a slot, note it; if it
adds a visual not in the MDX, note it — the MDX will be updated after approval.

### ← Gate: present required asset list for user approval

Stop here. Present the proposed asset table with rationale. Do not generate, do not write
source files, do not update the MDX. Wait for explicit user approval before proceeding.

If the user modifies the list, revise the table and confirm before continuing.

---

## Phase B — Generate approved assets

Begin only after the asset list is approved.

### Step 3b — Sync MDX to approved list

If the approved asset list adds or removes slots relative to the current MDX component
refs, update the MDX now — before writing any source file. Generation must match the MDX
paths exactly (filenames drive `src=` references, alt text, and `aspect` props).

For every MDX component being added or updated, draft the `alt` text and caption at this
step — not after generation. Both must describe the actual content:

- **`alt`** — one sentence describing what the figure shows, written from the reader's
  perspective. Not the figure title; not "diagram of X." Decorative assets use `alt=""`.
- **Caption** — explains what the reader should take away. Multi-panel figures require a
  per-panel breakdown (see `references/asset-procedure.md` — Multi-panel captions).
  Naming the figure type alone ("training curves") is not a valid caption.

Drafting at this stage, before the asset exists, forces the description to be based on
what the asset is *supposed* to show. After generation, verify the draft against the
actual output and correct any mismatch before moving to the gate.

### Step 4 — Categorize

For each approved asset, assign a type using the decision table in
`references/asset-procedure.md` — Asset Categorization. Source-authoritative figures
(real paper/slide crops) take priority over reconstructed diagrams — see the
source-first priority rule in the same section.

| Type | When |
|---|---|
| Legacy crop | Adequate source figure exists in PDF/slides at portfolio width |
| Hand-SVG (shared theme) | Sequential pipelines, stage diagrams, architecture/state — no adequate source figure |
| matplotlib | Result with source numbers (metrics, curves, comparisons) — no adequate source figure |
| Composition | Annotated layouts, side-by-side panels |

Charts and diagrams must be generated from a source script. Crop and composition
rasters are the exception — the committed image in `/public` is the deliverable, and the
crop recipe need not be retained (it depends on `tmp/`, which is not in git).

### Step 5 — Audit source material (before generating)

Before writing or exporting anything, measure the content bounds of every asset you plan
to produce or crop. See the audit rule in `references/asset-procedure.md` — Figure
Composition and Framing. Know exactly what whitespace is present. It is easy to make
framing worse under the assumption you are making it better.

### Step 6 — Generate

**Hand-authored SVG diagrams (shared theme):**
1. Author the body in `assets-source/svg/<slug>/<name>.py` — supply `content_bbox`, `title`,
   `aria_label`, the node/edge `body`, and `out_rel` (production path
   `public/projects/<slug>/<name>.svg`); `import _theme` and call `_theme.build(...)`
2. Run: `.venv/bin/python3 assets-source/svg/<slug>/<name>.py` — writes the production SVG
   with the shared `DEFS` and a tight, padded viewBox
3. Never copy `DEFS` into a diagram; never hand-edit a production SVG — edit the source and re-run

**matplotlib charts:**
1. Write Python script to `assets-source/matplotlib/<slug>/<name>.py`
2. Apply shared style: `plt.style.use('assets-source/matplotlib/_portfolio.mplstyle')`
3. Note the run command explicitly so the user can reproduce

**Legacy PDF crops:**
- Verify the extracted image shows the expected content before writing alt text
- Use PIL/equivalent to measure content bounds; apply consistent padding (15–28px)
- See `references/asset-procedure.md` — Legacy Crop Craft — for resampling, axes-border
  detection, and title-retention rules

### Step 7 — Frame, place, and verify alt text + captions

Apply framing rules from `references/asset-procedure.md` — Figure Composition and Framing:
- Width hierarchy: technical diagrams default `width="narrow"`; result visuals earn full width
- Responsive framing: avoid baked-in margin (tight viewBox for SVG, tight crop for raster) plus a `max-w` cap, so content stays legible when scaled down on small screens
- Multi-subplot figures (or a left-to-right comparison strip that must stay together) display as one atomic composed figure — not split
- Independent figures (e.g. original vs heatmap, two examples) are separate images in a responsive `<DiagramRow>` (side-by-side desktop, stacked mobile) — not baked into one PNG
- Crop normalization: symmetric padding, unified y-bounds across subplots
- Three-figure comparison sets: `<DiagramRow layout="2+1">` with shared caption

Place exports:
- Production files → `/public/projects/<slug>/`
- Source files → `assets-source/{svg,matplotlib}/<slug>/`

After placing each asset, verify the alt text and caption drafted in Step 3b against the
actual generated output:
- Does the `alt` text accurately describe what the asset shows — not what it was supposed
  to show?
- Does the caption match the actual content and cover every panel for multi-panel figures?
- For legacy crops: does the extracted image match what you expected (see Legacy Crop Craft
  — verify content before writing alt text)? If not, correct both the crop and the text.

Fix any mismatch before moving to the next asset. Do not defer to the gate.

## Visual Review Gate — mandatory before presenting for approval

After Step 7, run this gate before handing assets to the user. **Any failed check is a hard
stop: fix the asset (regenerate, re-crop, re-frame, or drop it), then re-run the full gate
from the top.** Do not continue to the next check after a failure. Do not present assets
while any check is open.

- [ ] **Source correctness** — every asset shows the right content (right figure, right
  page/object). Fail: re-extract from source.
- [ ] **Browser render** — rendered page captured via playwright, light + dark. HTML
  inspection alone is insufficient. Fail: fix the MDX reference or asset path, re-render.
- [ ] **Readability at rendered size** — every figure is legible at the column width it
  actually renders at (~760px prose, or wide/narrow as set). Source resolution is
  irrelevant. Fail: re-crop, resize, or replace the asset.
- [ ] **Caption-to-figure alignment** — caption describes what is actually shown. Multi-panel
  figures have per-panel explanations; naming the figure type alone fails. Fail: rewrite the
  caption.
- [ ] **Visual hierarchy and density** — technical/process diagrams use `width="narrow"`;
  result/outcome visuals earn full width. No section is visually heavy while an adjacent
  one is bare. Fail: adjust `width` prop or rebalance placement.
- [ ] **Responsive behavior** — all figures legible and intact at 375px and at desktop width.
  Fail: fix the asset or MDX component props.
- [ ] **Reader comprehension** — a reviewer can immediately determine what the figure shows
  and what takeaway it supports, without effort. This check applies regardless of technical
  correctness. Fail: re-crop, re-caption, resize, or drop the asset.

**Failure at any check → fix the asset → restart the gate from check 1.**

All 7 checks must pass before presenting assets for approval.

## Output

Production assets committed to `/public/projects/<slug>/` with sources retained in
`assets-source/`. MDX updated to reflect the approved asset list. Run the Validation
checklist below, then present the asset set to the user for final approval.

Do not generate the hero cover or make further MDX content edits. Those are separate skills.

## Validation — check before handing off

- Every chart and diagram has a source script (`.py`) — crop/composition rasters ship from `/public` with no retained source
- SVG for all hand-authored diagrams and vector outputs; PNG/WebP for raster per the format table
- Filenames are descriptive and stable — not `chart.svg` or `diagram1.svg`
- Production assets are in `/public/projects/<slug>/`, not in `assets-source/`
- `next build` passes (no broken `/public` refs from the MDX)
