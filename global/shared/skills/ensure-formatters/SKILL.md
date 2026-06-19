# ensure-formatters — formatter doctor for the current project

Scan a project's tracked file types and report whether the formatters they need are configured. Reports
only by default; `--install` shows install commands but **never auto-installs**.

## When to use

- Setting up or auditing a project — confirm formatters exist for the languages actually tracked.
- The user asks "are formatters set up?", "check formatting setup", "ensure formatters".

## Run

```
node global/shared/skills/ensure-formatters/scripts/scan.mjs [project-root] [--install]
```
- Default: scans `git ls-files` (falls back to a filesystem walk), maps extensions → formatter group,
  reports each present group as `OK` (a formatter is configured) or `MISSING`.
- `--install`: additionally prints the install command(s) for missing groups. It does NOT run them.

## Coverage

- **node/web** (`.ts .tsx .js .jsx .json .css .md`) → biome (`biome.json`) or prettier
  (`.prettierrc*` / `package.json#prettier`).
- **python** (`.py`) → ruff (`[tool.ruff]`) or black (`[tool.black]`) in `pyproject.toml`.
- Unmapped extensions are ignored (not an error). Extend `scan.mjs`'s `checks` map when a new stack appears.

## Safety

Read-only. `--install` prints commands for you to run after confirming — it never installs automatically and
never modifies the project. This matches the locked rule: report + opt-in, never auto.
