# Claude Field Kit

Source of truth for reusable Claude assets — rules, hooks, agents, skills, commands, plugins, and project
templates — and the operating manual for maintaining them.

It is **not** a backup of `~/.claude`: runtime state (caches, sessions, history, credentials) is excluded.

> This README is the full guide, read on demand. It is **not** auto-loaded into Claude sessions — that's
> `.claude/CLAUDE.md`, which points here.

## Contents
- [Why it exists](#why-it-exists)
- [Structure](#structure)
- [Placement](#placement)
- [Promotion and sync](#promotion-and-sync)
- [Project bootstrap](#project-bootstrap)
- [Authoring conventions](#authoring-conventions)
- [Hook conventions](#hook-conventions)

## Why it exists
Future project `.claude/` folders are gitignored (local-only), so anything reusable in them is lost when a
project is cleaned or re-cloned. Claude Field Kit is their durable home: improve an asset in a project, capture it
here, then sync it into future projects. Store only what's expected to be **reused** across projects or
environments — project-specific knowledge stays in the project.

## Structure
Three asset tiers plus a staging area:

```text
global/              # applies to every Claude environment
├── shared/          #   all environments (rules, hooks, skills, agents, CLAUDE.md)
├── windows/         #   Windows-desktop specifics (e.g. MSYS/WSL path rules)
├── wsl/             #   WSL specifics
└── tools/           #   delivery engine — global-sync.mjs composes global/ → ~/.claude on each env

project/             # copied into a new project's .claude/ — composed per project:
├── shared/          #   universal — every project
├── domains/<d>/     #   stack-agnostic capability: web-frontend, automation, …
├── stacks/<s>/      #   tooling per tech: node, python, …
└── repos/<name>/    #   bound to ONE named project — reused within it, NOT composed into others

incoming/            # staging (LOCAL-ONLY, gitignored) — captured by asset TYPE; tier at promotion (see Placement)
├── skills/
├── rules/
├── agents/
└── plugins/
```

A project composes its config by loading `shared` + each applicable `domain` + each applicable `stack`; a
multi-stack repo loads several stacks. `repos/<name>/` is the exception — it loads **only** into its own
named project, never composed into others; it is the durable home for that project's gitignored,
project-bound assets. Add a bucket only when a stack, capability, or named project first appears.

Working state (`session.md`, `tasks.md`, `lessons.md`) lives in `.claude/work/`, and `incoming/` is transient
capture→promote staging — both are **local-only, gitignored; the git repo never contains them**. Committed =
durable knowledge (`global/`, `project/`, `README.md`); local = ephemeral build state.

## Placement
What goes where:

- **Global** (`global/…`) — reusable across projects, not tied to one domain; part of the personal Claude
  workflow. *e.g.* engineering rules, git rules, safety hooks, debugging agents.
  `global/shared` every env · `global/windows` Windows/MSYS · `global/wsl` WSL.
- **Project shared** (`project/shared/`) — useful in most projects; bootstrap material. *e.g.* doc/work
  templates, planning workflows, review skills.
- **Domain** (`project/domains/<d>/`) — stack-agnostic capability. *e.g.* `web-frontend` (accessibility,
  design systems, motion, content, visual verification), `automation` (pipeline workflow, auth pauses, data integrity).
- **Stack** (`project/stacks/<s>/`) — tooling tied to a tech: build/verify gate, artifacts, `.gitignore`,
  stack git overrides. *e.g.* `node`, `python`.
- **Repo** (`project/repos/<name>/`) — bound to one named project (hardcoded paths/schema/components),
  not cross-project reusable, but durable and reused *within* that project. Its gitignored `.claude/`
  would lose them on clean — this is their home. Never composed into other projects. *e.g.* `portfolio`
  (content/asset/cover/review pipeline).

### Placement decision rule
Pick a tier by *reach*, not by where the asset came from (a globally-authored skill can still be
domain-scoped):
1. **Universal**, self-contained, any project regardless of domain/stack → `global/shared`
   (*e.g.* `spec-write`, `design-write`).
2. **Cross-project but domain-scoped** — only meaningful within one kind of work → `project/domains/<d>`
   (*e.g.* the `audit-*` design critiques + `implement-ai-seo` → `web-frontend`).
3. **Tied to a specific tool/tech** → `project/stacks/<s>`.
4. **Hardcoded to one project's structure** (paths, schema, components) → not cross-project reusable. If
   durable + reused within that project → `project/repos/<name>/` (its gitignored `.claude/` would lose
   it otherwise); if throwaway → leave it in the project. Never composed into other projects; generalize
   to a higher tier only on real cross-project demand — no speculative generalization.
5. **Exact or trivial-fork marketplace asset** → leave to plugin delivery; catalog it in the plugin
   reference (don't duplicate). Vendor a fork only when its customization is substantive.

## Promotion and sync
Assets flow **project → incoming → review → tier**. Never promote straight from a project — review first.

```text
improve in a project  →  incoming/<type>  →  review  →  promote to a tier
```

- **Capture by type, not scope** — staging sorts by asset type (`skills/ rules/ agents/ plugins/`). The
  reach-based **Placement rule** picks the tier (global vs project, and which domain/stack/repo) at
  promotion, not at capture.
- **Capture is hook-driven** — the global `asset-capture` hook auto-stages any edit under a project's
  `.claude/{rules,skills,agents,hooks}` into `incoming/<type>/<project>__<file>` (skills copied whole-dir)
  and queues a review task in that project's `tasks.md`. The staged copy is the no-loss capture; the task
  drives review→promote. Manual capture remains the fallback.
- **Promote = place in the tier AND remove the staged copy from `incoming/`.** Verify the tier copy exists
  before deleting the incoming one (no-loss). `incoming/` then holds only un-promoted items.
- **Only reusable assets promote** — project-specific knowledge stays in the project.
- **Promote as the comprehensive general version** — strip project specifics AND fill the obvious gaps so the
  asset stands as the complete best-practice rule for its area; enter content as principles, not one project's
  constants, and neutralize or relabel worked examples that read as project bias. A thin generalized subset is
  not the goal.
- **Skills promote without `evals/`** — eval fixtures are dev-time test data (project-specific golden runs,
  often embedding real paths / repo URLs), not shipped assets. Strip the `evals/` dir on promotion; a skill
  ships as `SKILL.md` + `references/` only.
- **Disposition table before deleting** scratch or source notes — map every item to promoted / rejected /
  project-specific (zero-loss; name the authoritative copy), then a separate fresh-eyes review, before removing anything.
- **Verify reference integrity on promotion** — grep the asset for `references/`/sibling-doc pointers and
  confirm each target exists; remove or create dead pointers.
- **Sync** (when a reusable asset changes): update it in the project → decide if the change is reusable →
  update Claude Field Kit → sync future projects from it. Claude Field Kit is the source of truth.
- **Global tier delivery** — the `global-sync` tool (`global/tools/global-sync.mjs`, via the `global-sync`
  skill) composes `global/shared` + the env overlay and delivers it to each `~/.claude` (Windows + WSL),
  transforming `hooks.json` into that env's `settings.json` (WSL-wrapped on Windows, bare `node` on WSL).
- **Plans + memory sync cross-env** — the global `plans-memory-sync` hook (SessionStart + SessionEnd) unions
  `~/.claude/plans/` and auto-memory between the Windows and WSL homes (newest-wins, never-delete; memory
  project-keys remapped per env). Runtime continuity, not asset promotion.
- **Compose, never ship shared alone:** bootstrapping a project pulls `shared` + every applicable
  domain/stack (incl. their `hooks.json`); the global env pulls `global/shared` + the matching env overlay.

## Project bootstrap
A new project's `.claude/` is seeded from `project/shared` (+ its domains/stacks). What you fill, and the
rule for each (detail lives in each template):

- **`CLAUDE.md`** (from `CLAUDE.template.md`) — repo-specific facts only: identity, stack, commands,
  rules-pointer, constraints. Workflow / git / guardrails / engineering / memory live in global
  `~/.claude/CLAUDE.md` (always loaded) — reference it, don't restate. Optional sections only when no rule owns them.
- **Work files** (from `work/*.template.md`) — always-loaded, so keep lean: current phase full, last 1–2
  phases crisp, prune older; datestamp Done/Decisions/Deferred (ISO). `tasks` clusters active work (each
  naming its plan(s)); `lessons` is curated — promote reusable ones to a rule, remove stale, don't archive.
- **Docs** (see `project/shared/docs/README.md`) — mandatory PROJECT + IMPLEMENTATION-PLAN; ARCHITECTURE /
  SCHEMA / DESIGN optional, split out only when substantial (else fold into PROJECT). `spec-write` writes
  the non-design docs; `design-*` own DESIGN.

The actionable, discovery-driven procedure lives in `project/shared/BOOTSTRAP.md` — follow it to seed a project's `.claude/`. This section is the conceptual model; BOOTSTRAP.md is the steps.

## Authoring conventions
Rules and Claude-facing docs must be **machine-readable, human-scannable, and low-load** — fully actionable
with minimal other context loaded:

- Bullets over prose; one concept per line; no filler. If a line gets overloaded, break it into multiple
  lines or sub-points rather than packing concepts onto one — machine-readability never at the cost of human
  scannability.
- No duplication across files — state a rule once, cross-reference it.
- **Skill names** use `<domain>-<verb>` with a non-colliding prefix (`design-write`, `spec-write`) — not
  noun-only (`project-docs`) or a broad `project-*` prefix that collides across skills.
- Clear, crisp, clean — the smallest content that fully conveys the rule. Trimming removes redundancy and
  filler, never usable info: condense the wording, never drop a rule's actual content.
- Split by what must load together: keep stack/domain specifics out of the shared core so a project loads
  only what applies.
- Template files (skeletons copied into a project and filled) use the `.template.md` suffix; the bootstrap
  procedure (`project/shared/BOOTSTRAP.md`) drops the suffix when seeding a project.
- Keep any single **auto-loaded** doc under ~200 lines; split longer ones by sub-topic. (This README is read
  on demand, not auto-loaded, so it may run longer.)

## Hook conventions
Hooks live in two tiers:

- **Global** (`global/shared/hooks/`) — the machine-wide safety net + workflow hooks: `command-firewall`,
  `file-protect`, `git-commit-guard`, the `session-checkpoint-nudger`, and the `hub-dirty-flag` /
  `asset-capture` / `plans-memory-sync` hooks. The `global-sync` tool delivers them to both `~/.claude/hooks/`
  and registers them in `~/.claude/settings.json` — no per-project wiring.
- **Per-project** (`project/<tier>/hooks/`) — repo-opinionated hooks composed into a project's `.claude/` at
  bootstrap: `code-formatter` (every project) + `ai-prose-guard-mdx` (web-frontend).

The conventions below apply to both tiers:

- **Unionized config, not per-stack splits** — one shared hook carries the union of names across stacks/shells;
  non-matching names stay inert. Fallback if unworkable: build-time merge at bootstrap.
- **Nested-path coverage** — segment-anchor dirs `(^|/)<name>/`; basename/segment-match files `(^|/)<file>$`;
  never `startsWith`/exact full-path. Block/ask tiers must be nested-safe; heuristics may be root-anchored.
- **Normalize separators** — `\` → `/` before matching (Windows/WSL parity).
- **Cross-shell** — command/commit hooks register for both `Bash` and `PowerShell`.
- **Fail closed (security) / fail open (quality)** — on unparseable input, security guards (firewall,
  file/commit protection) BLOCK; quality hooks (formatter, prose, nudger) SKIP. Suppress subprocess stderr
  (e.g. git `fatal:`) so tool noise never leaks.
- **`ask` = deny when unattended** — exit-2/`deny` blocks in all modes (incl. bypass/auto), before permission
  rules. A PreToolUse `ask` aborts headless/auto (no human → denied). Use `deny`/exit-2 for must-always-block;
  `ask` only to pause for a human; **nudges never `ask`**.
- **Advisories use `additionalContext`, not stderr** — a warn/nudge that wants Claude to *act* emits
  `hookSpecificOutput.additionalContext` (read next turn; works auto/headless), worded as the intended action.
  stderr+exit-0 is human-only. Post-action advisories run as **PostToolUse**.
- **`.claude/` is local-only** — gitignored, hard-blocked from commits.

### Hook registration
Each tier with hooks carries a `hooks.json` manifest (a `settings.json` `hooks` fragment) — source of truth
for which event + matcher each hook binds to.

- **Wiring (global):** the `global-sync` tool transforms `global/shared/hooks.json` into each env's
  `~/.claude/settings.json` `hooks` (smart-merge preserves user-owned entries); commands use absolute
  `~/.claude/hooks/` paths.
- **Wiring (per-project):** the bootstrap procedure deep-merges `project/shared/hooks.json` + each active
  domain/stack `hooks.json` into the project's `.claude/settings.json`; PreToolUse/PostToolUse arrays
  concatenate; `"//"` keys dropped.
- **Cross-shell:** command/commit hooks bind `"matcher": "Bash|PowerShell"`; file hooks bind
  `Write|Edit|MultiEdit|NotebookEdit`.
- **Command form:** global hooks → `node "/home/<user>/.claude/hooks/<hook>.mjs"`; per-project hooks →
  `node "$CLAUDE_PROJECT_DIR/.claude/hooks/<hook>.mjs"`. The Windows-desktop-over-WSL environment wraps
  either **WSL-first** (`wsl -d ubuntu bash -lc '…'`) — see `global/windows/rules/windows-claude.md` § Hooks.
- **Exec env:** resolved — hooks run under the Windows↔WSL harness (`node` resolves, stdin passes through,
  settings load at session start). The environment-specific command form and the open `$CLAUDE_PROJECT_DIR`
  path-format item are documented in `windows-claude.md` § Hooks.
