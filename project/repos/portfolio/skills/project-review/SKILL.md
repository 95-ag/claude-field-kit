---
name: project-review
description: >
  Runs the two-pass content review on a completed portfolio MDX page — a cold technical-recruiter
  pass and a cold technical-hiring-manager pass, run as separate subagents with no shared context,
  followed by conflict surfacing and a prioritized fix list.

  Use this skill when the user says things like "review the content", "run the reviewers",
  "QA the page", "final review", "check the MDX", "does this read well", "is the content
  ready", or "review model-extraction-attacks". Fire whenever a portfolio project page is
  being evaluated for quality, credibility, or readiness — even if the user just says
  "look this over" while a project MDX is in scope. Do NOT fire for asset generation,
  cover generation, or page layout issues.
---

# Project Review

You run the final QA gate on a portfolio project page. The output is a structured
review from two independent cold subagents, with conflicts surfaced and a prioritized fix list.
Each reviewer evaluates both the MDX text **and** the rendered page visually — a real
reviewer is biased by the hero, the diagrams, and how the page holds up across viewports
and themes before reading a word, so the review must capture that same first impression.

## Before running — read this reference

**`references/review-protocol.md`** — the full review protocol: reviewer separation
rules, conflict-surfacing logic, common drift patterns, and what to do with the findings.
Read this before spawning any subagents.

## Assets — verbatim reviewer prompts

The two reviewer prompts live in `assets/`:

- **`assets/reviewer-recruiter.md`** — Reviewer 1 (technical recruiter, 30-second scan)
- **`assets/reviewer-technical.md`** — Reviewer 2 (technical hiring manager)

Use these **verbatim** as the cold subagent's initial message. Do not paraphrase or shorten them.
Append the MDX file path (and PDF report path if available) after the verbatim prompt text.

## Procedure

### Step 1 — Identify inputs

Confirm with the user (or infer from context):
- MDX file path (e.g., `content/projects/model-extraction-attacks.mdx`)
- PDF report path if available (pass to Reviewer 2 only — Reviewer 1 has no ML background)
- Derive the slug from the MDX filename (strip path and `.mdx` extension) and form the
  project detail URL: `http://localhost:3000/work/<slug>`

### Step 1.5 — Capture screenshots

Invoke `playwright-cli` to capture the rendered project detail page before spawning
any reviewers. The dev server must be running (`npm run dev`, port 3000). If it is not
running, start it in the background.

For each theme (`light`, `dark`):
1. `playwright-cli open http://localhost:3000/work/<slug>` (first iteration) or
   `playwright-cli eval "() => localStorage.setItem('theme','<theme>')"` +
   `playwright-cli reload` (subsequent iterations)
2. `playwright-cli resize 1280 900`
3. `playwright-cli screenshot --filename=tmp/review-shots/<slug>/<theme>-desktop.png`
4. `playwright-cli resize 375 812`
5. `playwright-cli screenshot --filename=tmp/review-shots/<slug>/<theme>-mobile.png`
6. **Best-effort only** — attempt hero and diagram element crops:
   - Resize back to 1280×900, then try element screenshots of the hero section and
     each `<figure>` / diagram element. If a selector is absent or the capture errors,
     skip it and continue — these are never required.
   - Name them `<theme>-hero.png`, `<theme>-diagram-1.png`, etc.

After both themes are captured: `playwright-cli close`

Screenshot dir: `tmp/review-shots/<slug>/` — this path is gitignored under `/tmp`.

**Graceful degrade:** if the page cannot be served at all (server not startable, slug
404s), note this, skip all visual captures, and proceed text-only. Both reviewers mark
every VISUAL item `N/A (page not rendered)`. A missing best-effort crop is not a
degrade — reviewers judge that finer-grained item from the full-page shot or mark it
`N/A (not captured)`.

### Step 2 — Spawn both reviewers simultaneously

Spawn two subagents in the same turn — do not run them sequentially:

**Subagent 1 (recruiter):**
- Use `assets/reviewer-recruiter.md` verbatim, then append:
  ```
  MDX file: <path>
  Screenshots: tmp/review-shots/<slug>/
  Read every image in that directory before completing your review.
  ```
- The subagent should read the MDX and all screenshots, then return the formatted
  RECRUITER REVIEW block (text checks + VISUAL REVIEW sub-block)

**Subagent 2 (technical):**
- Use `assets/reviewer-technical.md` verbatim, then append:
  ```
  MDX file: <path>
  PDF report: <path>  (omit if no PDF)
  Screenshots: tmp/review-shots/<slug>/
  Read every image in that directory before completing your review.
  ```
- The subagent should read the MDX, PDF, and all screenshots, then return the formatted
  TECHNICAL REVIEW block (text checks + VISUAL REVIEW sub-block)

If visual captures were skipped (graceful degrade), omit the screenshot lines and note
`(visual pass skipped — page not rendered)` after the MDX file line in both prompts.

Do not let either subagent see the other's output.

### Step 3 — Surface conflicts and present findings

After both return, present the results per `references/review-protocol.md`:

1. Show both review blocks in full (text checks + VISUAL REVIEW sub-block for each)
2. Identify any **conflicts** — items where Reviewer 1 wants plainer language but Reviewer 2
   passed as technically precise (or vice versa), and visual conflicts (one flags, one passes).
   Do not auto-resolve conflicts.
3. Identify **high-priority items** — anything flagged by both reviewers independently,
   including visual items flagged by both
4. Present a **prioritized fix list**: high-priority (both flagged) → conflicts → single-reviewer
   flags → reviewer-specific suggestions. Visual and text findings are ranked together — a
   visual FLAG from both reviewers is high-priority just like a text one.

### Step 4 — Stop and hand off

Stop after presenting findings. Do not start editing the MDX. The user decides which fixes
to apply and in what order.

## Validation — check before handing off

- Both subagents spawned in the same turn (true parallelism, no shared context)
- Verbatim prompts used — no paraphrasing
- Both review blocks shown in full before conflict analysis (text + VISUAL sub-block)
- Mandatory screenshots captured: full-page desktop + mobile in both themes (or visual
  pass explicitly marked skipped with reason)
- Screenshot paths passed to both reviewers (or skipped flag passed if page not rendered)
- Conflicts identified explicitly — not resolved or merged (visual conflicts included)
- Fix list is prioritized, not a flat dump — visual and text findings ranked together
