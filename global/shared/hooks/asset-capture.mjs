#!/usr/bin/env node
/**
 * asset-capture — PostToolUse (Write|Edit|MultiEdit).
 * When a reusable asset under a project's .claude/ (rules|skills|agents|hooks) is edited:
 *  (1) stage it into claude-field-kit incoming/<type>/ with a project-prefixed name (no loss even if the
 *      gitignored .claude/ is later wiped), and
 *  (2) queue a review task — grouped per ASSET (a skill's many ref-file edits → one entry) — under the
 *      `### Harvest` cluster of claude-field-kit's OWN .claude/work/tasks.md, naming the originating project.
 * A hand-staged note in the kit's incoming/notes/ instead queues a resolve-task under `### General` (un-shaped
 * items: candidate lessons, deferred global edits, new-asset ideas, hook bugs — triaged at harvest, not captured).
 * Skips claude-field-kit's own .claude/ (kit-internal source/config, never promoted). No-ops if the kit
 * isn't present on this machine. Never promotes to a tier directly. Fail-open (always exit 0).
 */
import { createInterface } from "readline";
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, cpSync } from "fs";
import { basename, dirname, join } from "path";

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

// Stage the edited asset into incoming/<type>/ with a project-prefixed name.
// Skills are dirs → copy the whole skills/<name>/ tree; others → copy the single file.
function stageToIncoming(c) {
  try {
    if (c.assetDir === "skills") {
      const skillName = c.rest.split("/")[0];
      const srcDir = `${c.root}/.claude/skills/${skillName}`;
      const dest = join(INCOMING, "skills", `${c.project}__${skillName}`);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(srcDir, dest, { recursive: true });
    } else {
      const dest = join(INCOMING, c.assetDir, `${c.project}__${basename(c.rest)}`);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(c.absFile, dest);
    }
  } catch { /* no-loss best-effort; never throw */ }
}

// Insert `line` under a `### <Cluster>` sub-heading in tasks.md. Create the sub-heading under `## Backlog`
// if absent; append a Backlog if there is none. A blockquote note directly under the heading is skipped.
function insertUnderCluster(content, heading, line) {
  const lines = content.split("\n");
  const h = lines.findIndex(l => l.trim() === heading);
  if (h !== -1) {
    let at = h + 1;
    if (at < lines.length && lines[at].startsWith(">")) at++; // keep the heading's note on top
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

// Queue a capture review task in claude-field-kit's OWN tasks.md, grouped per ASSET (a skill's many ref-file
// edits collapse to one entry), under the `### Harvest` cluster.
function queueTask(c) {
  if (!existsSync(KIT_TASKS)) return; // kit tasks.md absent → skip task; staging already done
  let content;
  try { content = readFileSync(KIT_TASKS, "utf8"); } catch { return; }
  const asset = c.assetDir === "skills" ? c.rest.split("/")[0] : basename(c.rest);
  const marker = `<!-- t3:${c.project}:${c.assetDir}/${asset} -->`; // asset-level dedup
  if (content.includes(marker)) return;
  const staged = `incoming/${c.assetDir}/${c.project}__${asset}`;
  const line = `- [ ] **${c.project} · ${c.assetDir}/${asset}** — staged \`${staged}\` ${marker}`;
  try { writeFileSync(KIT_TASKS, insertUnderCluster(content, "### Harvest", line), "utf8"); } catch {}
}

// A hand-staged note in incoming/notes/ is un-shaped (candidate lesson, deferred global edit, new-asset idea,
// hook bug) — NOT a captured asset. Queue a resolve-task under `### General`; harvest triages it.
function queueNote(name) {
  if (!existsSync(KIT_TASKS)) return;
  let content;
  try { content = readFileSync(KIT_TASKS, "utf8"); } catch { return; }
  const marker = `<!-- t3-note:${name} -->`;
  if (content.includes(marker)) return;
  const line = `- [ ] **Note · ${name}** — resolve: shape into a rule/asset (→ harvest), apply as a fix, or drop. ${marker}`;
  try { writeFileSync(KIT_TASKS, insertUnderCluster(content, "### General", line), "utf8"); } catch {}
}

const rl = createInterface({ input: process.stdin });
let raw = "";
rl.on("line", (l) => (raw += l));
rl.on("close", () => {
  let input;
  try { input = JSON.parse(raw || "{}"); } catch { process.exit(0); }
  if (!existsSync(KIT_ROOT)) process.exit(0); // claude-field-kit not on this machine → no-op
  const fp = input?.tool_input?.file_path ?? "";
  if (!fp) process.exit(0);
  // Hand-staged note in the kit's incoming/notes/ → General resolve-task; never staged or Harvested.
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
