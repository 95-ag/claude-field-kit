#!/usr/bin/env node
/**
 * ai-prose-guard — PreToolUse on Write/Edit/MultiEdit, scoped to reader-served pages
 * (`.mdx`, `.html`, `.htm`). (was ai-prose-guard-mdx, .mdx-only)
 * Blocks AI-cliché phrasing and placeholder text in published prose.
 *
 * Only the reader-visible TEXT is checked: `<script>`/`<style>` blocks, HTML comments, tags
 * (and their attributes), and code (markdown fences + inline code) are stripped first, so markup,
 * CSS, JS, and class/id names never false-positive. Line numbers are preserved (stripped blocks are
 * blanked, not removed). Heuristic + dependency-free.
 *
 * Frontend tier. Quality gate, NOT security → fails OPEN: unparseable input skips the check.
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

// Replace every non-newline char with a space — blanks a block while preserving line count/numbers.
const blankSameLines = (m) => m.replace(/[^\n]/g, " ");

function findViolations(text, format) {
  // Pre-pass (multi-line safe, newline-preserving): drop script/style blocks + HTML comments.
  const pre = text
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, blankSameLines)
    .replace(/<!--[\s\S]*?-->/g, blankSameLines);

  const violations = [];
  let inFence = false; // markdown fenced code block

  for (const [lineIdx, original] of pre.split("\n").entries()) {
    if (format === "md" && /^\s*(```|~~~)/.test(original)) {
      inFence = !inFence; // toggle on the fence line itself; skip it
      continue;
    }
    if (inFence) continue;

    const textOnly = original
      .replace(/<[^>]*>/g, " ") // strip tags + attributes
      .replace(/`[^`]*`/g, " "); // strip inline code

    for (const pattern of [...AI_CLICHES, ...PLACEHOLDERS]) {
      if (pattern.test(textOnly)) {
        violations.push({ line: lineIdx + 1, match: original.trim() });
        break;
      }
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
rl.on("line", (line) => (raw += line + "\n"));
rl.on("close", () => {
  let input;
  try { input = JSON.parse(raw || "{}"); } catch { process.exit(0); } // quality gate → fail open

  const filePath = String(input?.tool_input?.file_path || "").replace(/\\/g, "/");
  const ext = (filePath.match(/\.(mdx|html?|htm)$/i) || [])[1]?.toLowerCase();
  if (!ext) process.exit(0);
  const format = ext === "mdx" ? "md" : "html";

  const content = extractContent(input);
  if (!content) process.exit(0);

  const violations = findViolations(content, format);
  if (violations.length === 0) process.exit(0);

  const details = violations.map((v) => `  Line ${v.line}: "${v.match}"`).join("\n");
  process.stderr.write(
    `[ai-prose-guard] BLOCKED: disallowed content in ${filePath}:\n${details}\nRewrite the flagged lines before saving.\n`,
  );
  process.exit(2);
});
