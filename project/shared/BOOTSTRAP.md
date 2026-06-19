# Project Bootstrap — seed a new project's `.claude/`

> Discovery-driven procedure to compose a project `.claude/` from the claude-field-kit `project/` tiers. Followed by
> an agent or a human. It ENUMERATES bucket directories and composes whatever it finds — it never names
> individual files, so new rules / skills / hooks / stacks / domains added to claude-field-kit are picked up with no
> edit to this file. Conceptual model → repo `README.md` (tiers, Placement, composition). This is the
> actionable procedure.

## Asset types (the ONE maintenance point)

Each compose step below iterates these asset-type subdirs inside every active bucket:
`rules/` · `hooks/` (scripts) + bucket-root `hooks.json` (manifest) · `skills/` · `agents/` · `docs/` · `work/`.
If claude-field-kit ever adds a NEW asset type, add it here and give it a compose step — the only edit this
checklist ever needs.

**Excluded from composition:** `plugins/` — these are reference catalogs ("reference, don't vendor"); plugins
install machine-wide (`claude plugin install`), they are not seeded into a project. Listing it here keeps the
enumeration complete (see `global/shared/plugins/README.md`).

## Inputs (the only per-project decisions)

1. Project name + one-line identity.
2. Stacks — list `project/stacks/*`; pick each that applies (a multi-stack repo picks several).
3. Domains — list `project/domains/*`; pick each that applies.
4. Named repo? — if a `project/repos/<name>/` bucket exists for this project, include it (loads ONLY here).

"Active buckets" = `project/shared` + each chosen domain + each chosen stack (+ the named repo, if any).

## Compose (enumeration-based — copy what exists, never a fixed file list)

A bucket that lacks a given asset-type subdir, or is empty, contributes nothing for that step — skip it silently; it is not an error.

Create the skeleton: `.claude/{rules,hooks,skills,agents,docs,work}/` + `.claude/settings.json`.

1. Rules — namespacing is collision-proof by construction:
   - `project/shared/rules/*.md` → `.claude/rules/*.md` (FLAT).
   - each active domain `<D>`: `project/domains/<D>/rules/*.md` → `.claude/rules/<D>/*.md` (SUBDIR).
   - each active stack `<S>`: `project/stacks/<S>/rules/*.md` → `.claude/rules/<S>/*.md` (SUBDIR).
   Shared keeps the bare name; a stack/domain rule with the same name (e.g. `build-verification.md`, `git.md`)
   lands under its bucket subdir and never overwrites the shared one.
2. Hooks — deep-merge every active bucket's `hooks.json` into `.claude/settings.json` `hooks`: concatenate
   each event's array (PreToolUse, PostToolUse, …); drop `"//"` comment keys. Copy every script those
   manifests reference from each bucket's `hooks/` → `.claude/hooks/`. (Global safety hooks + the nudger are
   NOT seeded here — T2 global-sync delivers them to `~/.claude`.) Target shape:
   `{ "hooks": { "PreToolUse": [...], "PostToolUse": [...] } }`.
   **Dual-env command wrap (required):** the manifest commands are cwd-relative (`node ".claude/hooks/<x>.mjs"`;
   the hook's cwd IS the project root — never `$CLAUDE_PROJECT_DIR`, which is unset inside a WSL hook). Unlike
   global-sync's `transformHooksForEnv` — which writes a *separate* `settings.json` per env (`~/.claude` on each
   side), so each can pick one form — a **project's single `.claude/settings.json` is shared by both the
   Windows-desktop-over-WSL harness and the WSL-native/Linux terminal**. So it must carry ONE command that works
   in both: detect `wsl` at runtime (present on Windows-desktop, absent in WSL-native — bare `wsl` is not on the
   WSL `$PATH`, only `/mnt/c/.../wsl.exe`) and branch. Use `if/then/else` (not `&&/||`) so a blocking hook's
   non-zero exit propagates instead of triggering the fallback:
   ```
   if command -v wsl >/dev/null 2>&1; then MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL=* wsl -d ubuntu bash -lc 'node ".claude/hooks/<x>.mjs"'; else node ".claude/hooks/<x>.mjs"; fi
   ```
   A single-env command (bare `node`, or a hard `wsl` wrap) silently fails the moment the project is opened from
   the other environment (`/bin/sh: wsl: not found` in WSL-native). Detail → `rules/<…>/windows-claude.md` § Hooks.
3. Skills — each active bucket's `skills/<name>/` → `.claude/skills/<name>/` (whole dir, incl. `references/`).
4. Agents — each active bucket's `agents/*.md` → `.claude/agents/*.md`.
5. Templates — copy each `*.template.md` from active buckets (bucket root + `work/`) to its target, dropping
   the `.template` suffix: `CLAUDE.template.md` → `.claude/CLAUDE.md`; `work/*.template.md` →
   `.claude/work/*.md`. Fill placeholders (name, stack, commands, constraints).
6. Docs — per `project/shared/docs/README.md`: create `.claude/docs/PROJECT.md` + `IMPLEMENTATION-PLAN.md`
   (mandatory); add ARCHITECTURE / SCHEMA / DESIGN only when needed.

## Wire `CLAUDE.md`

- Populate the Rules table from the composed `.claude/rules/` tree — one row per `*.md` that landed (flat
  shared + each `<bucket>/` subdir), with its area. A subdir rule must use its full path in the table —
  e.g. `.claude/rules/node/git.md`, NOT `.claude/rules/git.md`.
- Fill Stack and Commands for this project.
- Keep the `@work/session.md` / `@work/tasks.md` / `@work/lessons.md` imports at the top.
- Repo-specific facts only — workflow / git / guardrails / engineering live in global `~/.claude/CLAUDE.md`;
  reference, don't restate.

## Verify (before declaring the seed done)

- Reference integrity — every Rules-table entry and every `@import` resolves to a real file.
- No `.template` leftovers anywhere under `.claude/`.
- `settings.json` is valid JSON and its `hooks` reference scripts that exist in `.claude/hooks/`.
- Auto-loaded docs ≤ ~200 lines (`CLAUDE.md`, `work/*`); split longer ones.
- Collisions resolved — a name shared across tiers exists once flat (shared) and once per bucket subdir;
  nothing overwritten.

## Seed-once vs sync-always

- Seed once, then project-owned: `work/*` (session / tasks / lessons) — never re-pulled; the project edits them.
- Sync-always (re-pull on a claude-field-kit update): `rules/`, `hooks/`, `skills/`, `agents/` — composed fresh.
- A named repo's `repos/<name>/` assets sync-always into that ONE project only.
