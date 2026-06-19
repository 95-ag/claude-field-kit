#!/usr/bin/env node
/**
 * hub-dirty-flag — PostToolUse hook (Write|Edit|MultiEdit).
 *
 * When a manifest-tracked ~/.claude/ file is written, sets ~/.claude/.claude-sync-dirty
 * so the next global-sync run knows to diff for drift and route changes to incoming/.
 * Always exits 0 — never blocks.
 */
import { createInterface } from "readline";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const HOME = process.env.HOME ?? "/home/ag-95";
const TARGET_DIR     = join(HOME, ".claude");
const MANIFEST_PATH  = join(TARGET_DIR, ".claude-sync-manifest.json");
const DIRTY_FLAG_PATH = join(TARGET_DIR, ".claude-sync-dirty");

/** Extract the rel-path segment after /.claude/ for cross-env path matching. */
function claudeRel(p) {
  const norm = String(p).replace(/\\/g, "/");
  const marker = "/.claude/";
  const idx = norm.indexOf(marker);
  return idx !== -1 ? norm.slice(idx + marker.length) : null;
}

function loadTrackedRels() {
  try {
    const m = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
    return new Set(
      Object.keys(m.files ?? {}).map(claudeRel).filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

const rl = createInterface({ input: process.stdin });
let raw = "";
rl.on("line", line => (raw += line));
rl.on("close", () => {
  let input;
  try { input = JSON.parse(raw || "{}"); } catch { process.exit(0); }

  const filePath = input?.tool_input?.file_path ?? "";
  if (!filePath) process.exit(0);

  const rel = claudeRel(filePath);
  if (!rel) process.exit(0); // not a ~/.claude/ path

  const tracked = loadTrackedRels();
  if (tracked.has(rel)) {
    try { writeFileSync(DIRTY_FLAG_PATH, "", "utf8"); } catch {}
  }

  process.exit(0);
});
