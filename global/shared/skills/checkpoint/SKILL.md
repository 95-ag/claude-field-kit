---
name: checkpoint
description: checkpoint — checkpoint the project's work docs for clean handoff
---

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

## Run it yourself — never from a subagent

A dispatched subagent stops and reports back instead of writing.

## Procedure

Read the three work docs first and match the voice and section names they already have, then update:

1. **`session.md`**
   - Update each section in this order (default names): `## Phase` (current state) → `## Next` → `## Blockers` →
     `## Decisions locked` (add any newly locked one) → `## Deferred` → `## Done`.
   - Prepend the latest milestone to `## Done`, newest first.
   - Datestamp Done / Decisions / Deferred entries (ISO `YYYY-MM-DD`).
   - Prune `## Phase` and `## Done` per **Pruning**.
   - Re-check every `## Blockers` and `## Deferred` entry per **Stale open items**.
2. **`tasks.md`**
   - Flip completed checkboxes to `[x]`; move finished clusters to `## Done`.
   - Keep `## Now` (clusters + their `plan: <path>`), `## Open decisions` and `## Backlog` accurate; durable
     deferrals stay in Backlog, never under Now.
   - Datestamp Done and Backlog entries (ISO `YYYY-MM-DD`); a Now entry carries none.
   - Prune `## Now` and `## Done` per **Pruning** — in `## Done`, drop only the items of plans that are
     **fully complete**, keeping the current plan's done sub-tasks.
   - Re-check `## Backlog` per **Stale open items**.
3. **`lessons.md`**
   - Append any new correction/lesson (lead with the rule, 2–3 lines).
   - To prune, **surface the candidates for the user's call** — promote to a rule file / relocate / keep /
     drop — never silently delete.

## Pruning — the live sections too, not only `## Done`

- Move every signed-off block out of `## Phase` / `## Now` — no signed-off work stays in a live section.
- `## Done` ages the same way in both docs — current phase in full, last 1–2 phases crisp, 3+ back dropped.
- Write the block's `## Done` entry as part of the prune; never cut a block before its entry exists.
- Verify that entry by reading it — a grep for the work's name matches older, unrelated entries.
- Move forward-looking constraints into `## Done` or `## Decisions locked` before cutting. Detail is
  droppable; a constraint is not.
- Account for every line of a cut block — moved into `## Done` / `## Decisions locked`, or dropped on
  purpose. A section-level check misses a dropped line.
- A standing reference every session needs is not phase state.
- Where both docs carry a round, `session.md` owns the record and `tasks.md` keeps the checklist.

## Stale open items

`## Blockers`, `## Deferred` and `## Backlog` entries stay in the doc until someone removes them, so a
dead one keeps reading as live work.

- Verify each against the tree before restating it — grep its consumers or read the file. Drop what has
  landed and say so, never silently.
- A new deferred entry names its subject — the file, the line, and a quote where one applies. An entry only
  its author could act on is not ready to defer.
- When a fix lands, grep `## Blockers`, `## Deferred` and `## Backlog` for the entries it closed.

## Guarantees

- Idempotent — re-running just re-checkpoints the current state; no duplication.
- No fabrication — record only what actually happened; if a task isn't verified+signed-off, it is not "Done".
- Doc-only — never commits.
