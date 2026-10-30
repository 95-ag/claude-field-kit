import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync, spawnSync } from "child_process";

const TOOL = join(dirname(fileURLToPath(import.meta.url)), "../../global/tools/project-sync.mjs");
const made = [];

function scratch(prefix) {
  const dir = mkdtempSync(join(tmpdir(), `project-sync-${prefix}-`));
  made.push(dir);
  return dir;
}

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function write(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

const KIT_FILES = {
  "project/shared/rules/a.md": "# Rule A\n\nKeep things\nsmall.\n\n## Detail\nmore\n",
  "project/shared/hooks/fmt.mjs": "#!/usr/bin/env node\n/**\n * fmt — formats edited files.\n */\n",
  "project/shared/hooks.json": "{}\n",
  "project/stacks/node/rules/b.md": "# Rule B\n\nNode specifics.\n",
  "project/domains/web/skills/s1/SKILL.md": "---\nname: s1\ndescription: >\n  Does the s1 thing\n  on two lines.\n---\n\n# S1\n",
  "project/domains/web/skills/s1/references/r.md": "# Ref\n",
  "project/shared/CLAUDE.template.md": "# template\n",
};

export function makeFamily() {
  return scratch("family");
}

export function makeKit(parent) {
  const dir = parent ? join(parent, "kit") : scratch("kit");
  mkdirSync(dir, { recursive: true });
  git(dir, "init", "-q", "-b", "main");
  for (const [rel, content] of Object.entries(KIT_FILES)) write(dir, rel, content);
  const kit = {
    dir,
    git: (...args) => git(dir, ...args),
    write: (rel, content) => write(dir, rel, content),
    commit(message) {
      git(dir, "add", "-A");
      git(dir, "commit", "-q", "-m", message);
    },
  };
  kit.commit("seed");
  return kit;
}

export function makeProject(name, record, parent) {
  const dir = join(parent ?? scratch("proj"), name);
  mkdirSync(join(dir, ".claude"), { recursive: true });
  if (record !== undefined) {
    const body = typeof record === "string" ? record : JSON.stringify(record, null, 2);
    writeFileSync(join(dir, ".claude", "kit-delivery.json"), body);
  }
  return dir;
}

export function validRecord(overrides = {}) {
  return {
    tiers: { domains: [], stacks: [], repo: null },
    skip: [],
    delivered: null,
    files: {},
    ...overrides,
  };
}

export function tool(kitDir, args, env = {}) {
  const r = spawnSync("node", [TOOL, "--kit", kitDir, ...args], { encoding: "utf8", env: { ...process.env, ...env } });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

export function cleanup() {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
}
