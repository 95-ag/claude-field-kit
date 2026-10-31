// asset-capture harness — builds a scratch kit and project, feeds the hook Write payloads, and checks what it
// stages into incoming/ and queues in tasks.md; then exercises the read-only --verify mode.
//
//   node tests/asset-capture/run.mjs
import { spawnSync } from "child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, utimesSync, symlinkSync } from "fs";
import { tmpdir } from "os";
import { dirname as dn, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dn(fileURLToPath(import.meta.url)), "../..");
const HOOK = join(ROOT, "global/shared/hooks/asset-capture.mjs");
const SB = mkdtempSync(join(tmpdir(), "asset-capture-"));
const kit = `${SB}/kit`;
const proj = `${SB}/proj`;
const KT = `${kit}/.claude/work/tasks.md`;

// kit tasks.md with the cluster structure present
const WITH = "# Tasks\n\n## Backlog\n\n### General\n- [ ] gen\n\n### Harvest\n> notes land here\n- [ ] existing harvest\n\n### Notes\n- [ ] old note\n\n### Tools\n- [ ] tool\n";
const seed = (c) => writeFileSync(KT, c);
const read = () => readFileSync(KT, "utf8");
const run = (filePath, incoming = `${kit}/incoming`) => spawnSync("node", [HOOK], {
  input: JSON.stringify({ tool_name: "Write", tool_input: { file_path: filePath } }),
  env: { ...process.env, CLAUDE_FIELD_KIT_INCOMING: incoming },
  encoding: "utf8",
});
const count = (s, re) => (s.match(re) || []).length;
const seg = (s, from, to) => s.slice(s.indexOf(from), to ? s.indexOf(to) : undefined);

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); };

try {
  mkdirSync(`${kit}/incoming/notes`, { recursive: true });
  mkdirSync(`${kit}/.claude/work`, { recursive: true });
  mkdirSync(`${proj}/.claude/rules`, { recursive: true });
  mkdirSync(`${proj}/.claude/skills/myskill/references`, { recursive: true });
  mkdirSync(`${proj}/.claude/work`, { recursive: true });
  writeFileSync(`${proj}/.claude/rules/foo.md`, "# Foo\n");
  writeFileSync(`${proj}/.claude/skills/myskill/SKILL.md`, "# Skill\n");
  writeFileSync(`${proj}/.claude/skills/myskill/references/a.md`, "a\n");
  writeFileSync(`${proj}/.claude/skills/myskill/references/b.md`, "b\n");
  const projOrig = "# Tasks\n\n## Backlog\n- [ ] proj item\n";
  writeFileSync(`${proj}/.claude/work/tasks.md`, projOrig);

  // 1. rule edit → one grouped entry under ### Harvest (not Tools/General); project tasks untouched
  seed(WITH);
  run(`${proj}/.claude/rules/foo.md`);
  check("rule staged to kit incoming/", existsSync(`${kit}/incoming/rules/proj__foo.md`));
  check("rule entry grouped format + marker", read().includes("**proj · rules/foo.md**") && read().includes("t3:proj:rules/foo.md"));
  check("rule entry under ### Harvest", seg(read(), "### Harvest", "### Tools").includes("**proj · rules/foo.md**"));
  check("originating project tasks.md UNCHANGED", readFileSync(`${proj}/.claude/work/tasks.md`, "utf8") === projOrig);

  // 2. skill multi-file edits → ONE grouped entry per skill (asset-level dedup)
  seed(WITH);
  run(`${proj}/.claude/skills/myskill/SKILL.md`);
  run(`${proj}/.claude/skills/myskill/references/a.md`);
  run(`${proj}/.claude/skills/myskill/references/b.md`);
  check("skill grouped → single entry", count(read(), /\*\*proj · skills\/myskill\*\*/g) === 1);
  check("skill asset-level marker", read().includes("t3:proj:skills/myskill"));
  check("skill staged whole-dir", existsSync(`${kit}/incoming/skills/proj__myskill/SKILL.md`));

  // 3. rule dedup on re-run
  seed(WITH);
  run(`${proj}/.claude/rules/foo.md`);
  run(`${proj}/.claude/rules/foo.md`);
  check("rule dedup — single entry", count(read(), /\*\*proj · rules\/foo.md\*\*/g) === 1);

  // 4. ### Harvest absent → created under ## Backlog
  seed("# Tasks\n\n## Backlog\n- [ ] x\n");
  run(`${proj}/.claude/rules/foo.md`);
  check("### Harvest created when absent", read().includes("### Harvest") && read().includes("**proj · rules/foo.md**"));

  // 5. note under incoming/notes/ → ### Notes task (not staged as asset)
  seed(WITH);
  writeFileSync(`${kit}/incoming/notes/myidea.md`, "# idea\n");
  run(`${kit}/incoming/notes/myidea.md`);
  check("note → task present + marker", read().includes("**Note · myidea.md**") && read().includes("t3-note:myidea.md"));
  check("note under ### Notes", seg(read(), "### Notes", "### Tools").includes("**Note · myidea.md**"));
  check("note not under ### General", !seg(read(), "### General", "### Harvest").includes("**Note · myidea.md**"));
  check("note line names notes-triage", read().includes("**Note · myidea.md** — resolve with notes-triage."));
  check("note not staged as asset", !existsSync(`${kit}/incoming/rules/proj__myidea.md`));

  // 6. note dedup + .gitkeep ignored
  run(`${kit}/incoming/notes/myidea.md`);
  check("note dedup — single entry", count(read(), /\*\*Note · myidea.md\*\*/g) === 1);
  writeFileSync(`${kit}/incoming/notes/.gitkeep`, "");
  const before6 = read();
  run(`${kit}/incoming/notes/.gitkeep`);
  check(".gitkeep under notes/ ignored", read() === before6);

  // 6b. no ### Notes heading → created under ## Backlog
  seed("# Tasks\n\n## Backlog\n\n### General\n- [ ] gen\n");
  writeFileSync(`${kit}/incoming/notes/second.md`, "# second\n");
  run(`${kit}/incoming/notes/second.md`);
  check("### Notes created when absent", seg(read(), "### Notes").includes("**Note · second.md**"));

  // 7. self-capture (kit edits its OWN .claude/) → nothing
  seed(WITH);
  const before7 = read();
  run(`${kit}/.claude/rules/bar.md`);
  check("self-capture — tasks unchanged", read() === before7);

  // 8. kit not available → no-op, no orphan dirs
  const r8 = run(`${proj}/.claude/rules/foo.md`, `${SB}/no-such-kit/incoming`);
  check("kit-not-available — exit 0", r8.status === 0);
  check("kit-not-available — no orphan dirs", !existsSync(`${SB}/no-such-kit`));

  // 9. a universal rule and a same-named TIERED rule must not collide (basename flattening)
  seed(WITH);
  mkdirSync(`${proj}/.claude/rules/node`, { recursive: true });
  writeFileSync(`${proj}/.claude/rules/build-verification.md`, "universal\n");
  writeFileSync(`${proj}/.claude/rules/node/build-verification.md`, "tiered\n");
  run(`${proj}/.claude/rules/build-verification.md`);
  run(`${proj}/.claude/rules/node/build-verification.md`);
  check("universal rule staged", existsSync(`${kit}/incoming/rules/proj__build-verification.md`));
  check("tiered rule staged under its own name", existsSync(`${kit}/incoming/rules/proj__node__build-verification.md`));
  check("universal staged copy not overwritten by the tiered one",
    existsSync(`${kit}/incoming/rules/proj__build-verification.md`) &&
    readFileSync(`${kit}/incoming/rules/proj__build-verification.md`, "utf8") === "universal\n");
  check("two distinct markers", read().includes("t3:proj:rules/build-verification.md") &&
    read().includes("t3:proj:rules/node/build-verification.md"));
  check("two Harvest entries", count(read(), /\*\*proj · rules\/(node\/)?build-verification\.md\*\*/g) === 2);

  // ---- W: dedup counts open rows only ----
  // W1 a checked multi-line Harvest row, then the asset is edited again → a new open row
  seed("# Tasks\n\n## Backlog\n\n### Harvest\n- [x] **proj · rules/foo.md** — HARVESTED 2026-10-01.\n      Long disposition. <!-- t3:proj:rules/foo.md -->\n\n### Notes\n");
  run(`${proj}/.claude/rules/foo.md`);
  check("W1 re-capture after harvest → new open row", /^- \[ \] \*\*proj · rules\/foo\.md\*\*/m.test(read()));
  // W2 a checked note row, then the note is re-staged → a new open row
  seed("# Tasks\n\n## Backlog\n\n### Notes\n- [x] **Note · again.md** — RESOLVED <!-- t3-note:again.md -->\n");
  writeFileSync(`${kit}/incoming/notes/again.md`, "# again\n");
  run(`${kit}/incoming/notes/again.md`);
  check("W2 re-staged note after close → new open row", /^- \[ \] \*\*Note · again\.md\*\*/m.test(read()));
  // W3 an open row whose marker sits on a continuation line → still deduped
  seed("# Tasks\n\n## Backlog\n\n### Harvest\n- [ ] **proj · rules/foo.md** — staged, with notes\n      continued. <!-- t3:proj:rules/foo.md -->\n");
  run(`${proj}/.claude/rules/foo.md`);
  check("W3 open multi-line row → no duplicate", count(read(), /\*\*proj · rules\/foo\.md\*\*/g) === 1);

  // W4 a [~] row is open → still deduped
  seed("# Tasks\n\n## Backlog\n\n### Harvest\n- [~] **proj · rules/foo.md** — half done <!-- t3:proj:rules/foo.md -->\n");
  run(`${proj}/.claude/rules/foo.md`);
  check("W4 [~] row counts as open → no duplicate", count(read(), /\*\*proj · rules\/foo\.md\*\*/g) === 1);

  // ---- X: a multi-line blockquote under the heading is skipped whole ----
  seed("# Tasks\n\n## Backlog\n\n### Harvest\n> line one\n>\n> line three\n- [ ] **old · rules/a.md** — x <!-- t3:old:rules/a.md -->\n");
  run(`${proj}/.claude/rules/foo.md`);
  { const L = read().split("\n"); const i = L.findIndex((l) => l.includes("**proj · rules/foo.md**")); const q = L.indexOf("> line one");
    check("X1 row lands after the whole blockquote", i > 0 && L[i - 1] === "> line three");
    check("X1 blockquote stays contiguous", q > 0 && L.slice(q, q + 3).every((l) => l.startsWith(">"))); }

  // ---- --verify (read-only CLI mode) ----
  const verify = (dir, extra = [], cwd) => spawnSync("node", [HOOK, "--verify", dir, ...extra], {
    env: { ...process.env, CLAUDE_FIELD_KIT_INCOMING: `${kit}/incoming` }, encoding: "utf8", cwd,
  });
  const mk = (proj, rel, body = `${rel}\n`) => {
    const abs = `${SB}/${proj}/.claude/${rel}`;
    mkdirSync(dn(abs), { recursive: true }); writeFileSync(abs, body); return abs;
  };
  seed(WITH);
  // V1 staged identical
  { const a = mk("v1", "rules/foo.md"); run(a); const r = verify(`${SB}/v1`);
    check("V1 STAGED line", /STAGED\s+\.claude\/rules\/foo\.md/.test(r.stdout)); check("V1 exit 0", r.status === 0); }
  // V2 staged then changed
  { const a = mk("v2", "rules/foo.md"); run(a); writeFileSync(a, "changed\n"); const r = verify(`${SB}/v2`);
    check("V2 STALE line", /STALE\s+\.claude\/rules\/foo\.md/.test(r.stdout)); check("V2 exit 1", r.status === 1); }
  // V3 never staged
  { mk("v3", "rules/foo.md"); const r = verify(`${SB}/v3`);
    check("V3 MISSING line", /MISSING\s+\.claude\/rules\/foo\.md/.test(r.stdout)); check("V3 exit 1", r.status === 1); }
  // V4 tiered rule → flattened staged name
  { const a = mk("v4", "rules/node/git.md"); run(a); const r = verify(`${SB}/v4`);
    check("V4 tiered STAGED under flattened name", /STAGED\s+\.claude\/rules\/node\/git\.md → incoming\/rules\/v4__node__git\.md/.test(r.stdout)); }
  // V5 skill → whole-dir staged path
  { const a = mk("v5", "skills/s/SKILL.md"); mk("v5", "skills/s/references/a.md"); run(a); const r = verify(`${SB}/v5`);
    check("V5 skill ref file STAGED at whole-dir path", /STAGED\s+\.claude\/skills\/s\/references\/a\.md → incoming\/skills\/v5__s\/references\/a\.md/.test(r.stdout)); }
  // V6 window
  { const a = mk("v6", "rules/old.md"); const t = (Date.now() - 3 * 3600e3) / 1000; utimesSync(a, t, t);
    check("V6 old file outside default window", !verify(`${SB}/v6`).stdout.includes("old.md"));
    check("V6 --since 240 includes it", verify(`${SB}/v6`, ["--since", "240"]).stdout.includes("old.md")); }
  // V7 queued / not queued
  { const a = mk("v7", "rules/foo.md"); run(a);
    check("V7 queued", /\[queued\]/.test(verify(`${SB}/v7`).stdout));
    seed(WITH); check("V7 not queued", /\[not queued\]/.test(verify(`${SB}/v7`).stdout)); }
  // V8 kit's own .claude
  { const r = verify(kit); check("V8 kit exit 0", r.status === 0); check("V8 says never captured", /never captured/.test(r.stdout)); }
  // V9 relative path with trailing slash
  { const r = verify("v1/", [], SB); check("V9 relative path resolves", /STAGED\s+\.claude\/rules\/foo\.md/.test(r.stdout) && r.status === 0); }

  // V10 no such project dir → usage error
  check("V10 missing dir → exit 2", verify(`${SB}/nope`).status === 2);
  // V11 --since not a positive number → usage error
  check("V11 --since -5 → exit 2", verify(`${SB}/v1`, ["--since", "-5"]).status === 2);
  check("V11 --since abc → exit 2", verify(`${SB}/v1`, ["--since", "abc"]).status === 2);
  // V12 broken link and dir link are skipped, not crashed on
  { const a = mk("v12", "rules/real.md"); run(a);
    symlinkSync(`${SB}/v12/.claude/rules/gone.md`, `${SB}/v12/.claude/rules/broken.md`);
    symlinkSync(`${SB}/v1/.claude/rules`, `${SB}/v12/.claude/rules/dirlink`);
    const r = verify(`${SB}/v12`);
    check("V12 broken link SKIPPED", /SKIPPED\s+\.claude\/rules\/broken\.md \(unreadable\)/.test(r.stdout));
    check("V12 dir link SKIPPED", /SKIPPED\s+\.claude\/rules\/dirlink \(symlink\)/.test(r.stdout));
    check("V12 no crash, exit 0", r.status === 0 && !/Error/.test(r.stderr)); }
  // V13 no project dir given
  check("V13 bare --verify --since 30 → exit 2", spawnSync("node", [HOOK, "--verify", "--since", "30"], {
    env: { ...process.env, CLAUDE_FIELD_KIT_INCOMING: `${kit}/incoming` }, encoding: "utf8" }).status === 2);
} finally {
  rmSync(SB, { recursive: true, force: true });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
