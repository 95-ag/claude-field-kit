# Extraction Procedure

Step-by-step operating guide for converting a research project into portfolio MDX.

---

## Step 1 — Source Intake

### Source priority order

1. **Report / paper PDF** — authoritative for all metrics, experimental structure,
   figures, author/institution facts
2. **Repository** — authoritative for framework names, dataset names, file structure,
   README claims, implementation details
3. **User clarification** — authoritative for ownership, links, logo permissions,
   metric framing choices, tone

### Do first (before writing anything)

- Dump PDF text; read end-to-end before writing anything
- Inventory all tables → these are the only authoritative metric sources
- Inventory all figures → these determine which assets can be regenerated vs. must
  be cropped from the PDF
- Scan repo: README, training scripts, eval scripts, config files, dataset names,
  framework versions (imports + requirements)
- Build a numeric-claim correction log if a prior draft exists — this is an audit
  only, not a transformation map

### Human clarification is typically needed for

- GitHub URL (fork vs. original vs. org repo — do not guess)
- Co-author inclusion (skip by default unless the user asks to surface them)
- Logo / brand asset permissions (do not use logos without explicit confirmation)
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
   memorable. For reproduction: which claims were tested and whether they held. For
   negative results: the rigor and scope of the investigation. For novel systems: the
   specific tradeoff navigated and measured.

2. **Narrative arc** — the through-line the body will follow. Name it explicitly before
   writing. Example: "reproduce → test 3 claims → 2 hold, 1 reverses → interpretability
   validates representation → honest scope caveats"

3. **H2 section plan** — which standard spine sections to include, which to omit, and
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

Before writing any body prose, complete the full frontmatter. A build failure on
frontmatter wastes body writing time. Required fields and build-fail conditions are
in `references/frontmatter-rules.md`.

**Frontmatter checklist (verify each before proceeding to body):**

- `title` — prefer recruiter-readable and action-led; use the paper title only if
  it's already clear and compelling on its own
- `summary` — one sentence, specific metric, honest framing; max 200 chars
- `tags` — 4–6 recruiter-recognizable keywords, no duplicates with stack
- `stack` — languages / frameworks / libraries / tools; no CUDA as a library
  dependency; pull from imports and requirements files
- `links.github` — confirm URL with user; do not guess or fabricate
- `links.paper` — add PDF path if the report is in `/public/`; use relative path
  `/projects/<slug>/...`
- `logos` — only with confirmed brand permission; omit entirely if uncertain
- `overview` — **deferred**: leave as empty placeholders now; write after the body
  is complete (see "Write overview last" below)

### H2 spine — pick the spine that fits the project

Two project families, two spines. Choose before writing, based on what the work *is*:
a measured experiment, or a built-and-operated system. Default order; reorder only
when readability clearly improves; all sections are optional — include only what's
substantive for this project.

**ML / research projects** — experiments, models, papers; the project produces a
*measured result*:

1. Detailed Problem
2. Background
3. Architecture
4. Data
5. Engineering Decisions
6. Training Design
7. Results
8. Limitations
9. Next Steps

**Applied-systems projects** — built software, tools, agentic systems, products,
pipelines; the project *ships and operates* something, with no experimental metric:

1. Detailed Problem
2. Approach
3. Architecture
4. Workflow
5. Engineering Decisions
6. Outcomes
7. Limitations
8. Next Steps

Both share the universal bookends (Detailed Problem, Engineering Decisions,
Limitations, Next Steps). The applied-systems spine drops the ML-furniture sections
(Data, Training Design) and reframes three slots: **Background → Approach** (design
rationale and why simpler approaches fall short, not theory), **Training Design →
Workflow** (how the system runs — operating loop, stages, intervention points —
rather than how a model learns), **Results → Outcomes** (what was delivered and how
it was verified, not experimental metrics). Per-section authoring guidance for both
spines is in `narrative-structure.md`.

Project-specific content lives at H3/H4 under these H2s. Use H4 intentionally — only
when a nested concept genuinely improves flow and cannot be absorbed into prose.

### Narrative arc — verify before finalizing

- **Detailed Problem** → four layers: (1) real-world stakes, deeper than `overview.problem`
  which is scan-level only; (2) concept/domain setup scaled to how familiar the domain is —
  only what's needed to make the research question intelligible, not theory; (3) the research
  question or hypothesis, now landing with weight; (4) why answering it is non-trivial —
  failure modes, constraints, edge cases. Some overlap with `overview.problem` is acceptable;
  Detailed Problem deepens it, not avoids it. See `narrative-structure.md` §1 for the full
  layer breakdown.
- **Architecture / Data** → what was actually built and what fed into it (not just
  what was tried — what was decided and why)
- **Results** → primary conclusion in the first sentence, stated explicitly before any table,
  diagram, or metric. Supporting data follows. For negative results: state the non-finding
  directly; do not make the reader infer it from the numbers.
- **Limitations** → honest scope caveats, not defensive hedging
- **Next Steps** → where the work goes, not filler bullets. Close with one or two sentences
  framing what the project established and what thread is most worth pursuing — not a
  restatement of the bullets, but a synthesis of the whole

For the **applied-systems spine**, the three reframed sections carry the arc differently:
- **Approach** → the design decision that shapes everything downstream and why simpler
  options don't clear the bar — rationale, not theory.
- **Architecture / Workflow** → static structure (components and boundaries) vs. dynamic
  behavior (how the system runs — operating loop, stages, where humans or checks intervene).
  Keep them split; don't merge structure with operation.
- **Outcomes** → what shipped, stated in the first sentence, and how it was verified
  (build/quality/perf/a11y checks, adoption, before/after) — never invented metrics.

### Write overview last

Once the body is complete, return to write all `overview.*` fields. The project
differentiator, core findings, and narrative arc are now fully established — write
the overview to reflect them accurately. See `references/frontmatter-rules.md` §overview
for field-level rules and density targets.

### Standalone readability requirement

A technical reader should not need the paper or repo open beside the portfolio page
to understand the project. Every claim the body makes must be legible from the page
alone.

---

## Step 4 — Density Reduction

Run this pass before Reader Review. The reviewer should evaluate the version closest
to what the user will actually see.

### Tables that earn their place

- Two-column comparison with analytical content (e.g., for adversarial ML: victim
  vs. attacker strategy; for ablations: configuration vs. metric; for dataset
  construction: source vs. count vs. provenance)
- Results data that cannot be expressed as prose without losing precision
- Any breakdown where the count or breakdown itself carries credibility

### Tables that should become prose

- Standard dataset properties (classes, image counts) — write as one sentence
- Architecture layer groups (blocks, channels, downsampling) — write as one sentence
- Hyperparameter dumps where only one parameter is actually interesting — pull that
  one into prose with its rationale, drop the rest

### Figures and tables on the same result

If a table already expresses the result precisely, a figure is redundant unless it
shows something the table doesn't (trend shape, spatial layout, image examples).
Remove the redundant one.

### Lists

Prose lists should behave like prose — normal document flow, readable indent, text
wraps naturally. Do not force prose lists into metadata-row flex layouts (those are
for the overview component bullets, which is a separate rendering context). Ordered
lists stay native and clearly ordered.

### Component audit

After the density pass, check `src/components/mdx/mdx-components.tsx` for the current
available set of prose components. For each section, ask: is there a key mechanism,
finding, or rationale that a flat sentence undersells? If yes, consider whether a
component gives it appropriate weight. Do not add components for visual variety.

Each component has a specific role:
- `<Callout>` — flags a core finding or non-obvious constraint. One per major section max.
- `<Highlight>` — pull-quote for a single key conceptual insight. One per deep-dive max.
  Best where the *why* behind a mechanism deserves more weight than prose gives it.
- `<Diagram>` / `<Figure>` — visual evidence that adds something prose cannot.
- `<DiagramRow>` — side-by-side panels for direct comparison.
- `<CodeBlock>` — algorithm or config that would lose precision in prose.
- H4 accent heading — lightweight highlighted sub-heading for a rationale point within
  an H3. Use sparingly.

---

## Step 5 — Reader Review (required pre-approval gate)

Run after density reduction. Run it as a subagent to keep the main context clean.
The reviewer evaluates readability independently from technical correctness. Apply
all FLAG findings before presenting to the user.

### Checks — PASS or FLAG each

**Redundancy**
- Same information stated in multiple sections without adding depth
- Same metric or finding stated more than once within a few lines
- Overview fields that restate body content verbatim rather than summarizing it
- Limitations re-explaining mechanisms already covered in the results section —
  Results (ML spine) or Outcomes (applied-systems spine)
  (Limitations = scope caveats; the results section = mechanisms)

**Narrative flow**
- Abrupt section transitions with no bridging sentence
- Sections that open with a definition rather than a statement of purpose
- Structurally unusual sections (e.g. bug audits) that don't explain why they exist in the narrative

**Section boundaries**
- Detailed Problem restating `overview.problem` instead of opening with the research question
  (ML spine) or the engineering goal / design thesis (applied-systems spine)
- Body sections repeating the overview rather than deepening it
- Concepts introduced too late for the reader to follow the section that uses them

**Progressive disclosure**
- Key metrics used in diagrams or prose before being defined
- Conceptual explanations deferred past where the reader needs them
- Secondary experiments receiving equal narrative space to the core finding

### Output

PASS / FLAG per check, top 5 readability issues with line references, section-level
fixes only (no rewrites). Apply all flagged fixes before presenting to the user.
