import { createHash } from "crypto";
import { execFileSync } from "child_process";
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

// Every blob a kit path has held, following it back through renames (newest commit first, as `git log --follow`).
export function pathHistoryBlobs(kit, kitPath) {
  const blobs = new Set();
  let name = `project/${kitPath}`;
  for (const commit of renameLog(kit)) {
    let renamedFrom = null;
    for (const line of commit.split("\n")) {
      if (!line.startsWith(":")) continue;
      const [meta, from, to] = line.split("\t");
      const [, , before, after, status] = meta.split(" ");
      const now = to ?? from;
      if (now !== name) continue;
      for (const oid of [before, after]) if (!NULL_OID.test(oid)) blobs.add(oid);
      if (status.startsWith("R")) renamedFrom = from;
    }
    if (renamedFrom) name = renamedFrom;
  }
  return blobs;
}

// A run over several projects reads the kit's catalog and history once. The kit does not change during a run.
let cache = null;

export function cacheKit(kit) {
  cache = kit === null ? null : { kit, catalog: null, everPaths: null, renameLog: null };
}

function renameLog(kit) {
  if (cache?.kit !== kit) return readRenameLog(kit);
  return (cache.renameLog ??= readRenameLog(kit));
}

function readRenameLog(kit) {
  return gitText(kit, ["log", "-M", "--format=%x00", "--raw", "--no-abbrev", "-r", "HEAD", "--", "project/"]).split("\0").slice(1);
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

// null when the kit no longer holds `commit`
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
  if (!isAncestor(kit, commit)) throw new Refusal(`${ref} is not an ancestor of the kit's HEAD — a recorded base must come from main's history`);
  return commit;
}

export function isAncestor(kit, commit) {
  try {
    git(kit, ["merge-base", "--is-ancestor", commit, "HEAD"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function renamesSince(kit, commit, until = "HEAD") {
  const renames = new Map();
  const raw = gitText(kit, ["diff", "-M", "--name-status", commit, until, "--", "project/"]);
  for (const line of raw.split("\n")) {
    const [status, from, to] = line.split("\t");
    if (status?.startsWith("R")) renames.set(from.replace(/^project\//, ""), to.replace(/^project\//, ""));
  }
  return renames;
}

// Where a path the kit removed now lives, or null. Each hop is read inside the commit that removed the path, never across
// a wider range, where a file added later with similar text would pair with it; a hop to a path the kit has since
// removed too is followed on. Not tied to `delivered`, so a rename stays linked while the record holds the old path.
export function renamedTo(kit, kitPath) {
  const seen = new Set();
  for (let path = kitPath; !seen.has(path); ) {
    seen.add(path);
    const removedIn = gitText(kit, ["log", "-1", "--format=%H", "--no-renames", "--diff-filter=D", "HEAD", "--", `project/${path}`]).trim();
    const next = removedIn ? renamesSince(kit, `${removedIn}^`, removedIn).get(path) : undefined;
    if (!next) return null;
    if (blobAt(kit, "HEAD", next) !== null) return next;
    path = next;
  }
  return null;
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

function frontmatterDescription(text) {
  const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!front) return null;
  const lines = front[1].split(/\r?\n/);
  const at = lines.findIndex((l) => l.startsWith("description:"));
  if (at === -1) return null;
  const inline = lines[at].slice("description:".length).trim();
  const block = [];
  for (const line of lines.slice(at + 1)) {
    if (!/^\s/.test(line)) break;
    block.push(line.trim());
  }
  // a plain or quoted scalar may also run on over indented lines, which YAML folds with a space
  if (inline && !/^[>|][+-]?$/.test(inline)) return [inline, ...block].join(" ").replace(/^(["'])(.*)\1$/, "$2");
  return block.join(" ").trim() || null;
}

function openingCommentParagraph(text) {
  const paragraph = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#!") || line === "/**" || line === "/*" || line === "*/") {
      if (paragraph.length) break;
      continue;
    }
    if (!/^(\/\/|#|\*|\/\*)/.test(line)) break;
    const text = line.replace(/^(\/\/+|#+|\*+|\/\*+)\s*/, "").replace(/\s*\*\/$/, "").trim();
    if (!text) {
      if (paragraph.length) break;
      continue;
    }
    paragraph.push(text);
    if (line.endsWith("*/")) break;
  }
  return paragraph.join(" ");
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
  const type = splitBucket(kitPath)?.rest[0];
  const blob = blobAt(kit, "HEAD", type === "skills" ? `${kitPath}/SKILL.md` : kitPath);
  if (blob === null) return "";
  const text = readBlob(kit, blob).toString("utf8");
  if (type === "skills") return frontmatterDescription(text) ?? "";
  if (type === "rules") return firstParagraphAfterHeading(text);
  return frontmatterDescription(text) ?? openingCommentParagraph(text);
}

// The catalog is HEAD's tree, never the working tree: an ignored or untracked file has no blob to deliver or record.
function trackedFiles(kit) {
  let raw;
  try {
    raw = git(kit, ["ls-tree", "-r", "-z", "--name-only", "HEAD", "--", "project/"], { stdio: ["ignore", "pipe", "ignore"] }).toString("utf8");
  } catch {
    throw new Refusal(`${kit} is not a git checkout of the kit with a HEAD commit`);
  }
  return raw
    .split("\0")
    .filter(Boolean)
    .map((path) => path.replace(/^project\//, ""))
    .filter((path) => !path.split("/").some((part) => part.startsWith(".")))
    .sort();
}

export function catalog(kit) {
  if (cache?.kit !== kit) return readCatalog(kit);
  return (cache.catalog ??= readCatalog(kit));
}

export function fileTarget(entry, file) {
  return entry.type === "skills" ? join(entry.target, file.slice(entry.kit.length + 1)) : entry.target;
}

function readCatalog(kit) {
  const files = trackedFiles(kit);
  const tierNames = (kind) => [...new Set(files.filter((f) => f.startsWith(`${kind}/`) && f.split("/").length > 2).map((f) => f.split("/")[1]))].sort();
  const tiers = { domains: tierNames("domains"), stacks: tierNames("stacks"), repos: tierNames("repos") };
  const buckets = ["shared", ...Object.entries(tiers).flatMap(([kind, names]) => names.map((n) => `${kind}/${n}`))];
  const entries = [];
  for (const bucket of buckets) {
    for (const type of TYPES) {
      const prefix = `${bucket}/${type}/`;
      const inType = files.filter((f) => f.startsWith(prefix));
      if (type === "skills") {
        const names = [...new Set(inType.map((f) => f.slice(prefix.length).split("/")).filter((parts) => parts.length > 1).map((parts) => parts[0]))].sort();
        for (const name of names) {
          const kitPath = `${prefix}${name}`;
          entries.push({ kit: kitPath, bucket, type, target: `.claude/skills/${name}`, files: inType.filter((f) => f.startsWith(`${kitPath}/`)), purpose: purposeOf(kit, kitPath) });
        }
      } else {
        for (const kitPath of inType) {
          const target = targetFor(kitPath);
          if (target === null) continue;
          entries.push({ kit: kitPath, bucket, type, target, files: [kitPath], purpose: purposeOf(kit, kitPath) });
        }
      }
    }
  }
  return { tiers, entries };
}
