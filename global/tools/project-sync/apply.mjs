import { execFileSync, spawnSync } from "child_process";
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, rmdirSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { basename, dirname, join, relative, resolve, sep } from "path";
import { blobAt, readBlob, targetFor } from "./kit.mjs";
import { canonical, writeRecord } from "./record.mjs";
import { Refusal } from "./report.mjs";
import { planRulesTable } from "./rules-table.mjs";
import { planSettings } from "./settings.mjs";

const BACKUP_ROOT = ["tmp", "project-sync-backup"];
const META_FILES = ["project.json", "added.json"];
const RECORD = ".claude/kit-delivery.json";
const SETTINGS = ".claude/settings.json";
const CLAUDE_MD = ".claude/CLAUDE.md";

// A text check alone is not enough: a link anywhere below the project root sends a write somewhere else.
export function inside(projectDir, rel) {
  const root = resolve(projectDir);
  const abs = resolve(root, rel);
  if (!abs.startsWith(root + sep)) throw new Refusal(`${rel} resolves outside ${root}`);
  let walked = root;
  for (const part of relative(root, abs).split(sep)) {
    walked = join(walked, part);
    const stat = lstatSync(walked, { throwIfNoEntry: false });
    if (!stat) break;
    if (stat.isSymbolicLink()) throw new Refusal(`${walked} is a symbolic link — nothing is written through it`);
  }
  return abs;
}

const isFile = (path) => lstatSync(path, { throwIfNoEntry: false })?.isFile() === true;

// Stops at .claude/<type>/, which the kit owns whether or not it holds anything yet.
function pruneEmptyDirs(projectDir, target) {
  const parts = target.split("/");
  for (let depth = parts.length - 1; depth > 2; depth--) {
    const dir = join(projectDir, ...parts.slice(0, depth));
    if (!existsSync(dir) || readdirSync(dir).length) return;
    rmdirSync(dir);
  }
}

// git merge-file exits with the conflict count, or 255 on a real error
function mergeText(kitPath, projectBytes, baseBytes, headBytes) {
  const crlf = projectBytes.includes("\r\n");
  const normalise = (bytes) => (crlf ? Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n")) : bytes);
  const dir = mkdtempSync(join(tmpdir(), "project-sync-merge-"));
  try {
    const files = [["project", projectBytes], ["base", baseBytes], ["head", headBytes]].map(([name, bytes]) => {
      const path = join(dir, name);
      writeFileSync(path, normalise(bytes));
      return path;
    });
    const merged = spawnSync("git", ["merge-file", "-p", ...files], { cwd: dir, maxBuffer: 256 * 1024 * 1024 });
    if (merged.status === 0) return { conflict: false, bytes: crlf ? Buffer.from(merged.stdout.toString("utf8").replace(/\n/g, "\r\n")) : merged.stdout };
    if (merged.status > 0 && merged.status < 128) return { conflict: true };
    throw new Refusal(`git merge-file failed for ${kitPath}: ${merged.stderr?.toString().trim() || "no output"}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function backupDirFor(kit, projectDir) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const root = join(kit, ...BACKUP_ROOT);
  let run = join(root, stamp);
  for (let n = 1; existsSync(run); n++) run = join(root, `${stamp}-${n}`);
  return join(run, basename(projectDir));
}

// Copies every existing file in `toSave` into a fresh backup directory, with the metadata `restore` reads.
function takeBackup(kit, projectDir, toSave, added) {
  const backup = backupDirFor(kit, projectDir);
  for (const target of toSave.filter((t) => isFile(inside(projectDir, t)))) {
    mkdirSync(dirname(join(backup, target)), { recursive: true });
    copyFileSync(inside(projectDir, target), join(backup, target));
  }
  mkdirSync(backup, { recursive: true });
  writeFileSync(join(backup, "added.json"), `${JSON.stringify(added, null, 2)}\n`);
  writeFileSync(join(backup, "project.json"), `${JSON.stringify({ projectDir: resolve(projectDir) }, null, 2)}\n`);
  return backup;
}

// The record on its own, backed up first; null when it would not change.
export function saveRecord(kit, projectDir, rec, next) {
  inside(projectDir, RECORD);
  if (canonical(rec) === canonical(next)) return null;
  const backup = takeBackup(kit, projectDir, [RECORD], []);
  writeRecord(projectDir, next);
  return backup;
}

// What an apply would do to settings.json and the Rules table. Reads only; applyPlan and the dry run share it.
export function previewEdits(kit, projectDir, rec, done) {
  return {
    settings: planSettings(kit, rec, inside(projectDir, SETTINGS)),
    rules: planRulesTable(kit, inside(projectDir, CLAUDE_MD), done, rec.files),
  };
}

export function applyPlan(kit, projectDir, rec, plan, { resolved = [] } = {}) {
  const head = (kitPath) => blobAt(kit, "HEAD", kitPath);
  const headCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: kit, encoding: "utf8" }).trim();
  for (const action of plan.actions) inside(projectDir, action.target);
  for (const rel of [RECORD, SETTINGS, CLAUDE_MD]) inside(projectDir, rel);

  const conflicts = [];
  const mergedClean = new Set();
  const resolvedPaths = [];
  const writes = [];
  const executed = [];
  for (const action of plan.actions) {
    if (action.kind === "record" || action.kind === "remove") {
      executed.push(action);
    } else if (action.kind === "merge") {
      const merged = mergeText(action.kit, readFileSync(inside(projectDir, action.target)), readBlob(kit, action.base), readBlob(kit, head(action.kit)));
      if (merged.conflict && resolved.includes(action.kit)) resolvedPaths.push(action.kit);
      else if (merged.conflict) conflicts.push(action.kit);
      else {
        mergedClean.add(action.kit);
        writes.push({ action, bytes: merged.bytes });
        executed.push(action);
      }
    } else {
      writes.push({ action, bytes: readBlob(kit, head(action.kit)) });
      executed.push(action);
    }
  }
  for (const kitPath of resolved) {
    if (resolvedPaths.includes(kitPath)) continue;
    if (mergedClean.has(kitPath)) throw new Refusal(`--resolved ${kitPath}: it now merges cleanly — a plain --apply will take it`);
    if (!plan.notes.some((n) => n.kind === "edited-no-base" && n.kit === kitPath)) {
      throw new Refusal(`--resolved ${kitPath}: it is neither a merge conflict nor an edited file with no recorded base`);
    }
    resolvedPaths.push(kitPath);
  }

  const files = { ...rec.files };
  for (const action of executed) {
    if (action.kind === "remove") delete files[action.kit];
    else files[action.kit] = head(action.kit);
  }
  for (const kitPath of resolvedPaths) files[kitPath] = head(kitPath);
  // a retired key is dead once its file is gone or another current key delivers the same target (a skill moved between buckets)
  const retired = Object.keys(files).filter((kitPath) => head(kitPath) === null && targetFor(kitPath) !== null);
  const deliveredTargets = new Set(Object.keys(files).filter((kitPath) => head(kitPath) !== null).map(targetFor));
  for (const kitPath of retired) {
    const target = targetFor(kitPath);
    if (lstatSync(join(projectDir, target), { throwIfNoEntry: false }) === undefined || deliveredTargets.has(target)) delete files[kitPath];
  }

  const after = { commit: headCommit, date: new Date().toISOString().slice(0, 10) };
  const fileWrites = executed.filter((a) => a.kind !== "record");
  // an untouched record keeps its date, so `delivered.date` is the last run that changed something
  const recordChanged = rec.delivered?.commit !== headCommit || canonical({ ...rec, files }) !== canonical(rec);
  const next = { ...rec, files, delivered: after };
  const { settings, rules } = previewEdits(kit, projectDir, rec, executed);
  const result = { done: executed, conflicts, resolved: resolvedPaths, backup: null, before: rec.delivered, after: recordChanged ? after : rec.delivered, settings, rules };
  if (!fileWrites.length && !recordChanged && settings.text === null && rules.text === null) return result;

  const added = [];
  const edited = [...(settings.text === null ? [] : [SETTINGS]), ...(rules.text === null ? [] : [CLAUDE_MD])];
  const toSave = [...fileWrites.filter((a) => a.kind !== "add").map((a) => a.target), RECORD, ...edited];
  for (const target of [...fileWrites.map((a) => a.target), ...edited]) if (!isFile(inside(projectDir, target))) added.push(target);
  const backup = takeBackup(kit, projectDir, toSave, added);
  result.backup = backup;

  try {
    for (const { action, bytes } of writes) {
      const abs = inside(projectDir, action.target);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, bytes, { flag: "w" });
    }
    for (const action of executed.filter((a) => a.kind === "remove")) {
      const abs = inside(projectDir, action.target);
      if (isFile(abs)) unlinkSync(abs);
      pruneEmptyDirs(projectDir, action.target);
    }
    for (const [rel, text] of [[SETTINGS, settings.text], [CLAUDE_MD, rules.text]]) {
      if (text !== null) writeFileSync(inside(projectDir, rel), text, { flag: "w" });
    }
    if (process.env.PROJECT_SYNC_TEST_CRASH === "after-writes") process.exit(70);

    if (recordChanged) writeRecord(projectDir, next);
  } catch (error) {
    error.backup = backup;
    throw error;
  }
  return result;
}

export function restore(backupDir) {
  const metaPath = join(backupDir, "project.json");
  if (!existsSync(metaPath)) throw new Refusal(`${backupDir} is not a project-sync backup (no project.json)`);
  const { projectDir } = JSON.parse(readFileSync(metaPath, "utf8"));
  const added = JSON.parse(readFileSync(join(backupDir, "added.json"), "utf8"));

  const backedUp = [];
  const collect = (rel) => {
    for (const entry of readdirSync(join(backupDir, rel), { withFileTypes: true })) {
      const child = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) collect(child);
      else if (rel || !META_FILES.includes(entry.name)) backedUp.push(child);
    }
  };
  collect("");
  // every path is checked before the first change, so a refused restore leaves the project as it was
  for (const rel of [...added, ...backedUp]) inside(projectDir, rel);

  let removed = 0;
  for (const target of added) {
    const abs = inside(projectDir, target);
    if (!isFile(abs)) continue;
    unlinkSync(abs);
    removed++;
    pruneEmptyDirs(projectDir, target);
  }
  for (const rel of backedUp) {
    const abs = inside(projectDir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    copyFileSync(join(backupDir, rel), abs);
  }
  const restored = backedUp.length;
  return { restored, removed };
}
