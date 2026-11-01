// skill-reference-check harness — builds skill trees in a scratch directory and runs the tool on them.
//
//   node tests/skill-reference-check/run.mjs
import { spawnSync } from "child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const TOOL = join(ROOT, "global/tools/skill-reference-check.mjs");
const SB = mkdtempSync(join(tmpdir(), "skill-reference-check-"));

let failed = 0;
function check(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) {
    failed++;
    if (detail) console.log(`      ${detail}`);
  }
}

const put = (rel, content) => {
  const path = join(SB, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  return path;
};
const run = (...args) => spawnSync(process.execPath, [TOOL, ...args], { encoding: "utf8", cwd: ROOT });
const out = (r) => (r.stdout ?? "") + (r.stderr ?? "");
const show = (r) => `status=${r.status} ${JSON.stringify(out(r))}`;

try {
  // --- root forms ------------------------------------------------------------------------------------
  const skills = join(SB, "skills");
  put("skills/skill-a/SKILL.md", [
    "# Skill A",
    "",
    "Read `alpha.md` → Section One before starting.",
    "The shape rule lives in `alpha.md` → Nowhere At All.",
    "The seam is defined in `skill-b/references/beta.md` → Seam.",
    "",
  ].join("\n"));
  put("skills/skill-a/references/alpha.md", "# Alpha\n\n## Section One\n\nbody\n");
  put("skills/skill-b/SKILL.md", "# Skill B\n\nSee `beta.md` → Seam.\n");
  put("skills/skill-b/references/beta.md", "# Beta\n\n## Seam\n\nbody\n");

  const narrow = run(join(skills, "skill-a"));
  check("single skill directory is read as that skill", narrow.status !== 2 && out(narrow).includes("2 files scanned"), show(narrow));
  check("single skill: says which interpretation it used, naming the skill", /single skill/i.test(out(narrow)) && out(narrow).includes("skill-a"), show(narrow));
  check("single skill: resolving pointer stays quiet", !out(narrow).includes("Section One"), show(narrow));
  check("single skill: dead pointer reported", out(narrow).includes("Nowhere At All"), show(narrow));
  check("single skill: cross-skill pointer is NO SUCH FILE — the stated limit", out(narrow).includes("NO SUCH FILE") && out(narrow).includes("beta.md"), show(narrow));

  put("bare/solo-skill/SKILL.md", "# Solo\n\nSee `x.md` → Y.\n");
  const bare = run(join(SB, "bare/solo-skill"));
  check("SKILL.md-only directory is indexed and judged", bare.status !== 2 && out(bare).includes("NO SUCH FILE") && out(bare).includes("x.md"), show(bare));

  const wide = run(skills);
  check("wide root resolves the cross-skill pointer", !out(wide).includes("NO SUCH FILE"), show(wide));
  check("wide root prints no single-skill note", !/single skill/i.test(out(wide)), show(wide));

  // --- same-file (→ Heading) pointers ----------------------------------------------------------------
  const inFile = join(SB, "in-file-skills");
  put("in-file-skills/skill-c/SKILL.md", [
    "# Skill C",
    "",
    "## Local Heading",
    "",
    "Resolves in-file (→ Local Heading).",
    "Dead in-file (→ Nowhere Here).",
    "Resolves in a sibling file of the skill (→ Sibling Section).",
    "Chained, first hop only (→ Local Heading → Not Checked).",
    "A doc archetype is not a heading (→ SCHEMA) and (→ implementation-plan).",
    "Prose flow preview → confirmed → doc is not a pointer.",
    "A file pointer in parentheses (→ `gamma.md` → Gamma One) stays the file grammar's.",
    "A bold paragraph is cited (→ Bold Paragraph).",
    "",
    "A rule name that is also a heading word is still checked (→ Motion).",
    "A back-ticked heading target is read (→ `Nope Gone`).",
    "An ASCII arrow is read too (-> Gone Ascii).",
    "A pointer wrapped across a line (→ Gone",
    "Wrapped).",
    "A chained archetype pointer passes (→ SCHEMA → Tables).",
    "> A quoted pointer wrapped (→ Local",
    "> Heading) resolves.",
    "A non-archetype document name is judged (→ Readme).",
    "An unclosed (→ arrow here is a flow",
    "",
    "and a later paragraph says (see Setup) plainly.",
    "",
    "**Bold Paragraph** — body.",
    "",
  ].join("\n"));
  put("in-file-skills/skill-c/references/gamma.md", "# Gamma\n\n## Sibling Section\n\n## Gamma One\n");

  const inRun = run(inFile);
  const io = out(inRun);
  check("dead in-file pointer reported DEAD", /DEAD\s+\(→ "Nowhere Here"\)/.test(io), show(inRun));
  check("in-file pointer that resolves stays quiet", !io.includes('"Local Heading'), show(inRun));
  check("pointer resolving in a sibling file of the skill stays quiet", !io.includes("Sibling Section"), show(inRun));
  check("chained pointer judges the first hop only", !io.includes("Not Checked"), show(inRun));
  check("doc-archetype targets are skipped", !/SCHEMA|implementation-plan/.test(io), show(inRun));
  check("bare prose arrows are not read", !io.includes("confirmed"), show(inRun));
  check("file pointer in parentheses resolves through the file grammar", !io.includes("Gamma One"), show(inRun));
  check("a bold paragraph that is not a bullet is not a target", io.includes("Bold Paragraph"), show(inRun));
  check("a target sharing a rule file's name is judged as a heading", /DEAD\s+\(→ "Motion"\)/.test(io), show(inRun));
  check("a back-ticked heading target is judged", io.includes("Nope Gone"), show(inRun));
  check("an ASCII-arrow pointer is judged", io.includes("Gone Ascii"), show(inRun));
  check("a pointer wrapped across a line is judged", /Gone\s+Wrapped/.test(io), show(inRun));
  check("a chained pointer whose first hop is a doc archetype passes", !io.includes("Tables"), show(inRun));
  check("a blockquote-wrapped pointer resolves", !/Local\s*>?\s*Heading/.test(io), show(inRun));
  check("a non-archetype document name is judged", io.includes("Readme"), show(inRun));
  check("an unclosed arrow does not swallow the next paragraph", !io.includes("see Setup"), show(inRun));
  check("exit 1 while a pointer is DEAD", inRun.status === 1, show(inRun));

  // --- bullet bold labels -----------------------------------------------------------------------------
  const labels = join(SB, "label-skills");
  put("label-skills/skill-d/SKILL.md", [
    "# Skill D",
    "",
    "See `rules.md` → Never originate.",
    "See `rules.md` → Star Label.",
    "",
  ].join("\n"));
  put("label-skills/skill-d/references/rules.md", [
    "# Rules",
    "",
    "## Shared rules",
    "",
    "- **Never originate.** No mode invents tokens.",
    "* **Star Label** — body.",
    "",
  ].join("\n"));
  const labelRun = run(labels);
  check("label: a `- **Label.**` bullet resolves", !out(labelRun).includes("Never originate"), show(labelRun));
  check("label: a `* **Label**` bullet resolves", !out(labelRun).includes("Star Label"), show(labelRun));
  check("label: a tree whose only targets are labels exits 0", labelRun.status === 0, show(labelRun));

  const notLabels = join(SB, "not-label-skills");
  put("not-label-skills/skill-e/SKILL.md", [
    "# Skill E",
    "",
    "See `rules.md` → Mid Bold.",
    "See `rules.md` → Numbered Step.",
    "See `rules.md` → Never invent tokens.",
    "",
  ].join("\n"));
  put("not-label-skills/skill-e/references/rules.md", [
    "# Rules",
    "",
    "- text before **Mid Bold** after.",
    "1. **Numbered Step** — body.",
    "- **Never originate tokens.** body.",
    "",
  ].join("\n"));
  const notRun = run(notLabels);
  const no = out(notRun);
  check("label: bold mid-bullet is not a target", /DEAD\s+`rules\.md` → "Mid Bold"/.test(no), show(notRun));
  check("label: a numbered step's bold is not a target", no.includes("Numbered Step"), show(notRun));
  check("label: never a near-match source — a word-sharing pointer stays DEAD", /DEAD\s+`rules\.md` → "Never invent tokens"/.test(no), show(notRun));
  check("label: exit 1", notRun.status === 1, show(notRun));

  // --- exit split -------------------------------------------------------------------------------------
  put("near/skill-f/SKILL.md", "# Skill F\n\nSee `ref.md` → Colour Token Rules.\n");
  put("near/skill-f/references/ref.md", "# Ref\n\n## Color Token Rules Overview\n\n## Token Rules Colour\n");
  const near = run(join(SB, "near"));
  check("exit: a near-match only prints warn: and exits 0", near.status === 0 && /^warn: .*PARAPHRASE/m.test(out(near)), show(near));

  put("dead/skill-g/SKILL.md", "# Skill G\n\nSee `ref.md` → Gone.\n");
  put("dead/skill-g/references/ref.md", "# Ref\n\n## Here\n");
  const dead = run(join(SB, "dead"));
  check("exit: DEAD exits 1", dead.status === 1 && /DEAD/.test(out(dead)) && !/^warn:/m.test(out(dead)), show(dead));
  check("exit: summary counts holds and warnings", out(dead).includes("1 to fix, 0 to read"), show(dead));

  put("nofile/skill-h/SKILL.md", "# Skill H\n\nSee `missing.md` → X.\n");
  const nofile = run(join(SB, "nofile"));
  check("exit: NO SUCH FILE exits 1", nofile.status === 1 && out(nofile).includes("NO SUCH FILE"), show(nofile));

  put("ambig/skill-i/SKILL.md", "# Skill I\n\nSee `shared.md` → X.\n");
  put("ambig/skill-j/references/shared.md", "# X\n");
  put("ambig/skill-k/references/shared.md", "# X\n");
  const ambig = run(join(SB, "ambig"));
  check("exit: AMBIGUOUS FILE exits 1", ambig.status === 1 && out(ambig).includes("AMBIGUOUS FILE"), show(ambig));

  // --- --cited-by ------------------------------------------------------------------------------------
  const cleanSkills = join(SB, "cite-skills");
  put("cite-skills/skill-b/SKILL.md", "# Skill B\n\nSee `beta.md` → Seam.\n");
  put("cite-skills/skill-b/references/beta.md", "# Beta\n\n## Seam\n\nbody\n");
  const okDoc = put("docs/ok.md", "# Doc\n\nThe seam is `skill-b/references/beta.md` → Seam (→ Not A Pointer).\n");
  const okCite = run("--cited-by", okDoc, cleanSkills);
  check("cited-by: a pointer to a real heading exits 0, and a cited file's (→ X) is prose", okCite.status === 0 && !out(okCite).includes("ok.md"), show(okCite));

  const badDoc = put("docs/bad.md", "# Doc\n\nSee `beta.md` → Missing Section.\n");
  const badCite = run("--cited-by", badDoc, cleanSkills);
  check("cited-by: a pointer to a missing heading is DEAD, naming the citing file", badCite.status === 1 && /bad\.md: DEAD\s+`beta\.md` → "Missing Section"/.test(out(badCite)), show(badCite));

  const missingCite = run("--cited-by", join(SB, "docs/nope.md"), skills);
  check("cited-by: a missing file is a usage error (exit 2)", missingCite.status === 2, show(missingCite));

  // --- --rules ---------------------------------------------------------------------------------------
  // A kit-shaped rules tree: a universal rule and a node delta sharing a name, a domain rule cited by its kit
  // path and by its delivered path, and a global rule a project rule cites across tiers.
  const R = join(SB, "rk");
  put("rk/global/shared/rules/git.md", "# Git\n\n## Commits\n\n- **Pathspec.** body\n");
  put("rk/project/shared/rules/build-verification.md", "# Build\n\n## Always required\n\n## Batch gate, not per-commit\n");
  put("rk/project/stacks/node/rules/build-verification.md", "# Build — node\n\n## Node / Next specifics\n");
  put("rk/project/domains/web-frontend/rules/motion.md", "# Motion\n\n## Reduced motion (non-negotiable)\n\n## Tokens\n");
  put("rk/project/stacks/node/rules/nextjs.md", [
    "# Next",
    "",
    "Gate per the universal `build-verification.md` → Always required.",
    "Node commands live in build-verification.md → Node / Next specifics.",
    "Motion is in `web-frontend/motion.md` → Tokens, and domains/web-frontend/rules/motion.md → Reduced motion and more.",
    "Commits follow `git.md` → Pathspec.",
    "Release notes go in `RELEASE.md` → Versioning.",
    "",
  ].join("\n"));
  const ruleRoots = ["global/shared/rules", "project/shared/rules", "project/stacks/node/rules", "project/domains/web-frontend/rules"]
    .flatMap((r) => ["--rules", join(R, r)]);
  const rulesOk = run(...ruleRoots);
  check("rules: backticked and bare pointers to real sections pass", rulesOk.status === 0, show(rulesOk));
  check("rules: kit path and delivered path both resolve", !out(rulesOk).includes("motion.md"), show(rulesOk));
  check("rules: a bare name shared by universal rule and delta resolves in either", !out(rulesOk).includes("build-verification.md"), show(rulesOk));
  check("rules: an ALL-CAPS project doc is skipped", !out(rulesOk).includes("RELEASE.md"), show(rulesOk));
  check("rules: a trailing parenthetical in a heading still matches", !out(rulesOk).includes("Reduced motion"), show(rulesOk));
  check("rules: --rules alone does not fall back to ~/.claude/skills", /\b5 files scanned/.test(out(rulesOk)), show(rulesOk));

  put("rk/project/stacks/node/rules/dead.md", "# Dead\n\nSee `build-verification.md` → Never required.\nAnd motion.md → Gone Section.\n");
  const rulesDead = run(...ruleRoots);
  check("rules: a dead section is a DEAD hold naming the rule file", rulesDead.status === 1 &&
    /dead\.md: DEAD\s+`build-verification\.md` → "Never required"/.test(out(rulesDead)), show(rulesDead));
  check("rules: a bare-form dead section is a DEAD hold", /dead\.md: DEAD\s+motion\.md → "Gone Section"/.test(out(rulesDead)), show(rulesDead));

  const rulesPartial = run("--rules", join(R, "project/stacks/node/rules"), "--rules", join(R, "project/shared/rules"));
  check("rules: a cross-tier pointer with its root missing is NO SUCH FILE",
    rulesPartial.status === 1 && /NO SUCH FILE\s+git\.md/.test(out(rulesPartial)), show(rulesPartial));

  put("rk-skills/skill-r/SKILL.md", "# Skill R\n\nSee `git.md` → Gone Rule Section.\nAnd `motion.md` → Anything.\n");
  const skillToRule = run(join(SB, "rk-skills"), "--rules", join(R, "global/shared/rules"));
  check("rules: a skill pointer to an indexed rule is judged", skillToRule.status === 1 && out(skillToRule).includes("Gone Rule Section"), show(skillToRule));
  check("rules: a skill pointer to an unindexed rule stays skipped", !out(skillToRule).includes("Anything"), show(skillToRule));

  // A rule may cite itself by name; a path names one rule, or is ambiguous; a skill's own file outranks a rule.
  const R2 = join(SB, "rk2");
  put("rk2/global/shared/rules/git.md", "# Git\n\n## Commits\n");
  put("rk2/project/stacks/node/rules/git.md", "# Git — node\n\n## Node commits\n");
  put("rk2/project/repos/portfolio/rules/git.md", "# Git — portfolio\n");
  put("rk2/project/domains/web-frontend/rules/motion.md", "# Motion\n\n## Tokens\n\nAbove, `motion.md` → Tokens.\n");
  put("rk2/project/stacks/node/rules/x.md", [
    "# X",
    "",
    "See `web-frontend/motion.md` → Nope Path.",
    "See `node/git.md` → Node commits.",
    "See `rules/git.md` → Commits.",
    "",
  ].join("\n"));
  const r2Roots = ["global/shared/rules", "project/stacks/node/rules", "project/repos/portfolio/rules", "project/domains/web-frontend/rules"]
    .flatMap((r) => ["--rules", join(R2, r)]);
  const r2 = run(...r2Roots);
  check("rules: a rule citing its own name resolves against itself", !out(r2).includes("motion.md → \"Tokens\"") && !/NO SUCH FILE\s+motion\.md/.test(out(r2)), show(r2));
  check("rules: a path-form pointer to a missing section is DEAD", /x\.md: DEAD\s+`web-frontend\/motion\.md` → "Nope Path"/.test(out(r2)), show(r2));
  check("rules: a path-form pointer names one rule", !out(r2).includes("Node commits"), show(r2));
  check("rules: a path matching several rules is AMBIGUOUS FILE", /AMBIGUOUS FILE\s+`?rules\/git\.md/.test(out(r2)), show(r2));

  put("rk2-skills/skill-m/SKILL.md", "# Skill M\n\nSee `motion.md` → Own Heading.\n");
  put("rk2-skills/skill-m/references/motion.md", "# Motion notes\n\n## Own Heading\n");
  const ownFile = run(join(SB, "rk2-skills"), "--rules", join(R2, "project/domains/web-frontend/rules"));
  check("rules: a skill's own reference file outranks a same-named rule", ownFile.status === 0, show(ownFile));

  put("rk3/global/shared/rules/working-together.md", "# Working together\n\n## Shared docs\n");
  put("rk3-skills/skill-w/SKILL.md", "# Skill W\n\nSee `working-together.md` → Shared docs.\n");
  const unlisted = run(join(SB, "rk3-skills"), "--rules", join(SB, "rk3/global/shared/rules"));
  check("rules: a skill pointer to an indexed rule missing from the built-in list resolves", unlisted.status === 0, show(unlisted));
  put("rk3-skills/skill-w/SKILL.md", "# Skill W\n\nSee `working-together.md` → Gone Docs.\n");
  const unlistedDead = run(join(SB, "rk3-skills"), "--rules", join(SB, "rk3/global/shared/rules"));
  check("rules: …and a dead section there is DEAD", unlistedDead.status === 1 && out(unlistedDead).includes("Gone Docs"), show(unlistedDead));

  put("paren/skill-p/SKILL.md", "# Skill P\n\nSee `odd.md` → Totally Nonexistent.\n");
  put("paren/skill-p/references/odd.md", "# Odd\n\n## (deprecated)\n\n## Real\n");
  const paren = run(join(SB, "paren"));
  check("a parenthetical-only heading does not make every pointer resolve", paren.status === 1 && out(paren).includes("Totally Nonexistent"), show(paren));

  // --- the kit itself --------------------------------------------------------------------------------
  const kitGlobal = run(join(ROOT, "global/shared/skills"), "--rules", join(ROOT, "global/shared/rules"),
    "--rules", join(ROOT, "global/windows/rules"));
  check("kit: the global skill and rule roots exit 0 — what global-sync holds on", kitGlobal.status === 0, show(kitGlobal));
  const kit = run(
    join(ROOT, "global/shared/skills"),
    join(ROOT, "project/domains/web-frontend/skills"),
    join(ROOT, "project/repos/portfolio/skills"),
    // A skill may cite a global rule, which resolves only with the rules indexed.
    "--rules", join(ROOT, "global/shared/rules"),
  );
  check("kit: every skill root exits 0", kit.status === 0, show(kit));
} finally {
  rmSync(SB, { recursive: true, force: true });
}

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
