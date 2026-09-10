#!/usr/bin/env node
/**
 * bash-write-adapter — PreToolUse + PostToolUse companion on Bash|PowerShell.
 *
 * WHY THIS EXISTS
 * Every hook that guards file edits is registered on Write|Edit|MultiEdit and reads
 * tool_input.file_path. A file changed through the Bash tool — `sed -i`, `cat > f`, a python3
 * heredoc — matches none of them and carries no file_path, so it silently bypassed file-protect,
 * asset-capture, hub-dirty-flag, code-formatter and ai-prose-guard. This adapter closes the
 * detection half of that gap: it works out which files a shell command actually changed and
 * replays each one into the existing edit hooks through their own stdin contract.
 *
 * It is REACTIVE and restricts nothing. Prevention is command-firewall's job; this runs after the
 * write and either dispatches or reports. It is fail-open by construction: every path exits 0, so
 * a bug here can never break a Bash call. The one exception is loudness — a changed protected file
 * raises an alarm, because silence there is what made the original bug invisible.
 *
 * DETECTION — three targeted detectors, because no single one can see everything:
 *   1. `git status --porcelain -uall` gives the candidate set of dirty repo paths; each is then
 *      filtered by mtime against the pre-command marker. Filtering a candidate set beats diffing
 *      two snapshots: a file that was ALREADY dirty and is modified again keeps the same status
 *      line, so a snapshot diff would miss it while mtime does not.
 *   2. An mtime walk of <cwd>/.claude/{rules,skills,agents,hooks}. Those are gitignored, so git is
 *      blind to them — which is exactly the asset-capture case this work exists to fix.
 *   3. An mtime stat of the manifest-tracked ~/.claude/ files. They sit outside every repo, and
 *      they are what hub-dirty-flag needs to see for global-sync to notice drift.
 *
 * PAIRING — the marker is keyed by `tool_use_id`, which the harness sends on both the PreToolUse
 * and the PostToolUse of the same call. session_id is shared by parallel subagent calls and PPID
 * differs between the two halves, so neither can pair them; tool_use_id is the only key that does.
 *
 * KNOWN LIMITS — stated rather than papered over:
 *   - Writes outside the working repo are not detected at all. A cwd-relative write into a system
 *     directory is neither prevented by command-firewall (the target carries no absolute path) nor
 *     seen here. That combination has no coverage in either direction; only OS permissions stop it.
 *   - The protected-path scan reaches two directory levels from the repo root. A secret nested
 *     deeper than that is not reported.
 *   - The kit's own incoming/ is gitignored and sits outside .claude/, so a shell write there
 *     queues no review task. Only the Edit channel covers it.
 *   - Deleting a file leaves nothing to detect, so deletion is prevention-only — command-firewall
 *     refuses to destroy a protected path, and nothing here can notice after the fact.
 *   - A content-identical rewrite bumps mtime and is treated as a change. Formatting is idempotent
 *     and capture is deduped by task marker, so the cost is wasted work, never a wrong result.
 *   - Cost is roughly 80ms per Bash call, most of it node process startup for the two halves.
 *     Deriving the start time from the PostToolUse `duration_ms` would remove one spawn, but the
 *     hook only observes time AFTER the command, so the estimate would land later than the real
 *     start and need a margin wide enough to re-detect the previous command's writes — which would
 *     re-raise its alarms. Exactness was worth more than the spawn.
 */
import { createInterface } from "readline";
import { spawnSync } from "child_process";
import {
  existsSync, mkdirSync, readdirSync, readFileSync,
  statSync, unlinkSync, writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";

const HOOK_DIR = dirname(fileURLToPath(import.meta.url));
const HOME = process.env.HOME ?? process.env.USERPROFILE ?? "";
const CLAUDE_HOME = join(HOME, ".claude");
const MANIFEST_PATH = join(CLAUDE_HOME, ".claude-sync-manifest.json");

const ASSET_DIRS = ["rules", "skills", "agents", "hooks"];

// Build artifacts and vendored trees — never worth dispatching, and large enough to matter.
// code-formatter carries its own copy of this list: it is a project-tier hook delivered into each
// project's .claude/hooks/, so a global hook cannot import from it. Kept in sync by hand; this one
// additionally excludes .git, whose internals churn on every command.
const SKIP_DIR_RE =
  /(^|\/)(node_modules|\.venv|venv|dist|build|out|coverage|__pycache__|\.next|\.turbo|\.cache|\.git)\//;

// Filesystem timestamp granularity is not guaranteed finer than the marker write, so a file written
// in the same tick can stat as fractionally older. A small grace over-detects rather than misses;
// over-detection is harmless here (formatting is idempotent, capture is deduped by task marker).
const MTIME_GRACE_MS = 5;

// A heredoc can be megabytes. Cap what we hand the prose reporter so one giant file cannot stall a
// Bash call; the skip is recorded rather than silent.
const MAX_PROSE_BYTES = 512 * 1024;

const PROSE_EXT_RE = /\.(mdx|html?|htm)$/i;

// Stale markers accumulate whenever a PostToolUse never arrives (denied command, killed session).
const MARKER_TTL_MS = 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Marker
// ---------------------------------------------------------------------------

function markerDir(input) {
  const base = input?.scratchpad_dir || tmpdir();
  return join(base, ".bash-write-adapter");
}

function markerPath(input) {
  const key = input?.tool_use_id || `${input?.session_id ?? "nokey"}-${process.ppid}`;
  return join(markerDir(input), `${String(key).replace(/[^\w.-]/g, "_")}.json`);
}

function sweepStaleMarkers(dir) {
  try {
    const cutoff = Date.now() - MARKER_TTL_MS;
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      try { if (statSync(abs).mtimeMs < cutoff) unlinkSync(abs); } catch {}
    }
  } catch {}
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

function runGit(args, cwd) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return r.status === 0 ? (r.stdout ?? "") : "";
}

// git C-quotes a path with unusual characters; the escaping is JSON-compatible in practice.
function unquotePath(p) {
  if (!p.startsWith('"')) return p;
  try { return JSON.parse(p); } catch { return p.slice(1, -1); }
}

function porcelainPaths(repoRoot) {
  const out = runGit(["status", "--porcelain", "-uall"], repoRoot);
  const paths = [];
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    let rest = line.slice(3);
    const arrow = rest.indexOf(" -> "); // rename: only the destination exists now
    if (arrow !== -1) rest = rest.slice(arrow + 4);
    paths.push(join(repoRoot, unquotePath(rest)));
  }
  return paths;
}

function changedSince(paths, sinceMs) {
  const hits = [];
  for (const abs of paths) {
    try {
      const st = statSync(abs);
      if (st.isFile() && st.mtimeMs >= sinceMs - MTIME_GRACE_MS) hits.push(abs);
    } catch { /* gone — deleted by the command; deletion stays command-firewall's job */ }
  }
  return hits;
}

function walkNewer(dir, sinceMs, acc = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const entry of entries) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) { walkNewer(abs, sinceMs, acc); continue; }
    if (!entry.isFile()) continue;
    try {
      if (statSync(abs).mtimeMs >= sinceMs - MTIME_GRACE_MS) acc.push(abs);
    } catch {}
  }
  return acc;
}

// Protected files are almost always gitignored — that is the point of them — so the git detector is
// blind to exactly the paths the alarm exists to report, and they do not live under .claude/ either.
// A bounded walk of the repo root recovers the common case: protected material sits at the root or
// one directory down (certs/, secrets/). Deeper nesting is still missed, and is stated as a limit
// rather than papered over.
const PROTECTED_SCAN_DEPTH = 2;
const PROTECTED_SCAN_CAP = 2000;

function scanProtected(root, sinceMs, hardBlock, normalize) {
  const hits = [];
  let examined = 0;
  const walk = (dir, depth) => {
    if (depth > PROTECTED_SCAN_DEPTH || examined > PROTECTED_SCAN_CAP) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (examined++ > PROTECTED_SCAN_CAP) return;
      const abs = join(dir, entry.name);
      if (SKIP_DIR_RE.test(`${abs.replace(/\\/g, "/")}/`)) continue;
      if (entry.isDirectory()) { walk(abs, depth + 1); continue; }
      if (!entry.isFile()) continue;
      const norm = normalize(abs);
      if (!hardBlock.some((re) => re.test(norm))) continue;
      try {
        if (statSync(abs).mtimeMs >= sinceMs - MTIME_GRACE_MS) hits.push(abs);
      } catch {}
    }
  };
  walk(root, 1);
  return hits;
}

function manifestFilesChanged(sinceMs) {
  try {
    const m = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
    return changedSince(Object.keys(m.files ?? {}), sinceMs);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Dispatch — replay each changed file into a hook through its own stdin contract
// ---------------------------------------------------------------------------

// `cwd` matters: a dispatched hook may shell out to project-local tooling (code-formatter runs
// `npx --no-install biome`, which resolves from the working directory upward). Inheriting this
// process's cwd would silently resolve against the wrong project, or none at all.
function dispatch(hookPath, payload, cwd) {
  if (!existsSync(hookPath)) return null; // hook not present in this project → silent no-op
  try {
    return spawnSync("node", [hookPath], {
      cwd,
      input: JSON.stringify(payload),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 15000,
    });
  } catch {
    return null;
  }
}

const writePayload = (filePath, extra = {}) => ({
  tool_name: "Write",
  tool_input: { file_path: filePath, ...extra },
});

// asset-capture does a full recursive copy of a skill directory per call, so a sweep touching a
// dozen files in one skill must not trigger a dozen full-tree copies. Collapse to one path per asset.
function dedupeByAsset(paths) {
  const seen = new Map();
  for (const p of paths) {
    const m = p.replace(/\\/g, "/").match(/^(.*)\/\.claude\/([^/]+)\/(.+)$/);
    const key = m && m[2] === "skills" ? `${m[1]}/skills/${m[3].split("/")[0]}` : p;
    if (!seen.has(key)) seen.set(key, p);
  }
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Halves
// ---------------------------------------------------------------------------

function pre(input) {
  const dir = markerDir(input);
  mkdirSync(dir, { recursive: true });
  sweepStaleMarkers(dir);
  writeFileSync(markerPath(input), JSON.stringify({ t: Date.now(), cwd: input?.cwd ?? process.cwd() }), "utf8");
}

async function post(input) {
  const marker = markerPath(input);
  if (!existsSync(marker)) return; // no "before" state → nothing trustworthy to say
  let since, cwd;
  try {
    const m = JSON.parse(readFileSync(marker, "utf8"));
    since = m.t;
    cwd = m.cwd;
  } finally {
    try { unlinkSync(marker); } catch {}
  }
  if (!since) return;
  cwd = cwd || input?.cwd || process.cwd();

  const repoRoot = runGit(["rev-parse", "--show-toplevel"], cwd).trim();

  const repoChanged = repoRoot ? changedSince(porcelainPaths(repoRoot), since) : [];
  const assetChanged = ASSET_DIRS.flatMap((d) => walkNewer(join(cwd, ".claude", d), since));
  const hubChanged = manifestFilesChanged(since);

  // Loaded here rather than at module scope so the PreToolUse half never pays for it.
  let PROTECTED = null;
  try {
    PROTECTED = await import(new URL("./lib/protected-paths.mjs", import.meta.url));
  } catch {}

  // Kept out of repoChanged deliberately: a protected file must be reported, never formatted or staged.
  const protectedChanged = PROTECTED
    ? [...new Set([repoRoot, cwd].filter(Boolean))].flatMap((root) =>
        scanProtected(root, since, PROTECTED.HARD_BLOCK, PROTECTED.normalize),
      )
    : [];

  const all = [...new Set([...repoChanged, ...assetChanged, ...hubChanged, ...protectedChanged])]
    .filter((p) => !SKIP_DIR_RE.test(p.replace(/\\/g, "/")));

  if (all.length === 0) return; // fast path — most Bash calls read rather than write

  // hub-dirty-flag first: it is what tells global-sync that ~/.claude/ drifted, including drift
  // caused by this work itself.
  for (const p of hubChanged) dispatch(join(HOOK_DIR, "hub-dirty-flag.mjs"), writePayload(p), cwd);

  for (const p of dedupeByAsset(assetChanged)) {
    dispatch(join(HOOK_DIR, "asset-capture.mjs"), writePayload(p), cwd);
  }

  // Project-tier hooks live in the project, not beside this one. Absent → silent no-op.
  const formatter = join(cwd, ".claude", "hooks", "code-formatter.mjs");
  for (const p of repoChanged) dispatch(formatter, writePayload(p), cwd);

  await report(all, input, cwd, PROTECTED);
}

// ---------------------------------------------------------------------------
// Post-hoc alarm — the backstop for every write no static check can see
// ---------------------------------------------------------------------------

function proseFindings(paths, cwd) {
  const guard = join(cwd, ".claude", "hooks", "ai-prose-guard.mjs");
  if (!existsSync(guard)) return [];
  const findings = [];
  for (const p of paths.filter((f) => PROSE_EXT_RE.test(f))) {
    let content;
    try {
      if (statSync(p).size > MAX_PROSE_BYTES) {
        findings.push(`${p}: skipped, larger than ${Math.round(MAX_PROSE_BYTES / 1024)}KB`);
        continue;
      }
      content = readFileSync(p, "utf8");
    } catch { continue; }
    const r = dispatch(guard, writePayload(p, { content }), cwd);
    // Report only — never propagate the guard's exit 2 from PostToolUse. The write already happened,
    // and the guard sees the whole file rather than the added hunk. Its own message says BLOCKED,
    // which would contradict the surrounding report and invite the wrong correction; reword it.
    if (r && r.status === 2 && r.stderr) findings.push(r.stderr.trim().replace(/\bBLOCKED\b/g, "flagged"));
  }
  return findings;
}

async function report(all, input, cwd, PROTECTED) {
  const lines = [];

  if (PROTECTED) {
    const hit = all.filter((p) => PROTECTED.HARD_BLOCK.some((re) => re.test(PROTECTED.normalize(p))));
    if (hit.length) {
      const cmd = String(input?.tool_input?.command ?? "").slice(0, 400);
      lines.push(
        `PROTECTED FILE CHANGED BY A SHELL COMMAND — ${hit.length} file(s):`,
        ...hit.map((p) => `  ${p}`),
        `Command: ${cmd}`,
        "This write bypassed file-protect, which would have refused the same path through Edit.",
        "Nothing was reverted. Verify the change was intended; rotate the secret if it was not.",
      );
    }
  }

  const prose = proseFindings(all, cwd);
  if (prose.length) {
    lines.push(
      "Prose findings on files changed by this command (reported, not blocked —",
      "the guard saw the whole file, so a flagged line may pre-date this change):",
      ...prose,
    );
  }

  if (lines.length === 0) return;
  const text = `[bash-write-adapter] ${lines.join("\n")}`;
  process.stderr.write(`${text}\n`);
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: text } }),
  );
}

// ---------------------------------------------------------------------------

const rl = createInterface({ input: process.stdin });
let raw = "";
rl.on("line", (line) => (raw += line));
rl.on("close", async () => {
  try {
    const input = JSON.parse(raw || "{}");
    if (input?.hook_event_name === "PreToolUse") pre(input);
    else await post(input);
  } catch (err) {
    // Reactive and non-blocking by contract: surface the failure, never fail the Bash call.
    process.stderr.write(`[bash-write-adapter] skipped: ${err?.message ?? err}\n`);
  }
  process.exit(0);
});
