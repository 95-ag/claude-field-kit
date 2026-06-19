# Narrative Structure

What a well-structured portfolio project looks like from a narrative standpoint —
the target the extraction skill is building toward. Authoritative reference for the project-content-extraction skill.

---

## Core Credibility Rules

Always clearly separate:

- **Built from scratch** — implemented from first principles
- **Adapted from a paper/tutorial** — architecture or algorithm taken from literature
- **Fine-tuned pretrained model** — started from an existing checkpoint
- **Framework-provided functionality** — used a library's built-in feature

Do not imply novel research unless the work is genuinely novel. The distinction between
"I implemented X" and "I used X from library Y" must be explicit throughout.

---

## Audience Framing

Two audiences read a portfolio project page in sequence:

**Recruiter (30-second scan):**
- Needs a plain-language problem statement and a concrete headline outcome
- Does not have ML domain knowledge
- Decides on the first paragraph whether to forward the page

**Technical hiring manager (deep read):**
- Traces every metric back to a source
- Checks whether the candidate can explain tradeoffs, not just report results
- Evaluates whether what was built-from-scratch vs. reused is clearly maintained

Write the problem statement and summary for the recruiter. Write the deep-dive sections
for the technical reader. Both must be served by the same page.

---

## Identify the project differentiator before writing

Before writing any content, identify what makes the project credible and memorable.
Not the algorithm or framework used — what was *done* with it and what the outcome
reveals.

- For reproduction projects: the differentiator is audit depth and honest evaluation
- For negative results: the differentiator is rigor and scope of the investigation
- For novel systems: the differentiator is the specific tradeoff navigated and measured
- For applied-systems / built-software projects: the differentiator is the design decision
  that made the system work and the evidence it shipped and operates as intended

The central narrative arc should be explicit in the body and reflected in the overview.
Name the arc before drafting — it shapes which decisions to foreground and which to
treat as background. Examples by project type:

- Reproduction: "reproduce → test claims → confirm / refute each → characterize limits"
- Negative result: "hypothesis → implementation → experiment → failure analysis → scope"
- Novel system: "problem → design decision → implement → benchmark → tradeoff analysis"
- Applied system: "problem → design approach → build → operate → verify outcomes → honest limits"

---

## Standard H2 Narrative Spine (ML Projects)

The operative section list and inclusion criteria live in `extraction-procedure.md`
Step 3. If the two files ever diverge, `extraction-procedure.md` is authoritative for
the list. What follows is per-section authoring guidance — how to write each section,
not just what to include.

Default section order. Reorder only when readability clearly improves; all sections
are optional but most should be present. Section names double as the desktop sticky
section-nav labels (truncate at ~140px), so keep them short (≤ ~18 chars) — prefer
concise forms like "Training Design" / "Limitations" over longer phrasings:

1. **Detailed Problem** — four layers in order. `overview.problem` covers stakes at scan level;
   Detailed Problem goes deeper. Some overlap is acceptable — they serve different reading modes.

   **Layer 1 — Real-world stakes.** Why anyone would care. What is at risk, what is broken, or
   what becomes possible. Deeper than `overview.problem`; specific enough that both a recruiter
   and a technical reader understand the territory before the question is asked.

   **Layer 2 — What the thing is.** The minimum domain or concept setup needed to make the
   research question intelligible. Length scales with how familiar the domain is: an obscure
   threat model needs two sentences; lane detection needs one. This is not Background (theory) —
   it is the minimum context that makes the question non-opaque. Skip entirely if the stakes
   paragraph already provides it.

   **Layer 3 — The research question or engineering hypothesis.** Stated explicitly, after the
   reader has the territory. Now the question lands with weight.

   **Layer 4 — Execution constraints and genuine difficulty.** State the real challenges:
   failure modes, edge cases, why naive approaches fall short, operational limits. Do not
   force a "non-trivial" narrative. Some research questions are empirically clean — the
   challenge is in execution (compute constraints, ambiguous setup, implementation bugs),
   not in the fundamental difficulty of the question. If the question is hard to answer,
   say why. If the challenge is replication fidelity, compute budget, or underspecified
   protocols, say that instead. Inventing difficulty produces the meta-commentary the
   writing rules prohibit.
2. **Background** — domain context, theoretical background, operational constraints, hardware limits
3. **Architecture** — system diagrams, component interaction, model choice rationale
4. **Data** — dataset source, preprocessing, annotations, augmentations, distribution characteristics
5. **Engineering Decisions** — implementation choices and tradeoffs (architecture selection, accuracy vs latency, etc.)
6. **Training Design** — training pipeline, loss/reward design, validation strategy, memory/compute
7. **Results** — opens with the primary conclusion stated explicitly in the first sentence, before any
   table, diagram, or supporting metric. ("DQL did not outperform the baseline detector." not "The
   results are summarized in Table 1.") Supporting metrics, comparisons, and interpretation follow.
   For negative results: state the non-finding directly; explain causes; emphasize rigor of the
   investigation, not the size of the metric.
8. **Limitations** — scope caveats only: what the results *can't* conclude and why.
   Do not re-explain mechanisms already covered in Results. The distinction: Results explains
   *what happened and why*; Limitations explains *what that means for generalizability*.
9. **Next Steps** — where the work goes; can be carefully inferred if not in the source.
   Close with one or two sentences that synthesize what the project established and what
   thread is most worth pursuing — not a restatement of the bullet list.

Project-specific content lives at H3/H4 under these H2s. H1 is rendered by the layout — never written in MDX body.

---

## Applied-Systems H2 Spine (Built Software / Tools / Agentic Systems)

For projects that *ship and operate* something — software, tools, agentic systems,
products, pipelines — rather than measure an experimental result. The operative
section list and selection criteria live in `extraction-procedure.md` Step 3; that
file is authoritative for the list. What follows is per-section authoring guidance.

Same constraints as the ML spine: section names double as desktop sticky section-nav
labels, so keep them short. Default order; reorder only when readability clearly
improves; most sections present, all optional.

1. **Detailed Problem** — identical four-layer structure to the ML spine (real-world
   stakes → what the thing is → the goal → genuine difficulty). For built systems,
   Layer 3 is the engineering goal or design thesis ("ship X under constraint Y")
   rather than a research question; Layer 4 is the real difficulty — integration,
   reliability, a quality bar that must survive scrutiny, scope, or working in an
   unfamiliar domain. State the genuine constraint; do not invent difficulty.
2. **Approach** — the design philosophy and the one decision that shapes everything
   downstream, plus why simpler or more obvious approaches don't clear the bar. This
   is the "Background" slot reframed: rationale for the chosen design, not theory.
   Keep it to the load-bearing idea.
3. **Architecture** — the static structure: components, their boundaries, how they
   fit together. A system diagram lives here. Explain component-choice rationale, not
   just the box names.
4. **Workflow** — how the system actually runs: the operating loop, control flow,
   stages, and the points where humans or automated checks intervene. The dynamic
   counterpart to Architecture (static structure) — the "Training Design" slot
   reframed from how-a-model-learns to how-a-system-operates. A process or sequence
   diagram lives here. Keep operation separate from structure; don't merge with
   Architecture.
5. **Engineering Decisions** — the tradeoffs made and why. Reference concepts already
   named in Approach or Architecture; don't redefine them. Foreground the two or
   three decisions a skeptical engineer would interrogate.
6. **Outcomes** — opens with what was delivered, stated explicitly in the first
   sentence, then how it was verified. The "Results" slot for non-experimental work:
   delivered capabilities, shipped artifacts, and the evidence they work — build,
   quality, performance, accessibility checks, adoption, or before/after — not
   invented metrics. Name the headline outcome; don't make the reader infer it.
7. **Limitations** — scope caveats: what the system does not do, where it depends on
   human steering, where it does not generalize. Not defensive hedging, and not a
   re-explanation of mechanisms already covered in Outcomes.
8. **Next Steps** — where the work goes; close with a synthesis of what the project
   established and the thread most worth pursuing — not a restatement of the bullets.

The remaining sections of this document — Executive Overview, Standalone Readability,
Writing Rules, Concept Density, and Narrative Space Allocation — apply to **both
spines**. Their worked examples are drawn from ML projects (Background, Training
Design, experiments, "core finding vs. secondary experiment"); read those as
illustrations. For an applied-systems project, map them to the applied-systems
sections (Approach, Workflow, Outcomes) and allocate narrative depth by
capability- and decision-weight rather than experiment-weight.

Project-specific content lives at H3/H4 under these H2s. H1 is rendered by the layout — never written in MDX body.

---

## Executive Overview vs. Deep Technical Dive

The overview component (frontmatter `overview.*` fields) serves the recruiter:
- `overview.problem` — what problem exists and why it matters in real systems
- `overview.built` — what was *done*, not what was built. Describe the shape of the
  work: reproduce, audit, repair, extend, evaluate. Architecture names and algorithm
  labels belong in the body, not here.
- `overview.results` — 2–3 outcome-led bullets. Lead with the result, not the metric
  name. One number per bullet. Avoid metric abbreviations (FPR, FNR) unless self-explanatory.
- `overview.transferableSkills` — demonstrated capability, not a task list. Lead with
  the highest-signal skill. Frame as "Reproducing and auditing published research
  implementations" not "Used D-DQN with prioritized replay". Negative results are a
  skill signal if framed as evidence-based evaluation. 4 bullets maximum; each must
  be distinct.

The overview must be scannable in under 60 seconds. Density targets: `problem` ≤ 3
sentences, `built` ≤ 2 sentences, `results` = 3 short bullets (one number each),
`transferableSkills` = 4 bullets starting with gerunds. If any field exceeds this,
trim before presenting.

The MDX body is the deep technical dive. Do not repeat the executive overview verbatim
in the body — the body adds technical depth, not a paraphrase of the frontmatter.

**Overview describes what was done, not what was built.** The biggest signal shift
comes from work-centric language over architecture-centric language. Describe the
shape of the work — reproduce, audit, design, implement, evaluate — not the
configuration choices made. "Reproduced a published pipeline, identified failure
modes, and evaluated rigorously" is more distinctive than "built a model with
[architecture X and algorithm Y]." The former communicates research engineering
capability; the latter describes a configuration choice.

---

## Standalone Readability

A technical reader should not need the paper or repo open beside the portfolio page
to understand the project. This means:

- Explain the evaluation environment (simulated? real API? which dataset?)
- Describe what results mean in plain terms, not just as numbers
- Identify the headline finding explicitly — do not make the reader infer it
- For failure results: explain them in plain language, not just report the number

---

## Writing Rules

**Prefer:**
- Engineering explanations and implementation decisions
- Tradeoffs between choices made
- Specific observations from experiments
- Concise technical clarity

**Avoid:**
- Academic filler and passive voice
- Generic buzzwords ("state-of-the-art", "robust", "novel approach")
- Inflated claims about deployment or impact that aren't sourced
- Theory dumps that don't connect to what was actually built
- Copying the paper's abstract as the project summary
- In-text citations: `[1]`, `[4]`, `Zhao et al.`, "as discussed in Section X",
  "as mentioned above". The portfolio page is not an academic document. Readers
  do not have the paper open. State findings directly; reference external work by
  description if needed, not by citation.
- **Preamble before the first H2.** Start directly with `## Detailed Problem`. No
  introductory paragraph before the first section heading.
- **Connective tissue between sections.** Phrases like "With X defined, the next thing
  is Y" are not needed — section headings do the transitional work.
- **Explanatory parentheticals for concepts a technical reader knows.** Do not define
  standard ML metrics or well-known methods inline. Save parentheticals for genuinely
  non-obvious constraints or domain-specific terms.
- **Meta-commentary and editorial flourishes.** Do not describe what you are about to
  say, frame the project in colloquial terms ("the recipe", "this game"), or add turns
  of phrase that make writing "interesting" rather than credible.

**Abbreviations:** expand on first use, then use the short form throughout. Do not
assume domain familiarity. Any abbreviation a non-specialist reader would not recognize
should be spelled out at first occurrence and defined if the meaning isn't obvious from
the expansion alone.

**Writing register — decision-log clarity.** The target register is a senior engineer's
postmortem or design doc. Every sentence either states a fact, explains a decision, or
describes an outcome. Nothing exists to frame, warm up, or editorialize. Each section
opens with a clear statement of purpose, not a definition. Assume a technical reader —
do not over-explain the obvious.

Test: read each sentence and ask — could a senior engineer have written this in a
postmortem? If yes, the register is right. If it sounds like a tech blog or essay, cut it.

**Framing sentences — dead vs. load-bearing.** Not all framing sentences should be
removed. Two types exist:

- *Dead framing* — describes what you are about to say without carrying content.
  Cut these. Example: "Both answers carry value" as a standalone assertion with no
  follow-through.
- *Load-bearing framing* — introduces a consequence pair, sets up a logic chain, or
  names what is at stake in the answer. Keep these, but restate as a specific
  consequence rather than an abstract label. "The result matters either way: positive
  confirms X; negative redirects effort to Y" is load-bearing. "Both answers carry
  value" is dead.

**Restate as consequence, not label.** When a sentence reads as editorial commentary,
ask whether the underlying observation is specific and problem-related. If yes, restate
it as a consequence of a fact — do not delete it. "This is a structural mismatch" is a
label. "The compounding error is a property of the approach, not a tuning problem" is a
consequence. The observation survives; only the label changes.

**Stakes framing — scope consequence, not editorial binary.** Framing that tells the
reader what is at stake in the answer is valid. State it as a scope consequence, not a
judgment. "Determines whether X is a general method or a niche technique" is an
editorial binary. "Determines how broadly the method applies" is a consequence. Same
function, no label.

When revising a draft: apply targeted improvements to the existing text, not a wholesale
rewrite. Refinement, not substitution — a rewrite discards valid content and resets voice.

**Concept density per section:** a section that introduces more than 2–3 new concepts
at once forces the reader to context-switch mid-paragraph.

- Background should cover problem framing, the core method's formulation (RL reward
  design, loss function, inference procedure — whatever drives the approach), and any
  extension hypothesis as separate paragraphs — not merged into one dense block.
- Engineering Decisions should explain *why* a choice was made, not re-explain *what*
  it is. If a concept was introduced in Background or Architecture, reference it by
  name — don't redefine it.
- Training Design owns implementation detail; Background owns conceptual
  framing. Do not merge them.

If a section is doing work that belongs to another section, split or move — don't compress.

---

## Narrative Space Allocation

Allocate body depth proportionally to finding weight. Depth signals importance to the
reader — a secondary experiment that consumes the same space as the core finding implies
equal significance.

- **Core finding** — the result that defines the project's value: full Results section,
  subsections explaining why, supported by the table and key diagram.
- **Supporting findings** — configurations that extend or nuance the core finding:
  captured in the results table, briefly interpreted in prose.
- **Secondary contributions** — qualitative validation, interpretability checks, or
  supporting analysis: a named H3 at the logical end of the section it supports
  (Results, Training Design). H2 is only appropriate when the contribution genuinely
  has no parent section to live under. The failure mode is burying it as an unnamed
  paragraph — give it a named H3 so it reads as intentional work, not a footnote.

Apply this test before finalizing: if a secondary experiment has as much body space as
the core finding, reduce it.
