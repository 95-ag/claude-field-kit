/**
 * protected-paths — the single source of truth for which paths are protected, and how strongly.
 *
 * Shared by every global hook that has to make that judgement: `file-protect` (the file-edit
 * channel), `command-firewall` (the shell channel) and `bash-write-adapter` (the post-hoc alarm).
 * The lists live here rather than in any one hook because a copy that drifts is a hole: the same
 * path would be blocked through one channel and allowed through another, which is precisely the
 * class of bug the shell-channel work exists to close.
 *
 * Patterns are matched against a forward-slash-normalized path with segment anchors, so they behave
 * identically under Windows node and WSL/POSIX node. path.relative is deliberately avoided — it
 * diverges between win32/posix and misfires on mixed separators, the exact Windows↔WSL hazard here.
 *
 * No side effects, no I/O — importable from any hook regardless of its posture.
 */

// Never writable by an agent, through any channel. exit 2, no bypass.
export const HARD_BLOCK = [
  /(^|\/)\.git(\/|$)/,
  /(^|\/)\.env$/,
  /(^|\/)\.env\.(?!example$)[^/]+$/,
  // secret material — never edit/overwrite via the file tools
  /(^|\/)\.credentials\.json$/,
  /(^|\/)session_cookies\.json$/,
  /\.pem$/,
  /\.key$/,
  /\.p12$/,
  /\.pfx$/,
  // system config — agent never edits machine-level files (undo if a real case comes up)
  /^\/etc\//i,
];

// Sensitive config to confirm before editing. Stack config is a UNION across stacks — a name
// absent from the repo simply never matches, so one shared list serves every stack (no split).
export const ASK = [
  // universal
  /(^|\/)CLAUDE\.md$/,
  /(^|\/)AGENTS\.md$/,
  /(^|\/)\.gitignore$/,
  /(^|\/)\.gitattributes$/,
  // JS / TS
  /(^|\/)package\.json$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)tsconfig\.json$/,
  /(^|\/)biome\.json$/,
  /(^|\/)\.eslintrc(\.\w+)?$/,
  /(^|\/)\.prettierrc(\.\w+)?$/,
  /(^|\/)(next|tailwind|vite|webpack)\.config\.[a-z]+$/,
  // Python
  /(^|\/)pyproject\.toml$/,
  /(^|\/)requirements(-\w+)?\.txt$/,
  /(^|\/)setup\.(py|cfg)$/,
  /(^|\/)Pipfile(\.lock)?$/,
  /(^|\/)poetry\.lock$/,
  /(^|\/)alembic\.ini$/,
  // other ecosystems / infra
  /(^|\/)Cargo\.toml$/,
  /(^|\/)go\.mod$/,
  /(^|\/)Gemfile$/,
  /(^|\/)Dockerfile$/,
  /(^|\/)docker-compose\.ya?ml$/,
];

// Frequently-touched global working areas — allow silently, overriding GLOBAL_ASK.
export const GLOBAL_ALLOW = [
  /\/\.claude\/plans(\/|$)/i,
  /\/\.claude\/memory(\/|$)/i,
  /\/\.claude\/projects\/[^/]+\/memory(\/|$)/i,
];

// Out-of-repo / global config — global-config gate.
export const GLOBAL_ASK = [
  /\/home\/[^/]+\/\.claude(\/|$)/i,
  /\/Users\/[^/]+\/\.claude(\/|$)/i,
  /(^|\/)(\.profile|\.bash_profile|\.bash_login|\.bashrc|\.zshrc|\.zprofile)$/i,
];

/** Normalize separators so one pattern set serves Windows and WSL paths alike. */
export function normalize(p) {
  return String(p).replace(/\\/g, "/");
}

// Windows-desktop-over-WSL: a path may arrive as UNC (\\wsl.localhost\<distro>\X), which is
// unresolvable inside a WSL-run hook. Translate to the native WSL path; no-op for native paths.
export function toWslPath(p) {
  const norm = normalize(p);
  const m = norm.match(/^\/\/wsl(?:\.localhost|\$)\/[^/]+(\/.*)$/i);
  return m ? m[1] : norm;
}
