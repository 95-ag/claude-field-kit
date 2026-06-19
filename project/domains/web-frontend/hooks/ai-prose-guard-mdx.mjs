#!/usr/bin/env node
/**
 * ai-prose-guard-mdx — PreToolUse on Write/Edit/MultiEdit, scoped to .mdx content. (was text-enforce)
 * Blocks AI-cliché phrasing and placeholder text in published prose.
 *
 * Frontend tier: only .mdx (published web content) is checked. Quality gate, NOT security →
 * fails OPEN: an unparseable input skips the check, never blocks an unrelated write.
 */
import { createInterface } from "readline";

const AI_CLICHES = [
  /\blet me\b/i,
  /\bi'?ll now\b/i,
  /\bcertainly!/i,
  /\bgreat question\b/i,
  /\bas an ai\b/i,
  /\bi hope this helps\b/i,
  /\bfeel free to\b/i,
  /\bin conclusion\b/i,
];

const PLACEHOLDERS = [
  /\bTBD\b/,
  /\bplaceholder\b/i,
  /\blorem ipsum\b/i,
  /\bTODO:/,
  /\bFIXME\b/,
  /\bcoming soon\b/i,
];

function findViolations(text) {
  const violations = [];
  for (const [lineIdx, line] of text.split("\n").entries()) {
    for (const pattern of [...AI_CLICHES, ...PLACEHOLDERS]) {
      if (pattern.test(line)) violations.push({ line: lineIdx + 1, match: line.trim() });
    }
  }
  return violations;
}

function extractContent(input) {
  const tool = input.tool_name || "";
  if (tool === "Write") return input.tool_input?.content || "";
  if (tool === "Edit") return input.tool_input?.new_string || "";
  if (tool === "MultiEdit") return (input.tool_input?.edits || []).map((e) => e.new_string || "").join("\n");
  return "";
}

const rl = createInterface({ input: process.stdin });
let raw = "";
rl.on("line", (line) => (raw += line));
rl.on("close", () => {
  let input;
  try { input = JSON.parse(raw || "{}"); } catch { process.exit(0); } // quality gate → fail open

  const filePath = String(input?.tool_input?.file_path || "").replace(/\\/g, "/");
  if (!/\.mdx$/i.test(filePath)) process.exit(0);

  const content = extractContent(input);
  if (!content) process.exit(0);

  const violations = findViolations(content);
  if (violations.length === 0) process.exit(0);

  const details = violations.map((v) => `  Line ${v.line}: "${v.match}"`).join("\n");
  process.stderr.write(
    `[ai-prose-guard-mdx] BLOCKED: disallowed content in ${filePath}:\n${details}\nRewrite the flagged lines before saving.\n`,
  );
  process.exit(2);
});
