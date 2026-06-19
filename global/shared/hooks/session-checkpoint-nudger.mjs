#!/usr/bin/env node
/**
 * session-checkpoint-nudger — PostToolUse on `git commit` (bash + PowerShell). (was primer-guard)
 *
 * After a commit, if meaningful work has accumulated since .claude/work/session.md was last
 * committed, injects `additionalContext` pointing Claude at the /checkpoint skill (which owns the
 * work-doc update procedure). Non-blocking and works in auto/headless mode — additionalContext is
 * read by Claude on its next turn (it is actionable context, not a guaranteed command, and a hook
 * cannot itself invoke a skill). Message scales with severity. State from git only.
 *
 * Severity (max 5): Cadence (commits since session.md) + Arch (path weight of un-checkpointed
 * changes) + Breadth (distinct areas). 0–1 silent · 2–3 reminder · 4 update-now · 5+ action-required.
 */
import { createInterface } from "readline";
import { execSync } from "child_process";

const WINDOW = 15;
const SESSION_PATH = ".claude/work/session.md";

// --- config detection (union across stacks) ---
const CONFIG_BASENAMES = new Set([
  "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "tsconfig.json", "biome.json",
  "pyproject.toml", "requirements.txt", "Pipfile", "poetry.lock", "setup.py", "setup.cfg", "alembic.ini",
  "Cargo.toml", "go.mod", "Gemfile", "Dockerfile", "docker-compose.yml",
]);
const CONFIG_RE = [/(^|\/)(next|tailwind|vite|webpack)\.config\.[a-z]+$/, /(^|\/)\.github\/workflows\//];
function basename(f) { return f.slice(f.lastIndexOf("/") + 1); }
function isConfig(f) { return CONFIG_BASENAMES.has(basename(f)) || CONFIG_RE.some((r) => r.test(f)); }

// --- architectural weight (stack-agnostic) ---
const WEIGHT_RULES = [
  { weight: 3, test: (f) => isConfig(f) },
  { weight: 3, test: (f) => /^(src\/app|app|pages|src\/pages)\//.test(f) }, // entry / routing
  { weight: 2, test: (f) => /^(src|lib|pkg|internal)\//.test(f) || /(^|\/)components\//.test(f) },
  { weight: 2, test: (f) => /^(content|docs?)\//.test(f) },
  { weight: 1, test: (f) => /^(public|assets|static)\//.test(f) || /tailwind|theme|tokens|globals\.css/.test(f) },
];
function pathWeight(file) {
  for (const rule of WEIGHT_RULES) if (rule.test(file)) return rule.weight;
  return 0;
}

// --- area classification (stack-agnostic) ---
const AREA_RULES = [
  { name: "Source", test: (f) => /^(src|lib|app|pkg|internal)\//.test(f) },
  { name: "Tests", test: (f) => /(^|\/)(tests?|spec|__tests__)\//.test(f) },
  { name: "Docs", test: (f) => /(^|\/)docs?\//.test(f) || /\.mdx?$/.test(f) },
  { name: "Content", test: (f) => /^(content|public|assets|static)\//.test(f) },
  { name: "Scripts", test: (f) => /^(scripts?|bin|tools)\//.test(f) },
  { name: "CI", test: (f) => /(^|\/)\.github\//.test(f) },
  { name: "Config", test: (f) => isConfig(f) },
];
function classifyAreas(files) {
  const areas = new Set();
  for (const file of files) for (const rule of AREA_RULES) if (rule.test(file)) { areas.add(rule.name); break; }
  return [...areas];
}

function runGit(cmd) {
  // stderr=ignore so git's "fatal:" noise never leaks; decisions use stdout only.
  try { return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim(); } catch { return ""; }
}

function getCommitsSinceSession() {
  const allShas = runGit(`git log --oneline -${WINDOW} --format=%H`).split("\n").filter(Boolean);
  const lastSession = runGit(`git log --oneline -${WINDOW} --format=%H -- "${SESSION_PATH}"`).split("\n").filter(Boolean)[0] || null;
  if (!lastSession) return { count: allShas.length, shas: allShas };
  const idx = allShas.indexOf(lastSession);
  if (idx === -1) return { count: allShas.length, shas: allShas };
  return { count: idx, shas: allShas.slice(0, idx) }; // idx 0 ⇒ HEAD touched session.md ⇒ count 0
}
function getFilesForShas(shas) {
  if (shas.length === 0) return [];
  // `git show --name-only` per commit (union) — root-commit safe (no `^` parent ref needed).
  const out = runGit(`git show --name-only --format= ${shas.join(" ")}`);
  return [...new Set(out.split("\n").filter(Boolean))];
}

// Inject actionable context for Claude (read on its next turn). Non-blocking.
function inject(text) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: text } }));
  process.exit(0);
}

const rl = createInterface({ input: process.stdin });
let raw = "";
rl.on("line", (line) => (raw += line));
rl.on("close", () => {
  let input;
  try { input = JSON.parse(raw || "{}"); } catch { process.exit(0); } // fail open

  const command = input?.tool_input?.command || "";
  if (!/\bgit\s+commit\b/.test(command)) process.exit(0);

  const { count: commitsSince, shas } = getCommitsSinceSession();
  if (commitsSince === 0) process.exit(0); // the latest commit already updated session.md

  const files = getFilesForShas(shas);
  const cadence = commitsSince >= 12 ? 2 : commitsSince >= 7 ? 1 : 0;
  const totalWeight = files.reduce((sum, f) => sum + pathWeight(f), 0);
  const arch = totalWeight >= 16 ? 2 : totalWeight >= 8 ? 1 : 0;
  const areas = classifyAreas(files);
  const breadth = areas.length >= 4 ? 1 : 0;
  const severity = cadence + arch + breadth;

  if (severity <= 1) process.exit(0);

  const areaStr = areas.length ? ` (areas: ${areas.join(", ")})` : "";
  const fact = `${commitsSince} commit${commitsSince === 1 ? "" : "s"} since .claude/work/session.md was last updated${areaStr}.`;
  let action;
  // Action points at the /checkpoint skill (it owns the work-doc update procedure); the skill is
  // work-docs-only and does NOT commit, so the commit step stays explicit here.
  if (severity >= 5) {
    action = "ACTION REQUIRED — run /checkpoint now: major un-checkpointed progress at risk of loss. It updates the .claude/work/ docs (session.md + tasks.md / lessons.md); then commit the updated work docs.";
  } else if (severity === 4) {
    action = "Run /checkpoint now: significant progress since the last checkpoint. It updates the .claude/work/ docs; then commit them.";
  } else {
    action = "Consider running /checkpoint to checkpoint progress in .claude/work/, then committing the updated docs.";
  }
  inject(`[session-checkpoint-nudger] ${fact} ${action}`);
});
