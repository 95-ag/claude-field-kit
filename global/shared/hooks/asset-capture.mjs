#!/usr/bin/env node
/**
 * asset-capture — PostToolUse (Write|Edit|MultiEdit).
 * When a reusable asset under a project's .claude/ (rules|skills|agents|hooks) is edited:
 *  (1) stage it into claude-field-kit incoming/<type>/ with a project-prefixed name (no loss even if the
 *      gitignored .claude/ is later wiped), and
 *  (2) queue a lowest-priority review/promote task in claude-field-kit's OWN .claude/work/tasks.md Backlog,
 *      naming the originating project — review→promote happens in the kit, not the originating project.
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

function insertIntoBacklog(content, line) {
  const m = content.match(/(^|\n)##\s+Backlog[^\n]*/);
  if (!m) return content.replace(/\s*$/, "") + `\n\n## Backlog\n${line}\n`;
  const sectionStart = m.index + m[0].length;
  const after = content.slice(sectionStart);
  const nextHeadingRel = after.search(/\n##\s/);
  if (nextHeadingRel === -1) return content.replace(/\s*$/, "") + `\n${line}\n`;
  const insertPos = sectionStart + nextHeadingRel;
  return content.slice(0, insertPos) + `\n${line}` + content.slice(insertPos);
}

// Queue the review task in claude-field-kit's OWN tasks.md (not the originating project's).
function queueTask(c) {
  if (!existsSync(KIT_TASKS)) return; // kit tasks.md absent → skip task; staging already done
  let content;
  try { content = readFileSync(KIT_TASKS, "utf8"); } catch { return; }
  const marker = `<!-- t3-capture:${c.project}:${c.rel} -->`; // project-qualified (shared queue)
  if (content.includes(marker)) return; // dedup
  const line = `- [ ] **Harvest from ${c.project}**: \`${c.rel}\` — staged to \`incoming/\`; review + promote. ${marker}`;
  try { writeFileSync(KIT_TASKS, insertIntoBacklog(content, line), "utf8"); } catch {}
}

const rl = createInterface({ input: process.stdin });
let raw = "";
rl.on("line", (l) => (raw += l));
rl.on("close", () => {
  let input;
  try { input = JSON.parse(raw || "{}"); } catch { process.exit(0); }
  if (!existsSync(KIT_ROOT)) process.exit(0); // claude-field-kit not on this machine → no-op
  const fp = input?.tool_input?.file_path ?? "";
  const c = fp && classify(fp);
  if (!c) process.exit(0);
  if (c.root === KIT_ROOT) process.exit(0); // self-capture: kit's own .claude/ is kit-internal, never promoted
  stageToIncoming(c); // copy first (no-loss), independent of tasks.md
  queueTask(c);
  process.exit(0);
});
