# Windows Claude — operating a WSL-hosted repo

> Applies ONLY to Claude Code running as the **Windows desktop app** against a repo that lives in **WSL**.
> Does NOT apply when Claude runs inside the WSL terminal. Imported only by the Windows global `CLAUDE.md`.

## Default model — WSL-first
- Run command execution **and** hooks through `wsl -d ubuntu bash` / WSL node; git-bash (the Bash tool) is
  only the entry/bridge shell. PowerShell is never used for repo commands (see below).
- Rationale: one runtime, consistent with the WSL-hosted repo and with Claude running in the WSL terminal.

## Bash tool is git-bash (MINGW), not WSL
- The default Bash tool is MINGW64 (git-bash) on Windows; it lacks the WSL toolchain (node, npm, project bins) on PATH.
- Run the repo's toolchain through WSL explicitly: `wsl -d ubuntu bash -lc '…'` or `wsl -d ubuntu bash <script>`.

## Path mangling (MSYS) — prefer script files
- git-bash rewrites unix `/abs/paths` in args (e.g. `/home/...` → `C:/Program Files/Git/home/...`) and can drop slashes.
- Prefix cross-shell calls with `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'`.
- Anything with multiple `/paths`, quoting, or `$(...)` is unreliable inline — write a **script file** and run it via `wsl … bash <script>`.
- **NEVER use an inline `for`/`while` loop over paths inside `wsl … bash -lc '…'`.** The loop variable comes back **empty** in MSYS, so the body runs against the cwd instead of each item — `for f in a b; do rm -rf "/path/$f"; done` becomes `rm -rf "/path/"` and **deletes the parent directory**. No exceptions: use explicit `&&` chains, or write a script file and run it via `wsl … bash <script>`.
- **Capture output to a file and read it** — terminal stdout/stderr interleave through the git-bash→`wsl` bridge is unreliable for parsing.

## Don't drive repo commands through PowerShell
- PowerShell→WSL `$`/backtick escaping mangles commands. Use the git-bash Bash tool → `wsl` instead.

## The `claude` CLI via `wsl bash` mutates the WINDOWS config dir
- Running the `claude` CLI through `wsl -d ubuntu bash -lc 'claude …'` from the Windows app resolves its
  `~/.claude` to the **Windows** dir (`C:\Users\…\.claude`), NOT WSL's — even though WSL node reports
  `homedir=/home/ag-95`. Proven: a `claude plugin marketplace update` + reinstall via `wsl bash` mutated the
  **Windows** marketplace + install entry, leaving WSL untouched.
- So you CANNOT target WSL's plugin/config state from this Windows-app session via `wsl bash claude` — it hits
  Windows. To mutate WSL `~/.claude` plugin state, do it from a real WSL `claude` session.
- Specific to the `claude` CLI's own config-dir resolution: plain file ops via `wsl bash` (cp / node /
  global-sync) DO target WSL correctly.

## node for builds — script PATH-prepend
- `bash -lc` is non-interactive and does NOT load nvm (it lives in interactive `~/.bashrc`), so it falls back to system node v18; `next build` needs node ≥20.
- Prepend the nvm default's bin before the command:
  `export PATH="$HOME/.nvm/versions/node/<version>/bin:$PATH"` (e.g. `v24.16.0`), with the `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'` guard.
- Do NOT compute the version inline with `$(cat "$HOME/.nvm/alias/default")` — MSYS mangles the command substitution (it returns empty → falls back to system node v18, and `next build` rejects it). Hardcode the resolved version, or read the alias in a separate step / script file.
- `~/.profile` is NOT auto-sourced by `bash -lc`, and sourcing `nvm.sh` does not switch node non-interactively — so neither substitutes for the PATH-prepend.

## Long-running servers — keep alive, then free the port
- A server backgrounded inside a one-shot `wsl -d ubuntu bash -lc '(… &)'` dies when the call returns. Start it with the **Bash tool's `run_in_background: true`** on a *foreground* command so it persists across turns. **Prefix the start with the MSYS guard** `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'` — the background-start command is the easiest place to forget it, and a mangled `/home/...` script path fails with "No such file or directory".
- Stopping that background task (`TaskStop`) kills the git-bash→`wsl` wrapper, but the WSL process (e.g. `next-server`) can keep listening → `EADDRINUSE` on the next start. Free the port before restarting with the **bracket trick**: `pkill -f 'next-serv[e]r'`. A plain `pkill -f next-server` also matches the shell running it (its own command line contains the literal `next-server`) and SIGTERM-kills itself (exit 143); the `[e]` character class matches the `e` in the real process's cmdline but not pkill's own bracketed pattern. Same trap with `"next dev"`.

## Path translation (UNC ↔ WSL)
- WSL `/home/ag-95/…` ⇔ Windows UNC `\\wsl.localhost\ubuntu\home\ag-95\…`.
- File tools (Read/Write/Edit) use the UNC form; commands inside `wsl` use the `/home/...` form.
- Plans: WSL `/home/ag-95/.claude/plans/` = UNC `\\wsl.localhost\ubuntu\home\ag-95\.claude\plans\`.

## Hooks under the Windows↔WSL harness
Hooks run **WSL-first** (per the default model above). Verified 2026-06-16:
- **Command form:** `wsl -d ubuntu bash -lc 'node "<wsl-path>/.claude/hooks/<hook>.mjs"'`, prefixed with the
  MSYS guard `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'`. WSL system node (v18) runs the hooks fine — they
  use only readline/regex/child_process; v20+ matters only for `next build`.
- **stdin works:** the tool-input JSON the harness pipes to the hook passes through the git-bash→`wsl` bridge
  to the node process (verified). Hooks read their decision payload from stdin as normal.
- **Fallback runtime:** Windows node (v24 on PATH) also loads a hook over the UNC path, but WSL-first is the
  default — don't depend on a Windows node install.
- **Registration:** hooks live under the `hooks` key of `.claude/settings.json` (`event → matcher → hooks[]
  → command`); matcher takes pipe syntax (`Bash|PowerShell`, `Write|Edit|MultiEdit`). A standalone
  `hooks.json` is a **plugin-only** convention — `claude-sync` composes the repo's `hooks.json` into the
  consumer's `settings.json`; it is not loaded as a top-level file.
- **Settings load at session START, not hot-reloaded** — wiring or changing hooks needs a session restart to
  take effect (mid-session `settings.json` edits do not fire).
- **Contract:** exit 0 = allow · exit 2 = block (stderr shown) · JSON-on-stdout for `permissionDecision:
  "ask"` / `additionalContext`. Suppress subprocess stderr inside hooks — decisions use stdout only.
- **`$CLAUDE_PROJECT_DIR` is UNSET inside a WSL hook (RESOLVED 2026-06-18, real fire).** Windows→WSL env vars
  don't cross without `WSLENV`, so a WSL-wrapped hook command that references `$CLAUDE_PROJECT_DIR` (e.g.
  `node "$CLAUDE_PROJECT_DIR/.claude/hooks/x.mjs"`) expands to an **empty** prefix inside `wsl bash` and
  fails. **Use `process.cwd()` instead** — the hook process's cwd IS the project root in clean WSL-native form
  (`/home/ag-95/projects/<repo>`, captured live). So: global hooks use absolute `~/.claude/hooks/` paths;
  **per-project hook commands must resolve the script via cwd** (a cwd-relative path `node
  ".claude/hooks/x.mjs"`, or `process.cwd()` inside the script), never `$CLAUDE_PROJECT_DIR`.
- **Per-project hook command must be DUAL-ENV (RESOLVED 2026-06-19, real fire in a WSL-native terminal).** A
  project's single `.claude/settings.json` is shared by BOTH the Windows-desktop harness and the WSL-native /
  Linux terminal — there is no per-env file split like the global tier (which delivers a separate `~/.claude`
  on each side). A command hard-wrapped with `wsl -d ubuntu bash -lc '…'` fails in a WSL-native terminal
  (`/bin/sh: wsl: not found`, fail-open → the hook silently never fires); a bare `node` command fails on
  Windows-desktop. Emit ONE command that detects `wsl` at runtime and branches, using `if/then/else` (NOT
  `&&/||`, which would run the fallback when a blocking hook legitimately exits non-zero):
  `if command -v wsl >/dev/null 2>&1; then MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' wsl -d ubuntu bash -lc 'node ".claude/hooks/x.mjs"'; else node ".claude/hooks/x.mjs"; fi`
  `command -v wsl` is the reliable discriminator: bare `wsl` is on PATH only on Windows — in WSL-native only
  `/mnt/c/.../wsl.exe` exists. Global hooks are unaffected (separate per-env `~/.claude/settings.json`, one form each).
- **`tool_input.file_path` arrives as a Windows UNC path (`\\wsl.localhost\<distro>\X`) — RESOLVED 2026-06-18,
  real fire.** A WSL-run hook can't resolve a UNC path, so any hook doing **filesystem or exec ops** on
  `file_path` (copy / stat / format) must translate it to the native WSL path first — strip the
  `\\wsl.localhost\<distro>` / `\\wsl$\<distro>` prefix → `/X` (after the `\`→`/` normalize:
  `/^\/\/wsl(?:\.localhost|\$)\/[^/]+(\/.*)$/` → `$1`). Pure regex/string matchers (`file-protect`,
  `hub-dirty-flag`) are unaffected — they match path segments regardless of prefix. Confirmed: `asset-capture`
  + `code-formatter` silently no-op'd (fail-open) on every edit until they UNC-translated.
