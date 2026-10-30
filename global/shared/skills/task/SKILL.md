---
name: task
description: >
  Add a task to the current project's task list (.claude/work/tasks.md) at the right place, in the house
  format. Use when the user wants to queue/record a to-do — "/task ...", "add a task", "note this for
  later", "backlog this", "queue X", "remind me to do Y", "track that we need to Z" — WITHOUT starting it.
  It only RECORDS the task (queueing, never execution); it never begins the work. Places active items under
  the Now section and deferrals under Backlog, matching the shape tasks.md already has. Scope:
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
   convention, create it matching the shape of its sibling work docs; otherwise ask where the task should go.
2. Phrase the task as one **flat** checkbox item in the file's existing entry shape — by default
   `- [ ] **<short title>** — <what + why>`, wrapped to the file's width.
   - *Flat* means no cluster nesting, not one physical line.
   - Cluster grouping and a `plan: <path>` header are set at plan-time, not by this skill.
   - **A Backlog add is a deferral, so it names its subject** — the file, the line, and a quote where one
     applies. An entry only its author could act on is not ready to defer.
   - **Datestamp a Backlog add** (ISO `YYYY-MM-DD`); a Now entry carries none.
   - The date is what makes staleness checkable later.
3. Place it:
   - **Now / active** section when the user marks it current or next.
   - **Backlog** (default) when it's a deferral / later item.
   - Match the project's actual section names if they differ; create a `## Backlog` section only if none fits.
4. Dedup: if an open item already has the same subject (file and line) or the same title, point at it
   instead of adding a duplicate.

## Scope / boundaries

- Touches `.claude/work/tasks.md` only — never code, plans, or other work docs.
- Distinct from the `asset-capture` hook (auto-queues *harvest* tasks) and `/checkpoint` (reconciles all work
  docs). `/task` is the on-demand, user-driven single-task add.
