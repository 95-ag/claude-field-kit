#!/usr/bin/env node
/**
 * code-formatter — PostToolUse on Write/Edit/MultiEdit. Formats the edited file with the right
 * tool for its language, dispatching by extension. Multi-language by design: one project may hold
 * JS/TS *and* Python, so each file is routed independently.
 *
 * Cosmetic + best-effort: ALWAYS exits 0, never blocks or crashes a workflow. If the matching
 * formatter isn't installed it skips, but LOUDLY — one actionable line with the install command —
 * so missing tooling is never silent. (Hooks never auto-install; that's an explicit, approved step.)
 */
import { createInterface } from "readline";
import { execSync } from "child_process";

const BIOME_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"]);
const BLACK_EXTS = new Set([".py", ".pyi"]);

const SKIP_DIR_RE = /(^|\/)(node_modules|\.venv|venv|dist|build|out|coverage|__pycache__|\.next|\.turbo|\.cache)\//;

function extOf(file) { const m = file.match(/(\.[^./]+)$/); return m ? m[1] : ""; }
function canRun(cmd) { try { execSync(cmd, { stdio: "ignore" }); return true; } catch { return false; } }

// Windows-desktop-over-WSL: file_path arrives as a UNC path (\\wsl.localhost\<distro>\X),
// unresolvable inside this WSL-run hook — translate to the native WSL path. No-op otherwise.
function toWslPath(p) {
  const norm = String(p).replace(/\\/g, "/");
  const m = norm.match(/^\/\/wsl(?:\.localhost|\$)\/[^/]+(\/.*)$/i);
  return m ? m[1] : norm;
}

const rl = createInterface({ input: process.stdin });
let raw = "";
rl.on("line", (line) => (raw += line));
rl.on("close", () => {
  let input;
  try { input = JSON.parse(raw || "{}"); } catch { process.exit(0); } // cosmetic → fail open

  const filePath = input?.tool_input?.file_path || "";
  if (!filePath) process.exit(0);

  const p = toWslPath(filePath);
  if (/(^|\/)\.claude\//.test(p) || SKIP_DIR_RE.test(p)) process.exit(0); // don't format local/global config or artifacts

  const ext = extOf(p);
  let label = "", install = "", formatCmd = null;

  if (BIOME_EXTS.has(ext)) {
    label = "biome";
    install = "npm i -D @biomejs/biome";
    if (canRun("npx --no-install biome --version")) formatCmd = `npx --no-install biome format --write "${p}"`;
  } else if (BLACK_EXTS.has(ext)) {
    label = "black";
    install = "pip install black   (or: uv pip install black)";
    if (canRun("black --version")) formatCmd = `black -q "${p}"`;
    else if (canRun("python3 -m black --version")) formatCmd = `python3 -m black -q "${p}"`;
  } else {
    process.exit(0); // no formatter for this type
  }

  if (!formatCmd) {
    // Loud skip — surface the missing tool with the exact fix (never silent, never auto-install).
    process.stderr.write(
      `[code-formatter] ${label} not installed — ${ext} files won't be formatted.\n` +
      `                 install: ${install}\n`,
    );
    process.exit(0);
  }

  try {
    execSync(formatCmd, { stdio: "ignore" });
  } catch {
    process.stderr.write(`[code-formatter] ${label} could not format ${p} (skipped).\n`);
  }
  process.exit(0);
});
