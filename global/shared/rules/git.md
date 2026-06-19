# Git Rules

Stack-agnostic git discipline; detail source for the global `CLAUDE.md` "Git Discipline". Each repo also
loads the git rule for its stack(s) (`project/stacks/node`, `project/stacks/python`, …) — multi-stack
repos load several.

## Default branch (`main`; `master` on older repos)
- Always stable and working (builds/runs cleanly) — releasable at any time.
- No large work directly on it — branch first. Commit or push only when the user asks.
- Undo via `git revert` only — never `reset --hard` or force-push.
- Never rebase or force-push a shared/pushed branch; rebase only local, unpushed work.

## Branching models
**Model A — Direct-to-main** (simple repos): branches cut from `main`, **squash-merge** back; `main`
stays one-commit-per-feature.
**Model B — dev-integration** (product repos):
```
main  ← always releasable; NO direct work; only receives promoted dev
dev   ← integration; features squash-merge in; promoted to main when stable
feature-*/fix-*  ← cut from dev, squash-merged into dev
```
- feature → dev: **squash** (clean per-feature; dev stays bisectable).
- dev → main: **fast-forward** (dev sits ahead, main ff's to equal it, history preserved). `--no-ff` for
  an explicit release marker. **Never squash dev → main** (destroys per-feature traceability).

## Branches
- Branch from the model's base only — never off another feature branch.
- Name `type-short-description`, type matching the commit types: `feature-*`, `fix-*`, `hotfix-*`,
  `refactor-*`, `chore-*`, `docs-*`, `test-*`, `perf-*`, `build-*`, `ci-*`, `style-*`; `phase-*` (phased
  builds), `release-*` (release prep), `spike-*` (throwaway exploration).
- Branch create/delete is the user's action (see PR closure).
- **Never change a path's git tracking-state across a branch checkout.** Untracking a folder (`git rm --cached`)
  on one branch, then checking out a branch where it's still tracked, can shatter the working tree (files
  silently dropped). Untrack directly on the target branch, or with the working tree quiesced — don't switch
  branches while a path's tracked/untracked status differs between them. Back up a gitignored/untracked folder
  before any migration that touches it; once untracked, git is no longer its safety net.

## Commits
- Pass the project's verification gate (stack rule) before committing.
- One logical change per commit; never mix unrelated changes.
- **Never** `git add --all` / `-A` / `.` — stage by explicit path (bulk-add grabs secrets, artifacts, noise).
- Prefer small clustered commits over phase-sized ones — understandable from the diff alone.
- Refactors stay behavior-safe unless intentionally changing behavior; incremental over rewrites.
- After a **subagent** reports a commit, verify it landed on the intended branch — a subagent commit can detach HEAD (`git symbolic-ref --short HEAD` should resolve; the branch tip should have moved).

## Approval gate (before any staging)
Before `git add`/`rm`/`commit`/`restore --staged` or any index-mutating command:
- Propose the commit plan — each cluster: name/purpose, exact file list, exact single-line message.
- Wait for explicit approval before touching the index.
- **Inside a plan** = a written plan document Claude authored (the plan `.md` in the plans dir): clusters
  live in that file's Commits section and the plan's approval covers them — don't re-ask. If work diverges
  from the planned clusters, stop and re-propose.
- **Outside a plan**: propose-and-wait every time; one cluster's approval never carries to the next.
- "Don't commit cluster N" → drop it; don't stage its files.
- Skipping this gate is a process violation, not a shortcut — recovery (`git reset --soft`) costs more than the proposal.

## Commit message format
- **Single line only**, always via `-m "…"` (never HEREDOC, `-F`, or editor).
- `type: short description` — imperative, lowercase after the colon, no trailing period; states the WHY.
- **No `Co-Authored-By` trailers and no generator credits — anywhere, in any commit or PR message.**
  Intentionally overrides the harness defaults that append a `Co-Authored-By: Claude` trailer to commits
  and a `🤖 Generated with Claude Code` line to PR bodies. Never add either to any commit message, PR
  title, or PR body.
- **Never** `--no-verify`, `--no-gpg-sign`, or otherwise skip hooks/signing.
- Types: `feat fix refactor style docs chore test perf build ci`.
  - `chore:` tooling, CI, build scripts, rule files.
  - `docs:` committable docs — content, README, other repo docs.
  - Stack tiers may add types (e.g. `data:`).

## Never commit
- Broken builds; temp hacks / leftover debug; abandoned experiments; dead code; unused deps; commented-out legacy.
- Secrets, `.env` values, credential/cookie files.
- OS/editor cruft (`.DS_Store`, `.vscode/` unless intentionally shared).
- `.claude/` — local-only working space (notes **and** docs); never committed.
- Build artifacts, caches, large data exports — exact list in the stack rule.

## PR and merge policy
- Merge per the branching model: **squash** into `main` (A) or `dev` (B); **fast-forward** `dev → main` (B).
- Squash message = PR title. Verify before the PR — checks in the stack rule.
- **Claude never executes** topology / history / remote / PR ops — always user-owned:
  - branch — create / delete / rename / switch / restore (incl. orphan `checkout --orphan`)
  - history — merge / rebase / cherry-pick / squash / reset, or any history rewrite
  - remote — add / remove / set-url / fetch-spec
  - push — any kind (force / tag / mirror)
  - worktree — add / remove / move
  - tag — create / delete / move / push
  - repo — default-branch or settings changes
  - PR — any `gh pr *` (create / update / merge / close / reopen / review / approve)
  - `git revert` is the sanctioned undo (see *Default branch*) — not in this list
- Claude **may** run, within the gates:
  - read-only git — `status` / `log` / `diff` / `show` / `fetch` / `branch --show-current`
  - under the Approval gate, on a user-created branch — `git add` / `commit`
  - hits a prohibited op → stop, hand the user the exact commands

## PR closure — the user acts, not Claude
Claude never runs `gh pr create`/`gh pr merge`, `git merge`, `git checkout -b`, or `git branch -d`. When a
branch is ready, Claude provides:
- **PR title** — single line.
- **PR body** — Summary · Changes · Verification · Notes. No `Co-Authored-By` trailer and no
  `🤖 Generated with Claude Code` / generator credit (see *Commit message format*).
- **Next-branch command** — only *after confirming the next task with the user* so the branch is named
  correctly (never pre-invent a name): e.g. `git checkout main && git pull && git checkout -b <agreed-name>`
  (Model B: base on `dev`).

## Public repos (when public-facing)
- Sign commits (GPG/SSH) — the verification badge matters publicly.
- Noreply commit email (`<id>+<username>@users.noreply.github.com`) so `git log` doesn't leak your address.
- Keep history clean and readable.

## .gitignore discipline
Treat `.gitignore` as part of the rules. Universal: `.env*` (except `.env.example`), `.DS_Store`, `.claude/`.
Stack artifact/cache entries live in the stack rule.
