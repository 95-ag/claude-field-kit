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

1. **`session.md`** — update each section in template order: `## Phase` (current state) → `## Next` →
   `## Blockers` → `## Decisions locked` (add any newly locked one) → `## Deferred` → `## Done` (prepend the
   latest milestone, newest first). ISO-datestamp Done / Decisions / Deferred entries. Prune `## Done` 3+
   phases back (current phase full, last 1–2 crisp).
2. **`tasks.md`** — flip completed checkboxes to `[x]`; move finished clusters to `## Done`; keep `## Now`
   (clusters + their `plan: <path>`), `## Open decisions`, and `## Backlog` accurate; durable deferrals stay
   in Backlog, never under Now. Prune `## Done`: drop only the done items of plans that are **fully complete** —
   keep the current plan's done sub-tasks.
3. **`lessons.md`** — append any new correction/lesson (lead with the rule, 2–3 lines). To prune, **surface the
   candidates for the user's call** — promote to a rule file / relocate / keep / drop — never silently delete.

## Guarantees

- Idempotent — re-running just re-checkpoints the current state; no duplication.
- No fabrication — record only what actually happened; if a task isn't verified+signed-off, it is not "Done".
- Never silent-deletes a lesson — pruning lessons is always the user's call.
- Doc-only — never commits, never edits code/plans/memory.
