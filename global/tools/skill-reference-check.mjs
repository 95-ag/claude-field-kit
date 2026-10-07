#!/usr/bin/env node
/**
 * skill-reference-check — resolve every cross-reference in a multi-file skill, within and across skills.
 *
 * Usage:
 *   node skill-reference-check.mjs [<skills-dir> ...]
 *
 * Each argument is a directory holding skill folders (<skills-dir>/<skill>/.../*.md).
 * Default: ~/.claude/skills. To check staged assets before promoting them, pass the staging dir:
 *   node global/tools/skill-reference-check.mjs incoming/skills
 *
 * A split, a rename, or a moved section breaks a pointer silently, and the breakage reads as correct
 * prose — so this answers one question mechanically: does every `file.md` → Section pointer resolve?
 * An unresolved pointer is reported as DEAD (no such heading) or PARAPHRASE (a near-match, naming the
 * nearest real heading), because the two are triaged differently. Exit is non-zero when anything is
 * unresolved: a promotion hold, not a crash.
 *
 * Limits, stated so they are not rediscovered as bugs:
 *  - Only the FIRST hop of a chained reference is verified — `file.md` → Visualizer → P2 confirms
 *    Visualizer exists, not P2.
 *  - A reference to a numbered step rather than a heading is a legitimate form it cannot verify; it
 *    falls out as a PARAPHRASE and needs a human read.
 *  - A bold label a sibling doc cites is load-bearing like a heading but is not one, so it reports as
 *    unresolved. That is this tool's limit, not a defect in the label — do not "fix" the label.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { homedir } from "os";

// ---------------------------------------------------------------------------
// The grammars these assets actually write
// ---------------------------------------------------------------------------

// `file.md` · `references/file.md` · `other-skill/references/file.md`, each optionally followed by a
// first hop: `file.md` → Heading. A naive matcher reports nearly every reference as broken.
const REF =
  /`(?:(?!references\/)([a-z0-9-]+)\/)?(?:references\/)?([a-z0-9-]+\.md)`(?:\s*(?:→|->)\s*([^`\n|]{2,80}?))?(?=\s*(?:[.,;)|]|$|→|->|\n))/gm;

// Back-ticked (### `Specimen`), numbered (### 1. Colors), and the various dash characters.
const HEADING = /^#{1,4}\s+(.+)$/gm;

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

// ---------------------------------------------------------------------------
// Index every heading across every skill in every root
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const roots = args.length ? args : [join(homedir(), ".claude", "skills")];

const files = new Map(); // "<skill>\u0000<name>" -> { skill, name, text, headings }
const byName = new Map(); // "<name>" -> [skill, ...]

for (const root of roots) {
  if (!existsSync(root)) continue;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skill = entry.name;
    for (const path of markdownFiles(join(root, skill))) {
      const name = basename(path);
      const text = readFileSync(path, "utf8");
      const headings = new Set([...text.matchAll(HEADING)].map((match) => norm(match[1])));
      files.set(`${skill}\u0000${name}`, { skill, name, text, headings });
      byName.set(name, [...(byName.get(name) ?? []), skill]);
    }
  }
}

if (files.size === 0) {
  console.error(`no skill folders found under: ${roots.join(", ")}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Resolve each reference
// ---------------------------------------------------------------------------

const unresolved = new Set();

for (const key of [...files.keys()].sort()) {
  const { skill, name, text } = files.get(key);
  for (const [, refSkill, refFile, hop] of text.matchAll(REF)) {
    if (EXTERNAL.has(refFile)) continue;

    let target = `${refSkill ?? skill}\u0000${refFile}`;
    if (!files.has(target)) {
      // A bare filename may live in another skill — unambiguous only if exactly one skill has it.
      const owners = byName.get(refFile) ?? [];
      if (owners.length === 1) target = `${owners[0]}\u0000${refFile}`;
      else if (owners.length === 0) {
        unresolved.add(`${skill}/${name}: NO SUCH FILE  ${refSkill ? `${refSkill}/` : ""}${refFile}`);
        continue;
      } else {
        unresolved.add(`${skill}/${name}: AMBIGUOUS FILE  ${refFile} in ${owners.join(", ")}`);
        continue;
      }
    }
    if (!hop) continue;

    const firstHop = norm(hop.split("→")[0].split("->")[0]);
    if (!firstHop) continue;

    const { headings } = files.get(target);
    const forms = [firstHop, norm(firstHop.split("(")[0])].filter(Boolean);
    const resolves = [...headings].some((heading) =>
      forms.some((form) => heading === form || heading.startsWith(form) || form.startsWith(heading)),
    );
    if (resolves) continue;

    // A near-match shares at least two distinctive words with some real heading.
    const hopWords = new Set(distinctiveWords(firstHop));
    const near = [...headings].find(
      (heading) => distinctiveWords(heading).filter((word) => hopWords.has(word)).length >= 2,
    );
    const verdict = near ? `PARAPHRASE (nearest: ${JSON.stringify(near)})` : "DEAD";
    unresolved.add(`${skill}/${name}: ${verdict}  \`${refFile}\` → ${JSON.stringify(hop.trim())}`);
  }
}

for (const line of unresolved) console.log(line);
console.log(`\n${files.size} files scanned, ${unresolved.size} unresolved`);
process.exit(unresolved.size ? 1 : 0);
