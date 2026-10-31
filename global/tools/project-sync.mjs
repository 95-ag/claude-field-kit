#!/usr/bin/env node
/**
 * project-sync — deliver the kit's project tier to projects that already hold a
 * .claude/kit-delivery.json record.
 *
 * Usage:
 *   node project-sync.mjs [--kit <path>] (<project-dir>... | --all)
 *   node project-sync.mjs [--kit <path>] --catalog
 *   node project-sync.mjs [--kit <path>] --apply [--resolved <kit-path>[,<kit-path>…]] [--take-kit <kit-skill-dir>[,<kit-skill-dir>…]] (<project-dir>... | --all)
 *   node project-sync.mjs [--kit <path>] --status (<project-dir>... | --all)
 *   node project-sync.mjs [--kit <path>] --record-bases [--at <commit>] <project-dir>
 *   node project-sync.mjs [--kit <path>] --restore <backup-dir>
 *
 * --kit       Kit root. Default: the checkout this file lives in.
 * --catalog   Print the kit's tiers and deliverable entries as JSON; read-only.
 * --all       Every folder next to the kit that holds .claude/kit-delivery.json, by name; replaces the project list.
 * --status     Per project: the delivered commit, kit commits behind it, and the files still owed; read-only.
 * --record-bases  Adopt's writer of `files` for one project whose `delivered` is still null: each present file whose
 *             bytes are a past kit version is recorded at that blob; an edited file gets no entry. With --at <commit>
 *             (an ancestor of HEAD) every present file is recorded at that commit's blob instead. Writes the record only,
 *             after a backup.
 * --apply     Back up, write, update the record, print the report.
 * --resolved  With --apply and one project: kit paths (under project/) the owner merged by hand — a merge
 *             conflict, an edited file with no recorded base, or a file the kit renamed that the project edited (named by
 *             its new path). --apply leaves those files' merge copies under <kit>/tmp/project-sync-merge/<project>/
 *             (markers for a conflict; the project's copy for an edited file; for a renamed file the merge of the old
 *             path's copy into the kit's new text, at the new path; each with a .kit and a .project sidecar of the kit
 *             text and project file it was built from). An existing copy is
 *             never overwritten, and the folder's project.json ties it to one project path. The owner merges there, and
 *             --resolved writes that copy into the project (after a backup), advances the record entry to the kit's HEAD
 *             and removes the copy; for a renamed file it also removes the old path and drops its record entry. Refused
 *             while the copy is missing, still holds a conflict marker, or either sidecar no longer matches the kit's
 *             HEAD or the project file.
 * --take-kit  With --apply and one project: kit skill directories (under project/) currently held for a project edit.
 *             Each is replaced wholesale with the kit's HEAD version, as a released skill is, without consulting incoming/.
 * --restore   Put a backup's files back and remove the files that run added.
 *
 * With project directories and no mode flag it prints the plan per project and writes nothing.
 *
 * The dry run and every --apply form first run skill-reference-check over project/'s skill folders and refuse
 * on a dead pointer; a near-match is printed as `warn:` and does not refuse.
 *
 * Exit: 0 ok · 1 refused (printed as `REFUSED: …`) or, with --apply, something still owed (a conflict, a file
 * edited with no recorded base, a renamed file the project edited, an edited binary, a held skill) · 2 usage.
 */
import { spawnSync } from "child_process";
import { existsSync, readdirSync, realpathSync } from "fs";
import { basename, dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { assertDeliverable, cacheKit, catalog, kitRoot, resolveAncestor } from "./project-sync/kit.mjs";
import { applyPlan, previewEdits, restore, saveRecord } from "./project-sync/apply.mjs";
import { planProject } from "./project-sync/plan.mjs";
import { findProjects, planBases, readRecord, status, validateRecord } from "./project-sync/record.mjs";
import { Refusal, owedLines, renderBases, renderPlan, renderReport, renderStatus } from "./project-sync/report.mjs";

function usage(message) {
  console.error(`${message}\nusage: project-sync [--kit <path>] (--catalog | --restore <backup-dir> | --record-bases [--at <commit>] <project-dir> | [--apply [--resolved <kit-path>,…] [--take-kit <kit-skill-dir>,…] | --status] (<project-dir>... | --all))`);
  process.exit(2);
}

const args = process.argv.slice(2);
let kitArg = null;
let wantCatalog = false;
let wantApply = false;
let wantStatus = false;
let wantAll = false;
let wantBases = false;
let atArg = null;
let restoreArg = null;
let resolved = [];
let takeKit = [];
const projects = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--kit") {
    kitArg = args[++i];
    if (!kitArg) usage("--kit needs a path");
  } else if (args[i] === "--catalog") wantCatalog = true;
  else if (args[i] === "--apply") wantApply = true;
  else if (args[i] === "--status") wantStatus = true;
  else if (args[i] === "--all") wantAll = true;
  else if (args[i] === "--record-bases") wantBases = true;
  else if (args[i] === "--at") {
    atArg = args[++i];
    if (!atArg || atArg.startsWith("--")) usage("--at needs a commit");
  }
  else if (args[i] === "--restore") {
    restoreArg = args[++i];
    if (!restoreArg || restoreArg.startsWith("--")) usage("--restore needs a backup directory");
  } else if (args[i] === "--resolved") {
    if (!args[++i] || args[i].startsWith("--")) usage("--resolved needs kit paths");
    resolved = args[i].split(",").filter(Boolean);
  } else if (args[i] === "--take-kit") {
    if (!args[++i] || args[i].startsWith("--")) usage("--take-kit needs kit skill directories");
    takeKit = args[i].split(",").map((dir) => dir.replace(/\/+$/, "")).filter(Boolean);
  }
  else if (args[i].startsWith("--")) usage(`unknown flag ${args[i]}`);
  else projects.push(args[i]);
}
if (!wantCatalog && !restoreArg && !wantAll && projects.length === 0) usage("give a project directory, --all, --catalog or --restore");
if (restoreArg && (wantApply || wantCatalog || wantStatus || wantAll || wantBases || resolved.length || takeKit.length || projects.length)) usage("--restore stands alone — it needs no project and no other mode");
if (wantCatalog && (wantApply || wantStatus || wantAll || wantBases || resolved.length || takeKit.length || projects.length)) usage("--catalog stands alone");
if (wantAll && projects.length) usage("--all replaces the project list — give one or the other");
if (wantStatus && (wantApply || wantBases || resolved.length || takeKit.length)) usage("--status is read-only — it cannot be combined with --apply, --resolved, --take-kit or --record-bases");
if (wantBases && (wantApply || wantAll || projects.length !== 1)) usage("--record-bases takes exactly one project and no other mode");
if (atArg && !wantBases) usage("--at belongs to --record-bases");
if (resolved.length && !(wantApply && projects.length === 1)) usage("--resolved needs --apply and exactly one project");
if (takeKit.length && !(wantApply && projects.length === 1)) usage("--take-kit needs --apply and exactly one project");

const kit = kitRoot(kitArg);
cacheKit(kit);

if (wantCatalog) {
  try {
    console.log(JSON.stringify(catalog(kit), null, 2));
    process.exit(0);
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    console.log(`REFUSED: ${error.message}`);
    process.exit(1);
  }
}

if (restoreArg) {
  try {
    const { restored, removed } = restore(resolve(restoreArg));
    console.log(`restored ${restored} file(s), removed ${removed} added file(s)`);
    process.exit(0);
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    console.log(`REFUSED: ${error.message}`);
    process.exit(1);
  }
}

let refused = false;
function refuse(error) {
  if (!(error instanceof Refusal)) throw error;
  console.log(`REFUSED: ${error.message}`);
  refused = true;
}

/** `project/shared/skills` and every `project/<kind>/<name>/skills` that exists — discovered, so a new tier is covered. */
function skillRoots(projectTier) {
  const roots = [join(projectTier, "shared", "skills")];
  for (const kind of ["domains", "stacks", "repos"]) {
    const kindDir = join(projectTier, kind);
    if (!existsSync(kindDir)) continue;
    for (const name of readdirSync(kindDir)) roots.push(join(kindDir, name, "skills"));
  }
  return roots.filter((root) => existsSync(root));
}

// A skill delivered with a dead pointer reads as correct prose in the project, so the hold comes before any write.
function assertPointersResolve(kitDir) {
  const roots = skillRoots(join(kitDir, "project"));
  if (roots.length === 0) return;
  const check = join(dirname(fileURLToPath(import.meta.url)), "skill-reference-check.mjs");
  const result = spawnSync(process.execPath, [check, ...roots], { encoding: "utf8" });
  if (result.status !== 0 || /^warn:/m.test(result.stdout)) process.stdout.write(result.stdout);
  if (result.status === 1) throw new Refusal("a skill pointer under project/ does not resolve — fix it in the kit and rerun");
  if (result.status !== 0) {
    throw new Refusal(`skill-reference-check could not run (exit ${result.status}): ${(result.stderr ?? "").trim()}`);
  }
}

try {
  assertDeliverable(kit);
  if (!wantStatus && !wantBases) assertPointersResolve(kit);
} catch (error) {
  refuse(error);
  process.exit(1);
}

const targets = wantAll ? findProjects(kit) : projects.map((arg) => resolve(arg));
if (wantAll && targets.length === 0) console.log("no project holding a .claude/kit-delivery.json sits next to the kit");

for (const projectDir of targets) {
  try {
    if (!existsSync(projectDir)) throw new Refusal(`${projectDir} does not exist`);
    if (realpathSync(projectDir) === realpathSync(kit)) throw new Refusal(`${projectDir} is the kit itself — a project is delivered to, never the kit`);
    const rec = readRecord(projectDir);
    const { warnings } = validateRecord(rec, kit);
    for (const warning of warnings) console.log(`WARNING: ${warning}`);
    if (wantStatus) {
      console.log(renderStatus(basename(projectDir), status(kit, projectDir, rec)));
      continue;
    }
    if (wantBases) {
      if (rec.delivered !== null) throw new Refusal("already delivered — bases now come from runs");
      const at = atArg ? resolveAncestor(kit, atArg) : null;
      const summary = planBases(kit, projectDir, rec, at);
      const backup = saveRecord(kit, projectDir, rec, { ...rec, files: summary.files });
      console.log(renderBases(basename(projectDir), summary, at, backup));
      continue;
    }
    const plan = planProject(kit, projectDir, rec, { takeKit });
    if (!wantApply) {
      console.log(renderPlan(basename(projectDir), plan, previewEdits(kit, projectDir, rec, plan.actions)));
      continue;
    }
    const result = applyPlan(kit, projectDir, rec, plan, { resolved });
    console.log(renderReport(basename(projectDir), plan, result));
    if (owedLines(plan, result).length) refused = true;
  } catch (error) {
    if (error.backup) {
      console.log(`ERROR: ${error.message}`);
      console.log(`Backup path: ${error.backup}`);
      console.log(`Run \`project-sync --restore ${error.backup}\` to undo.`);
      refused = true;
    } else refuse(error);
  }
}
process.exit(refused ? 1 : 0);
