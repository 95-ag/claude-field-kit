# Evidence Hierarchy and Source Modes

How to rank conflicting claims and how to operate when sources are incomplete.

---

## Source-of-Truth Hierarchy

When two sources conflict, higher tier wins. Exception: ownership, links, permissions,
and framing always defer to user clarification regardless of tier — these are not
derivable from artifacts.

| Tier | Source | Authoritative for |
|---|---|---|
| 1a | **Report / results documentation** | Metrics, results, experimental structure, author/institution facts |
| 1b | **Design / spec documentation** (architecture docs, ADRs, schema specs, plans) | Architecture, rationale, constraints, rejected alternatives — **intent, never outcome** |
| 2 | **Source code** (training/eval scripts, configs) | Implementation details, frameworks, dataset names, hyperparameters |
| 3 | **Commit history / issues** | Timeline, evolution, known limitations, design decisions |
| 4 | **Demos / screenshots** | UI/output behavior, qualitative results, visual appearance |
| 5 | **User clarification** | Ownership, links, logo permissions, title framing, metric framing choices |

Prior draft MDX is reference only — never authoritative for any claim.

---

## Confidence Tagging

Applies in every mode, not only degraded ones. Before writing any factual claim, assign
it a tag in your working notes:

- `[verified]` — directly readable from an artifact (README line, script output, eval
  log, table cell)
- `[inferred]` — reasonably derivable from code structure, commit messages, or naming
  conventions; state the inference explicitly in prose if it affects a claim
- `[user-confirmed]` — the user's own attestation; **no artifact backs it**, whether the
  work is private, internal, or unreleased

Tag **per claim**, not per project. One page routinely mixes tiers — a `[verified]`
subsystem beside a `[user-confirmed]` one is normal, not a defect.

Writing rules by tag:

- `[user-confirmed]` may be stated plainly — it is the user's own work and their word.
  Never phrase it to imply artifact support ("the repo shows…", "the benchmark
  reports…"), and never attach a number to it.
- A private or unshareable artifact yields `[user-confirmed]`, not `[verified]` — the
  test is whether a reader could in principle be shown it, not whether you saw it.
- Never surface tags in the final MDX prose. They govern what you write, not what the
  reader sees.
- Any unresolved `[inferred]` claim on a metric becomes a clarification question before
  finalizing.

---

## Source Modes

The pipeline assumes report+repo by default. When one source is missing, degrade
gracefully: skip missing tiers and escalate gaps to user clarification.

### Report + repo (full)

**Primary path.** All tiers 1–3 available. Metrics from PDF tables; implementation
from code. No extra constraints.

### Repo only

Tiers 1 and part of 3 are unavailable. Apply these constraints:

- Metrics sourced from README, eval scripts, output artifacts, or commit history
- Tag each claim in your working notes before writing prose (see Confidence Tagging above)
- Never write paper-style metrics ("achieved X% on benchmark Y") without a traceable
  source; if no source exists, ask or omit
- Architecture and data facts from code; tech stack from imports and configs
- Heavier user clarification required for results framing and any headline metric
- The `summary` field must not claim precision beyond what the repo supports

### Design docs + partial artifacts (mixed evidence)

Common in client and freelance work: thorough design documentation, a repo covering only
part of the system, and further work the user attests to but cannot show. Evidence varies
**by subsystem**, so no single mode label describes the page — tag per claim and apply:

- Design docs establish **intent**. Never write a designed behavior in the present
  indicative ("the engine groups listings into canonical products") unless an artifact or
  a user attestation confirms it was built.
- Where a design doc and shipped code disagree, **code wins for what shipped**. The
  divergence is usually the most interesting content on the page — surface it rather than
  quietly following the doc.
- A planning estimate is never reported as a measured value. Prefer the measured figure
  and make clear which is which.
- Private or internal work is `[user-confirmed]`: write it plainly, never imply the reader
  could verify it, never attach a number.
- Undocumented drift — a decision log still naming a superseded choice — is a finding, not
  an error to smooth over. Confirm the real reason with the user.

### Prior draft only (extreme degradation)

When neither repo nor PDF is accessible and only a prior MDX draft exists:

- The prior draft is **reference only** — treat every claim in it as unverified
- **Refuse all numeric metrics** — do not include them as "reported" or "from the project owner"; there is no traceable source
- Omit `overview.results` entirely — never populate it with unverifiable numbers
- Architecture and stack claims: include only what is strongly inferable from the project name and framing; flag lower-confidence items as uncertain in working-notes; drop anything speculative
- Generate clarification questions covering all refused/omitted claims and ask them before finalizing
- The summary must describe the system without numeric precision — use framing like "A pipeline that corrects…" rather than "Achieved X%…"

This is the strictest operating mode. Its output is a structural shell that must be confirmed and filled in by the user before it is suitable for publishing.

### Report only

Tiers 2 and 3 are unavailable. Apply these constraints:

- Framework, dataset, and structure facts from paper prose only — cannot be
  cross-checked against code
- Tech stack inferred from paper and flagged for user confirmation before publishing
- Typically no GitHub link; do not fabricate or guess a repo URL
- No commit history tier — timeline and evolution are unknown unless stated in the paper

---

## Numeric claims require visible support

When a specific count is stated (e.g. "14 implementation bugs", "3 datasets", "5 ablation
runs"), the body must provide traceable support:

- Number or categorize the listed items so the count is verifiable
- If not all items are enumerated, explicitly acknowledge the gap ("The five most
  significant — the remaining nine covered…")

Never state a count and then explain fewer items without acknowledging the discrepancy.
The count itself carries credibility when it reflects rigorous work — do not remove it.
Do not let it become ungrounded.

---

## Common drift patterns to avoid

These are the most common credibility failures in portfolio content:

- **Fabricated speedup claims** — "3× improvement" not present in the source
- **Overstated weak results** — "meaningful improvement" when the delta is within noise
- **Data-free success framing** — success language when the actual result was partial
  failure (e.g., 30% accuracy on a 10-class problem ≠ convergence)
- **Inline code noise in prose** — where a table or plain language would be cleaner
- **Paper-style metrics without source** — citing a benchmark score with no traceable
  table cell or file line
- **Design intent written as shipped outcome** — a spec describes what the system was
  designed to do; writing it as what the system does claims a build no artifact supports
