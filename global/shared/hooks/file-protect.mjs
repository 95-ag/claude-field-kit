#!/usr/bin/env node
/**
 * file-protect — PreToolUse guard on file writes/edits (Write/Edit/MultiEdit/NotebookEdit).
 *
 * Platform-agnostic: matches the forward-slash-normalized file path with segment anchors,
 * so behavior is identical under Windows node and WSL/POSIX node. (We deliberately avoid
 * path.relative — it diverges between win32/posix and misfires on mixed separators/roots,
 * which is exactly the Windows↔WSL hazard in this setup.)
 *
 * Tiers: HARD_BLOCK (exit 2, no bypass) > GLOBAL_ALLOW (silent) > GLOBAL_ASK / ASK (confirm) > allow.
 * Scope: file-edit tools only. Shell deletion (rm, Remove-Item, git rm/clean) → command-firewall.
 */
import { createInterface } from "readline";

// Protected paths — matched against any segment of the normalized path.
const HARD_BLOCK = [
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
const ASK = [
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
const GLOBAL_ALLOW = [
  /\/\.claude\/plans(\/|$)/i,
  /\/\.claude\/memory(\/|$)/i,
  /\/\.claude\/projects\/[^/]+\/memory(\/|$)/i,
];

// Out-of-repo / global config — global-config gate.
const GLOBAL_ASK = [
  /\/home\/[^/]+\/\.claude(\/|$)/i,
  /\/Users\/[^/]+\/\.claude(\/|$)/i,
  /(^|\/)(\.profile|\.bash_profile|\.bash_login|\.bashrc|\.zshrc|\.zprofile)$/i,
];

function block(p) {
  process.stderr.write(`[file-protect] BLOCKED: "${p}" is a protected file and cannot be edited.\n`);
  process.exit(2);
}

function ask(target, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `"${target}" ${reason} Confirm this edit is intentional.`,
      },
    }),
  );
  process.exit(0);
}

const rl = createInterface({ input: process.stdin });
let raw = "";
rl.on("line", (line) => (raw += line));
rl.on("close", () => {
  let input;
  try {
    input = JSON.parse(raw || "{}");
  } catch {
    // Can't parse the tool call → can't verify safety → fail closed.
    process.stderr.write("[file-protect] BLOCKED: could not parse hook input (failing closed).\n");
    process.exit(2);
  }

  const filePath = input?.tool_input?.file_path || "";
  if (!filePath) process.exit(0);

  const p = String(filePath).replace(/\\/g, "/"); // normalize separators; match the path directly

  for (const re of HARD_BLOCK) if (re.test(p)) block(p);
  for (const re of GLOBAL_ALLOW) if (re.test(p)) process.exit(0);
  for (const re of GLOBAL_ASK)
    if (re.test(p))
      ask(p, "is global / out-of-repo config. Global-config changes need explicit approval —");
  for (const re of ASK) if (re.test(p)) ask(p, "is a sensitive config/rules file.");

  process.exit(0);
});
