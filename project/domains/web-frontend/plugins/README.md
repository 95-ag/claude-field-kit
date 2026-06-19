# Plugin Reference — project scope (web-frontend)

> Catalog of **per-project** plugins + external skills for web-frontend work. Install in a frontend
> project, **not** machine-wide. Delivery rule: *reference, don't vendor* — install via the plugin /
> skill and catalog here, never copy into the tiers (README § Placement, Rule 5). Composed into a
> project's `.claude/` by `claude-sync`.
>
> Global, machine-wide plugins live in `global/shared/plugins/README.md`.

## At a glance

| plugin | scope | status | source |
|--------|-------|--------|--------|
| frontend-design | project / web-frontend | catalogued | claude-plugins-official |
| playwright-cli | project / web-frontend | installed (skill) | direct skill install |

## Plugins / skills

### `frontend-design`

- Install: `/plugin install frontend-design@claude-plugins-official` (Anthropic, `./plugins/frontend-design`)
  — deliver via plugin, **do not vendor**. Supersedes the former incoming standalone copy.
- Contents — confirm full bundle at install (not cached locally):

| type  | name | what it does |
|-------|------|--------------|
| skill | frontend-design | distinctive, production-grade frontend UI that avoids generic AI aesthetics |

### `playwright-cli`

- A standalone **skill** the user installs in frontend / web projects — distinct from the marketplace
  `playwright` MCP plugin (different delivery mechanism). Not vendored.

| type  | name | what it does |
|-------|------|--------------|
| skill | playwright-cli | automate browser interactions, test web pages, work with Playwright tests |

## claude-sync note

- These compose into a frontend project's `.claude/` per applicable domain; **not** installed
  machine-wide.
