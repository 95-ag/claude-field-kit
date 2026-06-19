# Release Rules

How this repo publishes to production. Operational runbook (exact commands) → root `RELEASE.md`.
Allowlist source of truth → `release.sh`.

## Generated-production model (orphan publish)

> The **publish half of this repo's Model C** (development model → `portfolio/git.md`). Distinct from global
> `git.md`'s feature-integration models (A/B): this governs *publishing* — `production` is a generated
> artifact branch, not a development branch.

- `main` — authoritative development branch. Public but **non-default**. May contain `.claude/`,
  `AGENTS.md`, planning docs, asset sources, and the full development history.
- `production` — generated release branch with **orphan history**, independent of `main`. GitHub
  default branch. Treated as a build artifact (like `dist/`), never a development branch.

## Branch ownership

- `production` has no merge relationship with `main`.
- Commits on `production` are created only by the release process.
- Direct development commits on `production` are prohibited.

## Snapshot-replace, never merge

- **Never merge `main` into `production`.**
- Each release snapshots the current HEAD of `main`.
- The release process is deterministic: identical `main` commits and identical allowlists must produce
  identical `production` trees.
- Each release overwrites `production`'s tracked files with a curated, allowlisted copy of the snapshot,
  then commits `Release vN`.
- Run snapshots in an isolated `git worktree` so `main`'s working tree (and gitignored `.claude/`,
  `tmp/`) is never disturbed.
- Curation is performed by `release.sh` (curate-only: stages the allowlist, never commits or pushes).
- The allowlist hardcoded in `release.sh` is the single source of truth. Documentation may describe the
  allowlist but never define it.

## What ships

- Allowlist (production keeps): authoritative list in `release.sh`.
- Everything else is dropped — notably `.claude/` (including docs), `AGENTS.md`, `assets-source/`,
  `requirements.txt`, `playwright.config.ts`, `tmp/`, and the release tooling itself (`release.sh`,
  `RELEASE.md`).

## Release integrity

- `production` must be reproducible from `main` and `release.sh`.
- No file may exist in `production` unless introduced through the allowlist.
- Manual edits on `production` are overwritten by the next release.

## Build invariant (before every production push)

- Validation is performed from the snapshot worktree, not from `main`.
- `production` must contain every `next build` input.
- Before pushing a snapshot:
  - Run `next build` from the snapshot.
  - Run a grep/verification proving zero `.claude`, `AGENTS`, or `assets-source` leakage via
    `git ls-files`.
- A release is invalid if the snapshot cannot independently execute `next build`.

## Vercel / GitHub

- Vercel Production Branch = `production`.
- GitHub default branch = `production`.
- All branch, remote, PR, worktree, orphan-checkout, push, and default-branch operations are user
  actions — see global `git.md` + `portfolio/git.md`.
