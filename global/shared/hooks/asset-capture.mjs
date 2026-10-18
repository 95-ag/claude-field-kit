#!/usr/bin/env node
/**
 * asset-capture — PostToolUse (Write|Edit|MultiEdit).
 * When a reusable asset under a project's .claude/ (rules|skills|agents|hooks) is edited:
 *  (1) stage it into claude-field-kit incoming/<type>/ with a project-prefixed name (no loss even if the
 *      gitignored .claude/ is later wiped), and
 *  (2) queue a review task — grouped per ASSET (a skill's many ref-file edits → one entry) — under the
 *      `### Harvest` cluster of claude-field-kit's OWN .claude/work/tasks.md, naming the originating project.
 * A hand-staged note in the kit's incoming/notes/ instead queues a resolve-task under `### Notes` (un-shaped
 * items: candidate lessons, deferred global edits, new-asset ideas, hook bugs — resolved with notes-triage,
 * never harvested, never captured). A shell write into incoming/notes/ is never seen — see
 * bash-write-adapter's KNOWN LIMITS.
 * Both dedup against open rows only: a checked row is a capture already resolved, so re-editing it queues
 * it again rather than staging it with no row to find it by.
 * Skips claude-field-kit's own .claude/ (kit-internal source/config, never promoted). No-ops if the kit
 * isn't present on this machine. Never promotes to a tier directly. The hook path is fail-open (always exit 0).
 *
 * Staged name = <project>__<path-under-asset-dir with / → __>, so a universal rule and a same-named tiered
 * one (rules/git.md vs rules/node/git.md) stay distinct files with distinct Harvest entries. The task's
 * marker and label keep the real slashed path; only the filename flattens.
 *
 * KNOWN GAP — a retired file stays staged. Staging a skill copies its tree without removing anything, so
 * splitting or renaming a reference file leaves the old copy in incoming/ beside its replacements and
 * nothing reports it. Deliberate: auto-deleting would fight the no-loss guarantee staging exists for.
 * Remove the stale copy by hand when harvesting a skill whose file set changed.
 *
 * KNOWN GAP — row detection is loose. A plain column-0 line after a row, before the next heading,
 * inherits that row's box. Nothing in tasks.md has that shape today.
 *
 * VERIFY — `node asset-capture.mjs --verify <project-dir> [--since <minutes>]` (default 120) reports each
 * asset file edited in that window as STAGED, STALE or MISSING, with its row as queued, harvested or not
 * queued; exit 1 on STALE or MISSING, 2 on a usage error. Read-only. Capture is fail-open and cannot report its own miss; this
 * is how one is seen. A MISSING right after a harvest or a hand delivery from the kit is expected — the
 * default window keeps the report to the current session. A symlinked directory is not followed and a
 * broken link cannot be read; each is listed as SKIPPED and left out of the counts.
 */
import { createInterface } from "readline";
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, cpSync, readdirSync, statSync } from "fs";
import { basename, dirname, join, relative, resolve } from "path";

const ASSET_DIRS = ["rules", "skills", "agents", "hooks"];
const INCOMING = (process.env.CLAUDE_FIELD_KIT_INCOMING || "/home/ag-95/projects/claude-field-kit/incoming").replace(/\/+$/, "");
const KIT_ROOT = dirname(INCOMING);
const KIT_TASKS = `${KIT_ROOT}/.claude/work/tasks.md`;

// Windows-desktop-over-WSL: the harness passes file_path as a UNC path
// (\\wsl.localhost\<distro>\X). Inside this WSL-run hook that's unresolvable, so translate to
// the native WSL path before any filesystem use. No-op for already-native paths.
function toWslPath(p) {
  const norm = String(p).replace(/\\/g, "/");
  const m = norm.match(/^\/\/wsl(?:\.localhost|\$)\/[^/]+(\/.*)$/i);
  return m ? m[1] : norm;
}

// <root>/.claude/<assetDir>/<rest> → details; else null.
function classify(filePath) {
  const norm = toWslPath(filePath);
  const m = norm.match(/^(.*)\/\.claude\/([^/]+)\/(.+)$/);
  if (!m) return null;
  const [, root, assetDir, rest] = m;
  if (!ASSET_DIRS.includes(assetDir)) return null;
  return {
    root, assetDir, rest, absFile: norm,
    project: basename(root) || "unknown",
    rel: `.claude/${assetDir}/${rest}`,
  };
}

// Where capture stages an asset, shared with --verify so the two cannot disagree. A skill is a dir, staged
// whole; anything else is one file whose path is flattened, not dropped — a basename would collide a
// universal rule with a same-named tiered one (rules/git.md vs rules/node/git.md), and silently.
function stagedPath(c) {
  if (c.assetDir === "skills") return join(INCOMING, "skills", `${c.project}__${c.rest.split("/")[0]}`);
  return join(INCOMING, c.assetDir, `${c.project}__${c.rest.replace(/\//g, "__")}`);
}

// Asset-level dedup marker: a skill's many files share one.
function markerFor(c) {
  const asset = c.assetDir === "skills" ? c.rest.split("/")[0] : c.rest;
  return `<!-- t3:${c.project}:${c.assetDir}/${asset} -->`;
}

// Stage the edited asset into incoming/<type>/ with a project-prefixed name.
function stageToIncoming(c) {
  try {
    const dest = stagedPath(c);
    mkdirSync(dirname(dest), { recursive: true });
    if (c.assetDir === "skills") cpSync(`${c.root}/.claude/skills/${c.rest.split("/")[0]}`, dest, { recursive: true });
    else copyFileSync(c.absFile, dest);
  } catch { /* no-loss best-effort; never throw */ }
}

// Insert `line` under a `### <Cluster>` sub-heading in tasks.md. Create the sub-heading under `## Backlog`
// if absent; append a Backlog if there is none. A blockquote directly under the heading is skipped whole,
// so the row lands below the section's note however many lines it runs to.
function insertUnderCluster(content, heading, line) {
  const lines = content.split("\n");
  const h = lines.findIndex(l => l.trim() === heading);
  if (h !== -1) {
    let at = h + 1;
    while (at < lines.length && lines[at].startsWith(">")) at++;
    lines.splice(at, 0, line);
    return lines.join("\n");
  }
  const b = lines.findIndex(l => /^##\s+Backlog\b/.test(l));
  if (b !== -1) {
    lines.splice(b + 1, 0, "", heading, line);
    return lines.join("\n");
  }
  return content.replace(/\s*$/, "") + `\n\n## Backlog\n\n${heading}\n${line}\n`;
}

// Whether `marker` sits on a row not marked `x` (`[ ]` and `[~]` are both open). A row is a `- [?]` line
// plus its continuation lines, and a marker usually trails the last of them, so the box is carried down
// until the next row or heading.
function hasOpenRow(content, marker) {
  let box = null;
  for (const line of content.split("\n")) {
    const row = line.match(/^- \[(.)\]/);
    if (row) box = row[1];
    else if (line.startsWith("#")) box = null;
    if (box !== null && box !== "x" && line.includes(marker)) return true;
  }
  return false;
}

// Queue a capture review task in claude-field-kit's OWN tasks.md, grouped per ASSET (a skill's many ref-file
// edits collapse to one entry), under the `### Harvest` cluster.
function queueTask(c) {
  if (!existsSync(KIT_TASKS)) return; // kit tasks.md absent → skip task; staging already done
  let content;
  try { content = readFileSync(KIT_TASKS, "utf8"); } catch { return; }
  // The marker and label keep the real path (rules/node/git.md) so the entry reads as the file it is and
  // dedups per tier; only the staged FILENAME flattens the separator.
  const asset = c.assetDir === "skills" ? c.rest.split("/")[0] : c.rest;
  const marker = markerFor(c);
  if (hasOpenRow(content, marker)) return;
  const staged = `incoming/${relative(INCOMING, stagedPath(c))}`;
  const line = `- [ ] **${c.project} · ${c.assetDir}/${asset}** — staged \`${staged}\` ${marker}`;
  try { writeFileSync(KIT_TASKS, insertUnderCluster(content, "### Harvest", line), "utf8"); } catch {}
}

// A hand-staged note in incoming/notes/ is un-shaped (candidate lesson, deferred global edit, new-asset idea,
// hook bug) — NOT a captured asset. Queue a resolve-task under `### Notes`; notes-triage resolves it.
function queueNote(name) {
  if (!existsSync(KIT_TASKS)) return;
  let content;
  try { content = readFileSync(KIT_TASKS, "utf8"); } catch { return; }
  const marker = `<!-- t3-note:${name} -->`;
  if (hasOpenRow(content, marker)) return;
  const line = `- [ ] **Note · ${name}** — resolve with notes-triage. ${marker}`;
  try { writeFileSync(KIT_TASKS, insertUnderCluster(content, "### Notes", line), "utf8"); } catch {}
}

// A symlinked directory is not followed, since a cycle would never end; a symlinked file is walked, because
// the hook stages it like any other.
function filesUnder(dir, skipped) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  return entries.flatMap((e) => {
    const abs = join(dir, e.name);
    if (e.isDirectory()) return filesUnder(abs, skipped);
    if (e.isSymbolicLink()) {
      let target;
      try { target = statSync(abs); } catch { skipped.push([abs, "unreadable"]); return []; }
      if (target.isDirectory()) { skipped.push([abs, "symlink"]); return []; }
    }
    return [abs];
  });
}

// --verify: a read-only report, the one place this hook may exit non-zero — it is run by hand, not by the
// harness, and its exit code is the answer.
function verify(projectArg, sinceMin) {
  const root = toWslPath(resolve(projectArg)).replace(/\/+$/, "");
  if (root === KIT_ROOT) {
    console.log("claude-field-kit's own .claude/ is never captured — nothing to verify.");
    return 0;
  }
  let tasks = "";
  try { tasks = readFileSync(KIT_TASKS, "utf8"); } catch {}
  const since = Date.now() - sinceMin * 60e3;
  const counts = { STAGED: 0, STALE: 0, MISSING: 0 };
  const skipped = [];
  for (const dir of ASSET_DIRS) {
    for (const abs of filesUnder(`${root}/.claude/${dir}`, skipped)) {
      if (statSync(abs).mtimeMs < since) continue;
      const c = classify(abs);
      const staged = c.assetDir === "skills" ? join(stagedPath(c), ...c.rest.split("/").slice(1)) : stagedPath(c);
      const state = !existsSync(staged) ? "MISSING"
        : readFileSync(staged).equals(readFileSync(abs)) ? "STAGED" : "STALE";
      counts[state]++;
      const marker = markerFor(c);
      const queued = hasOpenRow(tasks, marker) ? "queued" : tasks.includes(marker) ? "harvested" : "not queued";
      console.log(`${state.padEnd(8)} ${c.rel} → ${relative(KIT_ROOT, staged)}  [${queued}]`);
    }
  }
  for (const [abs, why] of skipped) console.log(`${"SKIPPED".padEnd(8)} ${relative(root, abs)} (${why})`);
  const total = counts.STAGED + counts.STALE + counts.MISSING;
  console.log(`${total} checked (window ${sinceMin} min): ${counts.STAGED} staged, ${counts.STALE} stale, ${counts.MISSING} missing`);
  return counts.STALE + counts.MISSING > 0 ? 1 : 0;
}

// A mistyped path or window must not read as a clean run, so it exits 2, apart from a finding's 1.
function usage(problem) {
  console.error(`asset-capture --verify: ${problem}\nusage: node asset-capture.mjs --verify <project-dir> [--since <minutes>]`);
  process.exit(2);
}

if (process.argv[2] === "--verify") {
  const dir = process.argv[3];
  const at = process.argv.indexOf("--since");
  const sinceMin = at > 0 ? Number(process.argv[at + 1]) : 120;
  if (!dir || dir.startsWith("--") || !existsSync(join(resolve(dir), ".claude"))) {
    usage(`no .claude/ under ${dir && !dir.startsWith("--") ? dir : "(no project dir given)"}`);
  }
  if (!(sinceMin > 0)) usage("--since needs a positive number of minutes");
  process.exit(verify(dir, sinceMin));
}

const rl = createInterface({ input: process.stdin });
let raw = "";
rl.on("line", (l) => (raw += l));
rl.on("close", () => {
  let input;
  try { input = JSON.parse(raw || "{}"); } catch { process.exit(0); }
  if (!existsSync(KIT_ROOT)) process.exit(0); // claude-field-kit not on this machine → no-op
  // NotebookEdit sends `notebook_path`; every other edit tool sends `file_path`. Reading only the
  // latter would let a notebook inside a skill's references/ be edited without ever being staged.
  const fp = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path ?? "";
  if (!fp) process.exit(0);
  // Hand-staged note in the kit's incoming/notes/ → Notes resolve-task; never staged or Harvested.
  const fpw = toWslPath(fp);
  if (fpw.startsWith(`${INCOMING}/notes/`) && !fpw.endsWith("/.gitkeep")) {
    queueNote(basename(fpw));
    process.exit(0);
  }
  const c = classify(fp);
  if (!c) process.exit(0);
  if (c.root === KIT_ROOT) process.exit(0); // self-capture: kit's own .claude/ is kit-internal, never promoted
  stageToIncoming(c); // copy first (no-loss), independent of tasks.md
  queueTask(c);
  process.exit(0);
});
