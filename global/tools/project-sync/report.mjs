export class Refusal extends Error {
  constructor(message) {
    super(message);
    this.name = "Refusal";
  }
}

export const STALE_COPY_REMEDY = "delete the copy and its .kit and .project sidecars, then re-run --apply";

const ACTION_SECTIONS = [
  ["replace", "Replace"],
  ["add", "Add"],
  ["merge", "Merge"],
  ["remove", "Remove"],
  ["record", "Record"],
];
const NOTE_SECTIONS = ["edited-no-base", "removed-by-project", "retired-edited", "renamed-edited", "opted-out-on-disk", "binary-edited", "symlink", "project-only"];

const heldDetail = (h) => `(edited: ${h.files.join(", ")}${h.projectCopy ? `; the project's copy is ${h.projectCopy}` : ""})`;
const heldLine = (h) => `${h.skill} ${heldDetail(h)}`;

function section(title, lines) {
  return [`${title}: ${lines.length ? "" : "none"}`.trimEnd(), ...lines.map((line) => `  - ${line}`)];
}

// `preview` is what an apply would do to settings.json and the Rules table, computed without writing
export function renderPlan(projectName, plan, preview) {
  const lines = [`== ${projectName} ==`];
  for (const [kind, title] of ACTION_SECTIONS) {
    const rows = plan.actions.filter((a) => a.kind === kind).map((a) => `${a.kit} -> ${a.target}`);
    lines.push(...section(title, rows));
  }
  lines.push(...section("Held skills", plan.held.map(heldLine)));
  lines.push(...section("Settings", settingsLines(preview.settings, true)));
  lines.push(...section("Rules table", rulesLines(preview.rules, true)));
  for (const kind of NOTE_SECTIONS) {
    const rows = plan.notes.filter((n) => n.kind === kind).map((n) => `${n.target}${n.kit ? ` (${n.kit})` : ""}${n.detail ? ` — ${n.detail}` : ""}`);
    lines.push(...section(kind, rows));
  }
  return lines.join("\n");
}

const describeDelivered = (delivered) => (delivered ? `${delivered.commit.slice(0, 7)} (${delivered.date})` : "none");

const openNotes = (plan, result) => plan.notes.filter((n) => !(["edited-no-base", "renamed-edited"].includes(n.kind) && result.resolved.includes(n.kit)));

// exactly what keeps --apply from exiting 0
export function owedLines(plan, result) {
  return [
    ...result.conflicts.map((kitPath) => `${kitPath} — merge conflict; merge in the workspace copy, then --resolved`),
    ...openNotes(plan, result).filter((n) => n.kind === "edited-no-base").map((n) => `${n.kit} — edited, no recorded base; merge in the workspace copy, then --resolved`),
    ...openNotes(plan, result).filter((n) => n.kind === "renamed-edited").map((n) => `${n.kit} — renamed from ${n.from}, edited${n.base ? " in the project" : ", no recorded base"}; merge in the workspace copy, then --resolved`),
    ...plan.notes.filter((n) => n.kind === "binary-edited").map((n) => `${n.kit} — edited binary — take it with --take-kit, or add to skip`),
    ...(plan.blocked ?? []).map((b) => `${b.skill} — not written: ${b.target} is symlinked; replace it by hand or add the skill to skip`),
    ...plan.notes.filter((n) => n.owed).map((n) => `${n.kit} — ${n.kind === "symlink" ? "symlinked" : "not a regular file"}${n.renamedTo ? `, renamed to ${n.renamedTo}` : ""}; replace by hand or add to skip`),
    ...plan.held.map((h) => `${h.skill} — held skill ${heldDetail(h)}`),
  ];
}

const WOULD = { created: "would be created", updated: "would be updated", unchanged: "unchanged" };

const settingsLines = ({ status, added, removed }, dry = false) =>
  status === "none" ? [] : [`.claude/settings.json ${dry ? WOULD[status] : status}`, ...added.map((key) => `${dry ? "would register" : "registered"} ${key}`), ...removed.map((key) => `${dry ? "would unregister" : "unregistered"} ${key}`)];

const rulesLines = ({ changed, unmatched, missingTable }, dry = false) =>
  missingTable
    ? ["no Rules table — not edited"]
    : [...changed.map((line) => (dry ? line.replace(/^added /, "would add ").replace(/^removed /, "would remove ") : line)), ...unmatched.map((path) => `no row found for ${path}`)];

function movedFrom(plan, kitPath) {
  const rename = plan.notes.find((n) => n.kind === "renamed-edited" && n.kit === kitPath && n.fromTarget !== n.target);
  return rename ? `; ${rename.fromTarget} removed` : "";
}

export function renderReport(projectName, plan, result) {
  const kindRows = (kind) => result.done.filter((a) => a.kind === kind).map((a) => `${a.kit} -> ${a.target}`);
  const noteRows = (kinds) => openNotes(plan, result).filter((n) => kinds.includes(n.kind)).map((n) => `${n.target}${n.kit ? ` (${n.kit})` : ""}${n.detail ? ` — ${n.detail}` : ""}`);
  const targetOf = (kitPath) => plan.actions.find((a) => a.kit === kitPath)?.target ?? kitPath;
  const recorded = result.done.filter((a) => a.kind === "record").length;

  const lines = [`== ${projectName} ==`];
  lines.push(...section("Replaced", kindRows("replace")));
  lines.push(...section("Added", kindRows("add")));
  lines.push(...section("Merged", [...kindRows("merge"), ...result.resolved.map((kitPath) => `${kitPath} — resolved by hand, record advanced${movedFrom(plan, kitPath)}`)]));
  lines.push(...section("Removed", result.done.filter((a) => a.kind === "remove").map((a) => a.target)));
  const merging = (kitPath) => {
    const workspace = result.workspaces?.[kitPath];
    if (!workspace) return "";
    if (workspace.stale) return ` — merge copy ${workspace.path} is stale (${workspace.stale}) — ${STALE_COPY_REMEDY}`;
    return ` — merge in ${workspace.path}${workspace.kept ? `; workspace copy kept (written ${workspace.date})` : ""}`;
  };
  lines.push(...section("Conflicts", result.conflicts.map((kitPath) => `${kitPath} -> ${targetOf(kitPath)}${merging(kitPath)}`)));
  lines.push(...section("Edited without base", openNotes(plan, result).filter((n) => n.kind === "edited-no-base").map((n) => `${n.target} (${n.kit})${merging(n.kit)}`)));
  lines.push(...section("Removed by the project", noteRows(["removed-by-project"])));
  lines.push(...section("Held skills", [...plan.held.map(heldLine), ...(plan.taken ?? []).filter((t) => t.skill).map((t) => `${t.skill} — taken from the kit (edited: ${t.files.join(", ")})`)]));
  lines.push(...section("Skipped / opted out", noteRows(["opted-out-on-disk"])));
  lines.push(...section("Settings", settingsLines(result.settings)));
  lines.push(...section("Rules table", rulesLines(result.rules)));
  lines.push(...section("Still owed", owedLines(plan, result)));
  lines.push(`Backup path: ${result.backup ?? "none"}`);
  lines.push(`delivered: ${describeDelivered(result.before)} -> ${describeDelivered(result.after)}`);
  const renamedRows = openNotes(plan, result).filter((n) => n.kind === "renamed-edited").map((n) => `${n.target} (${n.kit}) — ${n.detail}${merging(n.kit)}`);
  lines.push(...section("Notes", [...renamedRows, ...noteRows(["retired-edited", "binary-edited", "symlink", "project-only"]), ...(plan.taken ?? []).filter((t) => t.file).map((t) => `${t.file} — edited binary, taken from the kit`), ...(recorded ? [`${recorded} file(s) already current, recorded`] : [])]));
  return lines.join("\n");
}

export function renderStatus(projectName, { delivered, behind, notAncestor, owed }) {
  const behindText = delivered === null ? "never delivered" : notAncestor ? `unknown — ${delivered.commit.slice(0, 7)} is not in main's history` : behind === null ? `unknown — ${delivered.commit.slice(0, 7)} is not in the kit` : `${behind} kit commit(s) since delivered`;
  return [`== ${projectName} ==`, `delivered: ${delivered ? describeDelivered(delivered) : "never"}`, `behind: ${behindText}`, ...section("owed", owed)].join("\n");
}

export function renderBases(projectName, summary, at, backup) {
  return [
    `== ${projectName} ==`,
    `recorded: ${summary.recorded.length}`,
    ...section("edited, no entry", summary.edited),
    ...section("absent from the project", summary.absent),
    ...(at ? section(`not in ${at.slice(0, 7)}, no entry`, summary.notAtCommit) : []),
    `Backup path: ${backup ?? "none"}`,
    "delivered: never (unchanged — the first run sets it)",
  ].join("\n");
}
