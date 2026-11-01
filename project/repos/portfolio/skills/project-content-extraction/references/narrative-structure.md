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

- For reproduction projects: the differentiator is audit depth and honest evaluation —
  which claims were tested and whether they held
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

## Choosing a spine

Two project families, two spines. Choose before writing, based on what the work *is*:

- **ML / research** — experiments, models, papers; the project produces a *measured result*.
- **Applied-systems** — built software, tools, agentic systems, products, pipelines; the
  project *ships and operates* something, with no experimental metric.

Both share the bookends (Detailed Problem, Engineering Decisions, Limitations, Next
Steps). Applied-systems drops Data and reframes three slots: Background → Approach,
Training Design → Workflow, Results → Outcomes.

Both spines: default order; reorder only when readability clearly improves. Every
section is optional — include only what is substantive — but a page carries **at least
5 H2s**.

### Heading limits

- **H2 labels ≤ 21 characters.** They double as the desktop sticky section-nav labels,
  which truncate at their narrowest width. 21 is the longest standard name
  ("Engineering Decisions"); prefer concise forms.
- H2 is for spine sections only; project-specific content lives at H3/H4 under them.
- **At most 1 H4 per H2, and only under an H3** — when a nested concept genuinely
  improves flow and cannot be absorbed into prose.
- H1 is rendered by the layout from `title` — never written in the MDX body.

---

## Standard H2 Narrative Spine (ML Projects)

Per-section authoring guidance — how to write each section, not just what to include:

1. **Detailed Problem** — four layers in order. `overview.problem` covers stakes at scan level;
   Detailed Problem goes deeper. Some overlap is acceptable — they serve different reading modes.
   - **Layer 1 — Real-world stakes.** Why anyone would care: what is at risk, broken, or
     newly possible. Specific enough that both audiences understand the territory before
     the question is asked.
   - **Layer 2 — What the thing is.** The minimum domain setup that makes the question
     intelligible — not Background (theory). Length scales with domain familiarity; skip it
     if Layer 1 already provides it. *Example:* an obscure threat model needs two sentences;
     lane detection needs one.
   - **Layer 3 — The research question or engineering hypothesis.** Stated explicitly,
     after the reader has the territory.
   - **Layer 4 — Execution constraints and genuine difficulty.**
     - State the real challenge: failure modes, edge cases, why naive approaches fall
       short, operational limits.
     - Where the question is empirically clean, the difficulty is execution — replication
       fidelity, compute budget, underspecified protocols, implementation bugs. Say that.
     - Never invent difficulty — it produces the meta-commentary the Writing Rules prohibit.
2. **Background** — domain context, theoretical background, operational constraints, hardware limits
3. **Architecture** — system diagrams, component interaction, model choice rationale.
   What was decided and why, not just what was tried.
4. **Data** — dataset source, preprocessing, annotations, augmentations, distribution characteristics
5. **Engineering Decisions** — implementation choices and tradeoffs (architecture selection, accuracy vs latency, etc.)
6. **Training Design** — training pipeline, loss/reward design, validation strategy, memory/compute
7. **Results** — opens with the primary conclusion stated explicitly in the first sentence,
   before any table, diagram, or supporting metric; supporting metrics, comparisons, and
   interpretation follow. For negative results: state the non-finding directly; explain
   causes; emphasize rigor of the investigation, not the size of the metric.
   *Example:* "DQL did not outperform the baseline detector." — not "The results are
   summarized in Table 1."
8. **Limitations** — scope caveats only, not defensive hedging: what the results *can't*
   conclude and why. Results explains *what happened and why*; Limitations explains *what
   that means for generalizability* — never re-explain mechanisms covered in Results.
9. **Next Steps** — where the work goes; can be carefully inferred if not in the source.
   Close with one or two sentences that synthesize what the project established and what
   thread is most worth pursuing — not a restatement of the bullet list.

---

## Applied-Systems H2 Spine (Built Software / Tools / Agentic Systems)

Per-section authoring guidance:

1. **Detailed Problem** — the ML spine's four layers. Layer 3 is the engineering goal or
   design thesis ("ship X under constraint Y") rather than a research question; Layer 4 is
   the real difficulty — integration, reliability, a quality bar that must survive
   scrutiny, scope, or working in an unfamiliar domain.
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
5. **Engineering Decisions** — the tradeoffs made and why. Foreground the two or
   three decisions a skeptical engineer would interrogate.
6. **Outcomes** — opens with what was delivered, stated explicitly in the first
   sentence, then how it was verified. The "Results" slot for non-experimental work:
   delivered capabilities, shipped artifacts, and the evidence they work — build,
   quality, performance, accessibility checks, adoption, or before/after — not
   invented metrics. Name the headline outcome; don't make the reader infer it.
7. **Limitations** — what the system does not do, where it depends on human steering,
   where it does not generalize. Holds the same boundary with Outcomes as the ML spine's
   Limitations holds with Results.
8. **Next Steps** — as in the ML spine.

The remaining sections of this document — Executive Overview vs. Deep Technical Dive,
Standalone Readability, Writing Rules, and Narrative Space Allocation — apply to **both
spines**. Their worked examples are drawn from ML projects (Background, Training
Design, experiments, "core finding vs. secondary experiment"); read those as
illustrations. For an applied-systems project, map them to the applied-systems
sections (Approach, Workflow, Outcomes) and allocate narrative depth by
capability- and decision-weight rather than experiment-weight.

---

## Executive Overview vs. Deep Technical Dive

The overview component (frontmatter `overview.*` fields) serves the recruiter and must be
scannable in under 60 seconds. Per-field guidance and density targets — trim any field
past its target before presenting:

- `overview.problem` — what problem exists and why it matters in real systems.
  **≤ 3 sentences.**
- `overview.built` — what was *done*, not what was built: the shape of the work
  (reproduce, audit, repair, design, implement, extend, evaluate), not the configuration
  choices. Architecture names and algorithm labels belong in the body. **≤ 2 sentences.**
  *Example:* "Reproduced a published pipeline, identified failure modes, and evaluated
  rigorously" — not "built a model with [architecture X and algorithm Y]."
- `overview.results` — outcome-led bullets: lead with the result, not the metric name.
  One number per bullet. Avoid metric abbreviations (FPR, FNR) unless self-explanatory.
  **Exactly 3 bullets.**
- `overview.transferableSkills` / `overview.learnings` — demonstrated capability, not a
  task list. Start each with a gerund; lead with the highest-signal skill; each bullet
  distinct. Negative results are a skill signal if framed as evidence-based evaluation.
  **≤ 4 bullets.** *Example:* "Reproducing and auditing published research
  implementations" — not "Used D-DQN with prioritized replay".

The MDX body is the deep technical dive. Do not repeat the overview in the body — the
body adds technical depth, not a paraphrase of the frontmatter.

---

## Standalone Readability

A technical reader should not need the paper or repo open beside the portfolio page
to understand the project — every claim the body makes must be legible from the page
alone. This means:

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
- In-text citations — numbered references, author-year citations, "as discussed in
  Section X", "as mentioned above". Readers do not have the paper open — state findings
  directly; reference external work by description, not by citation.
- **Preamble before the first H2.** The body opens directly on its first H2 — normally
  `## Detailed Problem`. No introductory paragraph before it.
- **Repeating a metric or finding within 150 words.** State it once where it lands;
  restate only in a different section, and only to add depth.
- **Connective tissue between sections.** Phrases like "With X defined, the next thing
  is Y" are not needed — section headings do the transitional work.
- **Explanatory parentheticals for concepts a technical reader knows.** Do not define
  standard ML metrics or well-known methods inline. Save parentheticals for genuinely
  non-obvious constraints or domain-specific terms.
- **Meta-commentary and editorial flourishes.** Do not describe what you are about to
  say, frame the project in colloquial terms, or add turns of phrase that make writing
  "interesting" rather than credible. *Example:* calling the method "the recipe" or the
  task "this game".
- **Unexplained unusual sections.** A section the spine does not name (e.g. a bug
  audit) states in its opening why it exists in the narrative.

**Abbreviations:**
- Expand on first use, then use the short form throughout.
- Spell out any abbreviation a non-specialist would not recognize, and define it if the
  expansion alone does not carry the meaning.

**Writing register — decision-log clarity.**
- Target register: a senior engineer's postmortem or design doc. If a sentence sounds like
  a tech blog or essay, cut it.
- Every sentence states a fact, explains a decision, or describes an outcome — nothing
  frames, warms up, or editorializes.
- Each section opens with a statement of purpose, not a definition.
- Assume a technical reader — do not over-explain the obvious.

**Framing sentences — dead vs. load-bearing.**
- *Dead framing* describes what is about to be said without carrying content — cut it.
  *Example:* "Both answers carry value" as a standalone assertion.
- *Load-bearing framing* introduces a consequence pair, sets up a logic chain, or names
  what is at stake — keep it, stated as a specific consequence rather than a label.
  *Example:* "The result matters either way: positive confirms X; negative redirects
  effort to Y."

**Restate as consequence, not label.**
- An editorial-sounding sentence whose observation is specific and problem-related is
  restated as a consequence of a fact — never deleted.
- *Example:* "This is a structural mismatch" (label) → "The compounding error is a
  property of the approach, not a tuning problem" (consequence).

**Stakes framing — scope consequence, not editorial binary.**
- State what is at stake as a scope consequence, not a judgment.
- *Example:* "Determines whether X is a general method or a niche technique" (binary) →
  "Determines how broadly the method applies" (consequence).

**Revising the draft in progress** (density, Reader Review and user-feedback fixes):
- Apply targeted improvements to the existing text — never a wholesale rewrite, which
  discards valid content and resets voice.
- Match the established person and register — no first person in an impersonal doc.
- A prior draft from before this run is not revised — it is rebuilt
  (`extraction-procedure.md` → Core rule: discard existing body, start fresh).

**Concept density per section:** a section that introduces more than 3 new concepts
at once forces the reader to context-switch mid-paragraph.

- Background should cover problem framing, the core method's formulation (RL reward
  design, loss function, inference procedure — whatever drives the approach), and any
  extension hypothesis as separate paragraphs — not merged into one dense block.
- Engineering Decisions should explain *why* a choice was made, not re-explain *what*
  it is. If a concept was introduced in an earlier section (Background / Approach or
  Architecture), reference it by name — don't redefine it.
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

Apply this test before finalizing: a secondary contribution gets at most half the words
of the core finding; past that, reduce it.
