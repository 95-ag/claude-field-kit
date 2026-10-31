import { execFileSync } from "child_process";
import { existsSync, lstatSync, readdirSync, readFileSync } from "fs";
import { basename, join } from "path";
import { blobAt, blobOf, catalog, fileTarget, readBlob, renamedTo, targetFor } from "./kit.mjs";
import { Refusal } from "./report.mjs";

const HEX_OID = /^[0-9a-f]{40}$/;
const SKILL_DIR = /^(?:shared|(?:domains|stacks|repos)\/[^/]+)\/skills\/[^/]+(?=\/)/;

const bucketOf = (kitPath) => {
  const parts = kitPath.split("/");
  return parts[0] === "shared" ? "shared" : `${parts[0]}/${parts[1]}`;
};
const isSkipped = (kitPath, skip) => skip.some((s) => kitPath === s || kitPath.startsWith(`${s}/`));

function isBinary(bytes) {
  if (bytes.includes(0)) return true;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return false;
  } catch {
    return true;
  }
}

// stdio is silenced because a missing object is an expected answer here, not an error to print
function gitSucceeds(kit, args) {
  try {
    execFileSync("git", args, { cwd: kit, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const blobExists = (kit, blob) => HEX_OID.test(blob) && gitSucceeds(kit, ["cat-file", "-e", blob]);

// Walks .claude/ → target without following links: a link anywhere on the way means a write would land elsewhere.
function inspect(projectDir, target) {
  const parts = target.split("/");
  for (let i = 0; i < parts.length; i++) {
    const abs = join(projectDir, ...parts.slice(0, i + 1));
    let stat;
    try {
      stat = lstatSync(abs);
    } catch {
      return { state: "missing" };
    }
    if (stat.isSymbolicLink()) return { state: "symlink" };
    if (i === parts.length - 1) return stat.isFile() ? { state: "file", bytes: readFileSync(abs) } : { state: "other" };
    if (!stat.isDirectory()) return { state: "other" };
  }
  return { state: "missing" };
}

function walkFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) found.push(...walkFiles(join(dir, entry.name)).map((f) => `${entry.name}/${f}`));
    else found.push(entry.name);
  }
  return found;
}

// Where each recorded path the kit renamed away now lives
function movesOf(kit, rec) {
  const moves = new Map();
  for (const from of Object.keys(rec.files)) {
    if (targetFor(from) === null || blobAt(kit, "HEAD", from) !== null) continue;
    const to = renamedTo(kit, from);
    if (to) moves.set(from, to);
  }
  return moves;
}

function renameLinks(rec, moves) {
  const links = new Map();
  for (const [from, to] of moves) if (rec.files[to] === undefined && !links.has(to)) links.set(to, from);
  return links;
}

function newItem(unit, kit) {
  return { unit, kit, edited: false, editedTarget: null, editedBytes: null, actions: [], forcedActions: null, notes: [] };
}

function classifyActive(ctx, { unit, kit: kitPath, target, head }) {
  const { kit, rec, links, claimed, projectDir } = ctx;
  const item = newItem(unit, kitPath);
  const note = (kind, noteKit, noteTarget, detail) => item.notes.push({ kind, kit: noteKit, target: noteTarget, ...(detail ? { detail } : {}) });
  const markEdited = (editedTarget, bytes, clean) => {
    item.edited = true;
    item.editedTarget = editedTarget;
    item.editedBytes = bytes;
    item.forcedActions = clean;
  };

  // `--status` owes a file whose record lags HEAD whatever sits at its target, so a link or a directory there is owed too
  const owed = rec.files[kitPath] !== head;
  const unwritable = (state, noteKit, noteTarget) => {
    // `--status` owes the new path; the old one is where the owner finds the file
    const renamedTo = noteKit === kitPath ? undefined : kitPath;
    if (state === "symlink") item.notes.push({ kind: "symlink", kit: noteKit, target: noteTarget, owed, renamedTo });
    else item.notes.push({ kind: "project-only", kit: noteKit, target: noteTarget, detail: "not a regular file", owed, renamedTo });
    return item;
  };

  const here = inspect(projectDir, target);
  if (here.state === "symlink" || here.state === "other") return unwritable(here.state, kitPath, target);

  const oldKit = links.get(kitPath);
  const oldTarget = oldKit ? targetFor(oldKit) : null;
  const sameTarget = oldTarget === target;
  // a copy already at a different new path is not the renamed file, so the link is not used
  const linked = oldKit !== undefined && (sameTarget || here.state === "missing");

  if (linked) {
    claimed.add(oldKit);
    const recorded = rec.files[oldKit];
    const old = sameTarget ? here : inspect(projectDir, oldTarget);
    if (old.state === "symlink" || old.state === "other") return unwritable(old.state, oldKit, oldTarget);
    // the record moves to the new path, so the next run reads it as removed by the project, never as not yet delivered
    if (old.state === "missing") return item.notes.push({ kind: "removed-by-project", kit: oldKit, target: oldTarget, detail: `renamed to ${kitPath}`, renamedTo: kitPath }), item;
    const clean = [{ kind: "replace", kit: kitPath, target }, ...(sameTarget ? [] : [{ kind: "remove", kit: oldKit, target: oldTarget }])];
    if (sameTarget && blobOf(old.bytes) === head) {
      item.actions.push({ kind: "record", kit: kitPath, target });
    } else if (blobOf(old.bytes) === recorded) {
      item.actions.push(...clean);
    } else {
      if (isBinary(old.bytes) || isBinary(readBlob(kit, head))) note("binary-edited", kitPath, target, `renamed from ${oldKit}; the project's copy is ${oldTarget}`);
      else {
        const base = blobExists(kit, recorded) ? recorded : null;
        // with no base there is nothing to merge against, so the workspace copy is the project's old-path file as it is
        const detail = `renamed from ${oldKit}; ${base ? "" : "no recorded base — "}the project's edited copy is ${oldTarget}`;
        item.notes.push({ kind: "renamed-edited", kit: kitPath, target, from: oldKit, fromTarget: oldTarget, base, detail });
      }
      markEdited(oldTarget, old.bytes, clean);
    }
    return item;
  }

  const recorded = rec.files[kitPath];
  if (here.state === "missing") {
    if (recorded !== undefined) note("removed-by-project", kitPath, target, "suggest adding it to skip");
    else item.actions.push({ kind: "add", kit: kitPath, target });
    return item;
  }

  const projectBlob = blobOf(here.bytes);
  if (projectBlob === head) {
    if (recorded !== head) item.actions.push({ kind: "record", kit: kitPath, target });
    return item;
  }
  if (recorded === head) return item;
  if (recorded !== undefined && projectBlob === recorded) {
    item.actions.push({ kind: "replace", kit: kitPath, target });
    return item;
  }

  const clean = [{ kind: "replace", kit: kitPath, target }];
  markEdited(target, here.bytes, clean);
  if (isBinary(here.bytes) || isBinary(readBlob(kit, head))) {
    note("binary-edited", kitPath, target);
  } else if (recorded === undefined || !blobExists(kit, recorded)) {
    note("edited-no-base", kitPath, target);
  } else {
    item.actions.push({ kind: "merge", kit: kitPath, target, base: recorded });
  }
  return item;
}

function classifyRetired(ctx, { unit, kit: kitPath, target }) {
  const item = newItem(unit, kitPath);
  const here = inspect(ctx.projectDir, target);
  if (here.state === "symlink") item.notes.push({ kind: "symlink", kit: kitPath, target });
  else if (here.state === "other") item.notes.push({ kind: "project-only", kit: kitPath, target, detail: "not a regular file" });
  else if (here.state === "file") {
    const clean = [{ kind: "remove", kit: kitPath, target }];
    if (blobOf(here.bytes) === ctx.rec.files[kitPath]) item.actions.push(...clean);
    else {
      item.notes.push({ kind: "retired-edited", kit: kitPath, target, detail: "retired from the kit; the project's copy was edited" });
      item.edited = true;
      item.editedTarget = target;
      item.editedBytes = here.bytes;
      item.forcedActions = clean;
    }
  }
  return item;
}

function stagedCopyMatches(kit, projectDir, item) {
  const skill = item.editedTarget.match(/^\.claude\/skills\/([^/]+)\/(.+)$/);
  if (!skill) return false;
  const staged = join(kit, "incoming", "skills", `${basename(projectDir)}__${skill[1]}`, skill[2]);
  return existsSync(staged) && readFileSync(staged).equals(item.editedBytes);
}

// `takeKit` names held skills and edited binary files (kit paths under project/) the owner chose to replace with the kit version
export function planProject(kit, projectDir, rec, { takeKit = [] } = {}) {
  const cat = catalog(kit);
  const activeBuckets = new Set(["shared", ...rec.tiers.domains.map((d) => `domains/${d}`), ...rec.tiers.stacks.map((s) => `stacks/${s}`), ...(rec.tiers.repo ? [`repos/${rec.tiers.repo}`] : [])]);
  const isActive = (kitPath) => activeBuckets.has(bucketOf(kitPath)) && !isSkipped(kitPath, rec.skip);
  const moves = movesOf(kit, rec);
  const ctx = { kit, rec, projectDir, links: renameLinks(rec, moves), claimed: new Set() };

  const items = [];
  const notes = [];
  const activeTargets = new Set();
  const activeEntries = cat.entries.filter((e) => isActive(e.kit));

  for (const entry of activeEntries) {
    activeTargets.add(entry.target);
    for (const file of entry.files) {
      const target = fileTarget(entry, file);
      activeTargets.add(target);
      items.push(classifyActive(ctx, { unit: entry.type === "skills" ? entry.kit : null, kit: file, target, head: blobAt(kit, "HEAD", file) }));
    }
  }

  const retiredTargets = new Set();
  for (const recorded of Object.keys(rec.files)) {
    const target = targetFor(recorded);
    if (target === null || blobAt(kit, "HEAD", recorded) !== null) continue;
    retiredTargets.add(target);
    if (ctx.claimed.has(recorded) || activeTargets.has(target)) continue;
    // a skip of the new path covers the copy still at the old one
    if (!isActive(recorded) || isSkipped(moves.get(recorded) ?? "", rec.skip)) {
      if (inspect(projectDir, target).state !== "missing") notes.push({ kind: "opted-out-on-disk", kit: recorded, target });
      continue;
    }
    items.push(classifyRetired(ctx, { unit: recorded.match(SKILL_DIR)?.[0] ?? null, kit: recorded, target }));
  }

  for (const entry of cat.entries) {
    if (isActive(entry.kit)) continue;
    if (!activeTargets.has(entry.target) && lstatOrNull(join(projectDir, entry.target)) !== null) {
      notes.push({ kind: "opted-out-on-disk", kit: entry.kit, target: entry.target });
    }
  }

  const knownTargets = new Set([...cat.entries.flatMap((e) => (e.type === "skills" ? e.files.map((f) => fileTarget(e, f)) : [e.target])), ...retiredTargets]);
  // a link to a directory holding known targets is already reported as a symlink; it is not also project-only
  const holdsKnown = (target) => [...knownTargets].some((known) => known.startsWith(`${target}/`));
  for (const entry of activeEntries.filter((e) => e.type === "skills")) {
    const skillDir = join(projectDir, entry.target);
    if (inspect(projectDir, entry.target).state !== "other" || !lstatOrNull(skillDir).isDirectory()) continue;
    for (const rel of walkFiles(skillDir)) {
      const target = `${entry.target}/${rel}`;
      if (!knownTargets.has(target) && !holdsKnown(target)) notes.push({ kind: "project-only", kit: null, target });
    }
  }

  const claudeLinked = lstatOrNull(join(projectDir, ".claude"))?.isSymbolicLink();
  const rulesDir = join(projectDir, ".claude", "rules");
  if (!claudeLinked && lstatOrNull(rulesDir)?.isDirectory()) {
    for (const rel of walkFiles(rulesDir)) {
      const target = `.claude/rules/${rel}`;
      if (!knownTargets.has(target) && !holdsKnown(target)) notes.push({ kind: "project-only", kit: null, target });
    }
  }

  const skillsDir = join(projectDir, ".claude", "skills");
  if (!claudeLinked && lstatOrNull(skillsDir)?.isDirectory()) {
    const knownSkillDirs = new Set([...cat.entries.filter((e) => e.type === "skills").map((e) => e.target), ...[...retiredTargets].map((t) => t.split("/").slice(0, 3).join("/"))]);
    for (const entry of readdirSync(skillsDir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const target = `.claude/skills/${entry.name}`;
      if (!entry.name.startsWith(".") && !knownSkillDirs.has(target)) notes.push({ kind: "project-only", kit: null, target });
    }
  }

  const actions = [];
  const held = [];
  const taken = [];
  const blocked = [];
  const units = new Map();
  for (const item of items) {
    if (item.unit === null && takeKit.includes(item.kit) && item.notes.some((n) => n.kind === "binary-edited")) {
      actions.push(...item.forcedActions);
      taken.push({ file: item.kit });
    } else if (item.unit === null) {
      actions.push(...item.actions);
      notes.push(...item.notes);
    } else units.set(item.unit, [...(units.get(item.unit) ?? []), item]);
  }
  for (const [unit, group] of units) {
    const link = group.flatMap((i) => i.notes).find((n) => n.kind === "symlink");
    if (link) {
      notes.push(...group.flatMap((i) => i.notes));
      // a skill is written whole or not at all, so one symlinked file holds back every change to the rest
      if (group.some((i) => i.actions.length || i.edited)) blocked.push({ skill: unit, target: link.target });
      continue;
    }
    notes.push(...group.filter((i) => !i.edited).flatMap((i) => i.notes));
    const edited = group.filter((i) => i.edited);
    if (edited.every((i) => stagedCopyMatches(kit, projectDir, i))) {
      actions.push(...group.flatMap((i) => (i.edited ? i.forcedActions : i.actions)));
    } else if (takeKit.includes(unit)) {
      actions.push(...group.flatMap((i) => (i.edited ? i.forcedActions : i.actions)));
      taken.push({ skill: unit, files: edited.map((i) => i.kit) });
    } else {
      const target = `.claude/skills/${unit.split("/").pop()}`;
      // a renamed skill's edit sits in the project under its old name, which is where the owner and incoming/ find it
      const copy = edited[0].editedTarget.split("/").slice(0, 3).join("/");
      held.push({ skill: unit, target, files: edited.map((i) => i.kit), projectCopy: copy === target ? null : copy });
    }
  }
  for (const kitPath of takeKit) {
    if (taken.some((t) => t.skill === kitPath || t.file === kitPath)) continue;
    const skillDir = kitPath.match(SKILL_DIR)?.[0];
    const why = skillDir
      ? `belongs to skill ${skillDir}; take the skill directory`
      : !cat.entries.some((e) => e.kit === kitPath)
        ? "not a kit skill directory or file under project/"
        : !isActive(kitPath)
          ? "not active in this project — skipped, or its tier is off"
          : items.some((i) => i.unit === null && i.kit === kitPath && i.edited)
            ? "not an edited binary — an edited text file merges"
            : "not held — the project has not edited it";
    throw new Refusal(`--take-kit ${kitPath}: ${why}; only a skill held for a project edit, or an edited binary file, can be taken from the kit`);
  }
  return { actions, held, taken, blocked, notes };
}

function lstatOrNull(path) {
  try {
    return lstatSync(path);
  } catch {
    return null;
  }
}
