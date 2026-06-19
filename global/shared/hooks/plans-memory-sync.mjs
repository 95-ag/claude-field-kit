#!/usr/bin/env node
/**
 * plans-memory-sync — SessionStart/SessionEnd hook.
 * Bidirectional union of ~/.claude plans + auto-memory between the WSL and Windows homes.
 * Fail-open (always exits 0). No external deps. Never calls the claude CLI or os.homedir().
 */
import {
  readdirSync, statSync, existsSync, mkdirSync, copyFileSync, utimesSync, appendFileSync,
} from "fs";
import { join, dirname, relative } from "path";
import { pathToFileURL } from "url";

const SKEW_MS = 2000; // drvfs (/mnt/c) truncates mtime to whole seconds; treat near-equal mtimes as the same file

/** Recursively map relPath → absPath for every file under dir. Missing dir → {}. */
export function walkFiles(dir, base = dir, acc = {}) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue; // don't follow symlinks out of / around the synced tree
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(abs, base, acc);
    else if (entry.isFile()) acc[relative(base, abs).split("\\").join("/")] = abs;
  }
  return acc;
}

/** Copy src → dest, creating parent dirs and preserving mtime (idempotency-critical). */
export function copyPreserveMtime(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  const st = statSync(src);
  utimesSync(dest, st.atime, st.mtime);
}

/**
 * Bidirectional union of two directories by relative path.
 * - present one side only → copy to the other
 * - present both → newest-wins by mtime (equal → no-op)
 * - never deletes. Returns counts.
 */
export function unionDir(dirA, dirB) {
  const a = walkFiles(dirA);
  const b = walkFiles(dirB);
  const rels = new Set([...Object.keys(a), ...Object.keys(b)]);
  let copiedAB = 0, copiedBA = 0;
  for (const rel of rels) {
    const inA = a[rel], inB = b[rel];
    if (inA && !inB) { copyPreserveMtime(inA, join(dirB, rel)); copiedAB++; }
    else if (inB && !inA) { copyPreserveMtime(inB, join(dirA, rel)); copiedBA++; }
    else {
      const mA = statSync(inA).mtimeMs, mB = statSync(inB).mtimeMs;
      if (mA - mB > SKEW_MS) { copyPreserveMtime(inA, inB); copiedAB++; }
      else if (mB - mA > SKEW_MS) { copyPreserveMtime(inB, inA); copiedBA++; }
      // else: within filesystem granularity skew → same file, no-op
    }
  }
  return { copiedAB, copiedBA };
}

// Same relative repo path, different fixed prefix per environment. Remap = swap the prefix.
// Extend by adding a pair if the home/distro ever changes.
const PREFIX_PAIRS = [
  { wsl: "-home-ag-95", win: "--wsl-localhost-ubuntu-home-ag-95" },
];

export function remapWslToWin(key) {
  for (const { wsl, win } of PREFIX_PAIRS)
    if (key.startsWith(wsl)) return win + key.slice(wsl.length);
  return null;
}
export function remapWinToWsl(key) {
  for (const { wsl, win } of PREFIX_PAIRS)
    if (key.startsWith(win)) return wsl + key.slice(win.length);
  return null;
}

export function syncPlans(wslHome, winHome) {
  return unionDir(join(wslHome, "plans"), join(winHome, "plans"));
}

/** Union projects/<key>/memory across homes, mapping keys by prefix-swap. memory/ only. */
export function syncMemory(wslHome, winHome) {
  const pairs = new Map(); // "wslKey winKey" → {wslKey, winKey}
  const add = (wslKey, winKey) => pairs.set(`${wslKey} ${winKey}`, { wslKey, winKey });

  const wslProjects = join(wslHome, "projects");
  if (existsSync(wslProjects))
    for (const key of readdirSync(wslProjects)) {
      if (!existsSync(join(wslProjects, key, "memory"))) continue;
      const winKey = remapWslToWin(key);
      if (winKey) add(key, winKey);
    }
  const winProjects = join(winHome, "projects");
  if (existsSync(winProjects))
    for (const key of readdirSync(winProjects)) {
      if (!existsSync(join(winProjects, key, "memory"))) continue;
      const wslKey = remapWinToWsl(key);
      if (wslKey) add(wslKey, key);
    }

  const totals = { copiedAB: 0, copiedBA: 0 };
  for (const { wslKey, winKey } of pairs.values()) {
    const r = unionDir(join(wslHome, "projects", wslKey, "memory"),
                       join(winHome, "projects", winKey, "memory"));
    totals.copiedAB += r.copiedAB;
    totals.copiedBA += r.copiedBA;
  }
  return totals;
}

const argv = process.argv.slice(2);
function getArg(name, fallback) {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : fallback;
}
const WSL_HOME = getArg("--wsl-home", "/home/ag-95/.claude");
const WIN_HOME = getArg("--win-home", "/mnt/c/Users/aishw/.claude");

function log(msg) {
  try {
    appendFileSync(join(WSL_HOME, ".plans-memory-sync.log"), `[${new Date().toISOString()}] ${msg}\n`);
  } catch { /* logging must never throw */ }
}

function main() {
  try {
    const p = syncPlans(WSL_HOME, WIN_HOME);
    const m = syncMemory(WSL_HOME, WIN_HOME);
    log(`plans +${p.copiedAB}→win +${p.copiedBA}→wsl | memory +${m.copiedAB}→win +${m.copiedBA}→wsl`);
  } catch (e) {
    log(`ERROR: ${(e && e.stack) || e}`);
  }
  process.exit(0); // fail-open: never block session start/end
}

// Run only on direct invocation (not when imported by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
