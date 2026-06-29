# Review Protocol

Authoritative reference for running the two-pass content review.

---

## Reviewer separation

Run two separate reviewer passes — do not blend them. Each reviewer must be cold: no shared
context with the other, no knowledge of the other's findings, no merged prompts.

The reviewers simulate distinct audiences:

- **Reviewer 1 (technical recruiter):** 30-second scan, business framing, no deep technical
  background. Kind-agnostic — its questions are general. Checks problem clarity, headline
  outcome, scope signal, plain-language limitations/failures, summary-first deep dive,
  forward verdict. Also evaluates first visual impression: hero professionalism, page polish,
  diagram credibility at a glance, mobile layout, and theme consistency.

- **Reviewer 2 (technical hiring manager):** Deep technical screen with access to PDF source.
  Six of its checks are phrased per the declared project kind (see Selecting the review kind);
  the rest are shared. Checks claim traceability, anomaly explanation, environment/interface
  clarity, figure-to-prose alignment, provenance distinction, fabricated claims, overstatement,
  inline code noise, anchor link slugs. Also evaluates diagram legibility and technical accuracy:
  label clarity, visual/prose alignment, visual honesty, dark-theme visibility of diagram
  elements, and hero relevance.

Spawn both as subagents in the same turn. Do not run them sequentially.

---

## Selecting the review kind

The **technical** reviewer's type-specific checks are phrased for one of two project kinds; the
**recruiter** pass is kind-agnostic (its questions are general). Classify the kind from existing
frontmatter before spawning, announce it, and let the user override. There is no dedicated
frontmatter field for this — classify from what's already there.

**Signal:**
- `tags[]` — the primary topic signal.
- `projectType` (`academic` | `freelance` | `personal`) — secondary context; not decisive alone.

**Guide — map the topic to a kind:**

- **ML-experiment** — tags name a modeling or experimental ML topic: a learning paradigm, model
  family, or research problem (e.g. *Reinforcement Learning, Computer Vision, Model Extraction,
  NLP*). The page's substance is training/evaluating a model and reporting metrics.
- **Applied-systems** — tags name built software, systems, tooling, or workflows (e.g. *Next.js,
  Backend, Developer Tooling, Agent Systems, AI Workflow, Web Development, Design*). The substance
  is an engineered artifact plus its architecture and outcomes — **even when the project uses AI.**
  An agent or AI-workflow product is applied-systems, not ML.

Domain shorthand → kind: *ML* → ML-experiment; *AI systems / tooling / workflows / web dev / design
/ backend* → applied-systems.

**Mixed or hybrid:** if the tags genuinely span both — a real experimental track *and* a shipped
system — declare **both**; the technical reviewer answers both phrasings for its type-specific
checks. Otherwise pick the page's center of gravity (does it report experimental results, or
present a built system?) and state any uncertainty.

**Transparency (required):** in Step 1 the controller states the chosen kind and the tags it keyed
on — e.g. *"Classified applied-systems — tags: Agent Systems, Next.js, Developer Tooling; a built
system, not an ML experiment. Override if wrong."* It proceeds without blocking, but the user can
flip it with one word.

The PDF report is an **input** (passed to the technical reviewer when present), never the kind
signal — a report can accompany either kind, and an ML project may have none.

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

These patterns recur in ML-experiment content; flag any that appear. Applied-systems content has
analogous drift — overstated automation, demo-ware presented as production, outcome claims not
traceable to the repo, config/class-name noise in prose. The list below is the ML-experiment set;
apply the same scrutiny in applied terms for an applied-systems page.

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
- **"the repo / the docs shows" sourcing** (applied-systems analogue) — architectural or
  performance claims attributed vaguely to "the repo" or "the docs" without a specific file,
  commit, or benchmark run; Reviewer 2 should flag for precision

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
