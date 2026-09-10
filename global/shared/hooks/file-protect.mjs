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
 * Tiers on the WRITE channel: HARD_BLOCK (exit 2, no bypass) > GLOBAL_ALLOW (silent) >
 * GLOBAL_ASK / ASK (confirm) > allow. The READ channel (Read, Grep) has one tier and a narrower
 * list — secret material blocks, everything else passes.
 *
 * Scope: file-edit and file-read tools. Shell writes and deletion (rm, Remove-Item, git rm/clean) →
 * command-firewall; anything that reaches disk unseen → bash-write-adapter's post-hoc alarm.
 */
import { createInterface } from "readline";

// Dynamic import with an explicit fail-closed catch. A static import that fails would abort the
// module with exit 1, which the harness treats as a non-blocking error — i.e. the guard would fail
// OPEN. Losing the lists means we cannot verify safety, so refuse instead.
let HARD_BLOCK, ASK, GLOBAL_ALLOW, GLOBAL_ASK, SECRET_MATERIAL, normalize;
try {
  ({ HARD_BLOCK, ASK, GLOBAL_ALLOW, GLOBAL_ASK, SECRET_MATERIAL, normalize } = await import(
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

  // Read and Grep return file CONTENTS, so they are guarded on a narrower list: secret material
  // only. A secret that reaches the transcript cannot be taken back, which is why this is a block
  // rather than a prompt. Reading .git or /etc stays allowed — those are protected against being
  // changed, not against being looked at, and refusing them would break ordinary diagnostics.
  //
  // LIMIT, stated rather than implied: this guards a NAMED target. A recursive Grep across a tree
  // that happens to contain a secret is not caught, because the alternative is refusing search
  // itself. Nor does it cover the shell — `cat`, a loop redirect, or an archiver piping a whole
  // directory out never route through this hook. This reduces casual exposure; it is not a
  // containment boundary, and should not be described as one.
  const tool = input?.tool_name || "";
  if (tool === "Read" || tool === "Grep") {
    const targets = [
      input?.tool_input?.file_path,
      input?.tool_input?.path,
      input?.tool_input?.glob,
    ].filter(Boolean);
    for (const target of targets) {
      const candidate = normalize(target);
      if (SECRET_MATERIAL.some((re) => re.test(candidate))) {
        process.stderr.write(
          `[file-protect] BLOCKED: "${candidate}" is secret material and must not be read into the transcript.\n`,
        );
        process.exit(2);
      }
    }
    process.exit(0);
  }

  // NotebookEdit is in this hook's matcher but sends `notebook_path`, not `file_path`. Reading only
  // the latter meant the matcher promised coverage it never delivered: a notebook write to any
  // protected path passed silently while the identical path through Edit was refused.
  // asset-capture and hub-dirty-flag carry the same fallback for the same reason. code-formatter
  // and ai-prose-guard deliberately do not: neither handles .ipynb, so registering them for it
  // would be a matcher that can only ever no-op — the exact shape of the bug above.
  const filePath = input?.tool_input?.file_path || input?.tool_input?.notebook_path || "";
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
