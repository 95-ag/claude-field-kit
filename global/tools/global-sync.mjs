#!/usr/bin/env node
/**
 * global-sync — deliver the Claude Field Kit global tier to ~/.claude/ (Windows + WSL).
 * (Built as cluster-C task "T2"; the tool is named global-sync, matching the global-sync skill.)
 *
 * Usage:
 *   node global-sync.mjs [--env windows|wsl] [--root <claude-field-kit-path>]
 *
 * --env   Target environment. Auto-detected from CLAUDE_PROJECT_DIR if omitted.
 * --root  Claude Field Kit repo root. Default: /home/ag-95/projects/claude-field-kit
 *
 * Stop before running if the user has not confirmed the sync.
 */
import { createHash } from "crypto";
import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
  readdirSync, copyFileSync, unlinkSync, statSync,
} from "fs";
import { join, dirname, basename, relative } from "path";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  return i !== -1 ? argv[i + 1] ?? null : null;
}

const CLAUDE_FIELD_KIT_ROOT = getArg("--root") ?? "/home/ag-95/projects/claude-field-kit";
const ENV = getArg("--env") ?? detectEnv();

function detectEnv() {
  const cpd = process.env.CLAUDE_PROJECT_DIR ?? "";
  // UNC (\\wsl...) or Windows drive path → windows
  if (cpd.startsWith("\\\\") || /^[a-zA-Z]:/.test(cpd)) return "windows";
  return "wsl";
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const WSL_HOME = "/home/ag-95/.claude";
const WIN_HOME = "/mnt/c/Users/aishw/.claude";

const TARGETS = { wsl: WSL_HOME, windows: WIN_HOME };
const TARGET_DIR = TARGETS[ENV];

if (!TARGET_DIR) {
  process.stderr.write(`[global-sync] Unknown env "${ENV}". Use --env windows|wsl\n`);
  process.exit(1);
}

const MANIFEST_PATH   = join(TARGET_DIR, ".claude-sync-manifest.json");
const DIRTY_FLAG_PATH = join(TARGET_DIR, ".claude-sync-dirty");
const SETTINGS_PATH   = join(TARGET_DIR, "settings.json");

const GLOBAL_SHARED   = join(CLAUDE_FIELD_KIT_ROOT, "global/shared");
const GLOBAL_OVERLAY  = join(CLAUDE_FIELD_KIT_ROOT, `global/${ENV}`);
const HOOKS_JSON_PATH = join(GLOBAL_SHARED, "hooks.json");

const INCOMING_ROOT   = join(CLAUDE_FIELD_KIT_ROOT, "incoming");
const TASKS_PATH      = join(CLAUDE_FIELD_KIT_ROOT, ".claude/work/tasks.md");

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function readJson(path, fallback = {}) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function writeJson(path, data) {
  writeFile(path, JSON.stringify(data, null, 2) + "\n");
}

/** Walk a directory tree. Returns { relPath: absPath } for all files. */
function walkDir(dir, base = dir, acc = {}) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walkDir(abs, base, acc);
    else acc[relative(base, abs).replace(/\\/g, "/")] = abs;
  }
  return acc;
}

// ---------------------------------------------------------------------------
// Hooks transform
// ---------------------------------------------------------------------------

/**
 * Transform commands from the source hooks.json for the target env.
 * Source commands use absolute WSL paths: node "/home/ag-95/.claude/hooks/<name>.mjs"
 * Windows env: wrap with wsl -d ubuntu bash -lc '...' + MSYS guard.
 * WSL env: leave as-is (already correct absolute path).
 */
function transformHooksForEnv(hooksJson, env) {
  const hooks = JSON.parse(JSON.stringify(hooksJson)); // deep clone
  const WSL_HOOKS_DIR = `${WSL_HOME}/hooks`;

  function transformCmd(cmd) {
    // Match: node "/home/ag-95/.claude/hooks/<name>.mjs"
    const m = cmd.match(/node\s+"([^"]+\.mjs)"/);
    if (!m) return cmd;
    const scriptPath = m[1];
    // Rebase to the delivered hooks dir in case source path differs
    const name = basename(scriptPath);
    const wslPath = `${WSL_HOOKS_DIR}/${name}`;

    if (env === "wsl") return `node "${wslPath}"`;
    // Windows: WSL-first wrap with MSYS guard
    return `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL=* wsl -d ubuntu bash -lc 'node "${wslPath}"'`;
  }

  for (const eventHooks of Object.values(hooks.hooks ?? {})) {
    for (const entry of eventHooks) {
      for (const hook of entry.hooks ?? []) {
        if (hook.type === "command" && hook.command) {
          hook.command = transformCmd(hook.command);
        }
      }
    }
  }
  return hooks;
}

// ---------------------------------------------------------------------------
// CLAUDE.md composition — overlay delta on top of shared body
// ---------------------------------------------------------------------------

/**
 * Strip an overlay CLAUDE.md's documentation preamble: the leading H1 title and the
 * blockquote meta-note both describe the overlay *file* (e.g. "Windows overlay — composes
 * with shared"), not instructions for the consumer. What remains is the substantive delta
 * (its @imports / rules), or nothing when the overlay is a pure placeholder.
 */
function stripOverlayMeta(text) {
  const lines = text.split("\n");
  let i = 0;
  const skipBlank = () => { while (i < lines.length && lines[i].trim() === "") i++; };
  skipBlank();
  if (i < lines.length && /^#\s/.test(lines[i])) i++;   // leading H1 title
  skipBlank();
  while (i < lines.length && lines[i].trimStart().startsWith(">")) i++; // blockquote note
  return lines.slice(i).join("\n").trim();
}

/** Overlay delta (preamble stripped) prepended to the shared body; shared alone if no delta. */
function composeClaudeMd(overlay, shared) {
  const delta = stripOverlayMeta(overlay);
  return delta ? delta + "\n\n" + shared : shared;
}

// ---------------------------------------------------------------------------
// Settings.json merge — preserve user-owned hooks, replace global-sync-managed
// ---------------------------------------------------------------------------

// global-sync-managed entries reference /.claude/hooks/ scripts. User-owned entries
// (Notification, custom commands, etc.) reference different paths and are kept.
function isManagedEntry(entry) {
  return (entry.hooks ?? []).some(
    h => h.type === "command" && (h.command ?? "").includes("/.claude/hooks/")
  );
}

function mergeSettings(existing, transformed) {
  const existingHooks = existing.hooks  ?? {};
  const newHooks      = transformed.hooks ?? {};
  const allEvents = new Set([...Object.keys(existingHooks), ...Object.keys(newHooks)]);

  const mergedHooks = {};
  for (const event of allEvents) {
    const userEntries = (existingHooks[event] ?? []).filter(e => !isManagedEntry(e));
    const managedEntries   = newHooks[event] ?? [];
    mergedHooks[event] = [...userEntries, ...managedEntries];
  }

  return { ...existing, hooks: mergedHooks };
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

function loadManifest() {
  return readJson(MANIFEST_PATH, { version: 1, deliveredAt: null, files: {} });
}

function saveManifest(files) {
  writeJson(MANIFEST_PATH, { version: 1, deliveredAt: new Date().toISOString(), files });
}

// ---------------------------------------------------------------------------
// Drift detection
// ---------------------------------------------------------------------------

/**
 * Extract the path segment after "/.claude/" for cross-env comparison.
 * Works for WSL paths, UNC paths, and Windows drive paths.
 */
function claudeRel(p) {
  const norm = String(p).replace(/\\/g, "/");
  const marker = "/.claude/";
  const idx = norm.indexOf(marker);
  return idx !== -1 ? norm.slice(idx + marker.length) : null;
}

function detectDrift(manifest) {
  const drifted = [];
  for (const [absPath, expectedHash] of Object.entries(manifest.files ?? {})) {
    if (absPath === SETTINGS_PATH) continue; // settings managed separately
    if (!existsSync(absPath)) continue;
    const actual = sha256(readFileSync(absPath, "utf8"));
    if (actual !== expectedHash) drifted.push(absPath);
  }
  return drifted;
}

// ---------------------------------------------------------------------------
// Routing: drifted file → incoming/ + harvest task
// ---------------------------------------------------------------------------

function routeDriftedFile(absPath) {
  const rel = claudeRel(absPath) ?? basename(absPath);
  const parts = rel.replace(/\\/g, "/").split("/");
  const assetType = parts.length > 1 ? parts[0] : "misc";

  const incomingDir = join(INCOMING_ROOT, assetType);
  const dest = join(incomingDir, basename(absPath));
  mkdirSync(incomingDir, { recursive: true });
  copyFileSync(absPath, dest);
  return { assetType, dest };
}

function appendHarvestTasks(entries) {
  if (!existsSync(TASKS_PATH)) return;
  const date = new Date().toISOString().split("T")[0];
  const lines = entries.map(({ absPath, assetType, dest }) =>
    `- [ ] **Review incoming drift (${date})**: \`${basename(absPath)}\` — routed from \`${ENV}\` ` +
    `\`${absPath}\` → \`incoming/${assetType}/\``
  ).join("\n");

  const content = readFileSync(TASKS_PATH, "utf8");
  // Insert before ## Done, or append
  const doneIdx = content.indexOf("\n## Done");
  const updated = doneIdx !== -1
    ? content.slice(0, doneIdx) + "\n" + lines + "\n" + content.slice(doneIdx)
    : content + "\n" + lines + "\n";
  writeFileSync(TASKS_PATH, updated, "utf8");
}

// ---------------------------------------------------------------------------
// Deletion check
// ---------------------------------------------------------------------------

function checkDeletions(manifest) {
  const missing = [];
  for (const absPath of Object.keys(manifest.files ?? {})) {
    if (absPath === SETTINGS_PATH) continue;
    const rel = claudeRel(absPath);
    if (!rel) continue;
    // Check if source still exists in global/shared or overlay
    const sharedSrc  = join(GLOBAL_SHARED, rel);
    const overlaySrc = join(GLOBAL_OVERLAY, rel);
    if (!existsSync(sharedSrc) && !existsSync(overlaySrc)) {
      missing.push(absPath);
    }
  }
  if (missing.length === 0) return;
  // Emit additionalContext — does not block, user sees it next turn
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext:
        `[global-sync] ${missing.length} delivered file(s) no longer have a Claude Field Kit source.\n` +
        `Review before removing — run with --prune to confirm deletion:\n` +
        missing.map(p => `  - ${p}`).join("\n"),
    },
  }) + "\n");
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

function deliver() {
  const newManifest = {};

  const sharedFiles  = walkDir(GLOBAL_SHARED);
  const overlayFiles = walkDir(GLOBAL_OVERLAY);

  // Overlay wins on conflict, except CLAUDE.md: overlay delta (preamble stripped) on top of shared.
  const composed = { ...sharedFiles, ...overlayFiles };
  const combinedClaude =
    sharedFiles["CLAUDE.md"] && overlayFiles["CLAUDE.md"]
      ? composeClaudeMd(
          readFileSync(overlayFiles["CLAUDE.md"], "utf8"),
          readFileSync(sharedFiles["CLAUDE.md"], "utf8"),
        )
      : null;

  for (const [rel, src] of Object.entries(composed)) {
    if (rel === "hooks.json") continue;       // handled separately via transform
    if (rel.startsWith(".")) continue;
    if (rel.startsWith("plugins/")) continue; // plugins/ holds scope/reference docs, not deliverables

    const content = (rel === "CLAUDE.md" && combinedClaude != null)
      ? combinedClaude
      : readFileSync(src, "utf8");

    const dest = join(TARGET_DIR, rel);
    writeFile(dest, content);
    newManifest[dest] = sha256(content);
  }

  // Transform hooks and merge into settings.json
  if (existsSync(HOOKS_JSON_PATH)) {
    const raw = readJson(HOOKS_JSON_PATH);
    const transformed = transformHooksForEnv(raw, ENV);
    const existing = readJson(SETTINGS_PATH, {});
    const merged = mergeSettings(existing, transformed);
    writeJson(SETTINGS_PATH, merged);
    newManifest[SETTINGS_PATH] = sha256(JSON.stringify(merged, null, 2) + "\n");
  }

  saveManifest(newManifest);
  console.log(`[global-sync] env=${ENV}  delivered ${Object.keys(newManifest).length} files → ${TARGET_DIR}`);
  return newManifest;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const oldManifest = loadManifest();

// Drift detection: must run BEFORE delivery (delivery overwrites hashes)
if (existsSync(DIRTY_FLAG_PATH)) {
  const drifted = detectDrift(oldManifest);
  if (drifted.length > 0) {
    console.log(`[global-sync] Drift in ${drifted.length} file(s) — routing to incoming/`);
    const routed = drifted.map(absPath => {
      const { assetType, dest } = routeDriftedFile(absPath);
      console.log(`  ${absPath} → incoming/${assetType}/${basename(absPath)}`);
      return { absPath, assetType, dest };
    });
    appendHarvestTasks(routed);
  }
  try { unlinkSync(DIRTY_FLAG_PATH); } catch {}
}

// Deletion check (warn if Claude Field Kit source removed)
checkDeletions(oldManifest);

// Deliver
deliver();
