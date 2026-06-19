---
name: task
description: >
  Add a task to the current project's task list (.claude/work/tasks.md) at the right place, in the house
  format. Use when the user wants to queue/record a to-do — "/task ...", "add a task", "note this for
  later", "backlog this", "queue X", "remind me to do Y", "track that we need to Z" — WITHOUT starting it.
  It only RECORDS the task (queueing, never execution); it never begins the work. Places active items under
  the Now section and deferrals under Backlog, matching the tasks.md template shape. Scope:
  .claude/work/tasks.md only — not a general note-taker, not /checkpoint, not the asset-capture hook.
---

# task — queue a task into the project's task list

Records a to-do in the current project's `.claude/work/tasks.md` at the right place and format, without
starting it.

## When to use

- The user says "/task …", "add a task", "queue / note / backlog this", "remind me to …", "track that we
  need to …" — i.e. they want it recorded, not done now.
- Queueing is the whole job: **record, never execute.** (Matches the global rule — queueing verbs add to the
  list; execution verbs like "do / start / implement" do not apply here.)

## What it does

1. Locate `.claude/work/tasks.md` in the current project. If it's genuinely absent and the project uses the
   convention, create it from the `work/tasks.template.md` shape; otherwise ask where the task should go.
2. Phrase the task as one checkbox line in the house format:
   `- [ ] **<short title>** — <what + why, one line>` (append `(YYYY-MM-DD)` if the doc datestamps entries).
3. Place it:
   - **Now / active** section when the user marks it current or next.
   - **Backlog** (default) when it's a deferral / later item.
   - Match the project's actual section names if they differ; create a `## Backlog` section only if none fits.
4. Dedup: if a near-identical item already exists, point at it instead of adding a duplicate.

## Scope / boundaries

- Touches `.claude/work/tasks.md` only — never code, plans, or other work docs.
- Records only; does NOT start, plan, or check off the task.
- Distinct from the `asset-capture` hook (auto-queues *harvest* tasks) and `/checkpoint` (reconciles all work
  docs). `/task` is the on-demand, user-driven single-task add.
