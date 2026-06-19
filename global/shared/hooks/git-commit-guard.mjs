#!/usr/bin/env node
/**
 * git-commit-guard — PreToolUse guard on `git commit` (cross-shell: Bash + PowerShell).
 *
 * Register the PreToolUse matcher for BOTH "Bash" and "PowerShell" so commits via either
 * shell are guarded. Stack-agnostic by design: the block / critical / debug lists are unions
 * across stacks (a name that doesn't apply to the repo simply never matches), so there is no
 * per-stack split to maintain. Paths come from `git` (always forward-slash) → cross-platform.
 *
 * Precedence (strict):
 *   Tier 1 hard block (exit 2, no bypass) > Tier 2 ask (no bypass) >
 *   Tier 3 warn (bypassable via [commit-guard-ignore]).
 */
import { createInterface } from "readline";
import { execSync } from "child_process";

// Tier 1 — artifact/cache dirs that must never be committed (any stack).
// Segment-anchored so they match at ANY depth (monorepos nest node_modules/dist/.venv/etc.).
const BLOCK_DIR_RE = [
  // .claude is local-only (gitignored, captured into Claude Field Kit) — never commit it. Hard block
  // here is belt-and-suspenders on top of .gitignore, independent of per-project ignore state.
  /(^|\/)\.claude\//,
  /(^|\/)node_modules\//, /(^|\/)\.git\//, /(^|\/)\.next\//, /(^|\/)dist\//,
  /(^|\/)build\//, /(^|\/)out\//, /(^|\/)coverage\//, /(^|\/)\.turbo\//,
  /(^|\/)\.cache\//, /(^|\/)\.vercel\//, /(^|\/)\.playwright\//, /(^|\/)\.playwright-cli\//,
  /(^|\/)\.venv\//, /(^|\/)venv\//, /(^|\/)__pycache__\//, /(^|\/)\.pytest_cache\//,
  /(^|\/)\.mypy_cache\//,
];

// Tier 1 — secrets that must never be committed (segment-anchored → catches nested paths)
const BLOCK_PATH_RE = [
  /(^|\/)\.env$/,
  /(^|\/)\.env\.(?!example$)[^/]+$/,
  /(^|\/)\.credentials\.json$/,
  /(^|\/)session_cookies\.json$/,
  /\.pem$/, /\.key$/, /\.p12$/, /\.pfx$/, /\.keystore$/,
];

// Tier 1 — placeholder / junk commit messages (whole message, case-insensitive)
const BLOCK_MSG_RE = /^\s*(wip|temp|tmp|misc|asdf|test|\.+|x+|#+|-+)\s*$/i;

// Tier 1 — attribution / generator trailers, banned by git.md (no bypass). git.md overrides the
// harness defaults that append a "Co-Authored-By: Claude" trailer + a "🤖 Generated with Claude Code"
// line. AI-assisted authoring is the implied default for this author (industry norm now), so stamping
// per-commit attribution is redundant noise — strip it. The generator pattern catches Claude and any
// other AI credit; the line-anchored Co-Authored-By catch covers any co-author trailer git.md forbids.
const ATTRIBUTION_MSG_RE = /^\s*co-authored-by:/im;
const GENERATOR_MSG_RE = /🤖|\bgenerated\s+(with|by)\b[^\n]*\b(claude|copilot|chatgpt|gpt|cursor|codeium|gemini|devin|ai)\b/i;

// Tier 2 — ask before committing critical config (union across stacks).
// Matched by BASENAME so nested (monorepo) copies count too: packages/web/package.json etc.
const CRITICAL_BASENAMES = new Set([
  ".gitignore", ".gitattributes", ".env.example", "README.md",
  // JS / TS
  "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
  "biome.json", "tsconfig.json", ".eslintrc.json", ".prettierrc",
  // Python
  "pyproject.toml", "requirements.txt", "requirements-dev.txt",
  "Pipfile", "Pipfile.lock", "poetry.lock", "setup.py", "setup.cfg", "alembic.ini",
  // other ecosystems / infra
  "Cargo.toml", "go.mod", "Gemfile", "Dockerfile", "docker-compose.yml",
]);
// Path-shaped criticals (segment-anchored → match at any depth).
// Note: .claude/ is hard-blocked from commits (see BLOCK_DIR_RE), not merely ask-critical.
const CRITICAL_PATH_RE = [
  /(^|\/)\.github\/workflows\//,
  /(^|\/)(next|tailwind|vite|webpack)\.config\.[a-z]+$/,
];

function basename(file) {
  return file.slice(file.lastIndexOf("/") + 1);
}
function isCritical(file) {
  return CRITICAL_BASENAMES.has(basename(file)) || CRITICAL_PATH_RE.some((r) => r.test(file));
}

// Generic area classification (stack-agnostic)
const AREA_RULES = [
  { name: "Source", test: (f) => /^(src|lib|app|pkg|internal)\//.test(f) },
  { name: "Tests", test: (f) => /(^|\/)(tests?|spec|__tests__)\//.test(f) },
  { name: "Docs", test: (f) => /(^|\/)docs?\//.test(f) || /\.mdx?$/.test(f) },
  { name: "Content", test: (f) => /^(content|public|assets|static)\//.test(f) },
  { name: "Scripts", test: (f) => /^(scripts?|bin|tools)\//.test(f) },
  { name: "CI", test: (f) => /(^|\/)\.github\//.test(f) },
  { name: "Config", test: (f) => isCritical(f) },
];

function classifyAreas(files) {
  const areas = new Set();
  for (const file of files) {
    for (const rule of AREA_RULES) {
      if (rule.test(file)) { areas.add(rule.name); break; }
    }
  }
  return [...areas];
}

// Tier 3 — debug artifacts in staged additions (union: JS / Python / Ruby)
const DEBUG_RE =
  /\bconsole\.(log|debug)\b|\bdebugger\b|\bTODO\b|\bFIXME\b|\bpdb\.set_trace\b|\bimport pdb\b|\bbreakpoint\s*\(\s*\)|\bbinding\.pry\b/;
const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".rb", ".go", ".rs", ".java"]);
const DEBUG_SKIP_PREFIX = ["__tests__/", "tests/", "test/", "spec/", "examples/", "example/", "playground/", "scratch/", "fixtures/"];
const DRAFT_PATH_RE = /(^|\/)drafts?\/|_draft\b/i;

function extOf(file) { const m = file.match(/(\.[^./]+)$/); return m ? m[1] : ""; }
function skipDebugCheck(file) { return DEBUG_SKIP_PREFIX.some((p) => file.startsWith(p)); }

function runGit(cmd) {
  // stderr=ignore so git's "fatal:" noise never leaks to the user; decisions use stdout only.
  try { return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim(); } catch { return ""; }
}

function extractCommitMessage(command) {
  // PowerShell here-string: -m @'\n...\n'@  or  -m @"\n...\n"@
  const psHere = command.match(/@(['"])\r?\n([\s\S]*?)\r?\n\1@/);
  if (psHere) return psHere[2].trim();
  // -m "..." or -m '...'
  const mFlag = command.match(/-m\s+["']([^"']*)["']/);
  if (mFlag) return mFlag[1].trim();
  // bash $(cat <<'EOF' \n ... \n EOF \n )
  const catHeredoc = command.match(/cat\s+<<['"]*\w+['"]*\r?\n([\s\S]*?)\r?\n\s*\w+\s*\)/);
  if (catHeredoc) return catHeredoc[1].trim();
  // plain heredoc: <<EOF \n ... \n EOF
  const heredoc = command.match(/<<['"]*\w+['"]*\r?\n([\s\S]*?)\r?\n\w+/);
  if (heredoc) return heredoc[1].trim();
  return null; // parsing failed — do not block on message
}

function block(reason) {
  process.stderr.write(`[commit-guard] BLOCKED\n${reason}\n`);
  process.exit(2);
}
function ask(lines) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `[commit-guard] Confirm commit\n${lines.join("\n")}`,
      },
    }),
  );
  process.exit(0);
}
// Advisory (Tier 3): inject actionable context for Claude — commit proceeds (non-blocking).
// additionalContext is read by Claude next turn, so it works in auto/headless mode.
function advise(text) {
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: text } }),
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
    process.stderr.write("[commit-guard] BLOCKED: could not parse hook input (failing closed).\n");
    process.exit(2);
  }

  const command = input?.tool_input?.command || "";
  if (!/\bgit\s+commit\b/.test(command)) process.exit(0);

  const stagedRaw = runGit("git diff --cached --name-status");
  const stagedDiff = runGit("git diff --cached --unified=0");

  const allEntries = stagedRaw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [status, ...parts] = line.split("\t");
      const file = parts[parts.length - 1] || ""; // renames: use the new path
      return { status: status[0], file };
    });
  const meaningfulFiles = allEntries.filter((e) => e.status !== "D").map((e) => e.file);
  const allFiles = allEntries.map((e) => e.file);

  const commitMessage = extractCommitMessage(command);
  const bypassed = commitMessage?.includes("[commit-guard-ignore]") ?? false;

  // Tier 1 — hard block (no bypass)
  if (commitMessage !== null) {
    const clean = commitMessage.replace(/\[commit-guard-ignore\]/g, "").trim();
    if (!clean) block("Commit message is empty.");
    if (BLOCK_MSG_RE.test(clean)) block(`Bad commit message: "${commitMessage}"`);
    if (ATTRIBUTION_MSG_RE.test(clean) || GENERATOR_MSG_RE.test(clean))
      block("Attribution/generator trailer in commit message — git.md bans Co-Authored-By and AI generator credits anywhere. Remove it.");
  }
  for (const file of allFiles) {
    for (const re of BLOCK_DIR_RE) if (re.test(file)) block(`Dangerous path staged: ${file}`);
    for (const re of BLOCK_PATH_RE) if (re.test(file)) block(`Dangerous file staged: ${file}`);
  }

  // Tier 2 — ask: critical files (no bypass)
  const criticalFiles = allFiles.filter(isCritical);
  if (criticalFiles.length > 0) {
    const areas = classifyAreas(meaningfulFiles);
    const lines = [
      `Critical files:`,
      ...criticalFiles.map((f) => `  * ${f}`),
      `Areas:`,
      ...areas.map((a) => `  * ${a}`),
      `Files: ${meaningfulFiles.length}`,
    ];
    if (commitMessage) lines.push(`Message: "${commitMessage.replace(/\[commit-guard-ignore\]/g, "").trim()}"`);
    ask(lines);
  }

  // Tier 3 — warn (bypassable)
  if (bypassed) process.exit(0);
  const areas = classifyAreas(meaningfulFiles);
  const count = meaningfulFiles.length;
  const warnings = [];
  if (count > 40) warnings.push(`Very large commit: ${count} files.`);
  else if (count > 25) warnings.push(`Large commit: ${count} files.`);
  if (areas.length >= 4) warnings.push(`Spans ${areas.length} areas: ${areas.join(", ")}.`);
  else if (areas.length >= 3) warnings.push(`Spans multiple areas: ${areas.join(", ")}.`);
  const draftFiles = meaningfulFiles.filter((f) => DRAFT_PATH_RE.test(f));
  if (draftFiles.length > 0) warnings.push(`Draft files: ${draftFiles.join(", ")}`);

  const debugHits = new Set();
  let currentFile = "";
  for (const line of stagedDiff.split("\n")) {
    if (line.startsWith("+++ b/")) currentFile = line.slice(6);
    else if (line.startsWith("+") && !line.startsWith("+++")) {
      if (SOURCE_EXTS.has(extOf(currentFile)) && !skipDebugCheck(currentFile) && DEBUG_RE.test(line)) {
        debugHits.add(currentFile);
      }
    }
  }
  if (debugHits.size > 0) warnings.push(`Debug artifacts in: ${[...debugHits].join(", ")}`);

  if (warnings.length > 0) {
    advise(
      `[commit-guard] This commit (${count} files, areas: ${areas.join(", ")}) — ${warnings.join(" ")} ` +
      `Address if unintended: remove debug artifacts and amend the commit; split a large or multi-area ` +
      `commit into focused ones; confirm any draft files belong. ` +
      `(Add [commit-guard-ignore] to the commit message to silence this.)`,
    );
  }

  process.exit(0);
});
