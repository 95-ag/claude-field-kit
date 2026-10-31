// ai-prose-guard harness — feeds Write payloads to the hook and checks which ones it blocks (exit 2).
//
//   node tests/ai-prose-guard/run.mjs
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const HOOK = join(ROOT, "project/domains/web-frontend/hooks/ai-prose-guard.mjs");

const cases = [
  // file, content, block? (true = expect exit 2)
  { n: "html visible slop (coming soon)", f: "index.html", c: `<html><body><p>Coming soon</p></body></html>`, block: true },
  { n: "html visible cliché (great question)", f: "page.html", c: `<main><h1>Great question</h1></main>`, block: true },
  { n: "html visible placeholder word", f: "x.html", c: `<p>This is a placeholder.</p>`, block: true },
  { n: "htm visible cliché (in conclusion)", f: "about.htm", c: `<p>In conclusion, we ship.</p>`, block: true },
  { n: "html TODO in <script> JS", f: "index.html", c: `<script>\n// TODO: wire this\nconst x=1;\n</script>\n<p>Clean copy.</p>`, block: false },
  { n: "html FIXME in <style> CSS", f: "index.html", c: `<style>\n.todo{color:red} /* FIXME later */\n</style>\n<p>Fine.</p>`, block: false },
  { n: 'html placeholder in class attr', f: "index.html", c: `<div class="placeholder card">Real heading</div>`, block: false },
  { n: "html TODO in comment", f: "index.html", c: `<!-- TODO: finish nav -->\n<p>Done.</p>`, block: false },
  { n: "mdx visible slop (lorem ipsum)", f: "post.mdx", c: `# Title\n\nLorem ipsum here.`, block: true },
  { n: "mdx TODO in code fence", f: "post.mdx", c: "# Title\n\n```js\n// TODO: example\n```\n\nClean prose.", block: false },
  { n: "mdx TODO in inline code", f: "post.mdx", c: "Use the `TODO:` marker in your editor.", block: false },
  { n: "tsx ignored (out of scope)", f: "comp.tsx", c: `// TODO: real\nconst x = "placeholder";`, block: false },
];

let pass = 0, fail = 0;
for (const t of cases) {
  const payload = JSON.stringify({ tool_name: "Write", tool_input: { file_path: t.f, content: t.c } });
  const r = spawnSync("node", [HOOK], { input: payload, encoding: "utf8" });
  const blocked = r.status === 2;
  const ok = blocked === t.block;
  console.log(`${ok ? "PASS" : "FAIL"}  [${t.block ? "block" : "allow"}] ${t.n}  (exit ${r.status})`);
  if (!ok) { fail++; if (r.stderr) console.log("       stderr: " + r.stderr.trim().split("\n")[0]); } else pass++;
}
console.log(`\n${pass}/${cases.length} passed${fail ? ` — ${fail} FAILED` : ""}`);
process.exit(fail ? 1 : 0);
