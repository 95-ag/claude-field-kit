# Engineering Philosophy

Cross-project engineering principles. These apply regardless of language, framework, or domain. Project-specific conventions take precedence where they conflict.

---

## Code quality

**Readable over clever.** Code is read far more than it is written. Optimize for the person reading it cold in six months — including yourself.

**Self-documenting first.** Clear naming, focused functions, and explicit structure communicate intent better than comments that describe the code. Write code that does not need explaining before reaching for comments.

**Consistent over novel.** Follow the patterns already established in the codebase. Introducing a new pattern has a cost — it must be understood, maintained, and eventually reconciled. Novel approaches require clear justification.

**Respect local conventions.** The best pattern is usually the one already established in the codebase unless there is a compelling reason to change it.

**Meaningful names.** Names should reveal intent. Avoid abbreviations, single-letter variables outside tight loops, and generic names (`data`, `info`, `handler`, `temp`) that force readers to trace context.

**Focused responsibilities.** Prefer functions, modules, and components with a single clear responsibility. Splitting logic into many tiny pieces should improve readability, not merely reduce size.

**Explicit structure over hidden magic.** Prefer obvious, traceable control flow over indirect mechanisms. Avoid hidden behavior and indirection that significantly increase understanding cost.

---

## Comments

Comments capture genuine decisions and intent — never restate what the code already says.

**Default to no comment; add one only where it earns its place.** Write the right comments as you go, not by trimming afterward. A comment earns its place only when it states a *why* the code itself cannot show.

**Never restate the code.** A comment describing what the names and structure already make clear is noise — and a shorter restatement is still a restatement. Code generation does this habitually; guard against it while writing, and re-read after to delete any that slipped in.

**Use comments only to explain:**

- non-obvious decisions and their reasoning
- tradeoffs that were considered and rejected
- complex business logic or domain rules
- edge cases that are not apparent from the implementation
- performance constraints that shape the implementation
- framework or runtime quirks being worked around
- important context that would otherwise be lost

**Never leave process or meta notes in shipped code** — "kept from the prior pass", "TODO later", and the like belong in the work log, not the source.

**Complex or high-risk logic warrants more thorough explanation** than straightforward implementation code. The bar for comments scales with the cost of misunderstanding the code.

---

## Abstraction

**Do not abstract early.** Premature abstraction is worse than duplication — it locks in assumptions before the problem is fully understood.

**Repetition alone is not always a problem.** Two similar things may diverge. Abstracting them too early creates coupling that is harder to undo than the original duplication.

**Prefer consolidating stable patterns, not unstable ones still evolving.** Abstractions built on shifting requirements become liabilities.

**Introduce abstractions only when they clearly improve clarity, maintainability, or consistency** — not because the pattern appears more than once. Three similar things with meaningful differences are better left separate than forced into a brittle generalization.

**Prefer understandable duplication over clever generalization.** A reader who can understand each instance directly is better served than one who must trace through a general mechanism.

**Do not introduce architectural complexity solely for hypothetical future scale.** Build for what exists now. Complexity invented for scale that never arrives creates burden without benefit.

**Escalate complexity only on evidence.** Prefer the lowest-impact change first — implementation, logic, configuration, prompts, selectors, or data — before introducing new infrastructure, layers, or abstractions.

**Do not mistake sophistication for quality.** More layers, patterns, abstractions, services, or configuration do not automatically improve a system. Judge solutions by clarity, maintainability, and evidence of need.

---

## Simplification

**Prefer removing complexity over managing it.** The best abstraction, dependency, configuration option, or code path is often the one that no longer exists.

**Deletion is a valid improvement.** When a requirement can be satisfied by removing code, layers, or process, prefer that over adding new mechanisms.

---

## Change discipline

**Understand before modifying.** Read enough surrounding code and context to understand why the current implementation exists before changing it.

**Prefer incremental changes over large rewrites.** Small changes are easier to review, safer to deploy, and easier to revert. Large rewrites introduce risk across the entire surface they touch.

**Fix root causes, not symptoms.** Layering patches over underlying problems compounds the problem and makes the root cause harder to find later. For systematic root-cause diagnosis, reach for the `debugger` agent (evidence-first, propose-only).

**Docs before code.** Once a change to a documented requirement, design, or spec is confirmed, update the owning doc FIRST, then implement to match — never patch code ahead of the doc and reconcile afterward (that breeds drift and patchwork).

**Preserve working systems unless there is clear evidence they need restructuring.** Working code has value. The cost of restructuring includes the risk of introducing new bugs, losing implicit knowledge, and disrupting reviewability.

**Minimize blast radius.** The smallest change that solves the problem is usually the best one. Avoid touching code that does not need to change.

**Do not mix unrelated concerns in one change.** Separate bug fixes, refactors, and feature additions into distinct commits or PRs. Mixed changes are harder to review, harder to revert, and harder to understand in history.

**Minimal diffs preferred.** Every line changed is a line that must be reviewed and a potential source of regression. Change only what needs to change.

---

## Implementation standards

**No dead code.** Remove unused functions, variables, imports, exports, and obsolete paths. Dead code misleads readers and accumulates over time.

**No speculative code.** Do not add code for requirements that do not exist yet. It will usually be wrong when the time comes and creates noise in the meantime.

**No unnecessary dependencies.** Each dependency is a maintenance surface, a version conflict risk, and a security exposure. Add dependencies only when the benefit clearly outweighs the cost.

**Verify with evidence.** Do not assume a change works because it appears correct. Use appropriate validation — tests, builds, runtime checks, visual verification, or other verification methods — and report what was verified. Outward-facing and boundary-crossing behavior (APIs, files, external services, extraction) needs a check against real data before handoff — a passing unit suite is not sufficient evidence on its own.

---

## Commits and history

**Keep commits focused and atomic.** Each commit should represent one logical change. A focused commit is easier to review, bisect, and revert.

**Write commit messages that explain the why, not just the what.** Future readers can see what changed from the diff. They cannot always infer why.

**Never commit secrets, credentials, tokens, or accidental artifacts.** Environment variables, API keys, credentials, and generated secrets do not belong in version control under any circumstances.

**Never commit broken builds, failing tests, or temporary hacks** intended to be cleaned up later. Cleanup debt accumulates.

---

## Decision framework

When multiple solutions are viable, prefer the one that:

1. Solves the actual problem
2. Changes the least code
3. Fits existing patterns
4. Is easiest to understand later
5. Is easiest to verify
6. Can be revised later with minimal cost

---

## When in doubt

- Choose the simpler solution
- Choose the more readable solution
- Choose the solution that requires less explanation
- Choose the solution with the smallest blast radius
- Do not introduce complexity to solve a problem you do not have yet
- Remove complexity before adding more
