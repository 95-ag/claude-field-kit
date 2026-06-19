# Git Rules — python (stack overrides)

Extends the global `git.md`. Load alongside it and any other stack rule this repo uses.

## Verification gate (per commit)
Scripts execute and imports resolve (no errors) before committing.

## Commit clustering
Separate pipeline logic, schema changes, scripts, and config.

## Commit types (stack)
- `data:` — schema changes, seed data, output format changes.

## Never commit (stack artifacts)
- `.venv/`, `__pycache__/`, `*.pyc`, `.pytest_cache/`; `session_cookies.json` and other credential/cookie
  files (see `auth-pause`); large raw data exports unless explicitly scoped.

## Verify before opening a PR
- Scripts run cleanly; no import errors; expected output produced.

## .gitignore (stack)
- `.venv/`, `__pycache__/`, `*.pyc`, `.pytest_cache/`, `session_cookies.json`, raw data exports / large outputs.
