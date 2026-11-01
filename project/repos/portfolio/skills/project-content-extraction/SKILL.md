---
name: project-content-extraction
description: >
  Converts a research project (PDF report + repo + user context) into a fresh,
  schema-aligned portfolio MDX page at content/projects/{slug}.mdx. Always rebuilds
  body content from scratch — never transforms a prior draft. Produces complete
  frontmatter + H2-spine body, density-reduced and ready for human approval before
  asset generation begins.

  Use this skill whenever the user starts a new portfolio project page, says things
  like "extract {project} into MDX", "build the case study for {slug}", "write up
  the {project}", "turn this paper/repo into a portfolio page", or supplies a PDF +
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
   (see → Source mode quick-reference below), how to rank conflicting
   claims, and how to tag every claim's confidence. Read this before touching any
   source material.

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

Read every source and ask every clarification question before writing a single line
(→ `references/extraction-procedure.md` Step 1, tagged by mode).

### Step 2 — Narrative Direction Proposal

Surface the narrative direction brief and wait for the user's approval before Step 3
(format → `references/extraction-procedure.md` Step 2).

### Step 3 — Write the MDX

Frontmatter first, then the body on the chosen H2 spine, then the final overview — in
that order (→ `references/extraction-procedure.md` Step 3). Place only rough
representation markers in the body; the representation layer is designed in
project-assets-generation, after the narrative stabilizes.

### Step 4 — Density Reduction (prose density only)

Run `references/extraction-procedure.md` Step 4. Definitive table-vs-prose-vs-diagram
decisions are not made here.

### Step 5 — Reader Review

Run `references/extraction-procedure.md` Step 5 — a subagent that sees screenshots of
the rendered page only, never the MDX.

## Output

One file: `content/projects/<slug>.mdx`

Stop here — hand the file path to the user for approval. Do not run `project-review`,
generate assets, or build the cover. Those are separate skills that run after
this step is approved. Step 5's Reader Review is this skill's own gate, not one of them.

## Validation — check before handing off

All items are required. Do not present the MDX to the user until all pass. Each is a
gate; the rule it checks lives where it points.

- `next build` passes (schema at `src/lib/schemas/project.ts`)
- Frontmatter and body markup conform → `frontmatter-rules.md` → Slug rule, Body
  authoring rules
- Headings conform → `narrative-structure.md` → Heading limits
- Claims conform → `evidence-and-modes.md` → Confidence Tagging, Common drift patterns
  to avoid
- Overview final, nothing provisional left → `frontmatter-rules.md` → overview
- Density Reduction complete → `extraction-procedure.md` Step 4
- Reader Review complete; every FLAG applied or dropped with a stated reason →
  `extraction-procedure.md` Step 5

## Source mode quick-reference

| Available sources | Mode |
|---|---|
| PDF + repo | report+repo |
| Repo only, no PDF | repo-only |
| PDF only, no code | report-only |
| Design/spec docs + partial repo + user-attested internal work | mixed-evidence |
| Prior draft MDX only | prior-draft-only |

The full mode rules — what each mode requires, forbids, and escalates to clarification —
are in `references/evidence-and-modes.md`.
