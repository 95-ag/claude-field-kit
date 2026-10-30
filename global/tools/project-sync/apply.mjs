import { execFileSync, spawnSync } from "child_process";
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, rmdirSync, statSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { basename, dirname, join, relative, resolve, sep } from "path";
import { blobAt, readBlob, targetFor } from "./kit.mjs";
import { canonical, writeRecord } from "./record.mjs";
import { Refusal, STALE_COPY_REMEDY } from "./report.mjs";
import { planRulesTable } from "./rules-table.mjs";
import { planSettings } from "./settings.mjs";

const BACKUP_ROOT = ["tmp", "project-sync-backup"];
// Outside any `.claude/` path on purpose: an edit under a project's `.claude/rules` is staged into the kit's incoming/ by asset-capture.
const MERGE_ROOT = ["tmp", "project-sync-merge"];
// `=======` is not tested: a Markdown setext underline is the same line, and a real conflict always carries the other two.
const CONFLICT_MARKER = /^(<<<<<<<|>>>>>>>)( |\r?$)/m;
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

// git merge-file exits with the conflict count, or 255 on a real error; a conflict still returns the marked-up text
function mergeText(kitPath, projectBytes, baseBytes, headBytes) {
  const crlf = projectBytes.includes("\r\n");
  const restoreEndings = (bytes) => (crlf ? Buffer.from(bytes.toString("utf8").replace(/\n/g, "\r\n")) : bytes);
  const normalise = (bytes) => (crlf ? Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n")) : bytes);
  const dir = mkdtempSync(join(tmpdir(), "project-sync-merge-"));
  try {
    const files = [["project", projectBytes], ["base", baseBytes], ["head", headBytes]].map(([name, bytes]) => {
      const path = join(dir, name);
      writeFileSync(path, normalise(bytes));
      return path;
    });
    const merged = spawnSync("git", ["merge-file", "-p", "-L", "project", "-L", "base", "-L", "kit", ...files], { cwd: dir, maxBuffer: 256 * 1024 * 1024 });
    if (merged.status === 0) return { conflict: false, bytes: restoreEndings(merged.stdout) };
    if (merged.status > 0 && merged.status < 128) return { conflict: true, bytes: restoreEndings(merged.stdout) };
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

export const mergeWorkspace = (kit, projectDir, target) => join(kit, ...MERGE_ROOT, basename(projectDir), target.replace(/^\.claude\//, ""));

// Two projects with the same folder name share a workspace folder; project.json says whose it is.
function assertWorkspaceOwner(kit, projectDir) {
  const meta = join(kit, ...MERGE_ROOT, basename(projectDir), "project.json");
  if (!isFile(meta)) return;
  const owner = JSON.parse(readFileSync(meta, "utf8")).projectDir;
  if (owner !== resolve(projectDir)) throw new Refusal(`${meta} names ${owner}, not ${resolve(projectDir)} — another project of the same name owns these merge copies; once they are settled, delete the folder with its copies, their .kit and .project sidecars and project.json`);
}

// The owner's hand-merged copy; refused while it is absent, built against another kit version or another project file, or
// still carries a marker, so a half-merge or a merge of outdated text never reaches the project.
function readMergedCopy(kit, projectDir, kitPath, target, kitBytes, projectTarget = target) {
  const path = mergeWorkspace(kit, projectDir, target);
  if (!isFile(path)) throw new Refusal(`--resolved ${kitPath}: no merge copy at ${path} — run --apply first, then merge there`);
  for (const sidecar of [".kit", ".project"]) {
    if (!isFile(path + sidecar)) throw new Refusal(`--resolved ${kitPath}: ${path}${sidecar} is missing — ${STALE_COPY_REMEDY}`);
  }
  if (!readFileSync(`${path}.kit`).equals(kitBytes)) throw new Refusal(`--resolved ${kitPath}: the kit moved since ${path} was written — ${STALE_COPY_REMEDY}`);
  if (!readFileSync(`${path}.project`).equals(readFileSync(inside(projectDir, projectTarget)))) throw new Refusal(`--resolved ${kitPath}: the project file changed since this copy was made — ${STALE_COPY_REMEDY}`);
  const bytes = readFileSync(path);
  if (CONFLICT_MARKER.test(bytes.toString("utf8"))) throw new Refusal(`--resolved ${kitPath}: ${path} still holds a conflict marker`);
  return bytes;
}

// An existing copy may hold the owner's merge in progress, so it is never rewritten; `stale` says its sidecars no longer match.
function writeWorkspace(kit, projectDir, target, bytes, kitBytes, projectBytes) {
  const path = mergeWorkspace(kit, projectDir, target);
  if (isFile(path)) {
    const matches = (sidecar, expected) => isFile(path + sidecar) && readFileSync(path + sidecar).equals(expected);
    const stale = !matches(".kit", kitBytes) ? "kit moved" : !matches(".project", projectBytes) ? "project file changed" : null;
    return { path, kept: true, date: statSync(path).mtime.toISOString().slice(0, 10), stale };
  }
  mkdirSync(dirname(path), { recursive: true });
  const meta = join(kit, ...MERGE_ROOT, basename(projectDir), "project.json");
  if (!isFile(meta)) writeFileSync(meta, `${JSON.stringify({ projectDir: resolve(projectDir) }, null, 2)}\n`);
  writeFileSync(path, bytes);
  writeFileSync(`${path}.kit`, kitBytes);
  writeFileSync(`${path}.project`, projectBytes);
  return { path, kept: false, stale: null };
}

function removeWorkspace(kit, projectDir, target) {
  const path = mergeWorkspace(kit, projectDir, target);
  for (const file of [path, `${path}.kit`, `${path}.project`]) if (isFile(file)) unlinkSync(file);
  const root = join(kit, ...MERGE_ROOT, basename(projectDir));
  for (let dir = dirname(path); dir !== root && dir.startsWith(root) && existsSync(dir) && !readdirSync(dir).length; dir = dirname(dir)) rmdirSync(dir);
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
  const renamed = plan.notes.filter((n) => n.kind === "renamed-edited");
  for (const target of [...plan.actions.map((a) => a.target), ...renamed.flatMap((n) => [n.target, n.fromTarget])]) inside(projectDir, target);
  for (const rel of [RECORD, SETTINGS, CLAUDE_MD]) inside(projectDir, rel);
  assertWorkspaceOwner(kit, projectDir);

  const conflicts = [];
  const conflictBytes = new Map();
  const mergedClean = new Set();
  const resolvedPaths = [];
  const resolvedWrites = [];
  const writes = [];
  const executed = [];
  for (const action of plan.actions) {
    if (action.kind === "record" || action.kind === "remove") {
      executed.push(action);
    } else if (action.kind === "merge") {
      const merged = mergeText(action.kit, readFileSync(inside(projectDir, action.target)), readBlob(kit, action.base), readBlob(kit, head(action.kit)));
      if (merged.conflict) {
        conflicts.push(action.kit);
        conflictBytes.set(action.kit, { target: action.target, bytes: merged.bytes });
      } else {
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
    if (mergedClean.has(kitPath)) throw new Refusal(`--resolved ${kitPath}: it now merges cleanly — a plain --apply will take it`);
    const rename = renamed.find((n) => n.kit === kitPath) ?? null;
    const target = conflictBytes.get(kitPath)?.target ?? plan.notes.find((n) => n.kind === "edited-no-base" && n.kit === kitPath)?.target ?? rename?.target;
    if (target === undefined) throw new Refusal(`--resolved ${kitPath}: it is neither a merge conflict, an edited file with no recorded base, nor a renamed file the project edited`);
    resolvedWrites.push({ kitPath, target, rename, bytes: readMergedCopy(kit, projectDir, kitPath, target, readBlob(kit, head(kitPath)), rename?.fromTarget ?? target) });
    resolvedPaths.push(kitPath);
  }
  const files = { ...rec.files };
  for (const action of executed) {
    if (action.kind === "remove") delete files[action.kit];
    else files[action.kit] = head(action.kit);
  }
  for (const kitPath of resolvedPaths) files[kitPath] = head(kitPath);
  for (const { rename } of resolvedWrites) if (rename) delete files[rename.from];
  for (const note of plan.notes.filter((n) => n.kind === "removed-by-project" && n.renamedTo && files[n.renamedTo] === undefined)) {
    files[note.renamedTo] = files[note.kit];
    delete files[note.kit];
  }
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
  const moved = resolvedWrites.filter((w) => w.rename && w.rename.fromTarget !== w.target).map((w) => ({ kind: "remove", kit: w.rename.from, target: w.rename.fromTarget }));
  const settled = [...executed, ...resolvedWrites.filter((w) => w.rename).map((w) => ({ kind: "replace", kit: w.kitPath, target: w.target })), ...moved];
  const { settings, rules } = previewEdits(kit, projectDir, rec, settled);
  const workspaces = {};
  for (const [kitPath, { target, bytes }] of conflictBytes) {
    if (!resolvedPaths.includes(kitPath)) workspaces[kitPath] = writeWorkspace(kit, projectDir, target, bytes, readBlob(kit, head(kitPath)), readFileSync(inside(projectDir, target)));
  }
  for (const note of renamed.filter((n) => !resolvedPaths.includes(n.kit))) {
    const projectBytes = readFileSync(inside(projectDir, note.fromTarget));
    const kitBytes = readBlob(kit, head(note.kit));
    const merged = note.base ? mergeText(note.kit, projectBytes, readBlob(kit, note.base), kitBytes) : { conflict: false, bytes: projectBytes };
    workspaces[note.kit] = writeWorkspace(kit, projectDir, note.target, merged.bytes, kitBytes, projectBytes);
  }
  for (const note of plan.notes.filter((n) => n.kind === "edited-no-base" && !resolvedPaths.includes(n.kit))) {
    const projectBytes = readFileSync(inside(projectDir, note.target));
    workspaces[note.kit] = writeWorkspace(kit, projectDir, note.target, projectBytes, readBlob(kit, head(note.kit)), projectBytes);
  }
  const result = { done: executed, conflicts: conflicts.filter((kitPath) => !resolvedPaths.includes(kitPath)), resolved: resolvedPaths, workspaces, backup: null, before: rec.delivered, after: recordChanged ? after : rec.delivered, settings, rules };
  if (!fileWrites.length && !resolvedWrites.length && !recordChanged && settings.text === null && rules.text === null) return result;

  const added = [];
  const edited = [...(settings.text === null ? [] : [SETTINGS]), ...(rules.text === null ? [] : [CLAUDE_MD])];
  const toSave = [...fileWrites.filter((a) => a.kind !== "add").map((a) => a.target), ...resolvedWrites.map((w) => w.target), ...moved.map((a) => a.target), RECORD, ...edited];
  for (const target of [...fileWrites.map((a) => a.target), ...resolvedWrites.map((w) => w.target), ...edited]) if (!isFile(inside(projectDir, target))) added.push(target);
  const backup = takeBackup(kit, projectDir, toSave, added);
  result.backup = backup;

  try {
    for (const { action, bytes } of writes) {
      const abs = inside(projectDir, action.target);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, bytes, { flag: "w" });
    }
    for (const { target, bytes } of resolvedWrites) {
      const abs = inside(projectDir, target);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, bytes, { flag: "w" });
    }
    for (const action of [...executed.filter((a) => a.kind === "remove"), ...moved]) {
      const abs = inside(projectDir, action.target);
      if (isFile(abs)) unlinkSync(abs);
      pruneEmptyDirs(projectDir, action.target);
    }
    for (const [rel, text] of [[SETTINGS, settings.text], [CLAUDE_MD, rules.text]]) {
      if (text !== null) writeFileSync(inside(projectDir, rel), text, { flag: "w" });
    }
    if (process.env.PROJECT_SYNC_TEST_CRASH === "after-writes") process.exit(70);

    if (recordChanged) writeRecord(projectDir, next);
    for (const { target } of [...resolvedWrites, ...executed]) removeWorkspace(kit, projectDir, target);
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
