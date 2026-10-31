#!/usr/bin/env node
/**
 * skill-reference-check — resolve every cross-reference in a multi-file skill, within and across skills.
 *
 * Usage:
 *   node skill-reference-check.mjs [--cited-by <file>]... [<skills-dir> ...]
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
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename, resolve } from "path";
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
// rule filenames are the one list a new environment may need to extend.
const EXTERNAL = new Set([
  "DESIGN.md", "PRODUCT.md", "PROJECT.md", "ARCHITECTURE.md", "SCHEMA.md",
  "IMPLEMENTATION-PLAN.md", "README.md", "CLAUDE.md", "AGENTS.md", "package.json",
  "session.md", "tasks.md", "lessons.md",
  "engineering.md", "git.md", "component-structure.md", "design-system.md",
  "build-verification.md", "accessibility.md", "motion.md", "visual-verification.md",
  "browser-testing.md", "nextjs.md",
]);
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
const rootArgs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] !== "--cited-by") {
    rootArgs.push(args[i]);
    continue;
  }
  const file = args[++i];
  if (!file || !existsSync(file)) {
    console.error(`--cited-by needs an existing file: ${file ?? "(none given)"}`);
    process.exit(2);
  }
  citedBy.push(file);
}
const roots = rootArgs.length ? rootArgs : [join(homedir(), ".claude", "skills")];

const files = new Map(); // "<skill>\u0000<name>" -> { skill, name, text, headings, labels }
const byName = new Map(); // "<name>" -> [skill, ...]

function indexSkill(dir, skill) {
  for (const path of markdownFiles(dir)) {
    const name = basename(path);
    const text = readFileSync(path, "utf8");
    const headings = new Set([...text.matchAll(HEADING)].map((match) => norm(match[1])));
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

if (files.size === 0) {
  console.error(`no skill folders found under: ${roots.join(", ")}`);
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

/** Judge every `<file>.md` → Section pointer in `text`; `skill` is null for a file outside any skill. */
function judgeFilePointers(where, skill, text) {
  for (const [, refSkill, refFile, hop] of text.matchAll(REF)) {
    if (EXTERNAL.has(refFile)) continue;

    let target = `${refSkill ?? skill}\u0000${refFile}`;
    if (!files.has(target)) {
      // A bare filename may live in another skill — unambiguous only if exactly one skill has it.
      const owners = byName.get(refFile) ?? [];
      if (owners.length === 1) target = `${owners[0]}\u0000${refFile}`;
      else if (owners.length === 0) {
        holds.add(`${where}: NO SUCH FILE  ${refSkill ? `${refSkill}/` : ""}${refFile}`);
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

for (const line of holds) console.log(line);
for (const line of warnings) console.log(`warn: ${line}`);
console.log(`\n${files.size} files scanned, ${holds.size} to fix, ${warnings.size} to read`);
process.exit(holds.size ? 1 : 0);
