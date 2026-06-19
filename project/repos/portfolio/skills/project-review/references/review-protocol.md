# Review Protocol

Authoritative reference for running the two-pass content review.

---

## Reviewer separation

Run two separate reviewer passes — do not blend them. Each reviewer must be cold: no shared
context with the other, no knowledge of the other's findings, no merged prompts.

The reviewers simulate distinct audiences:

- **Reviewer 1 (technical recruiter):** 30-second scan, business framing, no ML background.
  Checks problem clarity, headline outcome, scope signal, plain-language null results,
  Results summary paragraph, forward verdict. Also evaluates first visual impression:
  hero professionalism, page polish, diagram credibility at a glance, mobile layout,
  and theme consistency.

- **Reviewer 2 (technical hiring manager):** Deep technical screen with access to PDF source.
  Checks metric traceability to PDF table/figure, anomaly explanation, evaluation environment
  clarity, trend descriptions (not just endpoints), built-vs-reused distinction, fabricated
  claims, weak result overstatement, inline code noise, anchor link slugs. Also evaluates
  diagram legibility and technical accuracy: label clarity, visual/prose alignment, chart
  honesty, dark-theme visibility of diagram elements, and hero relevance.

Spawn both as subagents in the same turn. Do not run them sequentially.

---

## Conflict surfacing

After both return, surface conflicts before presenting to the user:

- If Reviewer 1 flags something as needing more plain language on a point that Reviewer 2
  passed as technically precise: flag it explicitly. Do not auto-resolve by choosing one
  reviewer's preference — the content step must reconcile.
- If both reviewers flag the same item independently, it is a **high-priority fix**.
- Present both finding sets together with conflicts highlighted. Do not merge into a single
  pass or blend the perspectives.

---

## Prioritized fix list structure

After presenting both review blocks and surfacing conflicts, produce a prioritized fix list:

1. **High priority** — items flagged by both reviewers
2. **Conflicts** — items where the reviewers disagree (need human judgment to resolve)
3. **Single-reviewer flags** — items flagged by one reviewer only
4. **Suggestions** — HIGHEST-LEVERAGE FIX recommendations from each reviewer

---

## Common drift patterns to catch

These patterns appear repeatedly in ML portfolio content. Flag any that appear:

- **Fabricated speedup claims** — "3× improvement" or "2× faster" not present in the source PDF
- **Overstatement of weak results** — "meaningful but not perfect" when the delta is within noise;
  "strong performance" when accuracy is 30%
- **Data-free success framing** — framing a failed experiment as exploratory rather than reporting
  the actual result honestly
- **Inline code noise** — `ResNet50`, `Adam(lr=1e-3)`, backtick-wrapped tokens in prose where
  a table or plain language would communicate the same thing more cleanly
- **Broken anchor links** — verify that anchor slugs in `[text](#slug)` match the actual H2/H3
  headings after slugification (lowercase, spaces to hyphens, special chars stripped)
- **"the paper says" sourcing** — metrics attributed to "the paper" without a specific table or
  figure number; acceptable as a placeholder but Reviewer 2 should flag for precision

---

## Scope of the review gate

The review gate covers content and visual presentation of the rendered page — prose quality,
factual accuracy, metric traceability, narrative structure, and how the page looks and
reads when rendered in a browser.

Visual inspection in scope:
- Hero first impression and relevance
- Diagram legibility, label clarity, chart honesty
- Page polish and layout coherence at desktop and mobile
- Theme parity — both light and dark themes render correctly

Not in scope (owned by other pipeline steps):
- Asset *generation* quality (handled by `project-assets-generation`)
- Hero cover *generation* (handled by `project-cover-generation`)
- Build output, component bugs, or TypeScript errors (use build verification checks)

Note: the review gate may flag a visual defect it can observe in screenshots (e.g. a
diagram with invisible strokes in dark theme) even if fixing it falls to the assets
pipeline — the finding still surfaces here.

After findings are presented, stop. Do not begin editing the MDX. The user decides which
fixes to apply.
