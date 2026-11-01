# Extraction Procedure

Step-by-step operating guide for converting a research project into portfolio MDX.

---

## Step 1 — Source Intake

Which source wins a conflict → `evidence-and-modes.md` → Source-of-Truth Hierarchy.
Mode names below match SKILL.md → Source mode quick-reference; an untagged line applies
in every mode.

### Do first (before writing anything)

- Read every available source end-to-end before writing anything
- Inventory the metric sources — the only places a number on the page may come from —
  and tag each claim (`evidence-and-modes.md` → Confidence Tagging)
- Inventory the figures — they determine which assets can be regenerated vs. must be
  cropped or captured
- `[report+repo]` `[report-only]` Dump the PDF text; its tables are the metric sources,
  its figures the figure inventory
- `[report+repo]` `[repo-only]` `[mixed-evidence]` Scan the repo: README, training and
  eval scripts, config files, dataset names, framework versions (imports + requirements)
- `[repo-only]` `[report-only]` `[mixed-evidence]` `[prior-draft-only]` Apply the mode's
  constraints (`evidence-and-modes.md` → Source Modes) — they decide where a metric may
  come from
- `[mixed-evidence]` Run the metric-source inventory per subsystem — evidence varies by
  subsystem, not by page
- `[prior-draft-only]`, or any mode with a prior draft: build a numeric-claim correction
  log (how a prior draft is used → Core rule: discard existing body, start fresh)

### Human clarification is typically needed for

- GitHub URL and logo / brand asset permissions (`frontmatter-rules.md` → Optional
  frontmatter fields)
- Co-author inclusion (skip by default unless the user asks to surface them)
- Title framing (paper title vs. recruiter-readable phrasing)
- Metric framing when multiple defensible headlines exist

Ask these questions upfront, all at once. Do not interrupt the writing phase with
mid-draft clarification requests.

---

## Step 2 — Narrative Direction Proposal (gate: user approval required)

Before writing any prose or frontmatter, surface the narrative direction and wait for
explicit user approval. Do not proceed to Step 3 until approved.

Write a brief — 5–10 lines, readable in under 60 seconds:

1. **Project differentiator** — one sentence on what makes this project credible and
   memorable (by project type → `narrative-structure.md` → Identify the project
   differentiator before writing).

2. **Narrative arc** — the through-line the body will follow, named explicitly (arc
   shapes by project type → the same section of `narrative-structure.md`).

3. **H2 section plan** — the chosen spine, which sections to include and omit, and
   why any non-obvious inclusion or exclusion was chosen.

4. **Framing decisions** — choices that affect how results are presented: what to
   foreground vs. treat as background; how to scope "built from scratch" vs. adapted
   vs. reused; whether the result frame is positive, negative, or mixed.

This is a check-in, not a spec. Keep it brief. Wait for approval, then proceed.

---

## Step 3 — MDX Content Build

### Core rule: discard existing body, start fresh

The old MDX body is reference material, not a transformation input. Prior drafts
accumulate errors, academic phrasing, and structural drift. Rebuilding fresh against
the source is faster and more reliable than editing.

Keep only: the file path, and any frontmatter fields that are already confirmed correct.

### Write frontmatter first

Before writing any body prose, complete the full frontmatter so `next build` passes —
a build failure on frontmatter wastes body writing time. Verify every field against
`frontmatter-rules.md` before proceeding to the body. Two fields are staged:

- hero fields — omit; the cover stage owns them (`frontmatter-rules.md` → Hero fields)
- `overview` — two passes (`frontmatter-rules.md` → overview)

### Write the body on the H2 spine

Pick the spine before writing — ML / research or applied-systems — and write each
section to its guidance. Both spines, the choice criterion, section order, heading and
H4 limits, per-section guidance, and the standalone-readability requirement live in
`narrative-structure.md`. Verify the body against that guidance before finalizing.

### Write overview last

Write the final `overview.*` here. Write order → `frontmatter-rules.md` → overview;
density targets → `narrative-structure.md` → Executive Overview vs. Deep Technical Dive.

---

## Step 4 — Density Reduction

Run this pass before Reader Review. The reviewer should evaluate the version closest
to what the user will actually see. This pass is **prose density only**.

### Prose

- Cut verbose narrative.
- Hyperparameters: pull the one interesting value into prose with its rationale; drop
  the rest.

### Tables, figures, and components — defer the definitive call

First-draft guidance only: don't dump academic furniture into the narrative — write
standard dataset properties or trivial layer groups as a sentence, not a table. The
definitive table-vs-prose-vs-diagram-vs-callout decisions for every content block are
made in project-assets-generation (the representation layer) — that sibling skill's
`asset-procedure.md` → Reader-first Selection. Leave a rough marker; don't optimize here.

### Lists

Prose lists should behave like prose — normal document flow, readable indent, text
wraps naturally. Do not force prose lists into metadata-row flex layouts (those are
for the overview component bullets, which is a separate rendering context). Ordered
lists stay native and clearly ordered.

### Component audit

After the density pass, check `src/components/mdx/mdx-components.tsx` for the current
registered set. For each section, ask: is there a key mechanism, finding, or rationale
that a flat sentence undersells? If yes, consider whether a component gives it
appropriate weight. Do not add components for visual variety.

Each component has a specific role — this list is the single home for component roles
and limits:
- `<Callout title="...">` — flags a core finding or non-obvious constraint. One per major section max.
- `<Highlight heading="...">` — pull-quote for a single key conceptual insight. One per
  deep-dive max. Best where the *why* behind a mechanism deserves more weight than prose gives it.
- `<Diagram>` / `<Figure>` — visual evidence (definitive choice deferred to
  project-assets-generation). Props → `frontmatter-rules.md` → Diagram and Figure props.
- `<DiagramRow>` with `<DiagramPanel>` — side-by-side panels for direct comparison.
  Props → `frontmatter-rules.md` → DiagramRow and DiagramPanel props.
- `<Stack gap="md">` — consistent spacing for grouped components.
- Fenced code block (rendered by `CodeBlock`) — algorithm or config that would lose
  precision in prose.
- H4 accent heading — lightweight highlighted sub-heading for a rationale point within
  an H3. Limit → `narrative-structure.md` → Heading limits.

---

## Step 5 — Reader Review (required pre-approval gate)

A subagent reads the rendered page the way a visitor will, judging readability
independently from technical correctness. Run it once, after density reduction — again
only if its fixes restructure sections, with fresh slices and a fresh subagent.

### Author — capture and hand-off

- Render the page on the project's dev server (capture mechanics → the project's
  browser-testing rule) and capture it top to bottom:
  - 1280px viewport width;
  - one theme, pinned explicitly — the site default follows the OS — and named in the
    hand-off;
  - slices one viewport tall, overlapping by ~100px, so text stays legible at full size.
- Hand the subagent **the slices and the Reviewer brief below only** — never the MDX,
  the Step 2 brief, the sources, working notes, or the rest of this step. Anything more
  makes the read warm.

### Author — after the review

- Map each FLAG back to the MDX. Apply it, or drop it with a stated reason reported to
  the user — the reviewer cannot see the source, so some FLAGs will be wrong.
- Rules behind the checks: Redundancy → `narrative-structure.md` → Executive Overview
  vs. Deep Technical Dive, Writing Rules, and the spine Limitations entries · Narrative
  flow → Writing Rules · Section boundaries → the spine entries · Progressive
  disclosure → Standalone Readability, Narrative Space Allocation.

### Reviewer brief

You are reading screenshots of a portfolio project page, top to bottom, as a first-time
visitor. Judge readability only, not technical correctness. The screenshots are ordered
slices of one page; neighbouring slices overlap by about 100px, so a strip repeated at a
slice boundary is the overlap, not redundancy.

**Checks — mark each PASS or FLAG**

*Redundancy*
- Same information stated in multiple sections without adding depth
- Same metric or finding stated more than once within 150 words
- The overview block at the top of the page restating body content verbatim rather
  than summarizing it
- Limitations re-explaining mechanisms already covered in Results or Outcomes

*Narrative flow*
- A section whose opening sentence does not orient a reader arriving from the previous one
- Sections that open with a definition rather than a statement of purpose
- Structurally unusual sections (e.g. bug audits) that don't explain why they exist in the narrative

*Section boundaries*
- Detailed Problem only restating the overview block's problem statement — never going
  deeper into the stakes or reaching the research question or engineering goal
- Body sections repeating the overview block rather than deepening it
- Concepts introduced too late for the reader to follow the section that uses them

*Progressive disclosure*
- Key metrics used in diagrams or prose before being defined
- Conceptual explanations deferred past where the reader needs them
- A secondary contribution visibly rivalling the core finding's length

**Report**
- Every check, each marked PASS or FLAG — a check with nothing found reports PASS
  explicitly.
- Each FLAG names its check and where it was seen, by section and heading text.
- The top 5 readability issues, by section and heading text.
- Section-level fixes only — no rewrites.
