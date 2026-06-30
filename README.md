# Claude Field Kit

A curated library of reusable Claude Code assets — rules, hooks, agents, skills, slash commands, plugin
references, and project templates — and the conventions for organizing and delivering them across projects
and machines.

Improve an asset in one project, capture it here, and sync it into the others — the durable home for assets
that would otherwise die in a project's gitignored `.claude/`.

**Who it's for:** primarily a personal kit, public so the tiering model and the capture → review → promote →
deliver workflow can be borrowed. It is **not** a backup of `~/.claude` — runtime state (caches, sessions,
history, credentials) is excluded.

## Contents
- [Overview](#overview) — what it is, why, and what's inside (start here)
- [Assets](#assets) — the tiers, and where each asset lives
- [System](#system) — capture, promote, deliver, and the authoring/hook conventions

## Overview

### Why it exists
A project's `.claude/` is gitignored, so the rules, hooks, and skills you improve there vanish when it's
cleaned or re-cloned. This kit is their durable home: **capture** an asset out of a project, then **sync** it
into the others. Only reusable assets belong here — project-specific knowledge stays in the project.

### Cross-machine setup (Windows + WSL)
A personal quirk: my projects live in WSL, but I sometimes work them from the Windows desktop app (easier
visualization), and want parity either way. So the kit delivers to **both** `~/.claude` homes — `global/shared`
for everything common, `global/windows` and `global/wsl` for per-environment specifics (e.g. MSYS/WSL path
rules). **Single-environment users can ignore the split** and use `global/shared`.

**Double-loaded global config (Windows-app-over-WSL).** Claude Code loads every `CLAUDE.md` from the project
folder up to the drive root. WSL projects sit under `/home/<user>/`, so it also loads `/home/<user>/.claude/CLAUDE.md`
(+ its `rules/`) — the same `global/shared` already loaded from the Windows `~/.claude`. It loads twice. Fix:
add to the **Windows** `~/.claude/settings.json` (`global-sync` keeps it; WSL-native doesn't need it):

```json
{ "claudeMdExcludes": ["**/<user>/.claude/CLAUDE.md", "**/<user>/.claude/rules/**"] }
```

### What's inside
Three asset tiers plus a staging area:

```text
global/              # applies to every Claude environment
├── shared/          #   all environments (rules, hooks, skills, agents, CLAUDE.md)
├── windows/         #   Windows-desktop specifics (e.g. MSYS/WSL path rules)
├── wsl/             #   WSL specifics
└── tools/           #   delivery engine — global-sync.mjs composes global/ → ~/.claude per env

project/             # copied into a new project's .claude/, composed per project:
├── shared/          #   universal — every project
├── domains/<d>/     #   stack-agnostic capability: web-frontend, automation, …
├── stacks/<s>/      #   tooling per tech: node, python, …
└── repos/<name>/    #   bound to ONE named project — reused within it, not composed into others

incoming/            # staging (local-only, gitignored) — captured by asset TYPE; tier assigned at promotion
├── rules/ · skills/ · agents/ · hooks/   # auto-captured by the asset-capture hook
├── notes/                                # hand-staged rough items (lessons, deferred global edits, ideas, hook bugs)
└── plugins/                              # plugin refs
```

## Assets

### The tiers in detail
A project composes its config by loading `shared` + each applicable `domain` + each applicable `stack` (a
multi-stack repo loads several). What each tier holds:

- **Global** (`global/…`) — reusable across projects, not tied to one domain; part of the personal Claude
  workflow. *e.g.* engineering rules, git rules, safety hooks, debugging agents.
  `global/shared` every env · `global/windows` Windows/MSYS · `global/wsl` WSL.
- **Project shared** (`project/shared/`) — useful in most projects; bootstrap material. *e.g.* doc/work
  templates, planning workflows, review skills.
- **Domain** (`project/domains/<d>/`) — stack-agnostic capability. *e.g.* `web-frontend` (accessibility,
  design systems, motion, content, visual verification), `automation` (pipeline workflow, auth pauses, data integrity).
- **Stack** (`project/stacks/<s>/`) — tooling tied to a tech: build/verify gate, artifacts, `.gitignore`,
  stack git overrides. *e.g.* `node`, `python`.
- **Repo** (`project/repos/<name>/`) — bound to one named project (hardcoded paths/schema/components), not
  cross-project reusable. *e.g.* `portfolio` (content/asset/cover/review pipeline).

And the composition rules:

- `repos/<name>/` is the exception — it loads **only** into its own named project, never composed into others;
  it's the durable home for that project's gitignored, project-bound assets.
- Add a bucket only when a stack, capability, or named project first appears.

### Placement — picking a tier by reach
Pick a tier by *reach*, not by where the asset came from (a globally-authored skill can still be
domain-scoped):

1. **Universal**, self-contained, any project regardless of domain/stack → `global/shared`
   (*e.g.* `spec-write`, `design-write`).
2. **Cross-project but domain-scoped** — only meaningful within one kind of work → `project/domains/<d>`
   (*e.g.* the `audit-*` design critiques + `implement-ai-seo` → `web-frontend`).
3. **Tied to a specific tool/tech** → `project/stacks/<s>`.
4. **Hardcoded to one project's structure** (paths, schema, components) → not cross-project reusable. If
   durable + reused within that project → `project/repos/<name>/` (its gitignored `.claude/` would lose it
   otherwise); if throwaway → leave it in the project. Never composed into other projects; generalize to a
   higher tier only on real cross-project demand — no speculative generalization.
5. **Exact or trivial-fork marketplace asset** → leave to plugin delivery; catalog it in the plugin
   reference (don't duplicate). Vendor a fork only when its customization is substantive.

---

## System

> **Dense reference — skip unless you want to understand the workings and replicate or operate this kit
> yourself.** None of this is needed to understand or borrow assets; it's the capture, promotion, delivery,
> and authoring machinery.

- [The maintenance loop](#the-maintenance-loop) — capture → review → promote
- [Promotion & sync](#promotion--sync) — what promotes, and how it's delivered
- [Review gate](#review-gate) — the per-item preview before promoting
- [Project bootstrap](#project-bootstrap) — seeding a new project's `.claude/`
- [Authoring conventions](#authoring-conventions)
- [Hook conventions](#hook-conventions)

### The maintenance loop
Assets flow **project → incoming → review → tier**. Never promote straight from a project — review first.

```text
improve in a project  →  incoming/<type>  →  review  →  promote to a tier
```

- **Capture by type, not scope** — staging sorts by asset type (`rules/ skills/ agents/ hooks/`). The
  reach-based [Placement rule](#placement--picking-a-tier-by-reach) picks the tier (global vs project, and
  which domain/stack/repo) at promotion, not at capture.
- **`notes/` holds rough items, not finished assets** — a lesson you haven't placed yet, a global edit you
  didn't want to make mid-task, an idea for a new asset, or a bug in an existing hook. At harvest these are
  triaged: turned into a rule/asset and promoted, applied as a fix, or dropped.
- **Capture is hook-driven** — the global `asset-capture` hook auto-stages any edit under a project's
  `.claude/{rules,skills,agents,hooks}` into `incoming/<type>/<project>__<file>` (skills copied whole-dir)
  and queues a review task in that project's `tasks.md`. The staged copy is the no-loss capture; the task
  drives review→promote. Manual capture remains the fallback.
- **Global-only assets need manual capture** — a global rule, the shared `CLAUDE.md`, or a global-only skill
  has no project `.claude/` copy, so the hook never sees it; stage a shaped fix by hand into `incoming/<type>/`,
  or an unsure/deferred one into `incoming/notes/`.
- **Promote = place in the tier AND remove the staged copy from `incoming/`.** Verify the tier copy exists
  before deleting the incoming one (no-loss). `incoming/` then holds only un-promoted items.

### Promotion & sync
- **Only reusable assets promote** — project-specific knowledge stays in the project.
- **Promote as the comprehensive general version** — strip project specifics AND fill the obvious gaps so the
  asset stands as the complete best-practice rule for its area; enter content as principles, not one project's
  constants, and neutralize or relabel worked examples that read as project bias. A thin generalized subset is
  not the goal.
- **Separate the general rule from its project costume** — a captured learning often carries a genuinely
  general rule wearing project specifics. Lift the general part out; keep only the truly domain-specific part,
  as a conditional. Don't harden a composition-specific tactic into a universal mandate; default to the most
  general framing and let the user tighten.
- **Repo-tier promotes verbatim** — an asset bound to one named project (`repos/<name>/`) mirrors that
  project; copy it as-is. Generalization applies only to shared / cross-project tiers.
- **Skills promote without `evals/`** — eval fixtures are dev-time test data (project-specific golden runs,
  often embedding real paths / repo URLs), not shipped assets. Strip the `evals/` dir on promotion; a skill
  ships as `SKILL.md` + `references/` only.
- **Reconcile file-by-file** — read → merge in context → place each file individually. No bulk `cp`/scripts
  that skip the per-file review (a `cp` is fine only to *apply* a candidate already reviewed in a diff tool).
- **Cold no-loss review per merge** — genericizing silently weakens specifics (exact paths, named values, hard
  mandates, rationale sentences). Diff the merged asset against the original and re-apply any dropped delta;
  for additive edits, the no-loss proof is a removed-lines-only diff.
- **Verify before folding a lesson** — add / strengthen / drop-as-already-covered, in the right section; never
  blind-append (a large share of a batch is often already present).
- **A captured update diffs both ways** — it can carry regressions (shortened cross-refs, dropped tool-flexible
  hedges), not just additions. Merge the genuine net-new; restore the kit's general form where the capture weakened it.
- **Disposition table before deleting** scratch or source notes — map every item to promoted / rejected /
  project-specific (zero-loss; name the authoritative copy), then a separate fresh-eyes review, before removing anything.
- **Deferred removal when a delete is blocked** — if a guard (e.g. the command-firewall on `rm -rf`) blocks
  deleting promoted `incoming/` copies, accumulate them in a removal list and run it at the end; never route
  around the block.
- **Verify reference integrity on promotion** — grep the asset for `references/`/sibling-doc pointers and
  confirm each target exists; remove or create dead pointers.
- **Sync** (when a reusable asset changes): update it in the project → decide if the change is reusable →
  update Claude Field Kit → sync other projects from it. Claude Field Kit is the source of truth.

Delivery:

- **Global tier** — the `global-sync` tool (`global/tools/global-sync.mjs`, via the `global-sync` skill)
  composes `global/shared` + the env overlay and delivers it to each `~/.claude` (Windows + WSL),
  transforming `hooks.json` into that env's `settings.json` (WSL-wrapped on Windows, bare `node` on WSL).
- **Plans + memory** — the global `plans-memory-sync` hook (SessionStart + SessionEnd) unions
  `~/.claude/plans/` and auto-memory between the Windows and WSL homes (newest-wins, never-delete; memory
  project-keys remapped per env). Runtime continuity, not asset promotion.
- **Compose, never ship `shared` alone** — bootstrapping a project pulls `shared` + every applicable
  domain/stack (incl. their `hooks.json`); the global env pulls `global/shared` + the matching env overlay.

### Review gate
Promoted assets run **handsfree** across every session, so nothing lands without an owner preview.

- **Per-item preview shape** — location (path + tier + handsfree blast radius) → verbatim incoming → curated
  final in full section context with change markers → disposition. Curation is applied before showing.
- **Full section context, not the isolated snippet** — enough to judge overlap / conflict / reinforcement;
  the owner decides from the message alone.
- **Don't rubber-stamp** — check each merge against the authoring conventions (duplication, overloaded lines,
  voice/density match) and tighten before applying; if a bullet got contorted by iterative edits, rewrite it clean.
- **Strict one-item loop** — preview → apply → next; no batching.
- **Heavily-rewritten item** — build the merged candidate in a scratch file and review it in a diff tool
  (incoming-vs-merged for what's dropped, current-vs-merged for what changes); iterate, then apply.
- **Repo-tier item** — same diff review, then apply verbatim.

### Project bootstrap
A new project's `.claude/` is seeded from `project/shared` (+ its domains/stacks). The actionable,
discovery-driven procedure lives in `project/shared/BOOTSTRAP.md` — this section is the conceptual model.
What you fill, and the rule for each (detail lives in each template):

- **`CLAUDE.md`** (from `CLAUDE.template.md`) — repo-specific facts only: identity, stack, commands,
  rules-pointer, constraints. Workflow / git / guardrails / engineering / memory live in global
  `~/.claude/CLAUDE.md` (always loaded) — reference it, don't restate. Optional sections only when no rule owns them.
- **Work files** (from `work/*.template.md`) — always-loaded, so keep lean: current phase full, last 1–2
  phases crisp, prune older; datestamp Done/Decisions/Deferred (ISO). `tasks` clusters active work (each
  naming its plan(s)); `lessons` is curated — promote reusable ones to a rule, remove stale, don't archive.
- **Docs** (see `project/shared/docs/README.md`) — mandatory PROJECT + IMPLEMENTATION-PLAN; ARCHITECTURE /
  SCHEMA / DESIGN optional, split out only when substantial (else fold into PROJECT). `spec-write` writes
  the non-design docs; `design-*` own DESIGN.

### Authoring conventions
Rules and Claude-facing docs are **machine-readable, human-scannable, and low-load** — fully actionable with
minimal other context loaded.

> The full authoring + contribution guide is delivered to every project as
> [`contributing-to-claude-field-kit.md`](project/shared/rules/contributing-to-claude-field-kit.md) — these
> conventions are mirrored there for builders.

- Bullets over prose; one concept per line; no filler. If a line gets overloaded, break it into multiple
  lines or sub-points rather than packing concepts onto one — machine-readability never at the cost of human
  scannability.
- No duplication across files — state a rule once, cross-reference it; even within a multi-file asset, put the
  rule in one canonical file and reference it from the others.
- **Skill names** use `<domain>-<verb>` with a non-colliding prefix (`design-write`, `spec-write`) — not
  noun-only (`project-docs`) or a broad `project-*` prefix that collides across skills.
- **Match the house voice — kit conventions ONLY.** Reuse existing assets' terminology, section shape, and
  density; don't coin a synonym for a concept already named. Never import another framework's voice (e.g.
  superpowers' *Iron Law* / *Red flags — STOP*); a skill drafted via an external tool (`writing-skills`,
  `skill-creator`) is realigned to the kit's voice — `checkpoint`'s shape is the reference — before promoting.
- **Concrete over vague** — prefer concrete metrics to vague thresholds ("split past ~10 items", not "when it
  gets big").
- **Principle vs mechanic** — keep the principle in its own rule and a tool-specific mechanic in that tool's
  rule; don't duplicate one lesson across both.
- **Multi-mode asset → mode-neutral checks** — write a skill's validation/check doc neutral by default, tag
  the genuinely mode-specific checks, and run validation in every mode (a check framed for one mode silently
  skips the others).
- Clear, crisp, clean — the smallest content that fully conveys the rule. Trimming removes redundancy and
  filler, never usable info: condense the wording, never drop a rule's actual content.
- Split by what must load together: keep stack/domain specifics out of the shared core so a project loads
  only what applies.
- Template files (skeletons copied into a project and filled) use the `.template.md` suffix; the bootstrap
  procedure (`project/shared/BOOTSTRAP.md`) drops the suffix when seeding a project.
- Keep any single **auto-loaded** doc under ~200 lines; split longer ones by sub-topic. (This README is read
  on demand, not auto-loaded, so it may run longer.)

### Hook conventions
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

#### Hook registration
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
- **Command form:** global hooks → `node "/home/<user>/.claude/hooks/<hook>.mjs"`; per-project hooks resolve
  the script cwd-relative (never `$CLAUDE_PROJECT_DIR` — unset inside WSL hooks). The Windows-desktop-over-WSL
  environment wraps either **WSL-first** (`wsl -d ubuntu bash -lc '…'`) — see
  `global/windows/rules/windows-claude.md` § Hooks.
- **Exec env:** hooks run under the Windows↔WSL harness (`node` resolves, stdin passes through, settings load
  at session start); the environment-specific command form is documented in `windows-claude.md` § Hooks.
