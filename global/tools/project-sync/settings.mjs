import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { catalog } from "./kit.mjs";
import { Refusal } from "./report.mjs";

const HOOKS_DIR = ".claude/hooks/";
const WRAPPED = "if command -v wsl >/dev/null 2>&1; then ";

const isSkipped = (kitPath, skip) => skip.some((s) => kitPath === s || kitPath.startsWith(`${s}/`));
const scriptOf = (command) => (typeof command === "string" ? command : "").match(/\.claude\/hooks\/([^"'\s;]+)/)?.[1] ?? null;

// One command for both harnesses a project's shared settings.json meets: Windows-desktop over WSL, and
// WSL-native. if/then/else rather than &&/|| so a blocking hook's non-zero exit is not taken for "wsl missing".
export function wrapCommand(command) {
  if (command.startsWith(WRAPPED)) return command;
  const quoted = command.replaceAll("'", "'\\''");
  return `${WRAPPED}MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL=* wsl -d ubuntu bash -lc '${quoted}'; else ${command}; fi`;
}

function withoutComments(value) {
  if (Array.isArray(value)) return value.map(withoutComments);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "//").map(([key, inner]) => [key, withoutComments(inner)]));
}

function activeBuckets(rec) {
  return ["shared", ...rec.tiers.domains.map((d) => `domains/${d}`), ...rec.tiers.stacks.map((s) => `stacks/${s}`), ...(rec.tiers.repo ? [`repos/${rec.tiers.repo}`] : [])];
}

function readHooksJson(path) {
  let parsed;
  try {
    parsed = withoutComments(JSON.parse(readFileSync(path, "utf8")));
  } catch (error) {
    throw new Refusal(`${path} is not valid JSON (${error.message})`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Refusal(`${path} is not a JSON object`);
  assertHooksShape(parsed, path);
  // a project's settings may hold a group with no `hooks` list; a kit file that does would compose nothing
  const listless = Object.entries(parsed.hooks ?? {}).find(([, groups]) => groups.some((group) => !Array.isArray(group.hooks)));
  if (listless) throw new Refusal(`${path} has an unexpected shape: an entry of \`hooks.${listless[0]}\` has no \`hooks\` list`);
  return parsed;
}

export function composeHooks(kit, rec) {
  const skippedScripts = new Set(
    catalog(kit).entries.filter((e) => e.type === "hooks" && isSkipped(e.kit, rec.skip)).map((e) => e.target.slice(HOOKS_DIR.length)),
  );
  const hooks = {};
  for (const bucket of activeBuckets(rec)) {
    const path = join(kit, "project", bucket, "hooks.json");
    if (!existsSync(path)) continue;
    for (const [event, groups] of Object.entries(readHooksJson(path).hooks ?? {})) {
      for (const group of groups) {
        const kept = group.hooks.filter((hook) => !skippedScripts.has(scriptOf(hook.command)));
        if (!kept.length) continue;
        (hooks[event] ??= []).push({ ...group, hooks: kept.map((hook) => ({ ...hook, command: wrapCommand(hook.command) })) });
      }
    }
  }
  return { hooks };
}

// Command by command, so a user's own hook sharing a group with a kit hook survives
export function mergeProjectSettings(existing, composed, kitHookScripts) {
  const isManaged = (hook) => kitHookScripts.has(scriptOf(hook?.command));
  const existingHooks = existing.hooks ?? {};
  const composedHooks = composed.hooks ?? {};
  const merged = {};
  for (const event of new Set([...Object.keys(existingHooks), ...Object.keys(composedHooks)])) {
    const before = existingHooks[event] ?? [];
    const userGroups = before
      .map((group) => (Array.isArray(group.hooks) ? { ...group, hooks: group.hooks.filter((hook) => !isManaged(hook)) } : group))
      .filter((group) => !Array.isArray(group.hooks) || group.hooks.length);
    const groups = [...userGroups, ...(composedHooks[event] ?? [])];
    if (groups.length || before.length === 0) merged[event] = groups;
  }
  if (!("hooks" in existing) && !Object.keys(merged).length) return existing;
  return { ...existing, hooks: merged };
}

function registered(settings, kitHookScripts) {
  const found = new Set();
  for (const [event, groups] of Object.entries(settings.hooks ?? {})) {
    for (const group of groups) {
      for (const hook of group.hooks ?? []) {
        const script = scriptOf(hook.command);
        if (kitHookScripts.has(script)) found.add(`${event} [${group.matcher ?? ""}] ${script}`);
      }
    }
  }
  return found;
}

function assertHooksShape(existing, settingsPath) {
  if (!("hooks" in existing)) return;
  const bad = (what) => {
    throw new Refusal(`${settingsPath} has an unexpected shape: ${what}`);
  };
  const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  if (!isObject(existing.hooks)) bad("`hooks` is not an object");
  for (const [event, groups] of Object.entries(existing.hooks)) {
    if (!Array.isArray(groups)) bad(`\`hooks.${event}\` is not a list`);
    for (const group of groups) {
      if (!isObject(group)) bad(`an entry of \`hooks.${event}\` is not an object`);
      if ("hooks" in group && (!Array.isArray(group.hooks) || !group.hooks.every(isObject))) bad(`an entry of \`hooks.${event}\` has a \`hooks\` that is not a list of objects`);
    }
  }
}

// status: none (nothing to register, no file) · created · updated · unchanged. `text` is set only when a write is due.
export function planSettings(kit, rec, settingsPath) {
  const composed = composeHooks(kit, rec);
  const scripts = new Set(catalog(kit).entries.filter((e) => e.type === "hooks").map((e) => e.target.slice(HOOKS_DIR.length)));
  for (const groups of Object.values(composed.hooks)) for (const group of groups) for (const hook of group.hooks) scripts.add(scriptOf(hook.command));

  const exists = existsSync(settingsPath);
  let existing = {};
  if (exists) {
    try {
      existing = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch (error) {
      throw new Refusal(`${settingsPath} is not valid JSON (${error.message})`);
    }
    if (existing === null || typeof existing !== "object" || Array.isArray(existing)) throw new Refusal(`${settingsPath} is not a JSON object`);
  }
  assertHooksShape(existing, settingsPath);
  const merged = mergeProjectSettings(existing, composed, scripts);
  const before = registered(existing, scripts);
  const after = registered(merged, scripts);
  const added = [...after].filter((key) => !before.has(key));
  const removed = [...before].filter((key) => !after.has(key));
  const text = `${JSON.stringify(merged, null, 2)}\n`;

  if (!exists) return merged === existing ? { status: "none", text: null, added, removed } : { status: "created", text, added, removed };
  if (JSON.stringify(merged) === JSON.stringify(existing)) return { status: "unchanged", text: null, added, removed };
  return { status: "updated", text, added, removed };
}
