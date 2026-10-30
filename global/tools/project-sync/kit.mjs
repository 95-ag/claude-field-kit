import { createHash } from "crypto";
import { execFileSync } from "child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { Refusal } from "./report.mjs";

const TYPES = ["rules", "skills", "agents", "hooks"];
const NULL_OID = /^0+$/;

export function kitRoot(argvKit) {
  return argvKit ? resolve(argvKit) : resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
}

function git(kit, args, options = {}) {
  return execFileSync("git", args, { cwd: kit, maxBuffer: 256 * 1024 * 1024, ...options });
}

function gitText(kit, args, options = {}) {
  return git(kit, args, { encoding: "utf8", ...options });
}

export function blobOf(bytes) {
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}

export function blobAt(kit, commit, kitPath) {
  try {
    return gitText(kit, ["rev-parse", "--verify", "-q", `${commit}:project/${kitPath}`]).trim() || null;
  } catch {
    return null;
  }
}

export function readBlob(kit, blob) {
  return git(kit, ["cat-file", "blob", blob]);
}

// --no-renames so every path a blob ever lived at is listed, not only its final name
function historyRaw(kit) {
  const raw = gitText(kit, ["log", "--no-renames", "--format=", "--raw", "--no-abbrev", "-r", "--", "project/"]);
  return raw.split("\n").filter(Boolean).map((line) => {
    const [meta, path] = line.split("\t");
    const [, , before, after] = meta.split(" ");
    return { before, after, path: path.replace(/^project\//, "") };
  });
}

export function everBlobs(kit) {
  const blobs = new Set();
  for (const { before, after } of historyRaw(kit)) {
    for (const oid of [before, after]) if (!NULL_OID.test(oid)) blobs.add(oid);
  }
  return blobs;
}

// A run over several projects reads the kit's catalog and history once. The kit does not change during a run.
let cache = null;

export function cacheKit(kit) {
  cache = kit === null ? null : { kit, catalog: null, everPaths: null };
}

export function everPaths(kit) {
  if (cache?.kit !== kit) return readEverPaths(kit);
  return (cache.everPaths ??= readEverPaths(kit));
}

function readEverPaths(kit) {
  const paths = new Set();
  for (const { path } of historyRaw(kit)) {
    paths.add(path);
    const skillDir = path.match(/^(?:shared|(?:domains|stacks|repos)\/[^/]+)\/skills\/[^/]+(?=\/)/);
    if (skillDir) paths.add(skillDir[0]);
  }
  return paths;
}

// Commits in `commit..HEAD` that touch project/; null when the kit no longer holds `commit`
export function commitsSince(kit, commit) {
  try {
    return Number(gitText(kit, ["rev-list", "--count", `${commit}..HEAD`, "--", "project/"], { stdio: ["ignore", "pipe", "ignore"] }).trim());
  } catch {
    return null;
  }
}

export function resolveAncestor(kit, ref) {
  let commit;
  try {
    commit = gitText(kit, ["rev-parse", "--verify", "-q", `${ref}^{commit}`], { stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    throw new Refusal(`${ref} is not a commit in the kit`);
  }
  try {
    git(kit, ["merge-base", "--is-ancestor", commit, "HEAD"]);
  } catch {
    throw new Refusal(`${ref} is not an ancestor of the kit's HEAD — a recorded base must come from main's history`);
  }
  return commit;
}

export function renamesSince(kit, commit) {
  const renames = new Map();
  const raw = gitText(kit, ["diff", "-M", "--name-status", commit, "HEAD", "--", "project/"]);
  for (const line of raw.split("\n")) {
    const [status, from, to] = line.split("\t");
    if (status?.startsWith("R")) renames.set(from.replace(/^project\//, ""), to.replace(/^project\//, ""));
  }
  return renames;
}

export function assertDeliverable(kit) {
  let dirty;
  try {
    const quiet = { stdio: ["ignore", "pipe", "ignore"] };
    if (gitText(kit, ["rev-parse", "--show-prefix"], quiet).trim()) throw new Error("inside a larger repository");
    dirty = gitText(kit, ["status", "--porcelain", "--", "project/"], quiet).trim();
  } catch {
    throw new Refusal(`${kit} is not the root of a git checkout of the kit`);
  }
  if (dirty) {
    throw new Refusal("the kit has uncommitted changes under project/ — commit or discard them first, so every recorded blob comes from a surviving commit");
  }
  let branch;
  try {
    branch = gitText(kit, ["symbolic-ref", "--short", "HEAD"]).trim();
  } catch {
    branch = "(detached HEAD)";
  }
  if (branch !== "main") throw new Refusal(`kit HEAD is on ${branch}, not main — a squash-merged branch's commits do not survive`);
}

// "bucket" is how a path's first segments name its tier: "shared" or "<kind>/<name>"
function splitBucket(kitPath) {
  const parts = kitPath.split("/");
  if (parts[0] === "shared") return { bucket: "shared", name: null, rest: parts.slice(1) };
  if (["domains", "stacks", "repos"].includes(parts[0]) && parts.length > 2) {
    return { bucket: `${parts[0]}/${parts[1]}`, name: parts[1], rest: parts.slice(2) };
  }
  return null;
}

export function targetFor(kitPath) {
  const split = splitBucket(kitPath);
  if (!split || kitPath.endsWith(".template.md")) return null;
  const [type, ...tail] = split.rest;
  if (!TYPES.includes(type) || tail.length === 0) return null;
  const inside = tail.join("/");
  if (type === "rules") return split.name ? `.claude/rules/${split.name}/${inside}` : `.claude/rules/${inside}`;
  return `.claude/${type}/${inside}`;
}

function filesUnder(dir) {
  const found = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue;
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) found.push(...filesUnder(abs).map((f) => `${name}/${f}`));
    else found.push(name);
  }
  return found;
}

function frontmatterDescription(text) {
  const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!front) return null;
  const lines = front[1].split(/\r?\n/);
  const at = lines.findIndex((l) => l.startsWith("description:"));
  if (at === -1) return null;
  const inline = lines[at].slice("description:".length).trim();
  if (inline && !/^[>|][+-]?$/.test(inline)) return inline.replace(/^(["'])(.*)\1$/, "$2");
  const block = [];
  for (const line of lines.slice(at + 1)) {
    if (!/^\s/.test(line)) break;
    block.push(line.trim());
  }
  return block.join(" ").trim() || null;
}

function firstCommentLine(text) {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#!") || line === "/**" || line === "/*" || line === "*/") continue;
    if (/^(\/\/|#|\*|\/\*)/.test(line)) {
      const text = line.replace(/^(\/\/+|#+|\*+|\/\*+)\s*/, "").replace(/\s*\*\/$/, "").trim();
      if (text) return text;
      continue;
    }
    break;
  }
  return "";
}

function firstParagraphAfterHeading(text) {
  const lines = text.split(/\r?\n/);
  let i = lines.findIndex((l) => l.startsWith("# "));
  if (i === -1) return "";
  const paragraph = [];
  for (i += 1; i < lines.length; i++) {
    if (!lines[i].trim()) {
      if (paragraph.length) break;
      continue;
    }
    if (lines[i].startsWith("#")) break;
    paragraph.push(lines[i].trim());
  }
  return paragraph.join(" ");
}

export function purposeOf(kit, kitPath) {
  const split = splitBucket(kitPath);
  const type = split?.rest[0];
  const abs = join(kit, "project", kitPath);
  const file = type === "skills" ? join(abs, "SKILL.md") : abs;
  if (!existsSync(file)) return "";
  const text = readFileSync(file, "utf8");
  if (type === "skills") return frontmatterDescription(text) ?? "";
  if (type === "rules") return firstParagraphAfterHeading(text);
  return frontmatterDescription(text) ?? firstCommentLine(text);
}

function listDirs(dir) {
  return existsSync(dir) ? readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory()).sort() : [];
}

export function catalog(kit) {
  if (cache?.kit !== kit) return readCatalog(kit);
  return (cache.catalog ??= readCatalog(kit));
}

export function fileTarget(entry, file) {
  return entry.type === "skills" ? join(entry.target, file.slice(entry.kit.length + 1)) : entry.target;
}

function readCatalog(kit) {
  const project = join(kit, "project");
  const tiers = {
    domains: listDirs(join(project, "domains")),
    stacks: listDirs(join(project, "stacks")),
    repos: listDirs(join(project, "repos")),
  };
  const buckets = ["shared", ...Object.entries(tiers).flatMap(([kind, names]) => names.map((n) => `${kind}/${n}`))];
  const entries = [];
  for (const bucket of buckets) {
    for (const type of TYPES) {
      const typeDir = join(project, bucket, type);
      if (!existsSync(typeDir)) continue;
      if (type === "skills") {
        for (const name of listDirs(typeDir)) {
          const kitPath = `${bucket}/skills/${name}`;
          const files = filesUnder(join(typeDir, name)).map((f) => `${kitPath}/${f}`);
          entries.push({ kit: kitPath, bucket, type, target: `.claude/skills/${name}`, files, purpose: purposeOf(kit, kitPath) });
        }
      } else {
        for (const f of filesUnder(typeDir)) {
          const kitPath = `${bucket}/${type}/${f}`;
          const target = targetFor(kitPath);
          if (target === null) continue;
          entries.push({ kit: kitPath, bucket, type, target, files: [kitPath], purpose: purposeOf(kit, kitPath) });
        }
      }
    }
  }
  return { tiers, entries };
}
