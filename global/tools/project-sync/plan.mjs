import { execFileSync } from "child_process";
import { existsSync, lstatSync, readdirSync, readFileSync } from "fs";
import { basename, join } from "path";
import { blobAt, blobOf, catalog, fileTarget, readBlob, renamesSince, targetFor } from "./kit.mjs";

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
const commitExists = (kit, commit) => HEX_OID.test(commit) && gitSucceeds(kit, ["cat-file", "-e", `${commit}^{commit}`]);

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

function renameLinks(kit, rec) {
  const links = new Map();
  const since = rec.delivered?.commit;
  if (!since || !commitExists(kit, since)) return links;
  for (const [from, to] of renamesSince(kit, since)) {
    if (rec.files[from] !== undefined && rec.files[to] === undefined && blobAt(kit, "HEAD", from) === null && targetFor(from) !== null) links.set(to, from);
  }
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

  const here = inspect(projectDir, target);
  if (here.state === "symlink") return note("symlink", kitPath, target), item;
  if (here.state === "other") return note("project-only", kitPath, target, "not a regular file"), item;

  const oldKit = links.get(kitPath);
  const oldTarget = oldKit ? targetFor(oldKit) : null;
  const sameTarget = oldTarget === target;
  // a copy already at a different new path is not the renamed file, so the link is not used
  const linked = oldKit !== undefined && (sameTarget || here.state === "missing");

  if (linked) {
    claimed.add(oldKit);
    const recorded = rec.files[oldKit];
    const old = sameTarget ? here : inspect(projectDir, oldTarget);
    if (old.state === "symlink") return note("symlink", oldKit, oldTarget), item;
    if (old.state === "other") return note("project-only", oldKit, oldTarget, "not a regular file"), item;
    if (old.state === "missing") return note("removed-by-project", oldKit, oldTarget, `renamed to ${kitPath}`), item;
    const clean = [{ kind: "replace", kit: kitPath, target }, ...(sameTarget ? [] : [{ kind: "remove", kit: oldKit, target: oldTarget }])];
    if (sameTarget && blobOf(old.bytes) === head) {
      item.actions.push({ kind: "record", kit: kitPath, target });
    } else if (blobOf(old.bytes) === recorded) {
      item.actions.push(...clean);
    } else {
      note("retired-edited", oldKit, oldTarget, `renamed to ${kitPath} — the project's edits are not merged across paths; merge by hand`);
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

export function planProject(kit, projectDir, rec) {
  const cat = catalog(kit);
  const activeBuckets = new Set(["shared", ...rec.tiers.domains.map((d) => `domains/${d}`), ...rec.tiers.stacks.map((s) => `stacks/${s}`), ...(rec.tiers.repo ? [`repos/${rec.tiers.repo}`] : [])]);
  const isActive = (kitPath) => activeBuckets.has(bucketOf(kitPath)) && !isSkipped(kitPath, rec.skip);
  const ctx = { kit, rec, projectDir, links: renameLinks(kit, rec), claimed: new Set() };

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
    if (!isActive(recorded)) {
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
  const units = new Map();
  for (const item of items) {
    if (item.unit === null) {
      actions.push(...item.actions);
      notes.push(...item.notes);
    } else units.set(item.unit, [...(units.get(item.unit) ?? []), item]);
  }
  for (const [unit, group] of units) {
    if (group.some((i) => i.notes.some((n) => n.kind === "symlink"))) {
      notes.push(...group.flatMap((i) => i.notes));
      continue;
    }
    notes.push(...group.filter((i) => !i.edited).flatMap((i) => i.notes));
    const edited = group.filter((i) => i.edited);
    if (edited.every((i) => stagedCopyMatches(kit, projectDir, i))) {
      actions.push(...group.flatMap((i) => (i.edited ? i.forcedActions : i.actions)));
    } else {
      held.push({ skill: unit, target: `.claude/skills/${unit.split("/").pop()}`, files: edited.map((i) => i.kit) });
    }
  }
  return { actions, held, notes };
}

function lstatOrNull(path) {
  try {
    return lstatSync(path);
  } catch {
    return null;
  }
}
