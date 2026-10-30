import { existsSync, readFileSync } from "fs";
import { purposeOf } from "./kit.mjs";

const RULES_PREFIX = ".claude/rules/";
const MAX_PURPOSE = 120;

const normalise = (path) => path.replace(/^\.claude\//, "");
const rowPath = (line) => line.match(/^\|\s*`([^`]+)`\s*\|/)?.[1] ?? null;

// Every table under `## Rules` up to the next level 1-2 heading: real projects group rules into several.
function findTables(lines) {
  const heading = lines.findIndex((line) => /^##\s+Rules\b/.test(line));
  if (heading === -1) return [];
  const tables = [];
  for (let i = heading + 1; i < lines.length; i++) {
    if (/^#{1,2}\s/.test(lines[i])) break;
    if (!lines[i].startsWith("|") || !/^\|[\s:|-]+\|?\s*$/.test(lines[i + 1] ?? "")) continue;
    let end = i + 1;
    while (lines[end + 1]?.startsWith("|")) end++;
    tables.push({ start: i, end });
    i = end;
  }
  return tables;
}

const directoryOf = (path) => normalise(path).split("/").slice(0, -1).join("/");

// A new row copies its table's own path style, so a project that writes `rules/x.md` keeps doing so
function styleOf(rows) {
  const first = rows.map(rowPath).find((path) => path && /^(\.claude\/)?rules\//.test(path));
  return first === undefined ? null : first.startsWith(".claude/") ? ".claude/" : "";
}

export function updateRulesTable(claudeMd, added, removed) {
  const lines = claudeMd.split("\n");
  const tables = findTables(lines);
  if (!tables.length) return { text: claudeMd, changed: [], unmatched: [], missingTable: true };

  const changed = [];
  const dropped = new Map(removed.map((target) => [normalise(target), target]));
  const matched = new Set();
  const rows = tables.map((table) =>
    lines.slice(table.start + 2, table.end + 1).filter((line) => {
      const path = rowPath(line);
      if (path === null || !dropped.has(normalise(path))) return true;
      matched.add(normalise(path));
      changed.push(`removed ${dropped.get(normalise(path))}`);
      return false;
    }),
  );
  const unmatched = removed.filter((target) => !matched.has(normalise(target)));

  const present = new Set(rows.flat().map(rowPath).filter(Boolean).map(normalise));
  const fallbackStyle = styleOf(rows.flat()) ?? ".claude/";
  const fresh = tables.map(() => []);
  for (const { target, purpose } of added) {
    if (present.has(normalise(target))) continue;
    present.add(normalise(target));
    const sameDirectory = rows.findIndex((tableRows) => tableRows.some((line) => rowPath(line) && directoryOf(rowPath(line)) === directoryOf(target)));
    const at = sameDirectory === -1 ? 0 : sameDirectory;
    const path = (styleOf(rows[at]) ?? fallbackStyle) + normalise(target);
    const eol = lines[tables[at].start].endsWith("\r") ? "\r" : "";
    fresh[at].push(`| \`${path}\` | ${purpose.replace(/\|/g, "\\|")} |${eol}`);
    changed.push(`added ${path}`);
  }
  if (!changed.length) return { text: claudeMd, changed, unmatched, missingTable: false };

  const out = [...lines];
  for (let i = tables.length - 1; i >= 0; i--) out.splice(tables[i].start + 2, tables[i].end - tables[i].start - 1, ...rows[i], ...fresh[i]);
  return { text: out.join("\n"), changed, unmatched, missingTable: false };
}

function blurb(purpose) {
  if (purpose.length <= MAX_PURPOSE) return purpose;
  const firstSentence = purpose.match(/^.*?[.!?](?=\s|$)/);
  return firstSentence ? firstSentence[0] : purpose;
}

const isRule = (action) => action.target.startsWith(RULES_PREFIX) && action.target.endsWith(".md");

// Only rules get rows, and only the ones this run put in or took out of the project. A rename lands as a replace
// of a key the record never held, plus a remove of the old path.
export function planRulesTable(kit, claudeMdPath, done, recordedFiles) {
  const arrives = (a) => a.kind === "add" || (a.kind === "replace" && recordedFiles[a.kit] === undefined);
  const added = done.filter((a) => arrives(a) && isRule(a)).map((a) => ({ target: a.target, purpose: blurb(purposeOf(kit, a.kit)) }));
  const removed = done.filter((a) => a.kind === "remove" && isRule(a)).map((a) => a.target);
  if (!added.length && !removed.length) return { text: null, changed: [], unmatched: [], missingTable: false };
  if (!existsSync(claudeMdPath)) return { text: null, changed: [], unmatched: [], missingTable: true };
  const original = readFileSync(claudeMdPath, "utf8");
  const updated = updateRulesTable(original, added, removed);
  return { text: updated.text === original ? null : updated.text, changed: updated.changed, unmatched: updated.unmatched, missingTable: updated.missingTable };
}
