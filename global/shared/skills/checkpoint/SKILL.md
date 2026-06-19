# checkpoint — checkpoint the project's work docs for clean handoff

Bring all `.claude/work/` docs to a current, resumable state — before leaving, clearing context, or
compaction. This is the on-demand counterpart to the `session-checkpoint-nudger` hook: the hook *reminds*;
this skill *does the write*.

## When to use

- Before ending a work session, clearing context, or an expected compaction.
- After a meaningful milestone (a task/cluster completed, a decision locked) when you want the docs current.
- When the user says "checkpoint", "update the work docs", "save state for handoff/resume".

## Scope

`.claude/work/` only — `session.md`, `tasks.md`, `lessons.md`. Do NOT touch plans, memory, or code (plans
and memory sync via their own mechanisms). This skill only reconciles the work docs with what just happened.

## Procedure

Read the three work docs first (match their existing voice and the `work/*.template.md` shapes), then update:

1. **`session.md`** — set `## Phase` to the current state; prepend the latest milestone under `## Done`
   (newest first, ISO datestamp); add any newly **locked decision** under `## Decisions locked`; set
   `## Next`; note any `## Blockers`. Keep it lean (current phase full, last 1–2 crisp, prune older).
2. **`tasks.md`** — flip completed checkboxes to `[x]`; move finished clusters to `## Done`; keep `## Now`
   and `## Backlog` accurate; durable deferrals stay in Backlog, never under Now.
3. **`lessons.md`** — append any new correction/lesson (lead with the rule, 2–3 lines); flag any worth
   promoting to a durable rule.

## Guarantees

- Idempotent — re-running just re-checkpoints the current state; no duplication.
- No fabrication — record only what actually happened; if a task isn't verified+signed-off, it is not "Done".
- Doc-only — never commits, never edits code/plans/memory.
