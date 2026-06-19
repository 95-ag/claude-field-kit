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
 * Not in scope: MSYS/WSL path mangling (git-bash rewriting /home/... args) is an
 * environment behavior fixed by the MSYS guard, not by this firewall.
 */
import { createInterface } from "readline";

// --- combined-flag helpers (order/case/long-flag tolerant) -----------------

// rm with BOTH recursive and force, any spelling: -rf, -fr, -Rf, -r -f, --recursive --force
function isDestructiveRm(cmd) {
  if (!/\brm\b/.test(cmd)) return false;
  const recursive = /(^|\s)-[a-zA-Z]*[rR][a-zA-Z]*(\s|$)/.test(cmd) || /--recursive\b/.test(cmd);
  const force = /(^|\s)-[a-zA-Z]*[fF][a-zA-Z]*(\s|$)/.test(cmd) || /--force\b/.test(cmd);
  return recursive && force;
}

// PowerShell/cmd recursive force-delete: Remove-Item -Recurse -Force, rd /s /q, del /s /q, etc.
function isDestructivePsRemove(cmd) {
  if (!/\b(Remove-Item|ri|del|erase|rd|rmdir)\b/i.test(cmd)) return false;
  const recursive = /-Recurse\b/i.test(cmd) || /(^|\s)-r\b/i.test(cmd) || /\/s\b/i.test(cmd);
  const force = /-Force\b/i.test(cmd) || /(^|\s)-f\b/i.test(cmd) || /\/q\b/i.test(cmd);
  return recursive && force;
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
  { cat: "in-place-edit", re: /\bsed\s+-i\b/ },
  { cat: "in-place-edit", re: /\bperl\s+-[a-z]*pi\b/ },
  // powershell
  { cat: "ps:install", re: /\b(Install-Module|Install-Package)\b/i },
  { cat: "ps:exec-policy", re: /\bSet-ExecutionPolicy\b/i },
  { cat: "ps:kill", re: /\bStop-Process\b[^\n]*-Force\b/i },
];

// --- runner ----------------------------------------------------------------

function block(category, command) {
  process.stderr.write(
    `[command-firewall] BLOCKED (${category}): this command is not permitted.\nCommand: ${command}\n`,
  );
  process.exit(2);
}

function ask(category, command) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `[command-firewall] Command matches sensitive category "${category}". Confirm this is intentional.\nCommand: ${command}`,
      },
    }),
  );
  process.exit(0);
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

  for (const { cat, re } of HARD_BLOCK) if (re.test(command)) block(cat, command);
  for (const { cat, fn } of HARD_BLOCK_FN) if (fn(command)) block(cat, command);
  for (const { cat, re } of ASK) if (re.test(command)) ask(cat, command);

  process.exit(0);
});
