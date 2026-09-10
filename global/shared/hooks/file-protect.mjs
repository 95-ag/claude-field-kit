#!/usr/bin/env node
/**
 * file-protect — PreToolUse guard on file writes/edits (Write/Edit/MultiEdit/NotebookEdit).
 *
 * The path lists live in ./lib/protected-paths.mjs so the file-edit channel, the shell channel
 * (command-firewall) and the post-hoc alarm (bash-write-adapter) all judge a path the same way.
 *
 * Platform-agnostic: matches the forward-slash-normalized file path with segment anchors,
 * so behavior is identical under Windows node and WSL/POSIX node. (We deliberately avoid
 * path.relative — it diverges between win32/posix and misfires on mixed separators/roots,
 * which is exactly the Windows↔WSL hazard in this setup.)
 *
 * Tiers: HARD_BLOCK (exit 2, no bypass) > GLOBAL_ALLOW (silent) > GLOBAL_ASK / ASK (confirm) > allow.
 * Scope: file-edit tools only. Shell writes and deletion (rm, Remove-Item, git rm/clean) →
 * command-firewall; anything that reaches disk unseen → bash-write-adapter's post-hoc alarm.
 */
import { createInterface } from "readline";

// Dynamic import with an explicit fail-closed catch. A static import that fails would abort the
// module with exit 1, which the harness treats as a non-blocking error — i.e. the guard would fail
// OPEN. Losing the lists means we cannot verify safety, so refuse instead.
let HARD_BLOCK, ASK, GLOBAL_ALLOW, GLOBAL_ASK, normalize;
try {
  ({ HARD_BLOCK, ASK, GLOBAL_ALLOW, GLOBAL_ASK, normalize } = await import(
    new URL("./lib/protected-paths.mjs", import.meta.url)
  ));
} catch (err) {
  process.stderr.write(
    `[file-protect] BLOCKED: protected-path list unavailable (failing closed): ${err?.message ?? err}\n`,
  );
  process.exit(2);
}

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

  const p = normalize(filePath); // normalize separators; match the path directly

  for (const re of HARD_BLOCK) if (re.test(p)) block(p);
  for (const re of GLOBAL_ALLOW) if (re.test(p)) process.exit(0);
  for (const re of GLOBAL_ASK)
    if (re.test(p))
      ask(p, "is global / out-of-repo config. Global-config changes need explicit approval —");
  for (const re of ASK) if (re.test(p)) ask(p, "is a sensitive config/rules file.");

  process.exit(0);
});
