# Git Rules — node (stack overrides)

Extends the global `git.md`. Load alongside it and any other stack rule this repo uses.

## Verification gate (per commit)
Build succeeds + lint + typecheck pass before committing. The full lint/typecheck/test/build suite runs
at the batch gate, not per commit — see build-verification.md → Batch gate, not per-commit.

## Commit clustering
Separate infrastructure, routing, schemas, content pipeline, and UI shells.

## Commit types (stack)
- `docs:` — content (MDX), README, other committable docs.

## Never commit (stack artifacts)
- `node_modules/`, `.next/`, `dist/`, build outputs and caches.

## Verify before opening a PR
- `npm run build` succeeds; lint + typecheck pass; no hydration errors.
- Plus the project's domain checks (e.g. `web-frontend` responsive/a11y — see those rules).

## dev → main promotion (Model B)
- Promote only when `dev` is releasable: all intended features merged, `npm run build` green, lint +
  typecheck clean, plus domain verification gates pass.
- Promote by **fast-forward** (`--no-ff` only if a release marker is wanted); never squash `dev → main`.
- The user runs the promotion — Claude provides the commands (see global PR closure).

## .gitignore (stack)
- `node_modules/`, `.next/`, build outputs and caches.
