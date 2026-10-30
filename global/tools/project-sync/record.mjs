import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";
import { blobAt, blobOf, catalog, commitsSince, everBlobs, everPaths, fileTarget } from "./kit.mjs";
import { Refusal } from "./report.mjs";

const isStringList = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");

export function recordPath(projectDir) {
  return join(projectDir, ".claude", "kit-delivery.json");
}

function shapeProblem(rec) {
  if (rec === null || typeof rec !== "object" || Array.isArray(rec)) return "it is not a JSON object";
  const { tiers, skip, delivered, files } = rec;
  if (!tiers || typeof tiers !== "object" || !isStringList(tiers.domains) || !isStringList(tiers.stacks)) return "`tiers` needs `domains` and `stacks` string lists";
  if (tiers.repo !== null && typeof tiers.repo !== "string") return "`tiers.repo` must be a string or null";
  if (!isStringList(skip)) return "`skip` must be a list of strings";
  if (delivered !== null && !(delivered && typeof delivered.commit === "string" && typeof delivered.date === "string")) return "`delivered` must be null or { commit, date }";
  if (!files || typeof files !== "object" || Array.isArray(files) || !Object.values(files).every((v) => typeof v === "string")) return "`files` must map kit paths to blob hashes";
  return null;
}

export function readRecord(projectDir) {
  const path = recordPath(projectDir);
  if (!existsSync(path)) throw new Refusal(`no delivery record at ${path} — run project-bootstrap adopt for this project`);
  let rec;
  try {
    rec = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Refusal(`${path} is not valid JSON (${error.message})`);
  }
  const problem = shapeProblem(rec);
  if (problem) throw new Refusal(`${path} is invalid: ${problem}`);
  return rec;
}

export function writeRecord(projectDir, rec) {
  const ordered = {
    tiers: rec.tiers,
    skip: rec.skip,
    delivered: rec.delivered,
    files: Object.fromEntries(Object.entries(rec.files).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  };
  mkdirSync(join(projectDir, ".claude"), { recursive: true });
  writeFileSync(recordPath(projectDir), `${JSON.stringify(ordered, null, 2)}\n`);
}

export const canonical = (rec) => JSON.stringify({ ...rec, files: Object.fromEntries(Object.entries(rec.files).sort(([a], [b]) => (a < b ? -1 : 1))) });

const isSkipped = (entry, skip) => skip.some((s) => entry.kit === s || entry.kit.startsWith(`${s}/`));

function activeEntries(cat, rec) {
  const buckets = new Set(["shared", ...rec.tiers.domains.map((d) => `domains/${d}`), ...rec.tiers.stacks.map((s) => `stacks/${s}`), ...(rec.tiers.repo ? [`repos/${rec.tiers.repo}`] : [])]);
  return cat.entries.filter((entry) => buckets.has(entry.bucket) && !isSkipped(entry, rec.skip));
}

export function validateRecord(rec, kit) {
  const cat = catalog(kit);
  const unknown = [
    ...rec.tiers.domains.filter((d) => !cat.tiers.domains.includes(d)).map((d) => `domains/${d}`),
    ...rec.tiers.stacks.filter((s) => !cat.tiers.stacks.includes(s)).map((s) => `stacks/${s}`),
    ...(rec.tiers.repo !== null && !cat.tiers.repos.includes(rec.tiers.repo) ? [`repos/${rec.tiers.repo}`] : []),
  ];
  if (unknown.length) throw new Refusal(`unknown tier: ${unknown.join(", ")} — no such folder under project/`);

  const history = everPaths(kit);
  const neverHad = rec.skip.filter((p) => !history.has(p));
  if (neverHad.length) throw new Refusal(`skip lists ${neverHad.join(", ")}, which the kit has never had — check for a typo`);
  const warnings = rec.skip
    .filter((p) => !existsSync(join(kit, "project", p)))
    .map((p) => `skip path ${p} has been retired from the kit — it can be removed from skip`);

  const byTarget = new Map();
  for (const entry of activeEntries(cat, rec)) {
    byTarget.set(entry.target, [...(byTarget.get(entry.target) ?? []), entry.kit]);
  }
  for (const [target, sources] of byTarget) {
    if (sources.length > 1) throw new Refusal(`${sources.join(" and ")} both deliver ${target} — skip one of them`);
  }
  return { warnings };
}

// Sibling folders of the kit that hold a delivery record, by name
export function findProjects(kit) {
  const parent = dirname(kit);
  const self = realpathSync(kit);
  return readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
    .map((entry) => join(parent, entry.name))
    .filter((dir) => existsSync(recordPath(dir)) && realpathSync(dir) !== self)
    .sort((a, b) => (basename(a) < basename(b) ? -1 : 1));
}

export function status(kit, projectDir, rec = readRecord(projectDir)) {
  const behind = rec.delivered ? commitsSince(kit, rec.delivered.commit) : null;
  const owed = [];
  for (const entry of activeEntries(catalog(kit), rec)) {
    for (const file of entry.files) {
      const recorded = rec.files[file];
      if (recorded === blobAt(kit, "HEAD", file)) continue;
      const removedByProject = recorded !== undefined && !lstatSync(join(projectDir, fileTarget(entry, file)), { throwIfNoEntry: false });
      if (!removedByProject) owed.push(file);
    }
  }
  return { delivered: rec.delivered, behind, owed };
}

// Adopt's writer of `files`. Without `at`, a present file is recorded only when its bytes are a past kit version;
// with `at`, the owner has confirmed the project was fully delivered at that commit, so every present file is.
export function planBases(kit, projectDir, rec, at = null) {
  const known = at ? null : everBlobs(kit);
  const files = { ...rec.files };
  const summary = { recorded: [], edited: [], absent: [], notAtCommit: [] };
  for (const entry of activeEntries(catalog(kit), rec)) {
    for (const file of entry.files) {
      const abs = join(projectDir, fileTarget(entry, file));
      const stat = lstatSync(abs, { throwIfNoEntry: false });
      const blob = !stat ? null : !stat.isFile() ? null : at ? blobAt(kit, at, file) : blobOf(readFileSync(abs));
      const usable = blob && (at || known.has(blob));
      if (usable) {
        files[file] = blob;
        summary.recorded.push(file);
        continue;
      }
      delete files[file];
      (!stat ? summary.absent : at && stat.isFile() ? summary.notAtCommit : summary.edited).push(file);
    }
  }
  return { files, ...summary };
}

export function recordBases(kit, projectDir, rec, at = null) {
  return { ...rec, files: planBases(kit, projectDir, rec, at).files };
}
