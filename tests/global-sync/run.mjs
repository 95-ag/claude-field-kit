// global-sync harness — a deletion warning survives every run until the file goes, and the drift log names
// the file it wrote.
//
//   node tests/global-sync/run.mjs
//
// The tool hardcodes its targets (WSL_HOME / WIN_HOME), so the harness copies it and rewrites WSL_HOME alone
// to a sandbox dir, asserting that exactly one line differs from the source. Everything else is driven
// through the real --root / --env flags, so INCOMING_ROOT and TASKS_PATH stay inside the sandbox and no real
// tree is touched. The copy sits in tools/ beside skill-reference-check.mjs, which its reference hold runs
// from the tool's own directory.
import { spawnSync } from "child_process";
import { createHash, randomBytes } from "crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const TOOLS = join(ROOT, "global/tools");
const SB = mkdtempSync(join(tmpdir(), "global-sync-"));
const kit = `${SB}/kit`;
const home = `${SB}/home/.claude`; // stands in for WSL_HOME; claudeRel() needs the /.claude/ segment
const copyPath = `${SB}/tools/global-sync.mjs`;

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); };
const put = (path, content) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content, "utf8"); };

try {
  // --- the tool under test ---------------------------------------------------------------------------
  const shipped = readFileSync(join(TOOLS, "global-sync.mjs"), "utf8");
  const patched = shipped.replace(/^const WSL_HOME = .*;$/m, `const WSL_HOME = ${JSON.stringify(home)};`);
  const a = shipped.split("\n"), b = patched.split("\n");
  check("tool copy differs from its source by exactly one line (WSL_HOME)",
    a.length === b.length && a.filter((line, i) => line !== b[i]).length === 1);
  put(copyPath, patched);
  copyFileSync(join(TOOLS, "skill-reference-check.mjs"), `${SB}/tools/skill-reference-check.mjs`);

  // --- the sandbox kit -------------------------------------------------------------------------------
  const SOURCE_GONE = `${kit}/global/shared/skills/foo/references/gone.md`;
  put(`${kit}/global/shared/CLAUDE.md`, "# shared\n");
  put(`${kit}/global/shared/skills/foo/SKILL.md`, "# foo\n");
  put(SOURCE_GONE, "# gone\n");
  // Invalid UTF-8 up front, so a text-mode copy cannot round-trip it by luck.
  const BLOB = Buffer.concat([Buffer.from([0xff, 0xfe, 0x00, 0x80, 0xc3]), randomBytes(512)]);
  mkdirSync(`${kit}/global/shared/skills/foo/assets`, { recursive: true });
  writeFileSync(`${kit}/global/shared/skills/foo/assets/blob.bin`, BLOB);
  put(`${kit}/global/wsl/CLAUDE.md`, "# wsl overlay\n\n> meta\n\nwsl delta\n");
  const RULE_A = `${kit}/global/shared/rules/a.md`;
  put(RULE_A, "# A\n\nSee `b.md` → Real.\n");
  put(`${kit}/global/shared/rules/b.md`, "# B\n\n## Real\n");
  put(`${kit}/.claude/work/tasks.md`, "# Tasks\n\n## Backlog\n- [ ] existing\n\n## Done\n- old\n");

  const DELIVERED_GONE = `${home}/skills/foo/references/gone.md`;
  const MANIFEST = `${home}/.claude-sync-manifest.json`;
  const GHOST = `${home}/skills/ghost/SKILL.md`;

  const sync = () => spawnSync(process.execPath, [copyPath, "--env", "wsl", "--root", kit], { encoding: "utf8" });
  const tracked = () => Object.keys(JSON.parse(readFileSync(MANIFEST, "utf8")).files);
  const warns = (run, path) => (run.stdout ?? "").includes(path);

  // --- 1. baseline delivery --------------------------------------------------------------------------
  const run1 = sync();
  check("run 1 passes the reference hold", run1.status === 0 && !/REFUSED/.test(run1.stderr ?? ""));
  check("run 1 delivers and tracks the file", existsSync(MANIFEST) && tracked().includes(DELIVERED_GONE) && existsSync(DELIVERED_GONE));
  check("run 1 warns about nothing", !warns(run1, "no longer have a Claude Field Kit source"));
  check("a binary deliverable arrives byte-exact",
    readFileSync(`${home}/skills/foo/assets/blob.bin`).equals(BLOB));
  // Valid UTF-8 hashes the same as bytes or as a string, so moving to bytes must not re-hash a text file —
  // a changed hash would read as drift on every machine's next sync.
  check("a text deliverable's manifest hash is the sha256 of its bytes",
    JSON.parse(readFileSync(MANIFEST, "utf8")).files[`${home}/skills/foo/SKILL.md`] ===
      createHash("sha256").update(readFileSync(`${kit}/global/shared/skills/foo/SKILL.md`)).digest("hex"));

  // --- 2. the kit source goes away; the delivered copy stays on disk -----------------------------------
  unlinkSync(SOURCE_GONE);

  const run2 = sync();
  check("run 2 warns that the source is gone", warns(run2, DELIVERED_GONE));
  check("run 2 KEEPS the entry — the file still exists on disk", tracked().includes(DELIVERED_GONE));

  // --- 3. the warning survives into the next run -----------------------------------------------------
  const run3 = sync();
  check("run 3 warns AGAIN", warns(run3, DELIVERED_GONE));
  check("run 3 still tracks the orphan", tracked().includes(DELIVERED_GONE));

  // --- 4. an entry whose file is NOT on disk drops, so carry-forward cannot pin entries forever --------
  const withGhost = JSON.parse(readFileSync(MANIFEST, "utf8"));
  withGhost.files[GHOST] = "0".repeat(64);
  writeFileSync(MANIFEST, JSON.stringify(withGhost, null, 2) + "\n", "utf8");

  sync();
  check("an entry with no file on disk is dropped", !tracked().includes(GHOST));
  const run5 = sync();
  check("and is not warned about again", !warns(run5, GHOST));

  // --- 5. the drift log names the file it actually wrote ---------------------------------------------
  writeFileSync(`${home}/.claude-sync-dirty`, "", "utf8");
  writeFileSync(`${home}/skills/foo/SKILL.md`, "# foo, edited out of band\n", "utf8");

  const run6 = sync();
  const staged = `${kit}/incoming/skills/wsl__foo__SKILL.md`;
  check("drift routed to the env+path-prefixed name", existsSync(staged));
  check("drift LOG names the file it wrote", (run6.stdout ?? "").includes("incoming/skills/wsl__foo__SKILL.md"));
  check("drift log does not name a file it did not write",
    !/incoming\/skills\/SKILL\.md/.test(run6.stdout ?? ""));
  check("a byte-exact binary is not routed as drift", !existsSync(`${kit}/incoming/skills/wsl__foo__assets__blob.bin`));

  // --- 6. a dead rule-to-rule pointer refuses the sync before anything is written ---------------------
  writeFileSync(RULE_A, "# A\n\nSee `b.md` → Gone.\n", "utf8");
  const manifestBefore = readFileSync(MANIFEST);
  const run7 = sync();
  check("a dead rule pointer refuses the sync", run7.status === 1 && /REFUSED/.test(run7.stderr ?? ""));
  check("a refused sync writes nothing", readFileSync(MANIFEST).equals(manifestBefore) &&
    readFileSync(`${home}/rules/a.md`, "utf8").includes("→ Real"));
  writeFileSync(RULE_A, "# A\n\nSee `b.md` → Real.\n", "utf8");
  check("the fixed pointer passes again", sync().status === 0);
} finally {
  rmSync(SB, { recursive: true, force: true });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
