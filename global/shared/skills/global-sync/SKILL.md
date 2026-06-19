# global-sync — Claude Field Kit global tier sync

Delivers the Claude Field Kit global tier (`global/shared` + env overlay) to `~/.claude/` on the
current environment, installs the global safety net, and routes any drifted files back to
Claude Field Kit `incoming/` for review.

## When to use

- After editing any file in `global/shared/` or `global/windows/` or `global/wsl/` in Claude Field Kit
- To install the global hook net on a new machine or after a clean setup
- When `~/.claude/` hooks or rules are stale relative to Claude Field Kit

## Stop before running if

- The user has said "don't sync" or "confirm before sync" — ask for explicit confirmation first
- The global hook scripts are not present in `global/shared/hooks/` (they're the source delivered to `~/.claude/hooks/`)
- This is the very first run in a new environment — verify `~/.claude/` exists and is writable

## How to invoke

**From Windows (Claude Code desktop) — WSL-first:**
```
MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' wsl -d ubuntu bash -lc 'node /home/ag-95/projects/claude-field-kit/global/tools/global-sync.mjs --env windows'
```

**From WSL terminal:**
```
node /home/ag-95/projects/claude-field-kit/global/tools/global-sync.mjs --env wsl
```

## Flags

| Flag | Default | Description |
|---|---|---|
| `--env windows\|wsl` | auto-detect | Target environment |
| `--root <path>` | `/home/ag-95/projects/claude-field-kit` | Claude Field Kit repo root |

## What happens

1. Reads `global/shared/` + env overlay; overlay files win on conflict
2. Transforms hook commands: WSL-wrapped for Windows, bare `node` for WSL
3. Deep-merges the `hooks` key into `~/.claude/settings.json` (all other keys preserved)
4. Writes all composed files to `~/.claude/` (hooks scripts to `~/.claude/hooks/`)
5. Updates `~/.claude/.claude-sync-manifest.json`
6. If `~/.claude/.claude-sync-dirty` exists: detects drifted files, routes to `incoming/`, appends harvest tasks to `tasks.md`, clears the flag
7. If a Claude Field Kit source was deleted: warns via `additionalContext`; does NOT prune

## After running

- Restart the Claude session for new hooks to take effect (settings load at session start)
- Check `incoming/` and `tasks.md` if drift was detected
