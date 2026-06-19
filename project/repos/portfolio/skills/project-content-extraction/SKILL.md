---
name: project-content-extraction
description: >
  Converts a research project (PDF report + repo + user context) into a fresh,
  schema-aligned portfolio MDX page at content/projects/<slug>.mdx. Always rebuilds
  body content from scratch — never transforms a prior draft. Produces complete
  frontmatter + H2-spine body, density-reduced and ready for human approval before
  asset generation begins.

  Use this skill whenever the user starts a new portfolio project page, says things
  like "extract <project> into MDX", "build the case study for <slug>", "write up
  the <project>", "turn this paper/repo into a portfolio page", or supplies a PDF +
  repo + slug in any combination — even if they don't say "MDX" or "portfolio". Fire
  on any request that initiates the content phase of a project. Do NOT fire for asset
  generation (diagrams, charts), cover/hero work, or reviewing an existing page —
  those are separate sibling skills.
---

# Project Content Extraction

You convert a research project (paper, repo, or both) into a portfolio-quality MDX
page. The output is a single file at `content/projects/<slug>.mdx` — complete
frontmatter and a deep-dive body — handed to the user for approval before any assets
or cover work begins.

## Before writing anything — read these references

1. **`references/evidence-and-modes.md`** — determines which source mode applies
   (report+repo / repo-only / report-only), how to rank conflicting claims, and how
   to tag confidence in repo-only mode. Read this before touching any source material.

2. **`references/frontmatter-rules.md`** — all required and optional frontmatter
   fields, their types, build-fail conditions, and MDX body authoring rules. Read
   this before writing the frontmatter.

3. **`references/extraction-procedure.md`** — the full intake → build → density
   reduction procedure. Use it as the step-by-step operating guide.

4. **`references/narrative-structure.md`** — the target narrative shapes: the two H2
   spines (ML / research and applied-systems), credibility rules, audience framing
   (recruiter vs. technical reader), executive overview vs. deep-dive distinction,
   standalone readability requirements, and writing rules. Read before writing any
   MDX body content.

## High-level procedure

### Step 1 — Source Intake

Read every source before writing a single line. Consult `references/extraction-procedure.md`
Step 1 for the complete intake checklist.

Key discipline: dump the PDF and read it end-to-end. Inventory all tables (metric
sources) and all figures (determines what can be regenerated vs. must be cropped).
Scan the repo's README, training scripts, config files, and imports. Build a
numeric-claim log if a prior draft exists — that's an audit, not a transformation.

Ask the user upfront about anything that requires clarification (GitHub URL, logo
permissions, title framing, metric framing choices). Do this before writing, not
mid-draft.

### Step 2 — Narrative Direction Proposal

Before writing anything, surface the narrative direction to the user and wait for
approval. See `references/extraction-procedure.md` Step 2 for the full format.

In brief: one sentence on the project differentiator, the narrative arc named
explicitly, the H2 section plan with rationale for non-obvious choices, and any
framing decisions (built-from-scratch scope, result frame). Keep it to 5–10 lines.
Do not proceed to Step 3 until the user approves.

### Step 3 — Write the MDX

Three sub-steps in order — do not reorder:

**(a) Frontmatter (except overview).** Write title, summary, tags, stack, links,
logos, projectType, publishedAt, heroImage. The schema is strict — get these right
before touching the body. See `references/frontmatter-rules.md` for every field.
Leave all `overview.*` fields as empty placeholders for now.

**(b) Body.** Discard any existing body content and rebuild from source. Old content
is reference material, not a transformation input. Keep only the file path and any
frontmatter already confirmed correct. Pick the H2 spine that fits the project (ML /
research or applied-systems) — see `references/extraction-procedure.md` Step 3 for
both spines, the narrative arc, and the standalone-readability requirement.

**(c) Overview (after body is complete).** Return to write all `overview.*` fields
once the body is finished. The project differentiator, core findings, and narrative
arc are now established — write the overview to reflect them accurately. See
`references/frontmatter-rules.md` §overview for field rules and density targets.

### Step 4 — Density Reduction

Before finalizing, run the density checklist from `references/extraction-procedure.md`
Step 4. Convert standard-dataset-property tables to one-sentence prose. Remove figures
that duplicate table data. Pull the one interesting hyperparameter into prose with its
rationale; drop the rest. Run the component audit at the end of this step.

### Step 5 — Reader Review

Run the Reader Review pass from `references/extraction-procedure.md` Step 5. Run it
as a subagent. Apply all FLAG findings before presenting to the user.

## Output

One file: `content/projects/<slug>.mdx`

Stop here — hand the file path to the user for approval. Do not run reviewers,
generate assets, or build the cover. Those are separate skills that run after
this step is approved.

## Validation — check before handing off

All items are required. Do not present the MDX to the user until all pass.

- `next build` passes (Zod validates frontmatter at build time; schema at
  `src/lib/schemas/project.ts`)
- No H1 in the MDX body
- No raw HTML in body — use components: `<Figure>`, `<Diagram>`, `<Callout>`,
  `<Stack>`, `<Highlight>`
- No `slug:` field in frontmatter
- In repo-only mode: no paper-style metrics written without a traceable source
- `overview.*` fields written after the body (not drafted before it)
- Density reduction pass complete (Step 4 checklist in `extraction-procedure.md`)
- Reader Review pass complete (Step 5 in `extraction-procedure.md`); all FLAG items resolved

## Source mode quick-reference

| Available sources | Mode |
|---|---|
| PDF + repo | report+repo |
| Repo only, no PDF | repo-only |
| PDF only, no code | report-only |

The full mode rules — what each mode requires, forbids, and escalates to clarification —
are in `references/evidence-and-modes.md`.
