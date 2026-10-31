import { chmodSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, renameSync, rmSync, symlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, dirname, basename, relative, sep } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import { makeFamily, makeKit, makeProject, validRecord, tool, cleanup } from "./sandbox.mjs";

const TOOLS = join(dirname(fileURLToPath(import.meta.url)), "../../global/tools/project-sync");
const TODAY = /^\d{4}-\d{2}-\d{2}$/;

let failed = 0;
function check(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) {
    failed++;
    if (detail) console.log(`      ${detail}`);
  }
}

function out(r) {
  return `status=${r.status} stdout=${JSON.stringify(r.stdout)} stderr=${JSON.stringify(r.stderr)}`;
}

function catalogOf(kit) {
  const r = tool(kit.dir, ["--catalog"]);
  return r.status === 0 ? JSON.parse(r.stdout) : { entries: [], tiers: {}, error: out(r) };
}

try {
  const shared = makeKit();
  const cat = catalogOf(shared);
  const entry = (kitPath) => cat.entries.find((e) => e.kit === kitPath);

  const rule = entry("shared/rules/a.md");
  check("catalog: shared rule maps flat", rule?.target === ".claude/rules/a.md" && rule.type === "rules" && rule.bucket === "shared", cat.error);
  check("catalog: rule purpose is the first paragraph on one line", rule?.purpose === "Keep things small.", JSON.stringify(rule?.purpose));

  const stackRule = entry("stacks/node/rules/b.md");
  check("catalog: stack rule maps to bucket subdir", stackRule?.target === ".claude/rules/node/b.md" && stackRule.bucket === "stacks/node", JSON.stringify(stackRule));

  const skill = entry("domains/web/skills/s1");
  check(
    "catalog: skill is one entry with its files",
    skill?.target === ".claude/skills/s1" && skill.files.length === 2 && skill.purpose === "Does the s1 thing on two lines.",
    JSON.stringify(skill),
  );

  const hook = entry("shared/hooks/fmt.mjs");
  check("catalog: hook maps to hooks dir with its comment as purpose", hook?.target === ".claude/hooks/fmt.mjs" && hook.purpose === "fmt — formats edited files.", JSON.stringify(hook));

  check(
    "catalog: template and hooks.json excluded",
    cat.entries.length > 0 && !cat.entries.some((e) => e.files.some((f) => f.endsWith("CLAUDE.template.md") || f.endsWith("hooks.json"))),
  );
  check("catalog: tiers list every bucket dir", JSON.stringify(cat.tiers) === JSON.stringify({ domains: ["web"], stacks: ["node"], repos: [] }), JSON.stringify(cat.tiers));

  const printed = tool(shared.dir, ["--catalog"]);
  check("--catalog prints JSON", printed.status === 0 && JSON.parse(printed.stdout).entries.length === 4, out(printed));

  const kitMod = await import(join(TOOLS, "kit.mjs"));
  check("targetFor: excluded paths are null", ["shared/CLAUDE.template.md", "shared/hooks.json", "shared/docs/README.md", "shared/work/tasks.template.md", "domains/web/plugins/README.md", "shared/BOOTSTRAP.md"].every((p) => kitMod.targetFor(p) === null));
  const bytes = Buffer.from("héllo\n");
  const hashed = execFileSync("git", ["hash-object", "--stdin"], { input: bytes, encoding: "utf8" }).trim();
  check("blobOf matches git hash-object", kitMod.blobOf(bytes) === hashed);

  {
    const kit = makeKit();
    const first = kit.git("rev-parse", "HEAD").trim();
    const oldBlob = kitMod.blobAt(kit.dir, first, "shared/rules/a.md");
    kit.write("project/shared/rules/a.md", "# Rule A\n\nrevised\n");
    kit.git("mv", "project/stacks/node/rules/b.md", "project/stacks/node/rules/c.md");
    kit.commit("revise a, rename b");
    const newBlob = kitMod.blobAt(kit.dir, "HEAD", "shared/rules/a.md");
    check("blobAt/readBlob: a path at a commit reads back its bytes", oldBlob !== newBlob && kitMod.readBlob(kit.dir, oldBlob).toString().includes("Keep things"));
    check("blobAt: absent path is null", kitMod.blobAt(kit.dir, "HEAD", "shared/rules/nope.md") === null);
    check("pathHistoryBlobs: holds a path's superseded and current versions", kitMod.pathHistoryBlobs(kit.dir, "shared/rules/a.md").has(oldBlob) && kitMod.pathHistoryBlobs(kit.dir, "shared/rules/a.md").has(newBlob));
    const paths = kitMod.everPaths(kit.dir);
    check("everPaths: keeps renamed-away paths and derives skill dirs", paths.has("stacks/node/rules/b.md") && paths.has("stacks/node/rules/c.md") && paths.has("domains/web/skills/s1"));
    const renames = kitMod.renamesSince(kit.dir, first);
    check("renamesSince: follows a rename", renames.get("stacks/node/rules/b.md") === "stacks/node/rules/c.md" && renames.size === 1, JSON.stringify([...renames]));
  }

  {
    const kit = makeKit();
    const project = makeProject("p", validRecord());
    kit.write("project/shared/rules/a.md", "# Rule A\n\nchanged\n");
    const r = tool(kit.dir, [project]);
    check("refuse: dirty project/", r.status === 1 && r.stdout.includes("REFUSED") && r.stdout.includes("uncommitted"), out(r));
  }

  {
    const kit = makeKit();
    kit.git("checkout", "-q", "-b", "other");
    const r = tool(kit.dir, [makeProject("p", validRecord())]);
    check("refuse: not on main", r.status === 1 && r.stdout.includes("main"), out(r));
  }

  {
    const kit = makeKit();
    kit.write("project/domains/web/skills/s1/SKILL.md", "---\nname: s1\ndescription: x\n---\n\n# S1\n\nSee `r.md` → Nowhere.\n");
    kit.commit("dead pointer");
    const project = makeProject("p", validRecord({ tiers: { domains: ["web"], stacks: [], repo: null } }));
    const dry = tool(kit.dir, [project]);
    check("hold: a dead skill pointer refuses the dry run", dry.status === 1 && dry.stdout.includes("REFUSED") && dry.stdout.includes("DEAD"), out(dry));

    const recordBefore = readFileSync(join(project, ".claude/kit-delivery.json"), "utf8");
    const applied = tool(kit.dir, ["--apply", project]);
    check(
      "hold: --apply writes nothing",
      applied.status === 1 && applied.stdout.includes("REFUSED") && !existsSync(join(project, ".claude/rules")) && !existsSync(join(project, ".claude/skills"))
        && readFileSync(join(project, ".claude/kit-delivery.json"), "utf8") === recordBefore && !existsSync(join(kit.dir, "tmp/project-sync-backup")),
      out(applied),
    );

    const stat = tool(kit.dir, ["--status", project]);
    check("hold: --status still runs", stat.status === 0 && !stat.stdout.includes("REFUSED"), out(stat));
  }

  {
    const kit = makeKit();
    kit.write("project/domains/web/skills/s1/references/r.md", "# Ref\n\n## Colour Token Rules Overview\n");
    kit.write("project/domains/web/skills/s1/SKILL.md", "---\nname: s1\ndescription: x\n---\n\n# S1\n\nSee `r.md` → Colour Token Rules Summary.\n");
    kit.commit("near pointer");
    const r = tool(kit.dir, [makeProject("p", validRecord())]);
    check("hold: a near-match only warns", r.status === 0 && r.stdout.includes("warn:") && !r.stdout.includes("REFUSED"), out(r));
  }

  {
    const kit = makeKit();
    kit.git("rm", "-q", "-r", "project/domains/web/skills");
    kit.commit("no skills");
    const r = tool(kit.dir, [makeProject("p", validRecord())]);
    check("hold: a kit with no skills folder runs", r.status === 0 && !r.stdout.includes("REFUSED"), out(r));
  }

  {
    const kit = makeKit();
    kit.write("project/stacks/py/skills/s2/SKILL.md", "---\nname: s2\ndescription: x\n---\n\n# S2\n\nSee `s2-ref.md` → Gone.\n");
    kit.write("project/stacks/py/skills/s2/references/s2-ref.md", "# Ref\n");
    kit.commit("new stack skill");
    const r = tool(kit.dir, [makeProject("p", validRecord())]);
    check("hold: a new stacks/<name>/skills root is checked", r.status === 1 && r.stdout.includes("REFUSED") && r.stdout.includes("Gone"), out(r));
  }

  {
    const r = tool(shared.dir, [makeProject("p")]);
    check("refuse: missing record", r.status === 1 && r.stdout.includes("project-bootstrap adopt"), out(r));
  }

  {
    const project = makeProject("p", "{ not json");
    const path = join(project, ".claude", "kit-delivery.json");
    const before = readFileSync(path);
    const r = tool(shared.dir, [project]);
    check("refuse: invalid JSON record", r.status === 1 && r.stdout.includes(path) && readFileSync(path).equals(before), out(r));
  }

  {
    const r = tool(shared.dir, [makeProject("p", validRecord({ tiers: { domains: [], stacks: ["rust"], repo: null } }))]);
    check("refuse: unknown tier", r.status === 1 && r.stdout.includes("rust"), out(r));
    const repo = tool(shared.dir, [makeProject("p", validRecord({ tiers: { domains: [], stacks: [], repo: "nowhere" } }))]);
    check("refuse: unknown repo bucket", repo.status === 1 && repo.stdout.includes("nowhere"), out(repo));
  }

  {
    const r = tool(shared.dir, [makeProject("p", validRecord({ skip: ["stacks/node/rules/typo.md"] }))]);
    check("refuse: skip path the kit never had", r.status === 1 && r.stdout.includes("typo.md"), out(r));
  }

  {
    const kit = makeKit();
    kit.write("project/shared/rules/old.md", "# Old\n\nGone soon.\n");
    kit.commit("add old");
    kit.git("rm", "-q", "project/shared/rules/old.md");
    kit.commit("retire old");
    const r = tool(kit.dir, [makeProject("p", validRecord({ skip: ["shared/rules/old.md"] }))]);
    check("warn: skip path since retired", r.status === 0 && /old\.md/.test(r.stdout) && /retired/.test(r.stdout) && !r.stdout.includes("REFUSED"), out(r));
  }

  {
    const kit = makeKit();
    mkdirSync(join(kit.dir, ".claude"));
    writeFileSync(join(kit.dir, ".claude", "kit-delivery.json"), JSON.stringify(validRecord()));
    const r = tool(kit.dir, [kit.dir]);
    check("refuse: target is the kit", r.status === 1 && r.stdout.includes("the kit itself"), out(r));
  }

  {
    const kit = makeKit();
    kit.write("project/stacks/node/skills/s1/SKILL.md", "---\nname: s1\ndescription: duplicate name\n---\n");
    kit.commit("colliding skill");
    const rec = validRecord({ tiers: { domains: ["web"], stacks: ["node"], repo: null } });
    const r = tool(kit.dir, [makeProject("p", rec)]);
    check(
      "refuse: two buckets, one target",
      r.status === 1 && r.stdout.includes("domains/web/skills/s1") && r.stdout.includes("stacks/node/skills/s1"),
      out(r),
    );
    const skipped = tool(kit.dir, [makeProject("p", { ...rec, skip: ["stacks/node/skills/s1"] })]);
    check("collision resolved by skipping one side", skipped.status === 0, out(skipped));
  }

  {
    const good = makeProject("good", validRecord());
    const missing = join(tmpdir(), "project-sync-no-such-project");
    const r = tool(shared.dir, [missing, good, makeProject("bad")]);
    check(
      "refuse: nonexistent project path, later projects still processed",
      r.status === 1 && r.stdout.includes(`REFUSED: ${missing} does not exist`) && r.stdout.includes("project-bootstrap adopt") && !r.stderr.includes("ENOENT"),
      out(r),
    );
    const notGit = tool(makeProject("not-a-kit"), [good]);
    check("refuse: --kit that is not a git checkout", notGit.status === 1 && notGit.stdout.includes("REFUSED") && notGit.stdout.includes("not the root of a git checkout") && notGit.stderr === "", out(notGit));
  }

  {
    const kit = makeKit();
    kit.write("project/shared/rules/x.template.md", "# Tmpl\n\nnot delivered\n");
    kit.write("project/shared/rules/.DS_Store", "junk");
    kit.write("project/shared/rules/real.md", "# Real\n\nkept\n");
    kit.commit("template and dotfile under rules");
    const names = catalogOf(kit).entries.map((e) => e.kit);
    check("catalog: .template.md and dotfiles under a type dir produce no entry", names.includes("shared/rules/real.md") && !names.some((n) => n.includes("template") || n.includes(".DS_Store")), JSON.stringify(names));
  }

  {
    const dirty = makeKit();
    dirty.write("project/shared/rules/a.md", "# Rule A\n\nuncommitted\n");
    const branched = makeKit();
    branched.git("checkout", "-q", "-b", "other");
    check("--catalog runs on a dirty kit", tool(dirty.dir, ["--catalog"]).status === 0);
    check("--catalog runs on a non-main kit", tool(branched.dir, ["--catalog"]).status === 0);
    const plain = makeFamily();
    mkdirSync(join(plain, "project", "shared", "rules"), { recursive: true });
    writeFileSync(join(plain, "project", "shared", "rules", "a.md"), "# A\n");
    const noGit = tool(plain, ["--catalog"]);
    check("--catalog on a folder that is not a git checkout is REFUSED, not a crash", noGit.status === 1 && /^REFUSED: .+not a git checkout/m.test(noGit.stdout) && noGit.stderr === "", out(noGit));
    const flag = tool(shared.dir, ["--frobnicate", makeProject("p", validRecord())]);
    check("usage: unknown flag exits 2", flag.status === 2, out(flag));
  }

  {
    const project = makeProject("p", validRecord({ tiers: { domains: ["web"], stacks: ["node"], repo: null } }));
    const r = tool(shared.dir, [project]);
    check("valid record: exit 0 and no refusal", r.status === 0 && !r.stdout.includes("REFUSED"), out(r));
    const none = tool(shared.dir, []);
    check("usage: no project and no --catalog exits 2", none.status === 2, out(none));
  }

  {
    const recordMod = await import(join(TOOLS, "record.mjs"));
    const project = makeProject("p");
    const rec = validRecord({ skip: ["shared/rules/a.md"], delivered: { commit: "abc", date: "2026-10-30" }, files: { "shared/rules/a.md": "deadbeef" } });
    recordMod.writeRecord(project, rec);
    check("record: write then read round-trips", JSON.stringify(recordMod.readRecord(project)) === JSON.stringify(rec));
  }

  {
    const planMod = await import(join(TOOLS, "plan.mjs"));
    const planProject = planMod.planProject;
    const TIERS = { domains: ["web"], stacks: ["node"], repo: null };
    const BLOB_A = "shared/rules/a.md";
    const BLOB_B = "stacks/node/rules/b.md";
    const SKILL = "domains/web/skills/s1";

    function deliverAll(kit, name = "p") {
      const project = makeProject(name, validRecord({ tiers: TIERS }));
      const files = {};
      for (const e of catalogOf(kit).entries) {
        for (const f of e.files) {
          const dest = e.type === "skills" ? join(e.target, f.slice(e.kit.length + 1)) : e.target;
          mkdirSync(dirname(join(project, dest)), { recursive: true });
          const blob = kitMod.blobAt(kit.dir, "HEAD", f);
          writeFileSync(join(project, dest), kitMod.readBlob(kit.dir, blob));
          files[f] = blob;
        }
      }
      const rec = validRecord({ tiers: TIERS, files, delivered: { commit: kit.git("rev-parse", "HEAD").trim(), date: "2026-10-30" } });
      return { project, rec, abs: (rel) => join(project, rel) };
    }
    const kinds = (plan, kind) => plan.actions.filter((a) => a.kind === kind);
    const notesOf = (plan, kind) => plan.notes.filter((n) => n.kind === kind);
    const noWork = (plan) => plan.actions.length === 0 && plan.held.length === 0;
    const show = (plan) => JSON.stringify(plan);

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      const synced = planProject(kit.dir, d.project, d.rec);
      check("plan: delivered and in sync -> nothing at all", noWork(synced) && synced.notes.length === 0, show(synced));
      const bare = planProject(kit.dir, d.project, { ...d.rec, files: {}, delivered: null });
      check(
        "plan: equal to HEAD but unrecorded -> record only",
        bare.actions.length === 5 && bare.actions.every((a) => a.kind === "record" && a.target) && bare.notes.length === 0 && bare.actions.some((a) => a.kit === BLOB_A && a.target === ".claude/rules/a.md"),
        show(bare),
      );
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      kit.write("project/shared/rules/a.md", "# Rule A\n\nnew text\n");
      kit.commit("revise a");
      const plan = planProject(kit.dir, d.project, d.rec);
      check("plan: untouched copy of a changed file -> replace", plan.actions.length === 1 && plan.actions[0].kind === "replace" && plan.actions[0].kit === BLOB_A && plan.actions[0].target === ".claude/rules/a.md" && plan.notes.length === 0, show(plan));
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      rmSync(d.abs(".claude/rules/node/b.md"));
      delete d.rec.files[BLOB_B];
      const plan = planProject(kit.dir, d.project, d.rec);
      check("plan: missing and never delivered -> add", plan.actions.length === 1 && plan.actions[0].kind === "add" && plan.actions[0].kit === BLOB_B && plan.actions[0].target === ".claude/rules/node/b.md", show(plan));
      const skipped = planProject(kit.dir, d.project, { ...d.rec, skip: [BLOB_B] });
      check("plan: skipped and absent -> no action, no note", noWork(skipped) && skipped.notes.length === 0, show(skipped));
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      rmSync(d.abs(".claude/rules/node/b.md"));
      const plan = planProject(kit.dir, d.project, d.rec);
      const note = notesOf(plan, "removed-by-project")[0];
      check("plan: missing but recorded -> removed-by-project note, no add", noWork(plan) && plan.notes.length === 1 && note.kit === BLOB_B && note.target === ".claude/rules/node/b.md", show(plan));
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      kit.write("project/shared/rules/a.md", "# Rule A\n\nkit side\n\n## Detail\nmore\n");
      kit.commit("revise a");
      writeFileSync(d.abs(".claude/rules/a.md"), "# Rule A\n\nKeep things\nsmall.\n\n## Detail\nmore\n\nproject addition\n");
      const plan = planProject(kit.dir, d.project, d.rec);
      check(
        "plan: edited with a recorded base -> merge, base is the recorded blob",
        plan.actions.length === 1 && plan.actions[0].kind === "merge" && plan.actions[0].kit === BLOB_A && plan.actions[0].base === d.rec.files[BLOB_A] && plan.notes.length === 0,
        show(plan),
      );

      const unchangedKit = makeKit();
      const e = deliverAll(unchangedKit);
      writeFileSync(e.abs(".claude/rules/a.md"), "# Rule A\n\nproject only edit\n");
      const same = planProject(unchangedKit.dir, e.project, e.rec);
      check("plan: edited but the kit has not moved since delivery -> nothing owed", noWork(same) && same.notes.length === 0, show(same));
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      kit.write("project/shared/rules/a.md", "# Rule A\n\nkit side\n");
      kit.commit("revise a");
      writeFileSync(d.abs(".claude/rules/a.md"), "# Rule A\n\nedited in the project\n");
      const noBase = { ...d.rec, files: { ...d.rec.files } };
      delete noBase.files[BLOB_A];
      const plan = planProject(kit.dir, d.project, noBase);
      check("plan: edited, no recorded base -> edited-no-base note, no action", noWork(plan) && notesOf(plan, "edited-no-base").length === 1 && plan.notes[0].kit === BLOB_A, show(plan));
      const lostBase = planProject(kit.dir, d.project, { ...d.rec, files: { ...d.rec.files, [BLOB_A]: "1".repeat(40) } });
      check("plan: recorded base missing from the kit -> edited-no-base", noWork(lostBase) && notesOf(lostBase, "edited-no-base").length === 1, show(lostBase));
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      kit.git("rm", "-q", "project/stacks/node/rules/b.md");
      kit.commit("retire b");
      const plan = planProject(kit.dir, d.project, d.rec);
      check("plan: retired and untouched -> remove", plan.actions.length === 1 && plan.actions[0].kind === "remove" && plan.actions[0].kit === BLOB_B && plan.actions[0].target === ".claude/rules/node/b.md" && plan.notes.length === 0, show(plan));
      writeFileSync(d.abs(".claude/rules/node/b.md"), "# Rule B\n\nproject edits\n");
      const edited = planProject(kit.dir, d.project, d.rec);
      check("plan: retired and edited -> retired-edited note, file kept", noWork(edited) && notesOf(edited, "retired-edited").length === 1 && edited.notes[0].kit === BLOB_B, show(edited));
      const skipped = planProject(kit.dir, d.project, { ...d.rec, skip: [BLOB_B] });
      check("plan: retired but skipped -> left alone and reported as opted out", noWork(skipped) && notesOf(skipped, "opted-out-on-disk").length === 1, show(skipped));
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      kit.git("mv", "project/stacks/node/rules/b.md", "project/stacks/node/rules/c.md");
      kit.commit("rename b to c");
      const plan = planProject(kit.dir, d.project, d.rec);
      const replace = kinds(plan, "replace")[0];
      const remove = kinds(plan, "remove")[0];
      check(
        "plan: kit rename, untouched copy -> replace at the new path, remove at the old",
        plan.actions.length === 2 && replace?.kit === "stacks/node/rules/c.md" && replace.target === ".claude/rules/node/c.md" && remove?.kit === BLOB_B && remove.target === ".claude/rules/node/b.md" && plan.notes.length === 0,
        show(plan),
      );
      writeFileSync(d.abs(".claude/rules/node/b.md"), "# Rule B\n\nproject edits\n");
      const edited = planProject(kit.dir, d.project, d.rec);
      check(
        "plan: kit rename, edited copy -> renamed-edited note on the new kit path carrying the old path and its base, no action",
        noWork(edited) && edited.notes.length === 1 && notesOf(edited, "renamed-edited").length === 1 && edited.notes[0].kit === "stacks/node/rules/c.md" && edited.notes[0].target === ".claude/rules/node/c.md" && edited.notes[0].from === BLOB_B && edited.notes[0].fromTarget === ".claude/rules/node/b.md" && edited.notes[0].base === d.rec.files[BLOB_B],
        show(edited),
      );
      rmSync(d.abs(".claude/rules/node/b.md"));
      const gone = planProject(kit.dir, d.project, d.rec);
      check("plan: kit rename, copy removed by the project -> removed-by-project, nothing added", noWork(gone) && notesOf(gone, "removed-by-project").length === 1 && gone.notes[0].kit === BLOB_B, show(gone));
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      const before = readFileSync(d.abs(".claude/rules/node/b.md"));
      const dropped = planProject(kit.dir, d.project, { ...d.rec, skip: [BLOB_B] });
      check("plan: opted out later (skip), still on disk -> note, no action", noWork(dropped) && dropped.notes.length === 1 && dropped.notes[0].kind === "opted-out-on-disk" && dropped.notes[0].kit === BLOB_B && dropped.notes[0].target === ".claude/rules/node/b.md", show(dropped));
      const tier = planProject(kit.dir, d.project, { ...d.rec, tiers: { ...TIERS, stacks: [] } });
      check("plan: tier dropped, still on disk -> note, no action", noWork(tier) && notesOf(tier, "opted-out-on-disk").some((n) => n.kit === BLOB_B), show(tier));
      check("plan: opted-out file left untouched", readFileSync(d.abs(".claude/rules/node/b.md")).equals(before));
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      kit.write("project/domains/web/skills/s1/SKILL.md", "---\nname: s1\ndescription: changed\n---\n\n# S1 v2\n");
      kit.write("project/domains/web/skills/s1/references/r.md", "# Ref v2\n");
      kit.commit("revise s1");
      writeFileSync(d.abs(".claude/skills/s1/references/r.md"), "# Ref edited by the project\n");

      const held = planProject(kit.dir, d.project, d.rec);
      check(
        "plan: skill with an edited file, not staged -> held, zero actions for the skill",
        held.held.length === 1 && held.held[0].skill === SKILL && held.held[0].files.length === 1 && held.held[0].files[0] === `${SKILL}/references/r.md` && !held.actions.some((a) => a.kit.startsWith(SKILL)),
        show(held),
      );

      const staged = join(kit.dir, "incoming", "skills", `${basename(d.project)}__s1`, "references");
      mkdirSync(staged, { recursive: true });
      writeFileSync(join(staged, "r.md"), "# Ref edited by somebody else\n");
      const wrongBytes = planProject(kit.dir, d.project, d.rec);
      check("plan: staged copy with different bytes does not release the skill", wrongBytes.held.length === 1 && wrongBytes.actions.length === 0, show(wrongBytes));

      writeFileSync(join(staged, "r.md"), "# Ref edited by the project\n");
      const released = planProject(kit.dir, d.project, d.rec);
      check(
        "plan: skill edited and an identical copy staged -> every file replaced",
        released.held.length === 0 && released.actions.length === 2 && released.actions.every((a) => a.kind === "replace") && released.actions.some((a) => a.kit === `${SKILL}/references/r.md` && a.target === ".claude/skills/s1/references/r.md") && released.actions.some((a) => a.kit === `${SKILL}/SKILL.md`),
        show(released),
      );

      rmSync(join(staged, "r.md"));
      kit.write("project/domains/web/skills/s1/references/extra.md", "# Extra\n");
      kit.git("rm", "-q", "project/domains/web/skills/s1/references/r.md");
      kit.commit("retire r, add extra");
      const plain = planProject(kit.dir, d.project, d.rec);
      check("plan: skill with an edited file the kit retired, not staged -> held", plain.held.length === 1 && plain.held[0].files.includes(`${SKILL}/references/r.md`) && plain.actions.length === 0, show(plain));
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      kit.write("project/domains/web/skills/s1/references/r.md", "# Ref v2\n");
      kit.write("project/domains/web/skills/s1/references/new.md", "# New\n");
      kit.write("project/domains/web/skills/s1/SKILL.md", "---\nname: s1\ndescription: v2\n---\n");
      kit.commit("evolve s1");
      const plan = planProject(kit.dir, d.project, d.rec);
      check("plan: unedited skill -> per-file replace and add", plan.actions.filter((a) => a.kind === "replace").length === 2 && plan.actions.filter((a) => a.kind === "add").length === 1 && plan.held.length === 0, show(plan));
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      mkdirSync(d.abs(".claude/skills/s1/evals"), { recursive: true });
      writeFileSync(d.abs(".claude/skills/s1/evals/e.json"), "{}\n");
      writeFileSync(d.abs(".claude/rules/mine.md"), "# Mine\n");
      mkdirSync(d.abs(".claude/skills/own"), { recursive: true });
      writeFileSync(d.abs(".claude/skills/own/SKILL.md"), "---\nname: own\n---\n");
      const plan = planProject(kit.dir, d.project, d.rec);
      const only = notesOf(plan, "project-only");
      const targets = only.map((n) => n.target).sort();
      check(
        "plan: project-only files and dirs -> notes only",
        noWork(plan) && plan.notes.length === 3 && JSON.stringify(targets) === JSON.stringify([".claude/rules/mine.md", ".claude/skills/own", ".claude/skills/s1/evals/e.json"]),
        show(plan),
      );
      check("plan: project-only content untouched", readFileSync(d.abs(".claude/skills/s1/evals/e.json"), "utf8") === "{}\n");
    }

    {
      const kit = makeKit();
      kit.write("project/shared/agents/blob.bin", Buffer.from([0xff, 0xfe, 0x00, 0x01]));
      kit.commit("add a binary");
      const d = deliverAll(kit);
      kit.write("project/shared/agents/blob.bin", Buffer.from([0xff, 0x00, 0x02]));
      kit.commit("change the binary");
      const untouched = planProject(kit.dir, d.project, d.rec);
      check("plan: untouched binary -> replace as bytes", untouched.actions.length === 1 && untouched.actions[0].kind === "replace" && untouched.actions[0].kit === "shared/agents/blob.bin", show(untouched));
      writeFileSync(d.abs(".claude/agents/blob.bin"), Buffer.from([0xff, 0x00, 0x03]));
      const edited = planProject(kit.dir, d.project, d.rec);
      check("plan: edited binary -> binary-edited note, no action", noWork(edited) && notesOf(edited, "binary-edited").length === 1 && edited.notes[0].kit === "shared/agents/blob.bin", show(edited));
      const missing = planProject(kit.dir, d.project, { ...d.rec, files: {} });
      check("plan: unrecorded edited binary -> binary-edited, not edited-no-base", notesOf(missing, "binary-edited").length === 1 && notesOf(missing, "edited-no-base").length === 0, show(missing));
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      kit.write("project/shared/rules/a.md", "# Rule A\n\nnew text\n");
      kit.write("project/stacks/node/rules/b.md", "# Rule B\n\nnew text\n");
      kit.commit("revise a and b");
      const outside = join(dirname(d.project), "outside.md");
      writeFileSync(outside, "outside\n");
      rmSync(d.abs(".claude/rules/a.md"));
      symlinkSync(outside, d.abs(".claude/rules/a.md"));
      const elsewhere = join(dirname(d.project), "elsewhere");
      renameSync(d.abs(".claude/rules/node"), elsewhere);
      symlinkSync(elsewhere, d.abs(".claude/rules/node"));
      const plan = planProject(kit.dir, d.project, d.rec);
      const bTarget = ".claude/rules/node/b.md";
      check(
        "plan: symlinked file and symlinked directory -> symlink notes, no action",
        noWork(plan) && plan.notes.length === 2 && notesOf(plan, "symlink").length === 2 && notesOf(plan, "symlink").some((n) => n.kit === BLOB_A) && notesOf(plan, "symlink").some((n) => n.kit === BLOB_B && n.target === bTarget),
        show(plan),
      );
      check("plan: symlink targets never followed", readFileSync(outside, "utf8") === "outside\n" && readFileSync(join(elsewhere, "b.md"), "utf8") === "# Rule B\n\nNode specifics.\n");
    }

    {
      const kit = makeKit();
      const d = deliverAll(kit);
      kit.write("project/shared/rules/a.md", "# Rule A\n\nkit side\n");
      kit.write("project/stacks/node/rules/b.md", "# Rule B\n\nkit side\n");
      kit.write("project/domains/web/skills/s1/references/r.md", "# Ref v2\n");
      kit.commit("revise");
      writeFileSync(d.abs(".claude/rules/a.md"), "# Rule A\n\nedited\n");
      writeFileSync(d.abs(".claude/skills/s1/references/r.md"), "# edited\n");
      rmSync(d.abs(".claude/hooks/fmt.mjs"));
      writeFileSync(d.abs(".claude/rules/mine.md"), "# Mine\n");
      symlinkSync(join(dirname(d.project), "nowhere"), d.abs(".claude/rules/dangling.md"));

      const snapshot = () => {
        const seen = {};
        const walk = (rel) => {
          for (const name of readdirSync(join(d.project, rel)).sort()) {
            const path = join(rel, name);
            const stat = lstatSync(join(d.project, path));
            if (stat.isSymbolicLink()) seen[path] = `-> ${readlinkSync(join(d.project, path))}`;
            else if (stat.isDirectory()) walk(path);
            else seen[path] = readFileSync(join(d.project, path)).toString("base64");
          }
        };
        walk(".");
        return JSON.stringify(seen);
      };
      const before = snapshot();
      const run = tool(kit.dir, [d.project]);
      const direct = planProject(kit.dir, d.project, d.rec);
      check("dry run: default CLI run writes nothing", run.status === 0 && snapshot() === before && !existsSync(join(kit.dir, "tmp")), out(run));
      check("dry run: planProject writes nothing", snapshot() === before);
      check(
        "dry run: CLI prints every action and note kind, with none where empty",
        ["Replace", "Add", "Merge", "Remove", "Record", "Held skills", "edited-no-base", "removed-by-project", "retired-edited", "opted-out-on-disk", "binary-edited", "symlink", "project-only"].every((h) => run.stdout.includes(h)) && run.stdout.includes("none") && run.stdout.includes(BLOB_B) && direct.actions.length > 0,
        run.stdout,
      );
    }
    {
      const { randomBytes } = await import("crypto");
      const { writeRecord } = await import(join(TOOLS, "record.mjs"));
      const applyMod = await import(join(TOOLS, "apply.mjs"));
      const persist = (d) => writeRecord(d.project, d.rec);
      const readRec = (project) => JSON.parse(readFileSync(join(project, ".claude", "kit-delivery.json"), "utf8"));
      const headBlob = (kit, path) => kitMod.blobAt(kit.dir, "HEAD", path);
      const backupOf = (r) => (r.stdout.match(/^Backup path: (.+)$/m) ?? [])[1];
      const read = (d, rel) => readFileSync(d.abs(rel), "utf8");
      const RULE_A = "# Rule A\n\nKeep things\nsmall.\n\n## Detail\nmore\n";
      const readBlobText = (kit, path) => kitMod.readBlob(kit.dir, headBlob(kit, path)).toString("utf8");
      const workspace = (kit, d, rel) => join(kit.dir, "tmp", "project-sync-merge", basename(d.project), rel);
      const apply = (kit, d, extra = [], env = {}) => tool(kit.dir, ["--apply", d.project, ...extra], env);
      const backups = (kit) => (existsSync(join(kit.dir, "tmp", "project-sync-backup")) ? readdirSync(join(kit.dir, "tmp", "project-sync-backup")) : []);

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", `${RULE_A}\nkit addition\n`);
        kit.write("project/domains/web/skills/s1/SKILL.md", "---\nname: s1\ndescription: v2\n---\n");
        kit.write("project/shared/rules/new.md", "# New\n");
        kit.git("rm", "-q", "project/domains/web/skills/s1/references/r.md");
        kit.commit("evolve");
        const edited = RULE_A.replace("Keep things", "Keep everything");
        writeFileSync(d.abs(".claude/rules/a.md"), edited);
        persist(d);
        const originals = { a: edited, skill: read(d, ".claude/skills/s1/SKILL.md"), ref: read(d, ".claude/skills/s1/references/r.md"), rec: read(d, ".claude/kit-delivery.json") };
        const run = apply(kit, d);
        const backup = backupOf(run) ?? "";
        const inBackup = (rel) => (existsSync(join(backup, rel)) ? readFileSync(join(backup, rel), "utf8") : null);
        check("apply: a clean run exits 0", run.status === 0, out(run));
        check(
          "apply: backup holds every replaced/merged/removed file + record",
          backup.startsWith(join(kit.dir, "tmp", "project-sync-backup")) && basename(backup) === "p" && inBackup(".claude/rules/a.md") === originals.a && inBackup(".claude/skills/s1/SKILL.md") === originals.skill && inBackup(".claude/skills/s1/references/r.md") === originals.ref && inBackup(".claude/kit-delivery.json") === originals.rec && inBackup(".claude/rules/new.md") === null,
          backup,
        );
        check("apply: backup directory is a UTC timestamp", /^\d{8}T\d{6}Z/.test(basename(dirname(backup))), backup);
        check("apply: added.json lists added files", JSON.stringify(JSON.parse(readFileSync(join(backup, "added.json"), "utf8"))) === JSON.stringify([".claude/rules/new.md"]));
        check("apply: backup remembers its project", JSON.parse(readFileSync(join(backup, "project.json"), "utf8")).projectDir === d.project);
        check(
          "apply: replace, add and remove land; emptied directory is pruned",
          read(d, ".claude/skills/s1/SKILL.md").includes("description: v2") && read(d, ".claude/rules/new.md") === "# New\n" && !existsSync(d.abs(".claude/skills/s1/references")) && existsSync(d.abs(".claude/skills/s1")),
        );
        check(
          "apply: clean merge keeps project wording and kit addition",
          read(d, ".claude/rules/a.md") === edited + "\nkit addition\n",
          JSON.stringify(read(d, ".claude/rules/a.md")),
        );
        const rec = readRec(d.project);
        check(
          "apply: record entries -> HEAD blobs, removed key gone, delivered advanced",
          rec.files[BLOB_A] === headBlob(kit, BLOB_A) && rec.files["shared/rules/new.md"] === headBlob(kit, "shared/rules/new.md") && rec.files[`${SKILL}/SKILL.md`] === headBlob(kit, `${SKILL}/SKILL.md`) && !(`${SKILL}/references/r.md` in rec.files) && rec.delivered.commit === kit.git("rev-parse", "HEAD").trim() && TODAY.test(rec.delivered.date),
          JSON.stringify(rec),
        );

        const restored = tool(kit.dir, ["--restore", backup]);
        check(
          "restore: puts backups back and deletes added files",
          restored.status === 0 && read(d, ".claude/rules/a.md") === originals.a && read(d, ".claude/skills/s1/SKILL.md") === originals.skill && read(d, ".claude/skills/s1/references/r.md") === originals.ref && read(d, ".claude/kit-delivery.json") === originals.rec && !existsSync(d.abs(".claude/rules/new.md")) && restored.stdout.includes("restored 4") && restored.stdout.includes("removed 1"),
          out(restored),
        );
        const again = apply(kit, d);
        check("apply: after a restore the same run applies again", again.status === 0 && read(d, ".claude/rules/new.md") === "# New\n" && backups(kit).length === 2, out(again));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", "# Rule A\n\nKeep things\nsmall.\n\n## Detail\nmore\nkit addition\n");
        kit.commit("kit adds a line");
        writeFileSync(d.abs(".claude/rules/a.md"), "# Rule A\n\nsmall.\n\n## Detail\nmore\n");
        persist(d);
        const run = apply(kit, d);
        check("apply: merge does not restore a line the project deleted", run.status === 0 && read(d, ".claude/rules/a.md") === "# Rule A\n\nsmall.\n\n## Detail\nmore\nkit addition\n", out(run) + JSON.stringify(read(d, ".claude/rules/a.md")));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", RULE_A.replace("Keep things", "Keep kit things"));
        kit.write("project/stacks/node/rules/b.md", "# Rule B\n\nkit side\n");
        kit.commit("kit edits a line and b");
        const conflicting = RULE_A.replace("Keep things", "Keep project things");
        writeFileSync(d.abs(".claude/rules/a.md"), conflicting);
        persist(d);
        const run = apply(kit, d);
        const rec = readRec(d.project);
        check("apply: conflict leaves file byte-identical, exit 1", run.status === 1 && read(d, ".claude/rules/a.md") === conflicting, out(run));
        check("apply: conflict keeps its entry; the clean file advanced; delivered advanced", rec.files[BLOB_A] === d.rec.files[BLOB_A] && rec.files[BLOB_B] === headBlob(kit, BLOB_B) && rec.delivered.commit === kit.git("rev-parse", "HEAD").trim(), JSON.stringify(rec));
        check("apply: conflicts are reported by path", /^Conflicts:\n\s+- shared\/rules\/a\.md/m.test(run.stdout) && /^Still owed:\n\s+- .*shared\/rules\/a\.md/m.test(run.stdout), run.stdout);

        const stillConflicts = apply(kit, d);
        check("apply: a plain re-run still conflicts and leaves the project file alone", stillConflicts.status === 1 && read(d, ".claude/rules/a.md") === conflicting && readRec(d.project).files[BLOB_A] === d.rec.files[BLOB_A], out(stillConflicts));
        const refused = apply(kit, d, ["--resolved", BLOB_B]);
        check("apply: --resolved refuses a path that is not conflicted", refused.status === 1 && refused.stdout.includes("REFUSED") && readRec(d.project).files[BLOB_A] === d.rec.files[BLOB_A], out(refused));
        const handMerged = "# Rule A\n\nKeep both things\nsmall.\n\n## Detail\nmore\n";
        writeFileSync(workspace(kit, d, "rules/a.md"), handMerged);
        const resolved = apply(kit, d, ["--resolved", BLOB_A]);
        check(
          "apply: --resolved on a conflicted file -> project file = workspace copy, entry = HEAD blob, exit 0",
          resolved.status === 0 && readRec(d.project).files[BLOB_A] === headBlob(kit, BLOB_A) && read(d, ".claude/rules/a.md") === handMerged,
          out(resolved),
        );
        const resolvedBackup = backupOf(resolved) ?? "";
        check("apply: --resolved backs up the project copy it overwrites", existsSync(join(resolvedBackup, ".claude/rules/a.md")) && readFileSync(join(resolvedBackup, ".claude/rules/a.md"), "utf8") === conflicting, resolvedBackup);
        const after = planProject(kit.dir, d.project, readRec(d.project));
        check("apply: after --resolved the next plan reports nothing for it", noWork(after) && after.notes.length === 0, show(after));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", "# Rule A\n\nkit side\n");
        kit.commit("revise a");
        writeFileSync(d.abs(".claude/rules/a.md"), "# Rule A\n\nkit side\n");
        persist(d);
        const taken = apply(kit, d);
        check("apply: second run after the hand-merge equals HEAD -> entry = HEAD blob, exit 0", taken.status === 0 && readRec(d.project).files[BLOB_A] === headBlob(kit, BLOB_A), out(taken));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", "# Rule A\n\nkit side\n");
        kit.commit("revise a");
        writeFileSync(d.abs(".claude/rules/a.md"), "# Rule A\n\nproject side\n");
        delete d.rec.files[BLOB_A];
        persist(d);
        const first = apply(kit, d);
        check("apply: edited, no base -> reported, exit 1, file and entry untouched", first.status === 1 && /^Edited without base:\n\s+- .*rules\/a\.md/m.test(first.stdout) && read(d, ".claude/rules/a.md") === "# Rule A\n\nproject side\n" && !(BLOB_A in readRec(d.project).files), out(first));
        writeFileSync(workspace(kit, d, "rules/a.md"), "# Rule A\n\nkit side\nproject side\n");
        const resolved = apply(kit, d, ["--resolved", BLOB_A]);
        check("apply: edited-no-base then --resolved -> project file = workspace copy, entry = HEAD blob, exit 0", resolved.status === 0 && readRec(d.project).files[BLOB_A] === headBlob(kit, BLOB_A) && read(d, ".claude/rules/a.md") === "# Rule A\n\nkit side\nproject side\n", out(resolved));
        const plain = apply(kit, d);
        check("apply: the next default run reports nothing for it", plain.status === 0 && /^Edited without base: none$/m.test(plain.stdout) && !plain.stdout.includes("rules/a.md"), out(plain));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/domains/web/skills/s1/SKILL.md", "---\nname: s1\ndescription: v2\n---\n");
        kit.write("project/domains/web/skills/s1/references/r.md", "# Ref v2\n");
        kit.write("project/shared/rules/a.md", "# Rule A\n\nnew text\n");
        kit.commit("revise");
        writeFileSync(d.abs(".claude/skills/s1/references/r.md"), "# edited by the project\n");
        persist(d);
        const run = apply(kit, d);
        check(
          "apply: held skill -> exit 1, none of its files written, other files still applied",
          run.status === 1 && /^Held skills:\n\s+- domains\/web\/skills\/s1/m.test(run.stdout) && read(d, ".claude/skills/s1/references/r.md") === "# edited by the project\n" && read(d, ".claude/rules/a.md") === "# Rule A\n\nnew text\n" && readRec(d.project).files[`${SKILL}/SKILL.md`] === d.rec.files[`${SKILL}/SKILL.md`],
          out(run),
        );
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/domains/web/skills/s1/SKILL.md", "---\nname: s1\ndescription: v2\n---\n");
        kit.write("project/domains/web/skills/s1/references/r.md", "# Ref v2\n");
        kit.write("project/domains/web/skills/s1/references/extra.md", "# Extra\n");
        kit.commit("revise s1, add extra");
        writeFileSync(d.abs(".claude/skills/s1/references/r.md"), "# edited by the project\n");
        mkdirSync(d.abs(".claude/skills/s1/evals"), { recursive: true });
        writeFileSync(d.abs(".claude/skills/s1/evals/case.md"), "# project eval\n");
        const staged = join(kit.dir, "incoming", "skills", "p__s1", "references");
        mkdirSync(staged, { recursive: true });
        writeFileSync(join(staged, "r.md"), "# a staged copy that must not be read\n");
        persist(d);
        const run = apply(kit, d, ["--take-kit", SKILL]);
        const backup = backupOf(run) ?? "";
        const rec = readRec(d.project);
        check(
          "take-kit: held skill -> every file equals kit HEAD, exit 0, taken skill reported",
          run.status === 0 && read(d, ".claude/skills/s1/SKILL.md").includes("description: v2") && read(d, ".claude/skills/s1/references/r.md") === "# Ref v2\n" && read(d, ".claude/skills/s1/references/extra.md") === "# Extra\n" && /taken from the kit/.test(run.stdout) && !/^Still owed:\n\s+- /m.test(run.stdout),
          out(run),
        );
        check(
          "take-kit: backup holds the project's edited file; the added file is listed in added.json",
          existsSync(join(backup, ".claude/skills/s1/references/r.md")) && readFileSync(join(backup, ".claude/skills/s1/references/r.md"), "utf8") === "# edited by the project\n" && JSON.parse(readFileSync(join(backup, "added.json"), "utf8")).includes(".claude/skills/s1/references/extra.md"),
          backup,
        );
        check(
          "take-kit: record entries = HEAD blobs for every file of the skill",
          [`${SKILL}/SKILL.md`, `${SKILL}/references/r.md`, `${SKILL}/references/extra.md`].every((f) => rec.files[f] === headBlob(kit, f)),
          JSON.stringify(rec.files),
        );
        check("take-kit: project-only files inside the skill dir are untouched", read(d, ".claude/skills/s1/evals/case.md") === "# project eval\n");
        check("take-kit: the staged copy in incoming/ is neither read nor changed", readFileSync(join(staged, "r.md"), "utf8") === "# a staged copy that must not be read\n" && readdirSync(join(kit.dir, "incoming")).join() === "skills" && readdirSync(join(kit.dir, "incoming", "skills")).join() === "p__s1");
        check("take-kit: the next plan finds nothing to do", noWork(planProject(kit.dir, d.project, rec)));
        const restored = tool(kit.dir, ["--restore", backup]);
        check("take-kit: --restore puts the edited file back and removes the added one", restored.status === 0 && read(d, ".claude/skills/s1/references/r.md") === "# edited by the project\n" && !existsSync(d.abs(".claude/skills/s1/references/extra.md")), out(restored));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/domains/web/skills/s1/SKILL.md", "---\nname: s1\ndescription: v2\n---\n");
        kit.git("rm", "-q", "project/domains/web/skills/s1/references/r.md");
        kit.commit("retire r");
        writeFileSync(d.abs(".claude/skills/s1/references/r.md"), "# edited by the project\n");
        persist(d);
        const run = apply(kit, d, ["--take-kit", `${SKILL}/`]);
        const rec = readRec(d.project);
        check(
          "take-kit: a file the kit retired is removed and its entry dropped; a trailing slash on the skill dir is accepted",
          run.status === 0 && !existsSync(d.abs(".claude/skills/s1/references/r.md")) && rec.files[`${SKILL}/references/r.md`] === undefined && rec.files[`${SKILL}/SKILL.md`] === headBlob(kit, `${SKILL}/SKILL.md`),
          out(run),
        );
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/domains/web/skills/s1/references/r.md", "# Ref v2\n");
        kit.commit("revise r");
        persist(d);
        const bytes = read(d, ".claude/skills/s1/references/r.md");
        const recBefore = read(d, ".claude/kit-delivery.json");
        const notHeld = apply(kit, d, ["--take-kit", SKILL]);
        check(
          "take-kit: a skill that is not held -> refused naming the path and saying so, nothing written",
          notHeld.status === 1 && /REFUSED: .*domains\/web\/skills\/s1.*not held/.test(notHeld.stdout) && read(d, ".claude/skills/s1/references/r.md") === bytes && read(d, ".claude/kit-delivery.json") === recBefore && backups(kit).length === 0,
          out(notHeld),
        );
        const unknown = apply(kit, d, ["--take-kit", "domains/web/skills/nope"]);
        check("take-kit: an unknown path -> refused, nothing written", unknown.status === 1 && /REFUSED: .*domains\/web\/skills\/nope/.test(unknown.stdout) && read(d, ".claude/kit-delivery.json") === recBefore && backups(kit).length === 0, out(unknown));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/domains/web/skills/s1/references/r.md", "# Ref v2\n");
        kit.write("project/shared/rules/a.md", `${RULE_A}kit addition\n`);
        kit.commit("revise r and a");
        writeFileSync(d.abs(".claude/skills/s1/references/r.md"), "# edited by the project\n");
        const recBefore = (persist(d), read(d, ".claude/kit-delivery.json"));
        const mixed = apply(kit, d, ["--take-kit", `${SKILL},domains/web/skills/nope`]);
        check("take-kit: one bad path refuses the whole run before any write", mixed.status === 1 && mixed.stdout.includes("REFUSED") && read(d, ".claude/skills/s1/references/r.md") === "# edited by the project\n" && read(d, ".claude/rules/a.md") === RULE_A && read(d, ".claude/kit-delivery.json") === recBefore && backups(kit).length === 0, out(mixed));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/domains/web/skills/s1/references/r.md", "# Ref v2\n");
        kit.write("project/shared/rules/a.md", RULE_A.replace("Keep things", "Keep kit things"));
        kit.commit("revise r and a");
        writeFileSync(d.abs(".claude/skills/s1/references/r.md"), "# edited by the project\n");
        writeFileSync(d.abs(".claude/rules/a.md"), RULE_A.replace("Keep things", "Keep project things"));
        persist(d);
        apply(kit, d);
        writeFileSync(workspace(kit, d, "rules/a.md"), RULE_A.replace("Keep things", "Keep both things"));
        const run = apply(kit, d, ["--take-kit", SKILL, "--resolved", BLOB_A]);
        const rec = readRec(d.project);
        check(
          "take-kit: combines with --resolved in one run -> skill taken, rule resolved, exit 0",
          run.status === 0 && read(d, ".claude/skills/s1/references/r.md") === "# Ref v2\n" && rec.files[BLOB_A] === headBlob(kit, BLOB_A) && rec.files[`${SKILL}/references/r.md`] === headBlob(kit, `${SKILL}/references/r.md`),
          out(run),
        );
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        const e = deliverAll(kit, "q");
        const exitOf = (args) => tool(kit.dir, args).status;
        check(
          "flags: --take-kit needs --apply and one project, rejects a flag-like value, excludes --restore",
          [
            [d.project, "--take-kit", SKILL],
            ["--apply", d.project, "--take-kit"],
            ["--apply", "--take-kit", "--resolved", BLOB_A, d.project],
            ["--apply", "--take-kit", SKILL, d.project, e.project],
            ["--apply", "--take-kit", SKILL, "--all"],
            ["--status", "--take-kit", SKILL, d.project],
            ["--restore", "x", "--apply", "--take-kit", SKILL],
          ].every((args) => exitOf(args) === 2),
          JSON.stringify([[d.project, "--take-kit", SKILL], ["--restore", "x", "--apply", "--take-kit", SKILL]].map(exitOf)),
        );
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", RULE_A.replace("Keep things", "Keep kit things"));
        kit.write("project/stacks/node/rules/b.md", "# Rule B\n\nkit side\n");
        kit.commit("kit edits a and b");
        const conflicting = RULE_A.replace("Keep things", "Keep project things");
        writeFileSync(d.abs(".claude/rules/a.md"), conflicting);
        writeFileSync(d.abs(".claude/rules/node/b.md"), "# Rule B\n\nproject side\n");
        delete d.rec.files[BLOB_B];
        persist(d);
        const incomingBefore = existsSync(join(kit.dir, "incoming"));
        const dry = tool(kit.dir, [d.project]);
        check("workspace: a dry run writes no workspace", dry.status === 0 && !existsSync(join(kit.dir, "tmp", "project-sync-merge")), out(dry));

        const run = apply(kit, d);
        const wsA = workspace(kit, d, "rules/a.md");
        const wsB = workspace(kit, d, "rules/node/b.md");
        const markers = existsSync(wsA) ? readFileSync(wsA, "utf8") : "";
        check("workspace: a conflict leaves a merge copy with markers; the project file is untouched", run.status === 1 && /^<<<<<<< project$/m.test(markers) && /^={7}$/m.test(markers) && /^>>>>>>> kit$/m.test(markers) && markers.includes("Keep project things") && markers.includes("Keep kit things") && read(d, ".claude/rules/a.md") === conflicting, out(run) + markers);
        check(
          "workspace: edited with no base gets the project copy and the kit HEAD copy beside it as .kit",
          existsSync(wsB) && readFileSync(wsB, "utf8") === "# Rule B\n\nproject side\n" && existsSync(`${wsB}.kit`) && readFileSync(`${wsB}.kit`, "utf8") === "# Rule B\n\nkit side\n" && read(d, ".claude/rules/node/b.md") === "# Rule B\n\nproject side\n" && !existsSync(d.abs(".claude/rules/node/b.md.kit")),
        );
        check("workspace: the paths contain no .claude segment", !relative(join(kit.dir, "tmp", "project-sync-merge"), wsA).split(sep).includes(".claude") && wsA.startsWith(join(kit.dir, "tmp", "project-sync-merge", basename(d.project))), wsA);
        check("workspace: the report names the workspace path for conflicts and for edited-without-base", new RegExp(`^Conflicts:\\n\\s+- shared/rules/a\\.md.*${wsA.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m").test(run.stdout) && new RegExp(`^Edited without base:\\n\\s+- .*${wsB.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m").test(run.stdout), run.stdout);
        check("workspace: incoming/ is not created or touched", existsSync(join(kit.dir, "incoming")) === incomingBefore);

        const bBefore = read(d, ".claude/rules/node/b.md");
        const recBefore = read(d, ".claude/kit-delivery.json");
        const backupsBefore = backups(kit).length;
        const left = apply(kit, d, ["--resolved", BLOB_A]);
        check("workspace: --resolved with markers left is refused and writes nothing", left.status === 1 && left.stdout.includes("REFUSED") && /conflict marker/.test(left.stdout) && read(d, ".claude/rules/a.md") === conflicting && read(d, ".claude/kit-delivery.json") === recBefore && backups(kit).length === backupsBefore, out(left));

        rmSync(wsA);
        const missing = apply(kit, d, ["--resolved", BLOB_A]);
        check("workspace: --resolved with no workspace copy is refused and writes nothing", missing.status === 1 && missing.stdout.includes("REFUSED") && read(d, ".claude/rules/a.md") === conflicting && read(d, ".claude/kit-delivery.json") === recBefore && backups(kit).length === backupsBefore, out(missing));

        const regenerated = apply(kit, d);
        check("workspace: a removed workspace copy is written afresh by the next apply", regenerated.status === 1 && /^<<<<<<< project$/m.test(readFileSync(wsA, "utf8")) && existsSync(`${wsA}.kit`), out(regenerated));
        check("workspace: a conflict gets the .kit sidecar with the kit HEAD bytes", readFileSync(`${wsA}.kit`, "utf8") === RULE_A.replace("Keep things", "Keep kit things"));

        writeFileSync(wsB, "# Rule B\n\n<<<<<<< oops\nproject side\n");
        const leftB = apply(kit, d, ["--resolved", BLOB_B]);
        check("workspace: markers left in an edited-no-base copy are refused too", leftB.status === 1 && /conflict marker/.test(leftB.stdout) && read(d, ".claude/rules/node/b.md") === bBefore, out(leftB));

        writeFileSync(wsA, "# Rule A\n\nmy merge in progress\n");
        const kept = apply(kit, d);
        check("workspace: an existing copy is kept, not overwritten, and the report says so", kept.status === 1 && readFileSync(wsA, "utf8") === "# Rule A\n\nmy merge in progress\n" && /workspace copy kept \(written \d{4}-\d{2}-\d{2}\)/.test(kept.stdout.split("Edited without base:")[0]) && /workspace copy kept/.test(kept.stdout.split("Edited without base:")[1]), out(kept));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", RULE_A.replace("Keep things", "Keep kit things"));
        kit.commit("kit edits a");
        const conflicting = RULE_A.replace("Keep things", "Keep project things");
        writeFileSync(d.abs(".claude/rules/a.md"), conflicting);
        persist(d);
        apply(kit, d);
        const ws = workspace(kit, d, "rules/a.md");
        const merged = "# Rule A\n\nKeep both things\n=======\n\nsmall.\n";
        writeFileSync(ws, merged);

        kit.write("project/shared/rules/a.md", RULE_A.replace("Keep things", "Keep kit things v2"));
        kit.commit("kit moves a again");
        const recBefore = read(d, ".claude/kit-delivery.json");
        const backupsBefore = backups(kit).length;
        const stale = apply(kit, d, ["--resolved", BLOB_A]);
        check("workspace: --resolved is refused when the kit moved since the copy was written, nothing written", stale.status === 1 && /kit moved/.test(stale.stdout) && read(d, ".claude/rules/a.md") === conflicting && read(d, ".claude/kit-delivery.json") === recBefore && backups(kit).length === backupsBefore && existsSync(ws), out(stale));

        rmSync(`${ws}.kit`);
        const noSidecar = apply(kit, d, ["--resolved", BLOB_A]);
        check("workspace: --resolved is refused when the .kit sidecar is missing, nothing written", noSidecar.status === 1 && /\.kit/.test(noSidecar.stdout) && read(d, ".claude/rules/a.md") === conflicting && backups(kit).length === backupsBefore, out(noSidecar));

        writeFileSync(`${ws}.kit`, readBlobText(kit, BLOB_A));
        const ok = apply(kit, d, ["--resolved", BLOB_A]);
        check("workspace: a setext-style ======= line does not block --resolved", ok.status === 0 && read(d, ".claude/rules/a.md") === merged, out(ok));
        check("workspace: a consumed workspace copy and its sidecar are removed, empty directories pruned", !existsSync(ws) && !existsSync(`${ws}.kit`) && !existsSync(join(kit.dir, "tmp", "project-sync-merge", basename(d.project), "rules")) && existsSync(join(kit.dir, "tmp", "project-sync-merge", basename(d.project))), out(ok));
      }

      {
        const kit = makeKit();
        const same = [deliverAll(kit), deliverAll(kit)];
        kit.write("project/shared/rules/a.md", RULE_A.replace("Keep things", "Keep kit things"));
        kit.commit("kit edits a");
        for (const [n, d] of same.entries()) {
          writeFileSync(d.abs(".claude/rules/a.md"), RULE_A.replace("Keep things", `Keep project ${n} things`));
          persist(d);
        }
        const first = apply(kit, same[0]);
        const wsPath = workspace(kit, same[0], "rules/a.md");
        const owner = JSON.parse(readFileSync(join(kit.dir, "tmp", "project-sync-merge", "p", "project.json"), "utf8"));
        const wsBefore = readFileSync(wsPath, "utf8");
        const projectBefore = read(same[1], ".claude/rules/a.md");
        const backupsBefore = backups(kit).length;
        const second = apply(kit, same[1]);
        const resolvedOther = apply(kit, same[1], ["--resolved", BLOB_A]);
        check("workspace: project.json records the project that owns the folder", first.status === 1 && owner.projectDir === same[0].project, JSON.stringify(owner) + out(first));
        check(
          "workspace: a second project of the same name is refused by --apply and --resolved before any write",
          second.status === 1 && second.stdout.includes("REFUSED") && /project\.json/.test(second.stdout) && resolvedOther.status === 1 && resolvedOther.stdout.includes("REFUSED") && readFileSync(wsPath, "utf8") === wsBefore && read(same[1], ".claude/rules/a.md") === projectBefore && backups(kit).length === backupsBefore,
          out(second) + out(resolvedOther),
        );
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", RULE_A.replace("Keep things", "Keep kit things"));
        kit.commit("kit edits a");
        writeFileSync(d.abs(".claude/rules/a.md"), RULE_A.replace("Keep things", "Keep project things"));
        writeFileSync(d.abs(".claude/settings.json"), "{ not json");
        persist(d);
        const run = apply(kit, d);
        check("workspace: a refusal from settings.json leaves no workspace copy behind", run.status === 1 && run.stdout.includes("REFUSED") && !existsSync(join(kit.dir, "tmp", "project-sync-merge")), out(run));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", RULE_A.replace("Keep things", "Keep kit things"));
        kit.commit("kit edits a");
        const conflicting = RULE_A.replace("Keep things", "Keep project things");
        writeFileSync(d.abs(".claude/rules/a.md"), conflicting);
        persist(d);
        apply(kit, d);
        const ws = workspace(kit, d, "rules/a.md");
        check("workspace: a conflict also gets a .project sidecar with the project bytes", readFileSync(`${ws}.project`, "utf8") === conflicting);

        kit.write("project/shared/rules/a.md", RULE_A.replace("Keep things", "Keep kit things v2"));
        kit.commit("kit moves a again");
        const moved = apply(kit, d);
        check("workspace: a kept copy built on older kit text is reported stale, not as a place to merge", moved.status === 1 && /stale \(kit moved\) — delete the copy and its \.kit and \.project sidecars, then re-run --apply/.test(moved.stdout) && !/merge in .*rules\/a\.md/.test(moved.stdout.split("Edited without base:")[0]), out(moved));

        const changed = conflicting + "edited after the copy\n";
        writeFileSync(d.abs(".claude/rules/a.md"), changed);
        writeFileSync(`${ws}.kit`, readBlobText(kit, BLOB_A));
        writeFileSync(ws, "# Rule A\n\nmerged\n");
        const recBefore = read(d, ".claude/kit-delivery.json");
        const backupsBefore = backups(kit).length;
        const stale = apply(kit, d, ["--resolved", BLOB_A]);
        check("workspace: --resolved is refused when the project file changed since the copy, nothing written", stale.status === 1 && /project file changed/.test(stale.stdout) && read(d, ".claude/rules/a.md") === changed && read(d, ".claude/kit-delivery.json") === recBefore && backups(kit).length === backupsBefore, out(stale));
        rmSync(`${ws}.project`);
        const noProject = apply(kit, d, ["--resolved", BLOB_A]);
        check("workspace: --resolved is refused when the .project sidecar is missing", noProject.status === 1 && /\.project/.test(noProject.stdout) && read(d, ".claude/rules/a.md") === changed, out(noProject));
      }

      for (const [label, settle] of [["recorded equal to HEAD", (kit, d) => readBlobText(kit, BLOB_A)], ["replaced from the recorded base", () => RULE_A]]) {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", RULE_A.replace("Keep things", "Keep kit things"));
        kit.commit("kit edits a");
        writeFileSync(d.abs(".claude/rules/a.md"), RULE_A.replace("Keep things", "Keep project things"));
        persist(d);
        apply(kit, d);
        const ws = workspace(kit, d, "rules/a.md");
        const existed = existsSync(ws) && existsSync(`${ws}.kit`) && existsSync(`${ws}.project`);
        writeFileSync(d.abs(".claude/rules/a.md"), settle(kit, d));
        const run = apply(kit, d);
        check(`workspace: a path the run settles (${label}) loses its workspace copy and sidecars`, existed && run.status === 0 && !existsSync(ws) && !existsSync(`${ws}.kit`) && !existsSync(`${ws}.project`) && !existsSync(join(kit.dir, "tmp", "project-sync-merge", "p", "rules")), out(run));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", RULE_A.replace("Keep things", "Keep kit things"));
        kit.commit("kit edits a");
        const crlf = RULE_A.replace(/\n/g, "\r\n").replace("Keep things", "Keep CRLF things");
        writeFileSync(d.abs(".claude/rules/a.md"), crlf);
        persist(d);
        const run = apply(kit, d);
        const text = readFileSync(workspace(kit, d, "rules/a.md"), "utf8");
        check("workspace: a CRLF conflict keeps CRLF, markers included", run.status === 1 && text.includes("<<<<<<< project\r\n") && !/(^|[^\r])\n/.test(text), JSON.stringify(text));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        const crlf = RULE_A.replace(/\n/g, "\r\n").replace("Keep things", "Keep CRLF things");
        writeFileSync(d.abs(".claude/rules/a.md"), crlf);
        kit.write("project/shared/rules/a.md", `${RULE_A}kit addition\n`);
        kit.commit("kit adds a line");
        persist(d);
        const run = apply(kit, d);
        const merged = readFileSync(d.abs(".claude/rules/a.md"), "utf8");
        check(
          "apply: CRLF project copy merges and keeps CRLF",
          run.status === 0 && merged === `${crlf}kit addition\r\n` && !/(^|[^\r])\n/.test(merged),
          out(run) + JSON.stringify(merged),
        );
      }

      {
        const kit = makeKit();
        kit.write("project/shared/rules/nonl.md", "a\nb");
        kit.write("project/shared/rules/gone.md", "x\n");
        kit.write("project/shared/rules/m.md", "one\ntwo\nthree\nfour\nfive");
        kit.commit("files without trailing newlines");
        const d = deliverAll(kit);
        kit.write("project/shared/rules/nonl.md", "a\nc");
        kit.write("project/shared/rules/gone.md", "");
        kit.write("project/shared/rules/m.md", "one\ntwo\nthree\nfour\nFIVE");
        kit.write("project/shared/rules/addnl.md", "no newline");
        kit.write("project/shared/rules/empty.md", "");
        kit.commit("change them");
        writeFileSync(d.abs(".claude/rules/m.md"), "ONE\ntwo\nthree\nfour\nfive");
        persist(d);
        const run = apply(kit, d);
        const bytes = (rel) => readFileSync(d.abs(rel));
        check(
          "apply: no-trailing-newline and empty kit files byte-exact",
          run.status === 0 && bytes(".claude/rules/nonl.md").equals(Buffer.from("a\nc")) && bytes(".claude/rules/gone.md").length === 0 && bytes(".claude/rules/addnl.md").equals(Buffer.from("no newline")) && bytes(".claude/rules/empty.md").length === 0 && bytes(".claude/rules/m.md").equals(Buffer.from("ONE\ntwo\nthree\nfour\nFIVE")),
          out(run) + JSON.stringify(bytes(".claude/rules/m.md").toString()),
        );
      }

      {
        const kit = makeKit();
        const blob = randomBytes(4096);
        kit.write("project/shared/agents/rand.bin", blob);
        kit.commit("add a binary");
        const d = deliverAll(kit);
        rmSync(d.abs(".claude/agents/rand.bin"));
        delete d.rec.files["shared/agents/rand.bin"];
        persist(d);
        const run = apply(kit, d);
        check("apply: binary add is byte-exact", run.status === 0 && readFileSync(d.abs(".claude/agents/rand.bin")).equals(blob) && readRec(d.project).files["shared/agents/rand.bin"] === headBlob(kit, "shared/agents/rand.bin"), out(run));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", "# Rule A\n\nnew text\n");
        kit.write("project/stacks/node/rules/b.md", "# Rule B\n\nnew text\n");
        kit.commit("revise a and b");
        persist(d);
        const crashed = apply(kit, d, [], { PROJECT_SYNC_TEST_CRASH: "after-writes" });
        check("apply: interrupted run wrote files but not the record", crashed.status !== 0 && read(d, ".claude/rules/a.md") === "# Rule A\n\nnew text\n" && readRec(d.project).files[BLOB_A] === d.rec.files[BLOB_A], out(crashed));
        const healing = planProject(kit.dir, d.project, readRec(d.project));
        check("apply: interrupted run self-heals -> record only, nothing owed", healing.actions.length === 2 && healing.actions.every((a) => a.kind === "record") && healing.held.length === 0 && healing.notes.length === 0, show(healing));
        const run = apply(kit, d);
        const rec = readRec(d.project);
        check("apply: re-running an interrupted run advances the entries and exits 0", run.status === 0 && rec.files[BLOB_A] === headBlob(kit, BLOB_A) && rec.files[BLOB_B] === headBlob(kit, BLOB_B), out(run));
        check("apply: after healing nothing is owed", noWork(planProject(kit.dir, d.project, rec)));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        d.rec.delivered.date = "2001-01-01";
        persist(d);
        const idle = apply(kit, d);
        check(
          "apply: nothing to write and delivered.commit already HEAD -> no backup, record and its date untouched",
          idle.status === 0 && backups(kit).length === 0 && readRec(d.project).delivered.date === "2001-01-01" && /^Backup path: none$/m.test(idle.stdout),
          out(idle),
        );
        kit.write("project/shared/CLAUDE.template.md", "# template v2\n");
        kit.commit("a kit commit that delivers nothing");
        const first = apply(kit, d);
        const recBytes = readFileSync(d.abs(".claude/kit-delivery.json"));
        const count = backups(kit).length;
        const second = apply(kit, d);
        const titles = ["Replaced", "Added", "Merged", "Removed", "Conflicts", "Edited without base", "Removed by the project", "Held skills", "Skipped / opted out", "Settings", "Rules table", "Still owed", "Backup path", "Notes"];
        check("apply: a run that only advances delivered.commit backs up and writes the record", first.status === 0 && count === 1 && readRec(d.project).delivered.commit === kit.git("rev-parse", "HEAD").trim() && readRec(d.project).delivered.date !== "2001-01-01", out(first));
        check("apply: a run with nothing to write takes no backup and leaves the record alone", second.status === 0 && backups(kit).length === count && readFileSync(d.abs(".claude/kit-delivery.json")).equals(recBytes), out(second));
        check("report: every spec section present, each empty one says none", titles.every((t) => new RegExp(`^${t}: none$`, "m").test(second.stdout)), second.stdout);
        check("report: delivered before -> after is printed", /^delivered: .+ -> .+$/m.test(second.stdout), second.stdout);
        const order = ["Replaced:", "Added:", "Merged:", "Removed:", "Conflicts:", "Edited without base:", "Removed by the project:", "Held skills:", "Skipped / opted out:", "Settings:", "Rules table:", "Still owed:", "Backup path:", "delivered:", "Notes:"].map((t) => second.stdout.indexOf(`\n${t}`));
        check("report: sections come in the spec order", order.every((at, i) => at > 0 && (i === 0 || at > order[i - 1])), JSON.stringify(order));
      }

      {
        const kit = makeKit();
        kit.write("project/stacks/node/rules/keep.md", "# Keep\n");
        kit.commit("a second node rule, so retiring b leaves the tier");
        const d = deliverAll(kit);
        kit.git("rm", "-q", "project/stacks/node/rules/b.md");
        kit.commit("retire b");
        rmSync(d.abs(".claude/rules/node/b.md"));
        persist(d);
        const run = apply(kit, d);
        check("apply: a retired key whose file is gone is pruned from the record", run.status === 0 && !(BLOB_B in readRec(d.project).files), out(run));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.git("mv", "project/stacks/node/rules/b.md", "project/stacks/node/rules/c.md");
        kit.commit("rename b to c");
        persist(d);
        const run = apply(kit, d);
        const rec = readRec(d.project);
        check(
          "apply: a rename moves the record key and the file",
          run.status === 0 && !(BLOB_B in rec.files) && rec.files["stacks/node/rules/c.md"] === headBlob(kit, "stacks/node/rules/c.md") && existsSync(d.abs(".claude/rules/node/c.md")) && !existsSync(d.abs(".claude/rules/node/b.md")),
          out(run),
        );
        const kit2 = makeKit();
        const d2 = deliverAll(kit2, "q");
        kit2.git("mv", "project/stacks/node/rules/b.md", "project/stacks/node/rules/c.md");
        kit2.commit("rename b to c");
        rmSync(d2.abs(".claude/rules/node/b.md"));
        persist(d2);
        const gone = apply(kit2, d2);
        check("apply: a rename whose old copy the project deleted drops the old key", gone.status === 0 && !(BLOB_B in readRec(d2.project).files), out(gone));
        const again = apply(kit2, d2);
        const status2 = tool(kit2.dir, ["--status", d2.project]);
        check(
          "apply: the next run does not re-add a renamed file whose old copy the project deleted, and it is not owed",
          again.status === 0 && !existsSync(d2.abs(".claude/rules/node/c.md")) && /^owed: none$/m.test(status2.stdout),
          out(again) + out(status2),
        );
      }

      {
        const BLOB_C = "stacks/node/rules/c.md";
        const RULE_B = "# Rule B\n\nline one\nline two\nline three\n";
        const setup = (projectText, kitText) => {
          const kit = makeKit();
          kit.write("project/stacks/node/rules/b.md", RULE_B);
          kit.commit("b with lines");
          const d = deliverAll(kit);
          kit.git("mv", "project/stacks/node/rules/b.md", "project/stacks/node/rules/c.md");
          kit.commit("rename b to c");
          kit.write("project/stacks/node/rules/c.md", kitText);
          kit.commit("edit c");
          writeFileSync(d.abs(".claude/rules/node/b.md"), projectText);
          writeFileSync(d.abs(".claude/CLAUDE.md"), "# P\n\n## Rules\n\n| Rule file | Covers |\n| --- | --- |\n| `.claude/rules/node/b.md` | B |\n");
          persist(d);
          return { kit, d };
        };
        const projectText = RULE_B.replace("line one", "line one, project wording");
        const { kit, d } = setup(projectText, `${RULE_B}kit addition\n`);
        const claudeBefore = read(d, ".claude/CLAUDE.md");
        const ws = workspace(kit, d, "rules/node/c.md");
        const first = apply(kit, d);
        const rec1 = readRec(d.project);
        check(
          "rename-edited: --apply owes it, leaves both project paths alone and keeps the old key",
          first.status === 1 && /^Still owed:\n(?:\s+- .+\n)*\s+- stacks\/node\/rules\/c\.md — renamed from stacks\/node\/rules\/b\.md/m.test(first.stdout) && read(d, ".claude/rules/node/b.md") === projectText && !existsSync(d.abs(".claude/rules/node/c.md")) && rec1.files[BLOB_B] === d.rec.files[BLOB_B] && !(BLOB_C in rec1.files) && rec1.delivered.commit === kit.git("rev-parse", "HEAD").trim(),
          out(first) + JSON.stringify(rec1),
        );
        check(
          "rename-edited: the workspace at the new path holds the clean merge, with .kit = kit HEAD and .project = the old-path copy",
          existsSync(ws) && readFileSync(ws, "utf8") === `${projectText}kit addition\n` && readFileSync(`${ws}.kit`, "utf8") === `${RULE_B}kit addition\n` && readFileSync(`${ws}.project`, "utf8") === projectText,
          existsSync(ws) ? JSON.stringify(readFileSync(ws, "utf8")) : "no workspace",
        );
        const second = apply(kit, d);
        check(
          "rename-edited: after delivered advanced, a plain re-run still links it — nothing added at the new path, still owed",
          second.status === 1 && !existsSync(d.abs(".claude/rules/node/c.md")) && read(d, ".claude/rules/node/b.md") === projectText && /stacks\/node\/rules\/c\.md — renamed from/.test(second.stdout),
          out(second),
        );
        const status = tool(kit.dir, ["--status", d.project]);
        check("rename-edited: --status owes the new path too", /^owed:\n(?:\s+- .+\n)*\s+- stacks\/node\/rules\/c\.md$/m.test(status.stdout), out(status));
        const dry = tool(kit.dir, [d.project]);
        check("rename-edited: the dry run reports it under renamed-edited", /^renamed-edited:\n\s+- \.claude\/rules\/node\/c\.md \(stacks\/node\/rules\/c\.md\)/m.test(dry.stdout), dry.stdout);

        const merged = `${projectText}kit addition\nowner touch\n`;
        mkdirSync(dirname(ws), { recursive: true });
        writeFileSync(ws, merged);
        const resolved = apply(kit, d, ["--resolved", BLOB_C]);
        const rec2 = readRec(d.project);
        const backup = backupOf(resolved) ?? "";
        check(
          "rename-edited: --resolved writes the new path, removes the old, records the new key at HEAD and drops the old",
          resolved.status === 0 && read(d, ".claude/rules/node/c.md") === merged && !existsSync(d.abs(".claude/rules/node/b.md")) && rec2.files[BLOB_C] === headBlob(kit, BLOB_C) && !(BLOB_B in rec2.files) && !existsSync(ws) && !existsSync(`${ws}.kit`) && !existsSync(`${ws}.project`),
          out(resolved) + JSON.stringify(rec2),
        );
        check(
          "rename-edited: the backup holds the old copy and lists the new path as added; the Rules table row moves",
          existsSync(join(backup, ".claude/rules/node/b.md")) && readFileSync(join(backup, ".claude/rules/node/b.md"), "utf8") === projectText && JSON.parse(readFileSync(join(backup, "added.json"), "utf8")).includes(".claude/rules/node/c.md") && read(d, ".claude/CLAUDE.md").includes("`.claude/rules/node/c.md`") && !read(d, ".claude/CLAUDE.md").includes("rules/node/b.md"),
          backup + read(d, ".claude/CLAUDE.md"),
        );
        const after = apply(kit, d);
        check("rename-edited: the next run owes nothing", after.status === 0 && /^Still owed: none$/m.test(after.stdout), out(after));
        const restored = tool(kit.dir, ["--restore", backup]);
        const rec3 = readRec(d.project);
        check(
          "rename-edited: --restore puts the old copy, the old key and the Rules table back and removes the new path",
          restored.status === 0 && read(d, ".claude/rules/node/b.md") === projectText && !existsSync(d.abs(".claude/rules/node/c.md")) && rec3.files[BLOB_B] === d.rec.files[BLOB_B] && !(BLOB_C in rec3.files) && read(d, ".claude/CLAUDE.md") === claudeBefore,
          out(restored) + JSON.stringify(rec3),
        );

        const clash = setup(RULE_B.replace("line one", "line one, project"), RULE_B.replace("line one", "line one, kit"));
        const clashRun = apply(clash.kit, clash.d);
        const clashWs = workspace(clash.kit, clash.d, "rules/node/c.md");
        const markers = existsSync(clashWs) ? readFileSync(clashWs, "utf8") : "";
        const refused = apply(clash.kit, clash.d, ["--resolved", BLOB_C]);
        check(
          "rename-edited: a conflicting merge leaves markers in the workspace, and --resolved is refused while they stay",
          clashRun.status === 1 && /^<<<<<<< project$/m.test(markers) && markers.includes("line one, kit") && refused.status === 1 && /conflict marker/.test(refused.stdout) && !existsSync(clash.d.abs(".claude/rules/node/c.md")),
          out(clashRun) + out(refused) + markers,
        );
      }

      {
        const kit = makeKit();
        kit.write("project/shared/agents/blob.bin", Buffer.from([0xff, 0xfe, 0x00, 0x01]));
        kit.commit("add a binary");
        const d = deliverAll(kit);
        kit.write("project/shared/agents/blob.bin", Buffer.from([0xff, 0x00, 0x02]));
        kit.commit("change the binary");
        writeFileSync(d.abs(".claude/agents/blob.bin"), Buffer.from([0xff, 0x00, 0x03]));
        persist(d);
        const run = apply(kit, d);
        const status = tool(kit.dir, ["--status", d.project]);
        check(
          "owed parity: an edited binary is still owed after --apply (exit 1), as --status says",
          run.status === 1 && /^Still owed:\n\s+- shared\/agents\/blob\.bin — edited binary — replace by hand or add to skip$/m.test(run.stdout) && /^owed:\n\s+- shared\/agents\/blob\.bin$/m.test(status.stdout),
          out(run) + out(status),
        );
      }

      {
        const kit = makeKit();
        kit.write(".gitignore", "*~\n");
        kit.commit("ignore backups");
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md~", "editor backup\n");
        persist(d);
        const run = apply(kit, d);
        check("catalog from HEAD: an ignored file under project/ is not delivered and --apply does not crash", run.status === 0 && run.stderr === "" && !existsSync(d.abs(".claude/rules/a.md~")), out(run));
        kit.write("project/shared/rules/untracked.md", "# Untracked\n\nNot committed.\n");
        kit.write("project/shared/rules/a.md", "# Rule A\n\nDirty purpose.\n");
        const names = catalogOf(kit);
        check(
          "catalog from HEAD: ignored and untracked files are not catalogued; a purpose comes from HEAD, not the working tree",
          !names.entries.some((e) => e.kit.endsWith("a.md~") || e.kit.endsWith("untracked.md")) && names.entries.find((e) => e.kit === BLOB_A)?.purpose === "Keep things small.",
          JSON.stringify(names.entries.map((e) => [e.kit, e.purpose])),
        );
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        writeFileSync(d.abs(".claude/CLAUDE.md"), "# P\n\n## Rules\n\n| Rule file | Covers |\n| --- | --- |\n");
        const filler = " Second sentence that pads the purpose well past the cut-off length for a row, so the blurb has to be cut short.";
        const rules = {
          paren: ["Techniques for driving a browser (Node toolchains, e.g. Playwright + a dev server).", "Techniques for driving a browser (Node toolchains, e.g. Playwright + a dev server)."],
          eg: ["Use a tool, e.g. Playwright, for checks.", "Use a tool, e.g. Playwright, for checks."],
          etc: ["Covers lint, format etc. and the rest of it.", "Covers lint, format etc. and the rest of it."],
          inner: ["Gates (see one. Two) live in build-verification.md here.", "Gates (see one. Two) live in build-verification.md here."],
        };
        for (const [name, [first]] of Object.entries(rules)) kit.write(`project/shared/rules/${name}.md`, `# ${name}\n\n${first}${filler}\n`);
        kit.write("project/shared/rules/whole.md", `# whole\n\n${"no sentence end at all ".repeat(8)}\n`);
        kit.commit("rules with long purposes");
        persist(d);
        const run = apply(kit, d);
        const after = read(d, ".claude/CLAUDE.md");
        const rowOf = (name) => after.split("\n").find((line) => line.startsWith(`| \`.claude/rules/${name}.md\``)) ?? "";
        check(
          "rules table: the blurb cuts at a sentence end — never at e.g./etc. or inside parentheses; no sentence end keeps it whole",
          run.status === 0 && Object.entries(rules).every(([name, [, expected]]) => rowOf(name) === `| \`.claude/rules/${name}.md\` | ${expected} |`) && rowOf("whole") === `| \`.claude/rules/whole.md\` | ${"no sentence end at all ".repeat(8).trim()} |`,
          after,
        );
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        const plan = { actions: [{ kind: "add", kit: BLOB_A, target: "../escape.md" }], held: [], notes: [] };
        let thrown = null;
        try {
          applyMod.applyPlan(kit.dir, d.project, d.rec, plan);
        } catch (error) {
          thrown = error;
        }
        check("apply: a target outside the project is refused before anything is written", thrown?.name === "Refusal" && !existsSync(join(dirname(d.project), "escape.md")) && backups(kit).length === 0, String(thrown));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/domains/web/skills/s1/SKILL.md", "---\nname: s1\ndescription: v2\n---\n");
        kit.write("project/domains/web/skills/s1/references/r.md", "# Ref v2\n");
        kit.commit("revise s1");
        const elsewhere = join(dirname(d.project), "elsewhere");
        mkdirSync(elsewhere);
        writeFileSync(join(elsewhere, "r.md"), "# Ref\n");
        rmSync(d.abs(".claude/skills/s1/references"), { recursive: true });
        symlinkSync(elsewhere, d.abs(".claude/skills/s1/references"));
        const plan = planProject(kit.dir, d.project, d.rec);
        check(
          "plan: a symlink inside a kit skill blocks the whole skill",
          plan.actions.length === 0 && plan.held.length === 0 && notesOf(plan, "symlink").length >= 1 && plan.notes.every((n) => n.kind === "symlink"),
          show(plan),
        );
        rmSync(d.abs(".claude/skills/s1/references"));
        mkdirSync(d.abs(".claude/skills/s1/references"));
        const unblockedByDelete = planProject(kit.dir, d.project, d.rec);
        check(
          "plan: a file the project removed from a skill does not block it",
          kinds(unblockedByDelete, "replace").some((a) => a.kit === `${SKILL}/SKILL.md`) && notesOf(unblockedByDelete, "removed-by-project").length === 1 && unblockedByDelete.held.length === 0,
          show(unblockedByDelete),
        );
      }
      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", "# Rule A\n\nnew text\n");
        kit.commit("revise a");
        persist(d);
        const outside = join(dirname(d.project), "outside");
        renameSync(d.abs(".claude"), outside);
        symlinkSync(outside, d.abs(".claude"));
        const snapshot = () => {
          const seen = {};
          const walk = (rel) => {
            for (const name of readdirSync(join(outside, rel)).sort()) {
              const path = join(rel, name);
              if (lstatSync(join(outside, path)).isDirectory()) walk(path);
              else seen[path] = readFileSync(join(outside, path)).toString("base64");
            }
          };
          walk("");
          return JSON.stringify(seen);
        };
        const before = snapshot();
        const linkedPlan = planProject(kit.dir, d.project, d.rec);
        check("plan: a symlinked .claude yields symlink notes only, no action", noWork(linkedPlan) && linkedPlan.notes.length > 0 && linkedPlan.notes.every((n) => n.kind === "symlink"), show(linkedPlan));
        const run = apply(kit, d);
        check("apply: a symlinked .claude is refused and nothing outside the project changes", run.status === 1 && run.stdout.includes("REFUSED") && snapshot() === before && backups(kit).length === 0, out(run));
        const fake = join(dirname(d.project), "fake-backup");
        mkdirSync(join(fake, ".claude", "rules"), { recursive: true });
        writeFileSync(join(fake, "project.json"), JSON.stringify({ projectDir: d.project }));
        writeFileSync(join(fake, "added.json"), JSON.stringify([".claude/rules/a.md"]));
        writeFileSync(join(fake, ".claude", "rules", "planted.md"), "planted\n");
        const back = tool(kit.dir, ["--restore", fake]);
        check("restore: a symlinked .claude is refused and nothing outside the project changes", back.status === 1 && back.stdout.includes("REFUSED") && snapshot() === before, out(back));
      }

      if (process.getuid?.() !== 0) {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", "# Rule A\n\nnew text\n");
        kit.commit("revise a");
        persist(d);
        const original = read(d, ".claude/rules/a.md");
        const recordBefore = read(d, ".claude/kit-delivery.json");
        chmodSync(d.abs(".claude/rules/a.md"), 0o444);
        const run = apply(kit, d);
        const backup = backupOf(run) ?? "";
        check(
          "apply: a write failing after the backup still prints the backup path and the restore command, exit 1",
          run.status === 1 && existsSync(join(backup, "project.json")) && run.stdout.includes(`--restore ${backup}`) && read(d, ".claude/kit-delivery.json") === recordBefore,
          out(run),
        );
        chmodSync(d.abs(".claude/rules/a.md"), 0o644);
        const undone = tool(kit.dir, ["--restore", backup]);
        check("restore: undoes a run that failed midway", undone.status === 0 && read(d, ".claude/rules/a.md") === original, out(undone));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        kit.write("project/shared/rules/a.md", `${RULE_A}kit addition\n`);
        kit.commit("kit adds a line");
        const edited = RULE_A.replace("Keep things", "Keep everything");
        writeFileSync(d.abs(".claude/rules/a.md"), edited);
        persist(d);
        const run = apply(kit, d, ["--resolved", BLOB_A]);
        check("apply: --resolved on a file that now merges cleanly says a plain --apply will take it", run.status === 1 && run.stdout.includes("plain --apply") && read(d, ".claude/rules/a.md") === edited && readRec(d.project).files[BLOB_A] === d.rec.files[BLOB_A], out(run));
      }

      {
        const kit = makeKit();
        const d = deliverAll(kit);
        const dir = join(dirname(d.project), "some-backup");
        const exitOf = (args) => tool(kit.dir, args).status;
        check(
          "flags: --resolved rejects a flag-like value; --restore stands alone",
          exitOf(["--apply", "--resolved", "--apply", d.project]) === 2 && exitOf(["--apply", d.project, "--resolved"]) === 2 && exitOf(["--restore", dir, "--apply"]) === 2 && exitOf(["--restore", dir, d.project]) === 2 && exitOf(["--restore", dir, "--apply", "--resolved", BLOB_A, d.project]) === 2 && exitOf(["--restore", "--apply"]) === 2,
        );
      }

    {
      const settingsMod = await import(join(TOOLS, "settings.mjs"));
      const rulesMod = await import(join(TOOLS, "rules-table.mjs"));
      const WRAP = (script) => `if command -v wsl >/dev/null 2>&1; then MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL=* wsl -d ubuntu bash -lc 'node ".claude/hooks/${script}"'; else node ".claude/hooks/${script}"; fi`;
      const bare = (script) => `node ".claude/hooks/${script}"`;
      const group = (matcher, ...commands) => ({ matcher, hooks: commands.map((command) => ({ type: "command", command })) });
      const FMT_HOOKS = JSON.stringify({ "//": "comment", hooks: { "//": "x", PostToolUse: [group("Write|Edit", bare("fmt.mjs"))] } }, null, 2);
      const kitWithHooks = (hooksJson = FMT_HOOKS) => {
        const kit = makeKit();
        kit.write("project/shared/hooks.json", hooksJson);
        kit.commit("register fmt");
        return kit;
      };
      const deliverPersisted = (kit) => {
        const d = deliverAll(kit);
        persist(d);
        return d;
      };
      const settingsOf = (d) => JSON.parse(read(d, ".claude/settings.json"));

      {
        const kit = kitWithHooks();
        const d = deliverPersisted(kit);
        const composed = settingsMod.composeHooks(kit.dir, d.rec);
        check(
          "settings: compose drops // keys at every level and wraps every command",
          JSON.stringify(composed) === JSON.stringify({ hooks: { PostToolUse: [group("Write|Edit", WRAP("fmt.mjs"))] } }),
          JSON.stringify(composed),
        );
        check("settings: wrapping is idempotent", settingsMod.wrapCommand(WRAP("fmt.mjs")) === WRAP("fmt.mjs") && settingsMod.wrapCommand(bare("fmt.mjs")) === WRAP("fmt.mjs"));
        const run = apply(kit, d);
        check("settings: missing file created with wrapped command", run.status === 0 && JSON.stringify(settingsOf(d)) === JSON.stringify({ hooks: { PostToolUse: [group("Write|Edit", WRAP("fmt.mjs"))] } }) && read(d, ".claude/settings.json").endsWith("}\n"), out(run));
        check("settings: report says created with the registered hook", /^Settings:\n\s+- \.claude\/settings\.json created\n\s+- registered PostToolUse \[Write\|Edit\] fmt\.mjs$/m.test(run.stdout), run.stdout);
        const backup = backupOf(run) ?? "";
        check("settings: a created file is listed in added.json and has no backup copy", JSON.parse(readFileSync(join(backup, "added.json"), "utf8")).includes(".claude/settings.json") && !existsSync(join(backup, ".claude/settings.json")), backup);
        const again = apply(kit, d);
        check("settings: re-running changes nothing and takes no backup", again.status === 0 && /^Settings:\n\s+- \.claude\/settings\.json unchanged$/m.test(again.stdout) && /^Backup path: none$/m.test(again.stdout) && backups(kit).length === 1, out(again));
        persist({ project: d.project, rec: { ...readRec(d.project), delivered: { ...readRec(d.project).delivered, date: "2001-01-01" } } });
        const recBytes = readFileSync(d.abs(".claude/kit-delivery.json"));
        writeFileSync(d.abs(".claude/settings.json"), "{}");
        const repaired = apply(kit, d);
        check(
          "settings: a settings-only change backs up, re-registers and leaves the record alone",
          repaired.status === 0 && JSON.stringify(settingsOf(d)) === JSON.stringify({ hooks: { PostToolUse: [group("Write|Edit", WRAP("fmt.mjs"))] } }) && readFileSync(d.abs(".claude/kit-delivery.json")).equals(recBytes) && readFileSync(join(backupOf(repaired), ".claude/settings.json"), "utf8") === "{}" && backups(kit).length === 2,
          out(repaired),
        );
        const undone = tool(kit.dir, ["--restore", backup]);
        check("settings: restore removes the created file", undone.status === 0 && !existsSync(d.abs(".claude/settings.json")), out(undone));
      }

      {
        const kit = kitWithHooks();
        const d = deliverPersisted(kit);
        const existing = {
          outputStyle: "Concise",
          permissions: { allow: ["Bash(ls)"] },
          hooks: {
            PostToolUse: [group("Write|Edit", bare("fmt.mjs")), group("Bash", 'node "scripts/mine.mjs"'), group("Write", bare("fmt.mjs"), 'node "scripts/also-mine.mjs"')],
            Stop: [group("", 'node "scripts/stop.mjs"')],
          },
        };
        writeFileSync(d.abs(".claude/settings.json"), `${JSON.stringify(existing, null, 4)}\n`);
        const before = read(d, ".claude/settings.json");
        const run = apply(kit, d);
        const after = settingsOf(d);
        check(
          "settings: user hook kept, managed replaced, outputStyle-like key kept",
          run.status === 0 && after.outputStyle === "Concise" && JSON.stringify(after.permissions) === JSON.stringify(existing.permissions) && JSON.stringify(after.hooks.Stop) === JSON.stringify(existing.hooks.Stop) && JSON.stringify(after.hooks.PostToolUse) === JSON.stringify([group("Bash", 'node "scripts/mine.mjs"'), group("Write", 'node "scripts/also-mine.mjs"'), group("Write|Edit", WRAP("fmt.mjs"))]),
          read(d, ".claude/settings.json"),
        );
        check("settings: the backup holds the old settings.json byte for byte", readFileSync(join(backupOf(run), ".claude/settings.json"), "utf8") === before && /\.claude\/settings\.json updated/.test(run.stdout), run.stdout);
      }

      {
        const kit = kitWithHooks();
        const d = deliverPersisted(kit);
        const sameSemantics = JSON.stringify({ hooks: { PostToolUse: [group("Write|Edit", WRAP("fmt.mjs"))] } }, null, 4);
        writeFileSync(d.abs(".claude/settings.json"), sameSemantics);
        const run = apply(kit, d);
        check("settings: equal content in another layout is not rewritten", run.status === 0 && read(d, ".claude/settings.json") === sameSemantics && backups(kit).length === 0, out(run));
      }

      {
        const kit = kitWithHooks();
        const d = deliverPersisted(kit);
        d.rec.skip = ["shared/hooks/fmt.mjs"];
        persist(d);
        const composed = settingsMod.composeHooks(kit.dir, d.rec);
        check("settings: skipped hook not registered", JSON.stringify(composed) === JSON.stringify({ hooks: {} }), JSON.stringify(composed));
        const run = apply(kit, d);
        check("settings: a skipped hook with no other hooks creates no settings.json", run.status === 0 && !existsSync(d.abs(".claude/settings.json")) && /^Settings: none$/m.test(run.stdout), out(run));
        writeFileSync(d.abs(".claude/settings.json"), JSON.stringify({ keep: 1, hooks: { PostToolUse: [group("Write|Edit", WRAP("fmt.mjs"))], Stop: [group("", bare("fmt.mjs"))] } }));
        const dropped = apply(kit, d);
        check(
          "settings: a previously registered hook that is now skipped is removed, emptied event dropped",
          dropped.status === 0 && JSON.stringify(settingsOf(d)) === JSON.stringify({ keep: 1, hooks: {} }) && /unregistered PostToolUse \[Write\|Edit\] fmt\.mjs/.test(dropped.stdout),
          dropped.stdout + read(d, ".claude/settings.json"),
        );
      }

      {
        const bucketHooks = JSON.stringify({ hooks: { PostToolUse: [group("Write", bare("lint.mjs"))] } });
        const kit = kitWithHooks();
        kit.write("project/domains/web/hooks.json", bucketHooks);
        kit.write("project/domains/web/hooks/lint.mjs", "// lint\n");
        kit.write("project/shared/hooks.json", JSON.stringify({ hooks: { PostToolUse: [group("Write|Edit", bare("fmt.mjs"))], PreToolUse: [group("Bash", bare("fmt.mjs"))] } }));
        kit.commit("a domain hook");
        const d = deliverPersisted(kit);
        const composed = settingsMod.composeHooks(kit.dir, d.rec);
        check("settings: events concatenate in bucket order, shared first", composed.hooks.PostToolUse.map((g) => g.matcher).join() === "Write|Edit,Write" && "PreToolUse" in composed.hooks, JSON.stringify(composed));
        const inactive = settingsMod.composeHooks(kit.dir, { ...d.rec, tiers: { ...d.rec.tiers, domains: [] } });
        check("settings: an inactive bucket's hooks.json is not composed", inactive.hooks.PostToolUse.length === 1, JSON.stringify(inactive));
      }

      {
        const kit = kitWithHooks();
        const d = deliverPersisted(kit);
        const broken = '{ "hooks": ';
        writeFileSync(d.abs(".claude/settings.json"), broken);
        kit.write("project/shared/rules/a.md", "# Rule A\n\nnew text\n");
        kit.commit("revise a");
        const run = apply(kit, d);
        check(
          "settings: invalid JSON is refused naming the path, nothing written",
          run.status === 1 && run.stdout.includes("REFUSED") && run.stdout.includes(d.abs(".claude/settings.json")) && read(d, ".claude/settings.json") === broken && read(d, ".claude/rules/a.md") === RULE_A && backups(kit).length === 0,
          out(run),
        );
        writeFileSync(d.abs(".claude/settings.json"), "[]");
        const notObject = apply(kit, d);
        check("settings: a JSON value that is not an object is refused", notObject.status === 1 && notObject.stdout.includes("REFUSED") && read(d, ".claude/settings.json") === "[]", out(notObject));
      }

      {
        const kit = kitWithHooks();
        const d = deliverPersisted(kit);
        const outside = join(dirname(d.project), "settings-elsewhere.json");
        writeFileSync(outside, "{}");
        symlinkSync(outside, d.abs(".claude/settings.json"));
        const run = apply(kit, d);
        check("settings: a symlinked settings.json is refused and the target untouched", run.status === 1 && run.stdout.includes("REFUSED") && readFileSync(outside, "utf8") === "{}", out(run));
      }

      const TABLE = "| Rule file | Covers |\n| --- | --- |\n| `.claude/rules/a.md` | A things |\n| `.claude/rules/node/b.md` | B things |\n";
      const DOC = (table) => `@work/session.md\n\n# Project\n\n| Dev | \`npm run dev\` |\n\n## Rules\n\nRead the rule first:\n\n${table}\n## Constraints\n\n- keep it\n`;

      {
        const upd = rulesMod.updateRulesTable;
        const doc = DOC(TABLE);
        const added = upd(doc, [{ target: ".claude/rules/node/c.md", purpose: "C things" }], []);
        check(
          "rules table: added rule gets a row with its purpose",
          !added.missingTable && added.text === DOC(`${TABLE}| \`.claude/rules/node/c.md\` | C things |\n`) && JSON.stringify(added.changed) === JSON.stringify(["added .claude/rules/node/c.md"]),
          JSON.stringify(added),
        );
        const removed = upd(doc, [], [".claude/rules/node/b.md"]);
        check("rules table: retired rule row removed", removed.text === DOC("| Rule file | Covers |\n| --- | --- |\n| `.claude/rules/a.md` | A things |\n") && JSON.stringify(removed.changed) === JSON.stringify(["removed .claude/rules/node/b.md"]), JSON.stringify(removed));
        const none = upd("# Project\n\n## Constraints\n\n- keep it\n", [{ target: ".claude/rules/x.md", purpose: "X" }], []);
        check("rules table: no table → missingTable, CLAUDE.md unchanged", none.missingTable === true && none.text === "# Project\n\n## Constraints\n\n- keep it\n" && none.changed.length === 0);
        const headingOnly = upd("## Rules\n\nSee the rules folder.\n\n## Next\n\n| a | b |\n| - | - |\n", [{ target: ".claude/rules/x.md", purpose: "X" }], []);
        check("rules table: a table outside the Rules section is not used", headingOnly.missingTable === true && headingOnly.changed.length === 0);
        const both = upd(doc, [{ target: ".claude/rules/node/c.md", purpose: "C things" }, { target: ".claude/rules/d.md", purpose: "D | things" }], [".claude/rules/a.md"]);
        const outsideTable = (text) => text.split("\n").filter((line) => !line.startsWith("|")).join("\n");
        check("rules table: only the table changes", outsideTable(both.text) === outsideTable(doc) && both.text.split("\n")[0] === "@work/session.md" && both.text.includes("| Dev | `npm run dev` |"), both.text);
        check("rules table: header and separator rows are never touched, a pipe in a purpose is escaped", both.text.includes("| Rule file | Covers |\n| --- | --- |\n") && both.text.includes("D \\| things |") && !both.text.includes("`.claude/rules/a.md`"), both.text);

        const short = DOC("| Rule file | Covers |\n|---|---|\n| `rules/a.md` | A things |\n| `rules/node/b.md` | B things |\n");
        const prefixed = upd(short, [{ target: ".claude/rules/node/c.md", purpose: "C things" }], []);
        check("rules table: a table written with rules/ paths gets rules/ rows", prefixed.text.includes("| `rules/node/c.md` | C things |\n") && !prefixed.text.includes("`.claude/rules/node/c.md`"), prefixed.text);
        const matched = upd(short, [{ target: ".claude/rules/a.md", purpose: "other" }], [".claude/rules/node/b.md"]);
        check("rules table: a row matches across prefix styles — no duplicate add, remove finds the short path", matched.text === DOC("| Rule file | Covers |\n|---|---|\n| `rules/a.md` | A things |\n") && JSON.stringify(matched.changed) === JSON.stringify(["removed .claude/rules/node/b.md"]), JSON.stringify(matched));
        const twice = upd(added.text, [{ target: ".claude/rules/node/c.md", purpose: "C things" }], [".claude/rules/zzz.md"]);
        check("rules table: applying the same change again is a no-op", twice.text === added.text && twice.changed.length === 0);
        const empty = upd(DOC("| Rule file | Covers |\n| --- | --- |\n"), [{ target: ".claude/rules/a.md", purpose: "A things" }], []);
        check("rules table: an empty table gets .claude/rules/ rows", empty.text.includes("| `.claude/rules/a.md` | A things |\n"), empty.text);
        const crlf = upd(DOC(TABLE).replace(/\n/g, "\r\n"), [{ target: ".claude/rules/node/c.md", purpose: "C things" }], []);
        check("rules table: CRLF kept on the new row", crlf.text.includes("| `.claude/rules/node/c.md` | C things |\r\n") && !/[^\r]\n/.test(crlf.text));
        const withHeading = upd("# P\n\n## Rules — Always Apply\n\n**Shared**\n| Rule file | Covers |\n|---|---|\n| `rules/a.md` | A |\n\n**Other**\n| Rule file | Covers |\n|---|---|\n| `rules/q.md` | Q |\n", [{ target: ".claude/rules/n.md", purpose: "N" }], []);
        check("rules table: a heading with a suffix counts, and only the first table is edited", withHeading.text.includes("| `rules/a.md` | A |\n| `rules/n.md` | N |\n\n**Other**") && withHeading.text.includes("| `rules/q.md` | Q |\n"), withHeading.text);
      }

      {
        const kit = makeKit();
        const d = deliverPersisted(kit);
        const claude = "# P\n\n## Rules\n\n| Rule file | Covers |\n| --- | --- |\n| `.claude/rules/a.md` | Keep things small. |\n| `.claude/rules/node/b.md` | Node specifics. |\n\n## After\n\ntext\n";
        writeFileSync(d.abs(".claude/CLAUDE.md"), claude);
        kit.write("project/shared/rules/new.md", `# New\n\nA long first sentence that keeps going. ${"Filler ".repeat(30)}\n`);
        kit.git("mv", "project/stacks/node/rules/b.md", "project/stacks/node/rules/c.md");
        kit.write("project/shared/rules/a.md", "# Rule A\n\nrevised\n");
        kit.commit("add new, rename b to c, revise a");
        persist(d);
        const run = apply(kit, d);
        const after = read(d, ".claude/CLAUDE.md");
        const lines = after.split("\n");
        check(
          "rules table: apply adds the new rule and the renamed one, removes the retired path, leaves the replaced rule's row",
          run.status === 0 && after.includes("| `.claude/rules/a.md` | Keep things small. |") && !after.includes("rules/node/b.md") && after.includes("| `.claude/rules/node/c.md` | Node specifics. |") && after.includes("| `.claude/rules/new.md` | A long first sentence that keeps going. |") && after.endsWith("## After\n\ntext\n"),
          after,
        );
        check("rules table: report lists the rows added and removed", /^Rules table:\n(\s+- (added|removed) .+\n){3}/m.test(run.stdout) && run.stdout.includes("removed .claude/rules/node/b.md"), run.stdout);
        check("rules table: the backup holds the old CLAUDE.md", readFileSync(join(backupOf(run), ".claude/CLAUDE.md"), "utf8") === claude, backupOf(run));
        check("rules table: the table is the only part that changed", lines.slice(0, 5).join("\n") === "# P\n\n## Rules\n\n| Rule file | Covers |", after.split("## After")[1] === claude.split("## After")[1]);
        const again = apply(kit, d);
        check("rules table: a second run changes nothing", again.status === 0 && read(d, ".claude/CLAUDE.md") === after && backups(kit).length === 1, out(again));
        const undone = tool(kit.dir, ["--restore", backupOf(run)]);
        check("rules table: restore brings CLAUDE.md back", undone.status === 0 && read(d, ".claude/CLAUDE.md") === claude, out(undone));
      }

      {
        const upd = rulesMod.updateRulesTable;
        const grouped = "# P\n\n## Rules\n\n**Shared**\n\n| Rule file | Covers |\n|---|---|\n| `rules/a.md` | A |\n\n**node/**\n\n| Rule file | Covers |\n|---|---|\n| `rules/node/b.md` | B |\n| `rules/node/old.md` | Old |\n\n**web-frontend/**\n\n| Rule file | Covers |\n|---|---|\n| `rules/web-frontend/w.md` | W |\n\n## After\n\n| x | y |\n|---|---|\n| `rules/zz.md` | not a rule table row |\n";
        const result = upd(grouped, [{ target: ".claude/rules/node/tailwind.md", purpose: "Tw" }, { target: ".claude/rules/shared-new.md", purpose: "S" }, { target: ".claude/rules/web-frontend/v.md", purpose: "V" }], [".claude/rules/node/old.md", ".claude/rules/gone.md"]);
        const expected = grouped
          .replace("| `rules/a.md` | A |\n", "| `rules/a.md` | A |\n| `rules/shared-new.md` | S |\n")
          .replace("| `rules/node/b.md` | B |\n| `rules/node/old.md` | Old |\n", "| `rules/node/b.md` | B |\n| `rules/node/tailwind.md` | Tw |\n")
          .replace("| `rules/web-frontend/w.md` | W |\n", "| `rules/web-frontend/w.md` | W |\n| `rules/web-frontend/v.md` | V |\n");
        check("rules table: three tables — each new row lands in the table sharing its directory, the retired row leaves a later table, nothing else moves", result.text === expected, result.text);
        check("rules table: a retired rule with no row is reported as unmatched", JSON.stringify(result.unmatched) === JSON.stringify([".claude/rules/gone.md"]) && result.changed.includes("removed .claude/rules/node/old.md"), JSON.stringify(result));
        const unknownDir = upd(grouped, [{ target: ".claude/rules/other/z.md", purpose: "Z" }], []);
        check("rules table: a rule whose directory no table holds goes to the first table", unknownDir.text.includes("| `rules/a.md` | A |\n| `rules/other/z.md` | Z |\n"), unknownDir.text);
      }

      {
        const kit = kitWithHooks();
        const d = deliverPersisted(kit);
        writeFileSync(d.abs(".claude/CLAUDE.md"), "# P\n\n## Rules\n\n| Rule file | Covers |\n| --- | --- |\n| `.claude/rules/a.md` | A |\n| `.claude/rules/node/b.md` | B |\n");
        kit.write("project/shared/rules/new.md", "# New\n\nNew.\n");
        kit.git("rm", "-q", "project/stacks/node/rules/b.md");
        kit.write("project/stacks/node/rules/keep.md", "# Keep\n");
        kit.commit("add new, retire b");
        const snapshot = () => JSON.stringify(["CLAUDE.md", "kit-delivery.json", "rules/a.md", "rules/new.md", "rules/node/b.md", "settings.json"].map((rel) => (existsSync(d.abs(`.claude/${rel}`)) ? readFileSync(d.abs(`.claude/${rel}`)).toString("base64") : null)));
        const before = snapshot();
        const dry = tool(kit.dir, [d.project]);
        check(
          "dry run: names the settings and Rules table changes and writes nothing",
          dry.status === 0 && snapshot() === before && !existsSync(join(kit.dir, "tmp")) && /^Settings:\n\s+- \.claude\/settings\.json would be created\n\s+- would register PostToolUse \[Write\|Edit\] fmt\.mjs$/m.test(dry.stdout) && /^Rules table:\n\s+- would remove .claude\/rules\/node\/b\.md\n\s+- would add .claude\/rules\/new\.md\n\s+- would add .claude\/rules\/node\/keep\.md$/m.test(dry.stdout),
          out(dry),
        );
        const quiet = kitWithHooks();
        const q = deliverPersisted(quiet);
        apply(quiet, q);
        const idle = tool(quiet.dir, [q.project]);
        check("dry run: with nothing to change, settings read unchanged and the Rules table says none", /^Settings:\n\s+- \.claude\/settings\.json unchanged$/m.test(idle.stdout) && /^Rules table: none$/m.test(idle.stdout), out(idle));
        const plain = makeKit();
        const p = deliverPersisted(plain);
        plain.write("project/shared/rules/new.md", "# New\n\nNew.\n");
        plain.commit("add new");
        const missing = tool(plain.dir, [p.project]);
        check("dry run: no Rules table is said so", /^Rules table:\n\s+- no Rules table — not edited$/m.test(missing.stdout), out(missing));
        const invalid = d.abs(".claude/settings.json");
        writeFileSync(invalid, "{ nope");
        const refused = tool(kit.dir, [d.project]);
        check("dry run: invalid settings.json is refused the same way an apply would", refused.status === 1 && refused.stdout.includes("REFUSED") && refused.stdout.includes(invalid), out(refused));
      }

      {
        const kit = kitWithHooks();
        const d = deliverPersisted(kit);
        const cases = [
          ["hooks is a list", { hooks: [] }],
          ["an event is not a list", { hooks: { PostToolUse: { matcher: "x" } } }],
          ["a group is a string", { hooks: { PostToolUse: ["node x"] } }],
          ["a group's hooks is an object", { hooks: { PostToolUse: [{ matcher: "x", hooks: { command: "node x" } }] } }],
          ["a hook is null", { hooks: { PostToolUse: [{ matcher: "x", hooks: [null] }] } }],
        ];
        const results = cases.map(([name, content]) => {
          const text = JSON.stringify(content);
          writeFileSync(d.abs(".claude/settings.json"), text);
          const run = apply(kit, d);
          return { name, ok: run.status === 1 && run.stdout.includes("REFUSED") && run.stdout.includes(d.abs(".claude/settings.json")) && !run.stderr && read(d, ".claude/settings.json") === text, run };
        });
        check("settings: a malformed hooks section is refused naming the path, never a TypeError", results.every((r) => r.ok), JSON.stringify(results.filter((r) => !r.ok).map((r) => [r.name, out(r.run)])));
      }

      {
        const kit = makeKit();
        const d = deliverPersisted(kit);
        kit.write("project/shared/rules/new.md", "# New\n\nNew.\n");
        kit.commit("add new");
        const noTable = apply(kit, d);
        check("rules table: no CLAUDE.md → reported, never created", noTable.status === 0 && !existsSync(d.abs(".claude/CLAUDE.md")) && /^Rules table:\n\s+- no Rules table — not edited$/m.test(noTable.stdout), out(noTable));
        const kit2 = makeKit();
        const d2 = deliverAll(kit2);
        const bareDoc = "# P\n\n## Constraints\n\n- x\n";
        writeFileSync(d2.abs(".claude/CLAUDE.md"), bareDoc);
        kit2.write("project/shared/rules/new.md", "# New\n\nNew.\n");
        kit2.commit("add new");
        const noRules = apply(kit2, d2);
        check("rules table: CLAUDE.md without a Rules table is reported and left byte-identical", noRules.status === 0 && read(d2, ".claude/CLAUDE.md") === bareDoc && /no Rules table — not edited/.test(noRules.stdout), out(noRules));
      }
    }
    }
  }
  {
    const recordMod = await import(join(TOOLS, "record.mjs"));
    const TIERS = { domains: ["web"], stacks: ["node"], repo: null };
    const headOf = (kit) => kit.git("rev-parse", "HEAD").trim();
    const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
    const recordOf = (project) => readJson(join(project, ".claude", "kit-delivery.json"));

    // a project holding every active file as the kit had it at `commit`; `delivered` stays null unless given
    function seed(kit, parent, name, { commit = "HEAD", recordFiles = true, delivered = null, tiers = TIERS, skip = [] } = {}) {
      const project = makeProject(name, validRecord({ tiers, skip, delivered }), parent);
      const files = {};
      for (const e of catalogOf(kit).entries) {
        for (const f of e.files) {
          const blob = kitMod.blobAt(kit.dir, commit, f);
          if (!blob) continue;
          const dest = e.type === "skills" ? join(e.target, f.slice(e.kit.length + 1)) : e.target;
          mkdirSync(dirname(join(project, dest)), { recursive: true });
          writeFileSync(join(project, dest), kitMod.readBlob(kit.dir, blob));
          files[f] = blob;
        }
      }
      if (recordFiles) writeFileSync(join(project, ".claude", "kit-delivery.json"), JSON.stringify(validRecord({ tiers, skip, delivered, files }), null, 2));
      return { project, abs: (rel) => join(project, rel), files };
    }
    const treeOf = (dir, rel = "") => readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? treeOf(dir, join(rel, e.name)) : [`${join(rel, e.name)}\0${readFileSync(join(dir, rel, e.name), "utf8")}`]));
    const stamp = (kit) => ({ delivered: { commit: headOf(kit), date: "2026-10-01" } });

    {
      const family = makeFamily();
      const kit = makeKit(family);
      const d = seed(kit, family, "p", { delivered: stamp(kit).delivered });
      kit.write("project/shared/rules/a.md", "# Rule A\n\nsecond\n");
      kit.commit("touch a");
      kit.write("README.md", "outside project/\n");
      kit.commit("not the project tier");
      kit.write("project/stacks/node/rules/b.md", "# Rule B\n\nsecond\n");
      kit.commit("touch b");
      const st = recordMod.status(kit.dir, d.project);
      check("status: behind counts kit commits since delivered that touch project/", st.behind === 2 && st.delivered.date === "2026-10-01", JSON.stringify(st));
      const run = tool(kit.dir, ["--status", d.project]);
      check("status: CLI prints delivered, behind and owed, exit 0 although files are owed", run.status === 0 && /^delivered: [0-9a-f]{7} \(2026-10-01\)$/m.test(run.stdout) && /^behind: 2 kit commit\(s\) since delivered$/m.test(run.stdout) && /^owed:\n\s+- shared\/rules\/a\.md\n\s+- stacks\/node\/rules\/b\.md$/m.test(run.stdout), out(run));
    }

    {
      const kit = makeKit();
      const d = seed(kit, undefined, "p");
      const st = recordMod.status(kit.dir, d.project);
      check("status: never delivered -> delivered null, behind null; files recorded at HEAD are not owed", st.delivered === null && st.behind === null && st.owed.length === 0, JSON.stringify(st));
      const run = tool(kit.dir, ["--status", d.project]);
      check("status: CLI says never for a null delivered", /^delivered: never$/m.test(run.stdout) && /^behind: never delivered$/m.test(run.stdout), out(run));
      const gone = seed(kit, undefined, "q", { delivered: { commit: "0".repeat(40), date: "2026-10-01" } });
      const lost = tool(kit.dir, ["--status", gone.project]);
      check("status: a delivered commit the kit no longer holds reads as unknown, not an error", lost.status === 0 && /^behind: unknown/m.test(lost.stdout), out(lost));
    }

    {
      const kit = makeKit();
      const original = headOf(kit);
      const recorded = seed(kit, undefined, "p", { delivered: stamp(kit).delivered });
      kit.write("project/shared/rules/a.md", "# Rule A\n\nrevised\n");
      kit.write("project/stacks/node/rules/b.md", "# Rule B\n\nrevised\n");
      kit.write("project/shared/rules/fresh.md", "# Fresh\n\nNew.\n");
      kit.write("project/domains/web/skills/s1/SKILL.md", "---\nname: s1\ndescription: v2\n---\n");
      kit.commit("evolve");
      rmSync(recorded.abs(".claude/rules/node/b.md"));
      const st = recordMod.status(kit.dir, recorded.project);
      check(
        "status: owed = unrecorded or stale entries; a never-delivered file counts, a file the project removed does not",
        JSON.stringify(st.owed) === JSON.stringify(["shared/rules/a.md", "shared/rules/fresh.md", "domains/web/skills/s1/SKILL.md"]),
        JSON.stringify(st.owed),
      );
      const optOut = seed(kit, undefined, "q", { commit: original, delivered: stamp(kit).delivered, skip: ["shared/rules/a.md", "domains/web/skills/s1"], tiers: { domains: ["web"], stacks: [], repo: null } });
      const stOut = recordMod.status(kit.dir, optOut.project);
      check("status: skipped files and inactive tiers are never owed", JSON.stringify(stOut.owed) === JSON.stringify(["shared/rules/fresh.md"]), JSON.stringify(stOut.owed));
    }

    {
      const kit = makeKit();
      const d = seed(kit, undefined, "p");
      kit.write("project/shared/rules/a.md", "# Rule A\n\nrevised\n");
      kit.commit("evolve");
      const before = treeOf(d.project);
      const run = tool(kit.dir, ["--status", d.project]);
      check("status: writes nothing — project tree identical, no kit backup folder", run.status === 0 && JSON.stringify(treeOf(d.project)) === JSON.stringify(before) && !existsSync(join(kit.dir, "tmp")), out(run));
      kit.write("project/shared/rules/a.md", "# Rule A\n\ndirty\n");
      const dirty = tool(kit.dir, ["--status", d.project]);
      check("status: refuses a dirty project/ like the default mode", dirty.status === 1 && dirty.stdout.includes("REFUSED") && dirty.stdout.includes("uncommitted"), out(dirty));
      kit.git("checkout", "-q", "--", "project/shared/rules/a.md");
      kit.git("checkout", "-q", "-b", "side");
      const off = tool(kit.dir, ["--status", d.project]);
      check("status: refuses a HEAD that is not main", off.status === 1 && off.stdout.includes("not main"), out(off));
    }

    {
      const family = makeFamily();
      const kit = makeKit(family);
      mkdirSync(join(kit.dir, ".claude"), { recursive: true });
      writeFileSync(join(kit.dir, ".claude", "kit-delivery.json"), JSON.stringify(validRecord()));
      const b = seed(kit, family, "bravo");
      const a = seed(kit, family, "alpha");
      mkdirSync(join(family, "plain", ".claude"), { recursive: true });
      mkdirSync(join(family, "bare"), { recursive: true });
      writeFileSync(join(family, "stray.txt"), "not a dir");
      check("findProjects: dirs next to the kit holding a record, sorted, kit excluded", JSON.stringify(recordMod.findProjects(kit.dir)) === JSON.stringify([a.project, b.project]), JSON.stringify(recordMod.findProjects(kit.dir)));

      kit.write("project/shared/rules/a.md", "# Rule A\n\nrevised\n");
      kit.commit("evolve");
      const all = tool(kit.dir, ["--all"]);
      const one = ["alpha", "bravo"].map((n) => tool(kit.dir, [join(family, n)]).stdout).join("");
      check("--all: dry run covers each project in name order, same text as running them one by one", all.status === 0 && all.stdout === one && all.stdout.indexOf("== alpha ==") < all.stdout.indexOf("== bravo =="), out(all));
      const status = tool(kit.dir, ["--status", "--all"]);
      const stOne = ["alpha", "bravo"].map((n) => tool(kit.dir, ["--status", join(family, n)]).stdout).join("");
      check("--all --status: one block per project, identical to running each", status.status === 0 && status.stdout === stOne && status.stdout.includes("== alpha ==") && status.stdout.includes("== bravo =="), out(status));
      const applied = tool(kit.dir, ["--apply", "--all"]);
      check(
        "--all --apply: delivers to every recorded project and nothing else",
        applied.status === 0 && readFileSync(a.abs(".claude/rules/a.md"), "utf8").includes("revised") && readFileSync(b.abs(".claude/rules/a.md"), "utf8").includes("revised") && !existsSync(join(family, "plain", ".claude", "rules")) && recordOf(a.project).delivered.commit === headOf(kit),
        out(applied),
      );
      const mixed = tool(kit.dir, ["--all", a.project]);
      check("--all with a project path is a usage error", mixed.status === 2, out(mixed));
      const empty = makeFamily();
      const lone = makeKit(empty);
      const none = tool(lone.dir, ["--all"]);
      check("--all with no recorded project beside the kit says so and exits 0", none.status === 0 && /no project/i.test(none.stdout), out(none));
      makeProject("charlie", "{ nope", family);
      const badAll = tool(kit.dir, ["--status", "--all"]);
      check("--all: one project with an invalid record is REFUSED, the others still print, exit 1", badAll.status === 1 && badAll.stdout.includes("REFUSED") && badAll.stdout.includes("== alpha ==") && badAll.stdout.includes("== bravo =="), out(badAll));
    }

    {
      const kitMod2 = await import(join(TOOLS, "kit.mjs"));
      const kit = makeKit();
      const first = kitMod2.catalog(kit.dir);
      check("kit cache: off by default — every catalog call is a fresh read", kitMod2.catalog(kit.dir) !== first);
      kitMod2.cacheKit(kit.dir);
      const cached = kitMod2.catalog(kit.dir);
      const pathsCached = kitMod2.everPaths(kit.dir);
      check("kit cache: once on, catalog and everPaths are computed once", kitMod2.catalog(kit.dir) === cached && kitMod2.everPaths(kit.dir) === pathsCached && JSON.stringify(cached) === JSON.stringify(first));
      kitMod2.cacheKit(null);
      check("kit cache: switched off again", kitMod2.catalog(kit.dir) !== cached);
    }

    {
      const kit = makeKit();
      const first = headOf(kit);
      kit.write("project/shared/rules/a.md", "# Rule A\n\nsecond\n");
      kit.write("project/shared/rules/late.md", "# Late\n");
      kit.commit("second");
      const second = headOf(kit);
      const oldA = kitMod.blobAt(kit.dir, first, "shared/rules/a.md");
      const d = seed(kit, undefined, "p", { commit: first, recordFiles: false });
      writeFileSync(d.abs(".claude/rules/node/b.md"), "# Rule B\n\nproject wording\n");
      rmSync(d.abs(".claude/skills/s1/references/r.md"));
      writeFileSync(join(d.project, ".claude", "kit-delivery.json"), JSON.stringify(validRecord({ tiers: TIERS }), null, 2));
      const run = tool(kit.dir, ["--record-bases", "--at", first, d.project]);
      const rec = recordOf(d.project);
      check(
        "record-bases --at: every present file gets the blob at that commit — an edited one too, an absent one not",
        run.status === 0 && rec.files["shared/rules/a.md"] === oldA && rec.files["stacks/node/rules/b.md"] === kitMod.blobAt(kit.dir, first, "stacks/node/rules/b.md") && !("domains/web/skills/s1/references/r.md" in rec.files) && rec.delivered === null,
        out(run) + JSON.stringify(rec),
      );
      check("record-bases --at: file the project lacks is listed as absent, one the commit lacks is not recorded", /^absent from the project:\n(?:\s+- .+\n)*\s+- domains\/web\/skills\/s1\/references\/r\.md/m.test(run.stdout) && !("shared/rules/late.md" in rec.files), run.stdout);
      check("record-bases: report counts what was recorded", /^recorded: 4$/m.test(run.stdout) && /^edited, no entry: none$/m.test(run.stdout), run.stdout);
      const late = seed(kit, undefined, "q", { commit: second, recordFiles: false });
      writeFileSync(join(late.project, ".claude", "kit-delivery.json"), JSON.stringify(validRecord({ tiers: TIERS }), null, 2));
      const lateRun = tool(kit.dir, ["--record-bases", "--at", first, late.project]);
      check("record-bases --at: a present file the commit lacks gets no entry and is named", lateRun.status === 0 && /not in .+:\n\s+- shared\/rules\/late\.md/.test(lateRun.stdout) && !("shared/rules/late.md" in recordOf(late.project).files), out(lateRun));
    }

    {
      const kit = makeKit();
      const first = headOf(kit);
      kit.write("project/shared/rules/a.md", "# Rule A\n\nsecond\n");
      kit.commit("second");
      const d = seed(kit, undefined, "p", { commit: first, recordFiles: false });
      writeFileSync(d.abs(".claude/rules/node/b.md"), "# Rule B\n\nproject wording\n");
      writeFileSync(join(d.project, ".claude", "kit-delivery.json"), JSON.stringify(validRecord({ tiers: TIERS }), null, 2));
      const run = tool(kit.dir, ["--record-bases", d.project]);
      const rec = recordOf(d.project);
      check(
        "record-bases without --at: past-kit copies get their blob, an edited file gets no entry and is listed",
        run.status === 0 && rec.files["shared/rules/a.md"] === kitMod.blobAt(kit.dir, first, "shared/rules/a.md") && !("stacks/node/rules/b.md" in rec.files) && Object.keys(rec.files).length === 4 && /^edited, no entry:\n\s+- stacks\/node\/rules\/b\.md$/m.test(run.stdout) && rec.delivered === null,
        out(run) + JSON.stringify(rec),
      );
      const plan = tool(kit.dir, [d.project]);
      check("record-bases: the first dry run then plans a replace from the recorded base and reports the edited file with no base", /Replace:\n\s+- shared\/rules\/a\.md/.test(plan.stdout) && /edited-no-base:\n\s+\.claude\/rules\/node\/b\.md/.test(plan.stdout.replace(/- /g, "")), plan.stdout);
      const backups = readdirSync(join(kit.dir, "tmp", "project-sync-backup"));
      const dir = join(kit.dir, "tmp", "project-sync-backup", backups[0], "p");
      check("record-bases: takes a backup of the record first, in the apply layout", backups.length === 1 && /^\d{8}T\d{6}Z/.test(backups[0]) && readJson(join(dir, ".claude", "kit-delivery.json")).files && Object.keys(readJson(join(dir, ".claude", "kit-delivery.json")).files).length === 0 && readJson(join(dir, "project.json")).projectDir === d.project && readJson(join(dir, "added.json")).length === 0, JSON.stringify(backups));
      check("record-bases: the run reports its backup path", /^Backup path: .+p$/m.test(run.stdout), run.stdout);
      const restored = tool(kit.dir, ["--restore", dir]);
      check("record-bases: --restore brings the empty record back", restored.status === 0 && Object.keys(recordOf(d.project).files).length === 0, out(restored));
      const again = tool(kit.dir, ["--record-bases", d.project]);
      const twice = tool(kit.dir, ["--record-bases", d.project]);
      check("record-bases: a second identical run changes nothing and takes no backup", again.status === 0 && twice.status === 0 && /^Backup path: none$/m.test(twice.stdout) && readdirSync(join(kit.dir, "tmp", "project-sync-backup")).length === 2, out(twice));
      writeFileSync(d.abs(".claude/rules/a.md"), "# Rule A\n\nedited since\n");
      const rerun = tool(kit.dir, ["--record-bases", d.project]);
      check("record-bases: a rerun drops the entry of a file edited since the last run", rerun.status === 0 && !("shared/rules/a.md" in recordOf(d.project).files) && /edited, no entry:\n(?:\s+- .+\n)*\s+- shared\/rules\/a\.md/.test(rerun.stdout), out(rerun));
    }
    {
      const kit = makeKit();
      const first = headOf(kit);
      kit.write("project/domains/web/skills/s1/SKILL.md", "---\nname: s1\ndescription: v2\n---\n");
      kit.write("project/domains/web/rules/w.md", "# W\n\nKeeps the web tier in the kit once s1 moves out.\n");
      kit.commit("s1 v2");
      mkdirSync(join(kit.dir, "project", "shared", "skills"), { recursive: true });
      kit.git("mv", "project/domains/web/skills/s1", "project/shared/skills/s1");
      kit.commit("move s1 to shared");
      const d = seed(kit, undefined, "p", { commit: first, recordFiles: false });
      mkdirSync(d.abs(".claude/skills/s1/references"), { recursive: true });
      writeFileSync(d.abs(".claude/skills/s1/SKILL.md"), kitMod.readBlob(kit.dir, kitMod.blobAt(kit.dir, first, "domains/web/skills/s1/SKILL.md")));
      writeFileSync(d.abs(".claude/skills/s1/references/r.md"), kitMod.readBlob(kit.dir, kitMod.blobAt(kit.dir, first, "domains/web/skills/s1/references/r.md")));
      writeFileSync(d.abs(".claude/rules/node/b.md"), kitMod.readBlob(kit.dir, kitMod.blobAt(kit.dir, first, "shared/rules/a.md")));
      writeFileSync(join(d.project, ".claude", "kit-delivery.json"), JSON.stringify(validRecord({ tiers: TIERS }), null, 2));
      const run = tool(kit.dir, ["--record-bases", d.project]);
      const rec = recordOf(d.project);
      check(
        "record-bases without --at: bytes another kit path once held are not a base for this path",
        run.status === 0 && !("stacks/node/rules/b.md" in rec.files) && /^edited, no entry:\n(?:\s+- .+\n)*\s+- stacks\/node\/rules\/b\.md$/m.test(run.stdout),
        out(run) + JSON.stringify(rec),
      );
      check(
        "record-bases without --at: a path's own history is followed across a kit rename",
        rec.files["shared/skills/s1/SKILL.md"] === kitMod.blobAt(kit.dir, first, "domains/web/skills/s1/SKILL.md") && rec.files["shared/skills/s1/references/r.md"] === kitMod.blobAt(kit.dir, "HEAD", "shared/skills/s1/references/r.md"),
        JSON.stringify(rec.files),
      );
    }

    {
      const kit = makeKit();
      const first = headOf(kit);
      kit.write("project/shared/rules/a.md", "# Rule A\n\nsecond\n");
      kit.commit("second");
      const delivered = seed(kit, undefined, "p", { delivered: stamp(kit).delivered });
      const before = readFileSync(join(delivered.project, ".claude", "kit-delivery.json"), "utf8");
      const refused = tool(kit.dir, ["--record-bases", delivered.project]);
      check("record-bases: refused once delivered — bases now come from runs; record untouched", refused.status === 1 && refused.stdout.includes("already delivered") && readFileSync(join(delivered.project, ".claude", "kit-delivery.json"), "utf8") === before && !existsSync(join(kit.dir, "tmp")), out(refused));

      const fresh = seed(kit, undefined, "q", { recordFiles: false });
      writeFileSync(join(fresh.project, ".claude", "kit-delivery.json"), JSON.stringify(validRecord({ tiers: TIERS }), null, 2));
      kit.git("checkout", "-q", "-b", "side");
      kit.write("project/shared/rules/side.md", "# Side\n");
      kit.commit("side only");
      const sideCommit = headOf(kit);
      kit.git("checkout", "-q", "main");
      const notAncestor = tool(kit.dir, ["--record-bases", "--at", sideCommit, fresh.project]);
      check("record-bases --at: a commit that is not an ancestor of HEAD is refused; nothing written", notAncestor.status === 1 && notAncestor.stdout.includes("ancestor") && Object.keys(recordOf(fresh.project).files).length === 0 && !existsSync(join(kit.dir, "tmp")), out(notAncestor));
      const unknown = tool(kit.dir, ["--record-bases", "--at", "no-such-ref", fresh.project]);
      check("record-bases --at: an unknown commit is refused", unknown.status === 1 && unknown.stdout.includes("REFUSED") && !existsSync(join(kit.dir, "tmp")), out(unknown));
      const byHash = tool(kit.dir, ["--record-bases", "--at", first, fresh.project]);
      check("record-bases --at: an ancestor given by hash is accepted", byHash.status === 0 && Object.keys(recordOf(fresh.project).files).length > 0, out(byHash));
      kit.write("project/shared/rules/a.md", "# Rule A\n\ndirty\n");
      const dirtyKit = tool(kit.dir, ["--record-bases", fresh.project]);
      check("record-bases: refuses a dirty project/ like every other mode", dirtyKit.status === 1 && dirtyKit.stdout.includes("uncommitted"), out(dirtyKit));
    }

    {
      const kit = makeKit();
      const d = seed(kit, undefined, "p");
      const e = seed(kit, undefined, "q");
      const usage = (args) => tool(kit.dir, args).status;
      check(
        "usage: bad flag combinations of --status, --all, --record-bases and --at exit 2",
        [
          ["--record-bases"],
          ["--record-bases", d.project, e.project],
          ["--record-bases", "--all"],
          ["--record-bases", "--apply", d.project],
          ["--record-bases", "--status", d.project],
          ["--record-bases", "--at"],
          ["--at", "HEAD", d.project],
          ["--status", "--apply", d.project],
          ["--status"],
          ["--status", "--resolved", "x", d.project],
          ["--all", "--catalog"],
          ["--all", "--restore", "x"],
          ["--all", "--resolved", "x", "--apply"],
        ].every((args) => usage(args) === 2),
        JSON.stringify([["--record-bases"], ["--status"], ["--at", "HEAD", d.project]].map((a) => usage(a))),
      );
    }
  }
} finally {
  cleanup();
}

if (failed) {
  console.log(`\n${failed} FAILED`);
  process.exit(1);
}
console.log("\nall passed");
