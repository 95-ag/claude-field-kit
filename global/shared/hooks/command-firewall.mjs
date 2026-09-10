#!/usr/bin/env node
/**
 * command-firewall — PreToolUse guard for command execution.
 *
 * Cross-shell: inspects commands from BOTH the Bash tool (unix / git-bash) and the
 * PowerShell tool. To actually intercept PowerShell, the PreToolUse matcher in
 * settings.json must list the "PowerShell" tool as well as "Bash" — otherwise PS
 * commands never reach this hook. The code below is shell-agnostic; unix and
 * PowerShell patterns do not overlap in practice, so running both sets is safe.
 *
 * Precedence (strict): HARD_BLOCK (exit 2, no bypass) > ASK (confirm) > allow.
 *
 * WRITE-TARGET GUARD. Beyond command shapes, this hook extracts the files a command would WRITE
 * -- redirections, tee, sed -i, cp/mv destinations, heredoc targets -- and judges them against the
 * same protected-path list file-protect uses. Without it, `Edit(".env")` was refused while
 * `cat > .env` succeeded: the same file, protected through one channel and open through the other.
 *
 * READING a protected file is deliberately NOT guarded (owner decision, 2026-09-10). Copying a
 * secret elsewhere, or piping it into a network call, is unguarded. Blocking writes does nothing
 * about reads, and the honest version of a read guard would restrict ordinary legitimate use. This
 * is a chosen gap, not an oversight — revisit it as a policy question, not as a missing pattern.
 *
 * This NARROWS the gap; it does not close it. A target computed at runtime contains no literal and
 * no static check can see it. Nor can a cwd-relative write be judged: `cd /etc && echo x > passwd`
 * extracts `passwd`, which matches no /etc/ rule. Both are caught after the fact by
 * bash-write-adapter's post-hoc alarm, which sees what actually changed. The only airtight
 * prevention is OS-level immutability (`chattr +i <file>`, run with elevated privileges) -- that is
 * the owner's to run, never an agent's, and privilege escalation is hard-blocked below.
 *
 * Not in scope: MSYS/WSL path mangling (git-bash rewriting /home/... args) is an
 * environment behavior fixed by the MSYS guard, not by this firewall.
 */
import { createInterface } from "readline";
import { existsSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

// The protected-path lists are shared with file-protect so the two channels cannot drift apart.
// If they cannot be loaded the write-target guard is skipped and every pre-existing check still
// runs. Failing closed here would block every command in the session, which is a worse failure
// than the narrower coverage this hook adds.
let PATHS = null;
try {
  PATHS = await import(new URL("./lib/protected-paths.mjs", import.meta.url));
} catch {
  PATHS = null;
}

// --- combined-flag helpers (order/case/long-flag tolerant) -----------------

// Flag scans run per command segment, never across the whole line. Scanning the whole line tests
// for the verb, the recursive flag and the force flag independently, so an unrelated flag on a
// SECOND command fabricates a match: a plain single-file delete beside a recursive search reads as
// a recursive force delete and hard-blocks. Splitting first keeps every true positive — a genuine
// destructive call lives inside one segment — and removes that whole false class.
function segments(cmd) {
  return String(cmd).split(/(?:\|\||&&|[;|\n])/);
}

function anySegment(cmd, test) {
  return segments(cmd).some(test);
}

// Deletion carrying BOTH recursive and force, in any spelling or order, short or long form.
function isDestructiveRm(cmd) {
  return anySegment(cmd, (seg) => {
    if (!/\brm\b/.test(seg)) return false;
    const recursive = /(^|\s)-[a-zA-Z]*[rR][a-zA-Z]*(\s|$)/.test(seg) || /--recursive\b/.test(seg);
    const force = /(^|\s)-[a-zA-Z]*[fF][a-zA-Z]*(\s|$)/.test(seg) || /--force\b/.test(seg);
    return recursive && force;
  });
}

// PowerShell/cmd recursive force-delete: Remove-Item -Recurse -Force, rd /s /q, del /s /q, etc.
function isDestructivePsRemove(cmd) {
  return anySegment(cmd, (seg) => {
    if (!/\b(Remove-Item|ri|del|erase|rd|rmdir)\b/i.test(seg)) return false;
    const recursive = /-Recurse\b/i.test(seg) || /(^|\s)-r\b/i.test(seg) || /\/s\b/i.test(seg);
    const force = /-Force\b/i.test(seg) || /(^|\s)-f\b/i.test(seg) || /\/q\b/i.test(seg);
    return recursive && force;
  });
}

// --- hard block: regex patterns (no bypass) --------------------------------

const HARD_BLOCK = [
  // unix / git
  { cat: "git:force-push", re: /\bgit\s+push\b[^\n]*\s--force(?!-with-lease)\b/ },
  { cat: "git:force-push", re: /\bgit\s+push\b[^\n]*\s-f\b/ },
  { cat: "git:reset-hard", re: /\bgit\s+reset\s+--hard\b/ },
  { cat: "git:checkout--", re: /\bgit\s+checkout\s+--(\s|$)/ },
  // No-loss guard: git clean with a force flag can wipe a gitignored .claude/ or docs/ (un-captured,
  // irrecoverable). Hard-block ANY `git clean` whose command contains -f (any cluster) or --force,
  // including compound commands (textual match, like the other rules). Bare `git clean -n`/`-i`
  // (no force flag) is allowed. See precious:delete.
  { cat: "git:clean", re: /\bgit\s+clean\b[^\n]*\s-[a-zA-Z]*f/ },
  { cat: "git:clean", re: /\bgit\s+clean\b[^\n]*\s--force\b/ },
  { cat: "git:branch-D", re: /\bgit\s+branch\s+-D\b/ },
  { cat: "fs:find-delete", re: /\bfind\b[^\n]*-delete\b/ },
  { cat: "fs:dd-device", re: /\bdd\b[^\n]*\bof=\/dev\// },
  { cat: "fs:mkfs", re: /\bmkfs(\.\w+)?\b/ },
  { cat: "priv:sudo", re: /\bsudo\b/ },
  { cat: "bypass:no-verify", re: /--no-verify\b/ },
  { cat: "bypass:no-gpg-sign", re: /--no-gpg-sign\b/ },
  { cat: "net:pipe-to-shell", re: /\b(curl|wget)\b[^|#\n]*\|\s*(ba|z|k|da)?sh\b/ },
  { cat: "net:exec-subshell", re: /\b(ba|z|k|da)?sh\b[^\n]*\$\(\s*(curl|wget)\b/ },
  { cat: "net:eval-fetch", re: /\beval\b[^\n]*\$\(\s*(curl|wget)\b/ },
  // release: irreversible publish / prod deploy — never unattended, no bypass
  { cat: "release:npm-publish", re: /\bnpm\s+publish\b/ },
  { cat: "deploy:prod", re: /\bvercel\b[^\n]*--prod\b/ },
  // precious / no-loss: deleting .claude or docs (gitignored → irreplaceable, never recoverable)
  { cat: "precious:delete", re: /\b(rm|rmdir|unlink|Remove-Item|ri|del|erase|rd)\b[^\n]*\.claude(\/|\b)/i },
  { cat: "precious:delete", re: /\b(rm|rmdir|unlink|Remove-Item|ri|del|erase|rd)\b[^\n]*(^|[\s'"\/])docs(\/|\b)/i },
  { cat: "precious:delete", re: /\bgit\s+rm\b[^\n]*(\.claude|docs)\b/i },
  // powershell
  { cat: "ps:exec-policy", re: /\bSet-ExecutionPolicy\b[^\n]*\b(Unrestricted|Bypass)\b/i },
  { cat: "ps:format-disk", re: /\b(Format-Volume|Clear-Disk)\b/i },
  { cat: "ps:download-exec", re: /\b(iwr|irm|Invoke-WebRequest|Invoke-RestMethod|DownloadString)\b[^\n]*\|\s*(iex|Invoke-Expression)\b/i },
  { cat: "ps:download-exec", re: /\b(iex|Invoke-Expression)\b[^\n]*\b(iwr|irm|DownloadString|Invoke-WebRequest|Invoke-RestMethod)\b/i },
  { cat: "ps:power", re: /\b(Stop-Computer|Restart-Computer)\b/i },
];

// hard block: function checks (combined flags)
const HARD_BLOCK_FN = [
  { cat: "fs:rm-rf", fn: isDestructiveRm },
  { cat: "ps:remove-recurse-force", fn: isDestructivePsRemove },
];

// --- ask: sensitive but legitimate (confirm) -------------------------------

const ASK = [
  // unix
  { cat: "publish", re: /\bgit\s+tag\b/ },
  { cat: "pkg-mutation", re: /\bnpm\s+(install|uninstall|remove|ci|i)\b/ },
  { cat: "pkg-mutation", re: /\bpnpm\s+(add|install|remove)\b/ },
  { cat: "pkg-mutation", re: /\byarn\s+(add|remove)\b/ },
  { cat: "pkg-mutation", re: /\bpip3?\s+(install|uninstall)\b/ },
  // In-place editing carried a blanket prompt here, on the command's NAME. It was the single
  // largest source of prompts measured, and it asked the same question of a protected file and of
  // an ordinary source file. The write-target guard below now judges the actual target: in-place
  // editing a protected path blocks outright, and one under global config still asks. Prompting on
  // the name as well would ask about files that are already decided, so it is gone.
  // powershell
  { cat: "ps:install", re: /\b(Install-Module|Install-Package)\b/i },
  { cat: "ps:exec-policy", re: /\bSet-ExecutionPolicy\b/i },
  { cat: "ps:kill", re: /\bStop-Process\b[^\n]*-Force\b/i },
];

// --- write-target extraction -----------------------------------------------

const HOME_DIR = process.env.HOME ?? process.env.USERPROFILE ?? "";

// Bodies of a heredoc are DATA, not shell syntax. `cat > page.html <<'EOF'` followed by `<div>x`
// would otherwise read as a redirection into a file called "x". Split them off before parsing, and
// hand the bodies to the interpreter and prose checks, which are the ones that care about content.
function splitHeredocs(command) {
  const lines = String(command).split("\n");
  const shell = [];
  const bodies = [];
  let i = 0;
  while (i < lines.length) {
    const opener = lines[i];
    shell.push(opener);
    i++;
    for (const m of opener.matchAll(/<<(-?)\s*(?:"([^"]*)"|'([^']*)'|([A-Za-z_]\w*))/g)) {
      const stripTabs = m[1] === "-";
      const tag = m[2] ?? m[3] ?? m[4];
      const body = [];
      while (i < lines.length) {
        const line = lines[i];
        i++;
        if ((stripTabs ? line.replace(/^\t+/, "") : line) === tag) break;
        body.push(line);
      }
      bodies.push({ tag, body: body.join("\n"), opener });
    }
  }
  return { shell: shell.join("\n"), bodies };
}

// Anything still holding a runtime value after the two expansions below cannot be judged statically.
const UNRESOLVABLE_RE = /[$`*?[\]]/;

// Only two expansions, both deterministic: a leading ~ and a leading $HOME. Every other $VAR,
// command substitution or glob is SKIPPED rather than guessed at — a wrong guess would either block
// a legitimate command or, worse, clear a protected one. Skipped targets are covered after the fact
// by bash-write-adapter's alarm.
function normalizeTarget(raw) {
  let t = String(raw).trim();
  const quoted = t.match(/^"([^"]*)"$/) ?? t.match(/^'([^']*)'$/);
  if (quoted) t = quoted[1];
  if (t === "~" || t.startsWith("~/")) t = HOME_DIR + t.slice(1);
  t = t.replace(/^\$\{?HOME\}?(?=\/|$)/, HOME_DIR);
  if (!t || UNRESOLVABLE_RE.test(t)) return null;
  if (/^\/dev\//.test(t)) return null; // /dev/null and friends are devices, not files
  return t;
}

function splitArgs(s) {
  return [...String(s).matchAll(/"[^"]*"|'[^']*'|\S+/g)].map((m) => m[0]);
}

// Redirections: > f, >f, >> f, 2> f, &> f, >| f. The target character class excludes & so that fd
// duplication (2>&1, >&2) yields nothing — those redirect to a descriptor, not to a file. It also
// excludes quote characters: a nested command (`bash -c 'echo x > .env'`) ends with the closing
// quote glued to the path, and a target of ".env'" matches no rule while writing the real file.
const REDIRECT_RE = /(?:\d+|&)?>>?\|?\s*("[^"]*"|'[^']*'|[^\s;&|<>()'"]+)/g;

function redirectTargets(text) {
  return [...String(text).matchAll(REDIRECT_RE)].map((m) => m[1]);
}

function teeTargets(shell) {
  const out = [];
  for (const m of shell.matchAll(/\btee\b([^\n;|&]*)/g)) {
    for (const arg of splitArgs(m[1])) if (!arg.startsWith("-")) out.push(arg);
  }
  return out;
}

// In-place stream editing rewrites its trailing file arguments. The first bare argument is the
// script UNLESS the script was already given by -e/-f, in which case every bare argument is a file.
// perl -pi is the same shape and was already an ASK category, so it must reach the same verdict.
function inPlaceEditTargets(shell) {
  const out = [];
  for (const m of shell.matchAll(/\b(?:sed|perl)\b([^\n;|&]*)/g)) {
    const args = splitArgs(m[1]);
    const inPlace = args.some((a) => /^-[a-zA-Z]*i/.test(a) || a === "--in-place" || a.startsWith("--in-place="));
    if (!inPlace) continue;
    let scriptSeen = args.some((a) => a === "-e" || a === "-f" || a.startsWith("--expression") || a.startsWith("--file"));
    for (let k = 0; k < args.length; k++) {
      const arg = args[k];
      if (arg === "-e" || arg === "-f" || arg === "--expression" || arg === "--file") { k++; continue; }
      if (arg.startsWith("-")) continue;
      if (!scriptSeen) { scriptSeen = true; continue; }
      out.push(arg);
    }
  }
  return out;
}

// Anything whose last operand is a destination it will create or overwrite. install, rsync and ln
// share cp/mv's shape and were reaching a protected path untouched.
function copyMoveTargets(shell) {
  const out = [];
  for (const m of shell.matchAll(/\b(cp|mv|install|rsync|ln)\b([^\n;|&]*)/g)) {
    const args = splitArgs(m[2]).filter((a) => !a.startsWith("-"));
    if (args.length >= 2) out.push(args[args.length - 1]); // destination is the last operand
  }
  return out;
}

// dd names its destination with of=, which no redirection or operand rule would ever see.
function ddTargets(shell) {
  return [...shell.matchAll(/\bdd\b[^\n;|&]*?\bof=("[^"]*"|'[^']*'|[^\s;&|]+)/g)].map((m) => m[1]);
}

// Destroying a protected file is not a write, so no write rule catches it — and the post-hoc alarm
// cannot either, because a deleted file leaves nothing to detect. Prevention is the only place this
// can be caught at all. mv's SOURCE belongs here: moving a file away destroys it in place.
function destructiveTargets(shell) {
  const out = [];
  for (const m of shell.matchAll(/\b(rm|unlink|shred|rmdir|truncate)\b([^\n;|&]*)/g)) {
    const args = splitArgs(m[2]);
    for (let k = 0; k < args.length; k++) {
      const arg = args[k];
      if (arg === "-s" || arg === "--size") { k++; continue; } // truncate's size operand
      if (arg.startsWith("-")) continue;
      out.push(arg);
    }
  }
  for (const m of shell.matchAll(/\bmv\b([^\n;|&]*)/g)) {
    const args = splitArgs(m[1]).filter((a) => !a.startsWith("-"));
    if (args.length >= 2) out.push(args[0]); // source is destroyed by the move
  }
  for (const m of shell.matchAll(/\bRemove-Item\b([^\n;|]*)/gi)) {
    const args = splitArgs(m[1]);
    const named = args.findIndex((a) => /^-(Path|LiteralPath)$/i.test(a));
    if (named !== -1 && args[named + 1]) { out.push(args[named + 1]); continue; }
    const positional = args.find((a) => !a.startsWith("-"));
    if (positional) out.push(positional);
  }
  return out;
}

// PowerShell writes by cmdlet rather than by redirection. This hook is registered for the
// PowerShell tool and claims cross-shell scope, so leaving these out would protect a path under
// bash and leave it open under PowerShell — the same asymmetry as the Edit/Bash split.
function powershellTargets(shell) {
  const out = [];
  for (const m of shell.matchAll(/\b(Set-Content|Add-Content|Out-File|Tee-Object|New-Item)\b([^\n;|]*)/gi)) {
    const args = splitArgs(m[2]);
    const named = args.findIndex((a) => /^-(Path|FilePath|LiteralPath)$/i.test(a));
    if (named !== -1 && args[named + 1]) { out.push(args[named + 1]); continue; }
    const positional = args.find((a) => !a.startsWith("-"));
    if (positional) out.push(positional);
  }
  return out;
}

function writeTargets(shell) {
  const raw = [
    ...redirectTargets(shell),
    ...teeTargets(shell),
    ...inPlaceEditTargets(shell),
    ...copyMoveTargets(shell),
    ...powershellTargets(shell),
    ...ddTargets(shell),
  ];
  return [...new Set(raw.map(normalizeTarget).filter(Boolean))].map(PATHS.normalize);
}

// --- OR1: interpreters may not write a protected file unattended -----------

const INTERPRETER_RE = /\b(python3?|node|perl|ruby|php|deno|bun)\b/;

// A write verb bound to the protected literal is confident enough for exit 2 — the same verdict
// file-protect already gives the Edit channel for that path. Parity, not new severity.
//
// The literal must appear IN the write call, not merely near it. A proximity window was tried and
// rejected: it blocks any script that writes one file while listing protected paths elsewhere —
// including this hook's own shared path list, which would have become uneditable. Binding to the
// call keeps the true case and drops that whole false-positive class into the ASK tier below.
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function writesLiteral(text, token) {
  const literal = escapeRegExp(token);
  const quoted = `["'][^"'\\n]*${literal}[^"'\\n]*["']`;
  const bound = [
    `\\bopen\\s*\\(\\s*${quoted}\\s*,\\s*["'][wax]`,                       // open(path, "w")
    `${quoted}\\s*\\)?\\s*\\.\\s*(write_text|write_bytes|write)\\s*\\(`,   // Path(path).write_text(...)
    `\\b(writeFileSync|appendFileSync|createWriteStream|writeFile|copyFileSync|renameSync)\\s*\\(\\s*${quoted}`,
    `\\b(shutil\\.(copy\\w*|move|rmtree)|os\\.(rename|replace|remove|unlink))\\s*\\([^)]*${quoted}`,
    `\\b(unlinkSync|rmSync|rmdirSync)\\s*\\(\\s*${quoted}`,
    // Destroying the file is the same verdict as overwriting it — `rm .env` blocks, so must this.
    `${quoted}\\s*\\)?\\s*\\.\\s*(unlink|rmdir)\\s*\\(`,
    `>\\s*["']?${literal}`,                                                // redirection nested in the body
  ];
  return bound.some((p) => new RegExp(p).test(text));
}

const LITERAL_CAP = 200;

// Candidate path tokens in interpreter text: quoted strings first, then bare path-shaped words.
function protectedLiterals(text) {
  const found = new Map();
  const consider = (token) => {
    if (found.has(token)) return;
    const t = normalizeTarget(token);
    if (!t) return;
    const p = PATHS.normalize(t);
    if (PATHS.HARD_BLOCK.some((re) => re.test(p))) found.set(token, p);
  };
  // Each quote style is scanned independently. One alternating pass would let an outer
  // double-quoted argument swallow the single-quoted path inside it — `-c "open('.env','w')"` —
  // and the literal would never be seen.
  for (const m of text.matchAll(/"([^"\n]{1,200})"/g)) consider(m[1]);
  for (const m of text.matchAll(/'([^'\n]{1,200})'/g)) consider(m[1]);
  for (const m of text.matchAll(/(?:^|[\s(,=[{"'])((?:~|\.{1,2})?[\w./~-]{2,200})/g)) consider(m[1]);
  return [...found].slice(0, LITERAL_CAP).map(([token, path]) => ({ token, path }));
}

function interpreterDecision(command, shell) {
  if (!INTERPRETER_RE.test(shell)) return null;
  const hits = protectedLiterals(command);
  if (hits.length === 0) return null;
  for (const hit of hits) {
    if (writesLiteral(command, hit.token)) {
      return { decision: "block", category: "interpreter:protected-write", detail: hit.path };
    }
  }
  // Literal without a bound write is too weak for exit 2 — the owner is the gate for the ambiguous half.
  return { decision: "ask", category: "interpreter:protected-literal", detail: hits[0].path };
}

// --- prose gate on heredoc bodies ------------------------------------------

// A body can be megabytes; checking one must not stall every command. The skip is reported, never silent.
const MAX_PROSE_BODY = 512 * 1024;

// ai-prose-guard is a project-domain hook, so its path cannot be assumed — resolve it under the
// project root and stay silent when the project does not have one.
function heredocProseBlock(bodies, cwd) {
  const guard = join(cwd, ".claude", "hooks", "ai-prose-guard.mjs");
  if (!existsSync(guard)) return null;
  for (const h of bodies) {
    const page = redirectTargets(h.opener)
      .map(normalizeTarget)
      .find((t) => t && /\.(mdx|html?|htm)$/i.test(t));
    if (!page) continue;
    if (h.body.length > MAX_PROSE_BODY) {
      process.stderr.write(
        `[command-firewall] prose check skipped for ${page}: body exceeds ${Math.round(MAX_PROSE_BODY / 1024)}KB.\n`,
      );
      continue;
    }
    // Blocking is right here: the guard reads the exact text being written, which is the same check
    // an Edit of this content would have received. Not a heuristic.
    const r = spawnSync("node", [guard], {
      cwd,
      input: JSON.stringify({ tool_name: "Write", tool_input: { file_path: page, content: h.body } }),
      encoding: "utf8",
      timeout: 15000,
    });
    if (r.status === 2) return r.stderr ?? `[ai-prose-guard] blocked ${page}`;
  }
  return null;
}

// --- combined decision ------------------------------------------------------

// One try/catch around all of the new parsing. A regex bug here must degrade to the pre-existing
// checks, never brick every Bash call — the tradeoff is that a parser crash silently loses this
// hook's added coverage, which the post-hoc alarm still reports after the fact.
function writeGuardDecision(command, cwd) {
  if (!PATHS) return null;
  try {
    const { shell, bodies } = splitHeredocs(command);

    for (const target of writeTargets(shell)) {
      if (PATHS.HARD_BLOCK.some((re) => re.test(target))) {
        return { decision: "block", category: "write:protected-path", detail: target };
      }
    }

    const destroyed = [...new Set(destructiveTargets(shell).map(normalizeTarget).filter(Boolean))].map(PATHS.normalize);
    for (const target of destroyed) {
      if (PATHS.HARD_BLOCK.some((re) => re.test(target))) {
        return { decision: "block", category: "destroy:protected-path", detail: target };
      }
    }

    const interpreter = interpreterDecision(command, shell);
    if (interpreter?.decision === "block") return interpreter;

    const prose = heredocProseBlock(bodies, cwd);
    if (prose) return { decision: "block", category: "write:prose", detail: prose };

    if (interpreter) return interpreter;

    for (const target of writeTargets(shell)) {
      if (PATHS.GLOBAL_ALLOW.some((re) => re.test(target))) continue; // plans/ and memory/ stay silent
      if (PATHS.GLOBAL_ASK.some((re) => re.test(target))) {
        return { decision: "ask", category: "write:global-config", detail: target };
      }
    }
    return null;
  } catch (err) {
    process.stderr.write(`[command-firewall] write-target check skipped: ${err?.message ?? err}\n`);
    return null;
  }
}

// --- runner ----------------------------------------------------------------

function block(category, command, detail = "") {
  process.stderr.write(
    `[command-firewall] BLOCKED (${category}): this command is not permitted.\n` +
      (detail ? `${detail}\n` : "") +
      `Command: ${command}\n`,
  );
  process.exit(2);
}

function ask(category, command, detail = "") {
  const reason = detail || `Command matches sensitive category "${category}".`;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `[command-firewall] ${reason} Confirm this is intentional.\nCommand: ${command}`,
      },
    }),
  );
  process.exit(0);
}

function guardMessage({ category, detail }) {
  switch (category) {
    case "destroy:protected-path":
      return `"${detail}" is a protected file and this command would destroy it. Deleting it is not a way around the rule against editing it.`;
    case "write:protected-path":
      return `"${detail}" is a protected file. file-protect refuses the same path through Edit, and the shell is not a way around that.`;
    case "interpreter:protected-write":
      return `An interpreter in this command would write the protected file "${detail}". Only the owner may do that — run it yourself, or make the file immutable at the OS level.`;
    case "interpreter:protected-literal":
      return `This interpreter command names the protected file "${detail}" without an obvious write.`;
    case "write:global-config":
      return `"${detail}" is global / out-of-repo config. Global-config changes need explicit approval.`;
    case "write:prose":
      return detail;
    default:
      return detail;
  }
}

const rl = createInterface({ input: process.stdin });
let raw = "";
rl.on("line", (line) => (raw += line));
rl.on("close", () => {
  let input;
  try {
    input = JSON.parse(raw || "{}");
  } catch {
    // Can't parse the tool call → can't verify safety → fail closed.
    process.stderr.write("[command-firewall] BLOCKED: could not parse hook input (failing closed).\n");
    process.exit(2);
  }

  const command = input?.tool_input?.command || "";
  if (!command) process.exit(0);
  const cwd = input?.cwd || process.cwd();

  for (const { cat, re } of HARD_BLOCK) if (re.test(command)) block(cat, command);
  for (const { cat, fn } of HARD_BLOCK_FN) if (fn(command)) block(cat, command);

  // Deliberately ahead of the ASK list: a protected write target must BLOCK, not merely prompt.
  // Reaching ASK first would let `sed -i` on a protected file be answered with "yes", which is the
  // asymmetry this guard exists to remove.
  const guard = writeGuardDecision(command, cwd);
  if (guard?.decision === "block") block(guard.category, command, guardMessage(guard));
  if (guard?.decision === "ask") ask(guard.category, command, guardMessage(guard));

  for (const { cat, re } of ASK) if (re.test(command)) ask(cat, command);

  process.exit(0);
});
