#!/usr/bin/env node
/**
 * skill-reference-check — resolve every cross-reference in a multi-file skill, within and across skills.
 *
 * Usage:
 *   node skill-reference-check.mjs [--cited-by <file>]... [--rules <rules-dir>]... [<skills-dir> ...]
 *
 * Each argument is a directory holding skill folders (<skills-dir>/<skill>/.../*.md), or a single skill
 * directory — one holding a SKILL.md — which is read as that one skill and says so.
 * Default: ~/.claude/skills. To check staged assets before promoting them, pass the staging dir:
 *   node global/tools/skill-reference-check.mjs incoming/skills
 *
 * Prefer the widest root that covers the assets: a single skill directory cannot resolve a pointer into
 * another skill, so one reads as NO SUCH FILE there and resolves from the root above it.
 *
 * A split, a rename, or a moved section breaks a pointer silently, and the breakage reads as correct
 * prose — so this answers one question mechanically: does every `<file>.md` → Section pointer resolve?
 * A pointer resolves to a heading or to a bullet's leading bold label (`- **Never originate.** …`).
 * An unresolved pointer is reported as DEAD (no such heading), NO SUCH FILE or AMBIGUOUS FILE — each a hold
 * — or, prefixed `warn:`, as PARAPHRASE (a near-match, naming the nearest real heading), which needs a read.
 * Exit: 0 clean or warnings only · 1 a hold: a promotion or sync hold, not a crash · 2 usage, or no skills.
 *
 * --cited-by <file> also judges the `<file>.md` → Section pointers a non-skill file (README, a tool) writes
 * into the indexed skills. Repeat it per file.
 *
 * --rules <rules-dir> indexes a folder of rules and judges every pointer a rule writes — back-ticked or bare
 * (`accessibility.md → Images & media`) — against the indexed rules and skills; a skill's pointer to an indexed
 * rule is judged too. Repeat it per rules folder. A rule's delivered path is its path under the folder,
 * prefixed `<name>/` when the folder is `…/domains|stacks|repos/<name>/rules`, and a pointer may name it by
 * that path or by its kit path. A bare name several rules share (a universal rule and a stack's delta) resolves
 * when any of them holds the section. An unindexed ALL-CAPS name (`RELEASE.md`) is a project doc and is
 * skipped. Pass every rules folder a pointer can reach — a project rule cites global ones — or a cross-tier
 * pointer reads as NO SUCH FILE. With --rules and no skills dir, ~/.claude/skills is not read.
 *
 * An in-file pointer — `(→ Heading)` or `(-> Heading)`, in parentheses — resolves against the file it sits in,
 * then any other file of the same skill. A bare `A → B` is prose (a flow, a mapping) and is not read. A target
 * whose first hop names a doc archetype — `(→ SCHEMA)`, `(→ implementation-plan)` — passes when no heading matches.
 *
 * Limits, stated so they are not rediscovered as bugs:
 *  - Only the FIRST hop of a chained reference is verified — `<file>.md` → Visualizer → P2 confirms
 *    Visualizer exists, not P2.
 *  - A reference to a numbered step rather than a heading is a legitimate form it cannot verify; it
 *    falls out as a PARAPHRASE and needs a human read.
 *  - A bold label resolves only at a bullet's start; a cited bold paragraph or numbered step does not.
 *  - An in-file target over 80 characters is not read, and code — fenced or inline — is read like prose.
 *  - Two roots holding a skill of the same name are indexed as one skill.
 *  - In a rule, only a pointer carrying a section is read; a bare file mention and an in-file (→ X) are prose.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename, relative, resolve } from "path";
import { homedir } from "os";

// ---------------------------------------------------------------------------
// The grammars these assets actually write
// ---------------------------------------------------------------------------

// `<file>.md` · `references/<file>.md` · `<other-skill>/references/<file>.md`, each optionally followed by a
// first hop: `<file>.md` → Heading. A naive matcher reports nearly every reference as broken.
const REF =
  /`(?:(?!references\/)([a-z0-9-]+)\/)?(?:references\/)?([a-z0-9-]+\.md)`(?:\s*(?:→|->)\s*([^`\n|]{2,80}?))?(?=\s*(?:[.,;)|]|$|→|->|\n))/gm;

// A blank line ends the capture, so an unclosed `(→` cannot swallow the next paragraph.
const IN_FILE = /\((?:→|->)\s*((?:(?!\n\s*\n)[^)]){2,80})\)/g;
// (→ `<file>.md` → X) is a file pointer, which REF already reads.
const FILE_POINTER = /`[^`]*\.md`/;

// Back-ticked (### `Specimen`), numbered (### 1. Colors), and the various dash characters.
const HEADING = /^#{1,4}\s+(.+)$/gm;
// A bullet's leading bold label — `- **Never originate.** …` — is cited like a heading. Only a bullet's:
// bold mid-sentence is emphasis, and a numbered step is cited by number.
const LABEL = /^\s*[-*]\s+\*\*(.+?)\*\*/gm;

// Non-skill targets a skill legitimately cites. The doc archetypes and work files are stable; the
// rule filenames are the one list a new environment may need to extend. A rule is judged instead of skipped
// once --rules indexes it, so only the docs are skipped in a rule's own pointers.
const EXTERNAL_DOCS = new Set([
  "DESIGN.md", "PRODUCT.md", "PROJECT.md", "ARCHITECTURE.md", "SCHEMA.md",
  "IMPLEMENTATION-PLAN.md", "README.md", "CLAUDE.md", "AGENTS.md", "package.json",
  "session.md", "tasks.md", "lessons.md",
]);
const EXTERNAL = new Set([
  ...EXTERNAL_DOCS,
  "engineering.md", "git.md", "component-structure.md", "design-system.md",
  "build-verification.md", "accessibility.md", "motion.md", "visual-verification.md",
  "browser-testing.md", "nextjs.md",
]);
const PROJECT_DOC = /^[A-Z][A-Z0-9_-]*\.md$/;

// A rule names another by a path (`node/nextjs.md`, `domains/web-frontend/rules/motion.md`) as well as a
// bare name, and often without back-ticks: `accessibility.md → Images & media`.
const RULE_REF =
  /`([a-zA-Z0-9._\/-]+\.md)`\s*(?:→|->)\s*([^`\n|]{2,80}?)(?=\s*(?:[.,;)|]|$|→|->|\n))/gm;
const RULE_BARE =
  /(?<![\w\/`.-])([a-zA-Z0-9_\/-]+\.md)\s*(?:→|->)\s*([^`\n|]{2,80}?)(?=\s*(?:[.,;)|]|$|→|->|\n))/gm;
const DOC_ARCHETYPES = new Set([
  "design.md", "product.md", "project.md", "architecture.md", "schema.md", "implementation-plan.md",
]);
const namesDocArchetype = (target) =>
  DOC_ARCHETYPES.has(`${target.split(/→|->/)[0].trim().toLowerCase().replace(/\.md$/, "")}.md`);

/** Strip back-ticks, bold, leading numbering and dash variants so a reference and a heading compare. */
function norm(text) {
  return text
    .replaceAll("`", "")
    .replaceAll("**", "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/[—–-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/^[\s:.,]+|[\s:.,]+$/g, "");
}

// A heading's trailing qualifier — `## Reduced motion (non-negotiable)` — is not part of how it is cited.
function headingForms(text) {
  // An empty form — from `## (deprecated)` — would prefix-match every pointer into the file, so it is dropped.
  return new Set([...text.matchAll(HEADING)].flatMap((match) => [
    norm(match[1]), norm(match[1].replace(/\s*\([^)]*\)\s*$/, "")),
  ]).filter(Boolean));
}

function markdownFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...markdownFiles(path));
    else if (entry.name.endsWith(".md")) found.push(path);
  }
  return found;
}

const distinctiveWords = (text) => text.split(/\W+/).filter((word) => word.length > 3);

/**
 * null when the first hop names a heading or a bullet label; otherwise its DEAD or PARAPHRASE verdict.
 * Labels resolve but never supply a near-match: a kit holds far more labels than headings, and a dead
 * pointer sharing two words with one would be demoted from a hold to a warning.
 */
function judgeHop(hop, headings, labels) {
  const firstHop = norm(hop.split("→")[0].split("->")[0]);
  if (!firstHop) return null;

  const forms = [firstHop, norm(firstHop.split("(")[0])].filter(Boolean);
  const resolves = [...headings, ...labels].some((heading) =>
    forms.some((form) => heading === form || heading.startsWith(form) || form.startsWith(heading)),
  );
  if (resolves) return null;

  // A near-match shares at least two distinctive words with some real heading.
  const hopWords = new Set(distinctiveWords(firstHop));
  const near = headings.find(
    (heading) => distinctiveWords(heading).filter((word) => hopWords.has(word)).length >= 2,
  );
  return near ? `PARAPHRASE (nearest: ${JSON.stringify(near)})` : "DEAD";
}

// ---------------------------------------------------------------------------
// Index every heading across every skill in every root
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const citedBy = [];
const ruleRoots = [];
const rootArgs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] !== "--cited-by" && args[i] !== "--rules") {
    rootArgs.push(args[i]);
    continue;
  }
  const flag = args[i];
  const path = args[++i];
  if (!path || !existsSync(path)) {
    console.error(`${flag} needs an existing ${flag === "--rules" ? "directory" : "file"}: ${path ?? "(none given)"}`);
    process.exit(2);
  }
  (flag === "--rules" ? ruleRoots : citedBy).push(path);
}
const roots = rootArgs.length ? rootArgs : ruleRoots.length ? [] : [join(homedir(), ".claude", "skills")];

const files = new Map(); // "<skill>\u0000<name>" -> { skill, name, text, headings, labels }
const byName = new Map(); // "<name>" -> [skill, ...]

function indexSkill(dir, skill) {
  for (const path of markdownFiles(dir)) {
    const name = basename(path);
    const text = readFileSync(path, "utf8");
    const headings = headingForms(text);
    const labels = new Set([...text.matchAll(LABEL)].map((match) => norm(match[1])));
    files.set(`${skill}\u0000${name}`, { skill, name, text, headings, labels });
    byName.set(name, [...(byName.get(name) ?? []), skill]);
  }
}

for (const root of roots) {
  if (!existsSync(root)) continue;

  // A reviewer's natural call is the asset itself. Without this, a skill directory is walked as if it
  // contained skills: references/ is indexed as a pseudo-skill, SKILL.md is skipped for being a file, and
  // the run exits 0 — a green result over part of the asset rather than a refusal.
  if (existsSync(join(root, "SKILL.md"))) {
    const skill = basename(resolve(root));
    indexSkill(root, skill);
    console.log(
      `note: ${root} holds a SKILL.md — read as the single skill "${skill}". ` +
      `A pointer into another skill cannot resolve from here; pass the root that contains them for that.`,
    );
    continue;
  }

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    indexSkill(join(root, entry.name), entry.name);
  }
}

const rules = []; // { path, delivered, text, headings, labels }
for (const root of ruleRoots) {
  const tier = resolve(root).replace(/\\/g, "/").match(/\/(?:domains|stacks|repos)\/([^/]+)\/rules\/?$/);
  for (const path of markdownFiles(root)) {
    const text = readFileSync(path, "utf8");
    const underRoot = relative(root, path).replace(/\\/g, "/");
    rules.push({
      path: resolve(path).replace(/\\/g, "/"),
      delivered: tier ? `${tier[1]}/${underRoot}` : underRoot,
      text,
      headings: headingForms(text),
      labels: new Set([...text.matchAll(LABEL)].map((match) => norm(match[1]))),
    });
  }
}

if (files.size === 0 && rules.length === 0) {
  console.error(`no skill folders or rules found under: ${[...roots, ...ruleRoots].join(", ")}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Resolve each reference
// ---------------------------------------------------------------------------

// DEAD, NO SUCH FILE and AMBIGUOUS FILE are defects; a PARAPHRASE may be a legitimate numbered-step
// reference the tool cannot verify, so it warns and needs a human read.
const holds = new Set();
const warnings = new Set();
const report = (line, verdict) => (verdict.startsWith("PARAPHRASE") ? warnings : holds).add(line);

const headingsBySkill = new Map();
const labelsBySkill = new Map();
for (const { skill, headings, labels } of files.values()) {
  headingsBySkill.set(skill, [...(headingsBySkill.get(skill) ?? []), ...headings]);
  labelsBySkill.set(skill, [...(labelsBySkill.get(skill) ?? []), ...labels]);
}

/**
 * The indexed rules a pointer path names. The citing rule counts only when it is the sole match: a stack delta
 * naming `build-verification.md` means the universal file, but a rule may also cite a section of its own.
 */
function rulesNamed(pointer, citingPath) {
  const hits = rules.filter((rule) =>
    [rule.delivered, rule.path].some((path) => path === pointer || path.endsWith(`/${pointer}`)));
  const others = hits.filter((rule) => rule.path !== citingPath);
  return others.length ? others : hits;
}

/** Judge one hop against several same-named rules: it resolves when any of them holds the section. */
function judgeAgainstRules(where, pointer, hop, hits) {
  if (hits.length > 1 && pointer.includes("/")) {
    holds.add(`${where}: AMBIGUOUS FILE  ${pointer} in ${hits.map((rule) => rule.delivered).join(", ")}`);
    return;
  }
  const verdict = judgeHop(hop, hits.flatMap((rule) => [...rule.headings]), hits.flatMap((rule) => [...rule.labels]));
  if (verdict) report(`${where}: ${verdict}  ${pointer} → ${JSON.stringify(hop.trim())}`, verdict);
}

/** Judge every `<file>.md` → Section pointer in `text`; `skill` is null for a file outside any skill. */
function judgeFilePointers(where, skill, text) {
  for (const [, refSkill, refFile, hop] of text.matchAll(REF)) {
    // A skill's own reference file outranks a same-named rule, as it did before rules were indexed.
    if (EXTERNAL.has(refFile) && !files.has(`${refSkill ?? skill}\u0000${refFile}`)) {
      const hits = refSkill || !hop ? [] : rulesNamed(refFile, null);
      if (hits.length) judgeAgainstRules(where, `\`${refFile}\``, hop, hits);
      continue;
    }

    let target = `${refSkill ?? skill}\u0000${refFile}`;
    if (!files.has(target)) {
      // A bare filename may live in another skill — unambiguous only if exactly one skill has it.
      const owners = byName.get(refFile) ?? [];
      if (owners.length === 1) target = `${owners[0]}\u0000${refFile}`;
      else if (owners.length === 0) {
        const hits = refSkill ? [] : rulesNamed(refFile, null);
        if (hits.length && hop) judgeAgainstRules(where, `\`${refFile}\``, hop, hits);
        else if (!hits.length) holds.add(`${where}: NO SUCH FILE  ${refSkill ? `${refSkill}/` : ""}${refFile}`);
        continue;
      } else {
        holds.add(`${where}: AMBIGUOUS FILE  ${refFile} in ${owners.join(", ")}`);
        continue;
      }
    }
    if (!hop) continue;

    const { headings, labels } = files.get(target);
    const verdict = judgeHop(hop, [...headings], [...labels]);
    if (verdict) report(`${where}: ${verdict}  \`${refFile}\` → ${JSON.stringify(hop.trim())}`, verdict);
  }
}

for (const key of [...files.keys()].sort()) {
  const { skill, name, text } = files.get(key);
  judgeFilePointers(`${skill}/${name}`, skill, text);

  for (const [, captured] of text.matchAll(IN_FILE)) {
    if (FILE_POINTER.test(captured)) continue;
    const pointer = captured.replace(/\n\s*>\s?/g, " ");
    const verdict = judgeHop(pointer, headingsBySkill.get(skill), labelsBySkill.get(skill));
    if (verdict && !namesDocArchetype(pointer)) {
      report(`${skill}/${name}: ${verdict}  (→ ${JSON.stringify(pointer.replace(/\s+/g, " ").trim())})`, verdict);
    }
  }
}

// A cited file's (→ X) is the file's own prose, not a pointer into a skill, so only its file pointers count.
for (const file of citedBy) judgeFilePointers(file, null, readFileSync(file, "utf8"));

/** Judge a rule's pointer: indexed rules first, then a skill file, then a doc that is skipped. */
function judgeRulePointer(where, rule, pointer, hop, form) {
  const shown = form === "`" ? `\`${pointer}\`` : pointer;
  const hits = rulesNamed(pointer, rule.path);
  if (hits.length) return judgeAgainstRules(where, shown, hop, hits);

  const owners = byName.get(basename(pointer)) ?? [];
  if (owners.length === 1) {
    const { headings, labels } = files.get(`${owners[0]}\u0000${basename(pointer)}`);
    const verdict = judgeHop(hop, [...headings], [...labels]);
    if (verdict) report(`${where}: ${verdict}  ${shown} → ${JSON.stringify(hop.trim())}`, verdict);
    return;
  }
  if (owners.length > 1) return holds.add(`${where}: AMBIGUOUS FILE  ${pointer} in ${owners.join(", ")}`);
  if (EXTERNAL_DOCS.has(basename(pointer)) || PROJECT_DOC.test(basename(pointer))) return;
  holds.add(`${where}: NO SUCH FILE  ${pointer}`);
}

for (const rule of rules) {
  const where = relative(process.cwd(), rule.path);
  // The two grammars never read the same pointer: the bare one refuses a path that opens on a back-tick.
  for (const [grammar, form] of [[RULE_REF, "`"], [RULE_BARE, "bare"]]) {
    for (const match of rule.text.matchAll(grammar)) judgeRulePointer(where, rule, match[1], match[2], form);
  }
}

for (const line of holds) console.log(line);
for (const line of warnings) console.log(`warn: ${line}`);
console.log(`\n${files.size + rules.length} files scanned, ${holds.size} to fix, ${warnings.size} to read`);
process.exit(holds.size ? 1 : 0);
