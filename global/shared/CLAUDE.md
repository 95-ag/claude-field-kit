@rules/engineering.md

## Workflow Orchestration

### Hard Gates (STOP — bound to the trigger moment)

Non-negotiable stops. The numbered sections below expand each one.
- **Status question** ("what's next", "where are we", "status?") → answer and STOP. Never start work off a status question.
- **Non-trivial task** (3+ steps / architectural) → plan mode FIRST. No execution without an explicit "do / start / implement X".
- **Before the FIRST file write** → plan is user-approved AND `tasks.md` exists (with the plan path). No edit before both are true.
- **Before ANY index mutation** (`git add` / `rm` / `commit` / `restore --staged`) → propose the cluster + exact message and WAIT for approval. Never stage first.
- **"Complete"** = verification done AND explicit user sign-off in chat. A build pass is one form of verification — necessary, never the whole bar or a substitute for sign-off.

### 0. Status Questions Don't Start Tasks

- "whats next", "where are we", "what's left", "status?" — answer and STOP
- Never begin executing a task based on a status question
- A task begins only when the user explicitly says "do X", "start X", "implement X", or similar
- Queueing verbs (*add, queue, note, backlog, later*) mean record it in `tasks.md` and STOP — they are not execution verbs (*do, start, implement, build, fix now*). "Add X to the backlog" is an instruction to queue, not to begin.

### 1. Plan Node Default

- Default IS plan mode — execution requires explicit user instruction
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- When in doubt, plan. Do not rationalize past the threshold.
- If execution deviates or assumptions break, stop immediately and re-plan
- Use plan mode for verification steps, not just building
- Keep plans concise and actionable instead of writing long specs
- Read relevant `.claude/docs` files and check `.claude/work/session.md` before planning for context

#### Plan Document Requirements
- Commits Section:
  - each cluster must list: name, exact file paths to stage, exact single-line commit message
  - if a task produces no commits, state that explicitly. Plan approval covers listed clusters — no re-ask at execution time.
- Verification Section: how to confirm the work is correct end-to-end before marking done.


### 2. Subagent Strategy

- Use subagents only when necessary to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents when beneficial
- Avoid subagents for simple or linear tasks to prevent overhead and token waste
- Keep each subagent single-purpose with minimal tools and clear scope
- Use subagents to reduce main context load not to increase system complexity
- Announce any deviation from a subagent's intended process — never silently substitute the controller's review for a skill's own spec/quality review

### 3. Self-Improvement Loop

- After repeated corrections from the user: append to `.claude/work/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Review lessons when relevant
- Review `lessons.md` at the start of a plan; capture new lessons when wrapping up work-docs (not only after repeated corrections)

### 4. Verification Before Done

- Never mark a task complete without proving it works technically AND receiving user approval
- Build passing is necessary but not sufficient — user sign-off is required
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how
- Autonomy is over diagnosis and execution within the plan and verification gates — not a license to bypass them

## Task Management

1. **Plan First**: Write checkable items to `.claude/work/tasks.md` — required for any non-trivial task. Record the plan file path at the top of the task list so any session can resume. Plans live in the WSL global plans dir: `/home/ag-95/.claude/plans/<name>.md`.
2. **Verify Plan**: Get user approval before starting implementation
3. **Track Progress**: Check off items in `tasks.md` as completed; update `session.md` after each checkpoint. `tasks.md` is a live to-do list (overwritten as work moves on), not an archive.
4. **Complete = verification + sign-off**: A task is done only when verification is complete (build / tests / render as applicable — a build pass is one form of verification) AND the user has signed off in chat.
5. **Explain Changes**: Brief summary after each meaningful change
6. **Capture Lessons**: Append to `.claude/work/lessons.md` after repeated corrections

## Git Discipline

- Propose cluster(s) + exact single-line message(s) and wait for approval before any index-mutating command. Inside a plan, clusters must be written into the plan's Commits section — plan approval covers them; outside a plan, propose-and-wait in chat each time.
- Stage explicit paths only — never `git add -A`, `--all`, or `.`
- Commit messages: single line, `-m "..."` only
- Never open, merge, or delete PRs/branches — hand the user PR title + body + next-branch commands
- Project's `rules/git.md` owns the details

## Guardrails

- Diagnose a tool failure before changing any global config — establish what worked before and why it now appears unavailable.
- Never circumvent a blocked tool via an alternate path (PowerShell `Remove-Item` for a blocked `rm`, an `rm` buried in a script file, etc.) — the block **is** the approval gate. Propose the action and wait.
- Global-config changes (`~/.claude/`, shell dotfiles like `~/.profile`/`~/.bashrc`, `claude mcp add`, system packages) need their **own** explicit gate — never bundled into a plan or blanket "go ahead" that also covers project files. Don't widen the file set (e.g. sync a second copy) without asking.
- Never use `--break-system-packages`, `--force`, or equivalent override flags without permission. Safe alternatives, in order: `--user` install → project virtualenv → throwaway temp venv.
- Files outside the repo are not project-owned — `tmp/`, sibling directories, and extracted assets need explicit scope confirmation before writing. Read access ≠ write permission.

## Context and Memory

- Working/scratch notes files (planning scratch, skill notes, lessons drafts) go in `.claude/work/` — never in a skill folder or elsewhere
- One-off scripts and their outputs go in `tmp/<folder>/` (gitignored), not `.claude/work/` — `work/` is session notes only
- Check `.claude/work/session.md` at the start of every task for current state
- Update `session.md` at every checkpoint — not just session end:
  - After each `tasks.md` checkbox flip
  - After user approval of any step
  - Before any commit
  - After any architectural decision
  - When stopping work for >5 minutes
- Update on user-approved completion only — never on technical verification alone
