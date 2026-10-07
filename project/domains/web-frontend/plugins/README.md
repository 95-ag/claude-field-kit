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
| playwright-cli | project / web-frontend | installed (npm CLI + skill) | npm — `@playwright/cli` |

## Plugins / skills

### `frontend-design`

- Install: `/plugin install frontend-design@claude-plugins-official` (Anthropic, `./plugins/frontend-design`)
  — deliver via plugin, **do not vendor**. Supersedes the former incoming standalone copy.
- Contents — confirm full bundle at install (not cached locally):

| type  | name | what it does |
|-------|------|--------------|
| skill | frontend-design | distinctive, production-grade frontend UI that avoids generic AI aesthetics |

### `playwright-cli`

- Delivered as an **npm package**, not through a marketplace: `npm i -g @playwright/cli`, or run it
  per-project with `npx playwright-cli`. Not a plugin install, not a skill install. Not vendored.
- Two parts, one tool: the **skill body carries the instructions**, the **npm CLI is the runner** that
  executes them. The skill alone cannot drive a browser; the CLI alone has no house conventions.
- **Distinct from the marketplace `playwright` MCP plugin** — that one installs via
  `/plugin install` and exposes browser control as MCP tools. Different package, different delivery,
  different mechanism; catalog and install them separately.

| type  | name | what it does |
|-------|------|--------------|
| skill | playwright-cli | automate browser interactions, test web pages, work with Playwright tests |

## claude-sync note

- These compose into a frontend project's `.claude/` per applicable domain; **not** installed
  machine-wide.
