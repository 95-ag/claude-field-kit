# Git — portfolio (project-specific, not a reusable rule)

Fully project-specific git facts for THIS repo. Reusable git discipline (branch autonomy, approval gate, commit format, never-commit, PR closure) lives in global `~/.claude/rules/git.md`; node tooling in `node/git.md`. This file DEFINES this repo's branching model, which the global rule does not cover.

## Branching model — Model C: dev-on-main + snapshot release

Global `git.md` defines Model A (direct-to-main squash) and Model B (dev-integration, `dev→main` fast-forward). **This repo is neither — it uses a third model ("Model C"):** Model-A-style development, with the live site published as snapshot releases to an orphan `production` branch.

**Development (like Model A)**
- `main` is the single long-lived development branch — always stable, buildable, releasable.
- No large / architectural / UI work directly on `main` — branch first; branch from `main` only.
- Work branches **squash-merge** back into `main` (one-commit-per-feature; squash message = PR title); delete the branch after.
- On `main`, undo via `git revert` only (user-run) — never `reset --hard` or force-push.

**Publish (snapshot release — the Model-C distinction)**
- `production` is a separate **orphan-history** branch: a curated, allowlisted **snapshot** of `main`'s HEAD produced by `release.sh`, treated as a build artifact / deploy target (the live site).
- `production` is **never merged or fast-forwarded** from `main` (that would be Model A/B) — it is **snapshot-replaced** each release. Full model + commands → `release.md` (+ root `RELEASE.md`).

- Model B / a `dev` integration branch does NOT apply.
- All branch / remote / PR / merge / orphan-checkout ops are user-owned (global "Branch & remote autonomy" + `release.md`).

## Public repo

- This repo is **public-facing.** The global "Public repos (when public-facing)" rules apply: sign commits (GPG/SSH — the verification badge matters for a portfolio), use a noreply commit email (`<id>+<username>@users.noreply.github.com`), keep history clean.
