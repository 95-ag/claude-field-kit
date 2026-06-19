# Plugin Reference — global scope

> Catalog of **machine-wide** plugins + external skills claude-field-kit relies on. Delivery rule: *reference,
> don't vendor* — exact or trivial-fork marketplace assets are installed via their plugin and catalogued
> here, never copied into the tiers (README § Placement, Rule 5). This doc is the source of truth for
> `claude-sync`'s global bootstrap.
>
> Scope = **where to install**, not where authored. Project-scoped frontend plugins live in
> `project/domains/web-frontend/plugins/README.md`.

## At a glance

| plugin | scope | status | source |
|--------|-------|--------|--------|
| superpowers | global | installed | claude-plugins-official |
| skill-creator | global | installed | claude-plugins-official |

## Marketplace

- `claude-plugins-official` → `anthropics/claude-plugins-official` (GitHub) — the configured source.

## Plugins

### `superpowers`

- Install: `/plugin install superpowers@claude-plugins-official`
- "Core skills library: TDD, debugging, collaboration patterns, and proven techniques."
- Contents — **14 skills + 1 hook** (no plugin-level agents/commands):

| type  | name | what it does | remarks |
|-------|------|--------------|---------|
| skill | brainstorming | explore intent / requirements / design before any creative work | |
| skill | test-driven-development | write the test first, watch it fail, minimal code, refactor | prereq for `writing-skills` |
| skill | systematic-debugging | root-cause any bug / test failure before proposing fixes | |
| skill | writing-plans | turn a spec into a multi-step plan before touching code | |
| skill | executing-plans | execute a written plan in a separate session with checkpoints | |
| skill | subagent-driven-development | execute plan tasks via subagents in the current session | |
| skill | dispatching-parallel-agents | fan out 2+ independent tasks with no shared state | |
| skill | requesting-code-review | verify completed work meets requirements before merge | |
| skill | receiving-code-review | apply review feedback with rigor + verification | |
| skill | verification-before-completion | evidence before claiming done / fixed / passing | |
| skill | finishing-a-development-branch | structured merge / PR / cleanup options | |
| skill | using-git-worktrees | isolated workspace via native tools or worktree fallback | |
| skill | writing-skills | create / edit / verify skills before deployment | best for behavioral / process / judgment skills — TDD-for-process, success = compliance under pressure (vs `skill-creator` for output skills) |
| skill | using-superpowers | bootstrap skill discovery at conversation start | |
| hook  | session-start | superpowers session bootstrap (`hooks/hooks.json`) | |

### `skill-creator`

- Install: `claude plugin install skill-creator@claude-plugins-official --scope user` (Anthropic,
  `./plugins/skill-creator`) — deliver via plugin, **do not vendor**. Supersedes the former incoming
  standalone copy. Installed user-scope + enabled on WSL + Windows (2026-06-17).
- Contents — full bundle (`SKILL.md` + agents · references · scripts · eval-viewer · assets):

| type  | name | what it does | remarks |
|-------|------|--------------|---------|
| skill | skill-creator | create new skills, improve existing ones, run evals + benchmark performance | best for output-producing skills + fixing bad triggering — eval / benchmark-driven, ships a description optimizer (vs superpowers `writing-skills` for behavioral skills) |

## Harness-bundled

- Skills shipped with Claude Code itself (e.g. `anthropic-skills:*`) need no install and are **out of
  scope** for `claude-sync`.

## claude-sync bootstrap

- Global-scope plugins here install **machine-wide** at bootstrap.
- Sync reads this doc as the source of truth and **never re-vendors** marketplace-delivered content.
