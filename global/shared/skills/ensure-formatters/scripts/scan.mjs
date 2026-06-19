#!/usr/bin/env node
/**
 * ensure-formatters scan — report which formatters the project's tracked file types need vs what is
 * configured. Read-only. `--install` prints (does not run) the install commands for missing groups —
 * never auto-installs. Optional first arg = project root (default cwd).
 */
import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, extname } from "path";

const args = process.argv.slice(2);
const wantInstall = args.includes("--install");
const root = args.find((a) => !a.startsWith("--")) || process.cwd();

function trackedFiles() {
  try {
    return execSync("git ls-files", { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
  } catch {
    const acc = [];
    (function walk(d) {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.name === "node_modules" || e.name === ".git") continue;
        if (e.isSymbolicLink()) continue;
        const p = join(d, e.name);
        e.isDirectory() ? walk(p) : acc.push(p);
      }
    })(root);
    return acc;
  }
}
const read = (f) => { try { return readFileSync(join(root, f), "utf8"); } catch { return ""; } };
const exts = new Set(trackedFiles().map((f) => extname(f).toLowerCase()).filter(Boolean));
const has = (...e) => e.some((x) => exts.has(x));

const PRETTIER_CFG = [".prettierrc", ".prettierrc.json", ".prettierrc.yaml", ".prettierrc.yml",
  ".prettierrc.js", "prettier.config.js"];
const checks = [
  { group: "node/web", present: has(".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".md"),
    // package.json check matches the top-level "prettier" config key or a devDependency entry, not a scripts-only invocation
    configured: existsSync(join(root, "biome.json")) || PRETTIER_CFG.some((f) => existsSync(join(root, f))) || read("package.json").includes('"prettier"'),
    options: "biome (biome.json) or prettier (.prettierrc / package.json#prettier)",
    install: ["npm i -D @biomejs/biome", "# or: npm i -D prettier"] },
  { group: "python", present: has(".py"),
    configured: read("pyproject.toml").includes("[tool.ruff]") || read("pyproject.toml").includes("[tool.black]"),
    options: "ruff ([tool.ruff]) or black ([tool.black]) in pyproject.toml",
    install: ["pip install ruff", "# or: pip install black"] },
];

console.log(`ensure-formatters: ${exts.size} tracked extension(s) in ${root}\n`);
let missing = 0;
for (const c of checks) {
  if (!c.present) continue;
  if (c.configured) { console.log(`  OK   ${c.group}: a formatter is configured`); continue; }
  console.log(`  MISSING ${c.group}: file types present, no formatter configured → ${c.options}`);
  missing++;
  if (wantInstall) c.install.forEach((i) => console.log(`         ${i}`));
}
console.log(`\n${missing} formatter group(s) missing.` +
  (missing && !wantInstall ? " Re-run with --install to see install commands." : ""));
console.log("(report only — never auto-installs; run any install command yourself after confirming.)");
process.exit(0);
