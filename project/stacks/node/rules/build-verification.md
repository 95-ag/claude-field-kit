# Build Verification — node (stack delta)

Node/TypeScript specifics. Load alongside the universal `build-verification.md`; this file adds only the node
toolchain commands and quirks.

## Commands

- Linter: `biome check` (or the project's configured linter) — zero errors.
- Types: `tsc` with zero errors under `strict`.
- Production build: `next build` (or the project's build command) — succeeds.
- `biome check --write <files>` auto-fixes format + organizeImports; `noImportantStyles` (no `!important`) is an "unsafe" fix that won't auto-apply — correct the root cause by hand.

## Node / Next specifics

- Resolve all path aliases (tsconfig `paths`) — no unresolved aliases in the build.
- No React hydration errors on affected pages or routes.
- Keep generated types / schemas / codegen current (e.g. `*.d.ts`, ORM or client codegen).
- The on-edit hook is **format-only by design** (`biome format`) — do not extend it to run the full linter; lint and build are gate checks, not per-edit checks.
- `{/* biome-ignore */}` suppresses only **single-line** JSX — on a multiline element the lint fires on an attribute line the sibling comment can't reach, so biome reports both the original error and `suppressions/unused`. Scope the suppression with a `biome.json` `overrides` entry targeting the specific file(s) — never a global rule disable, which drops the safety net everywhere else.
- A stylesheet that nothing imports still builds green — `next build` reports nothing when a token layer is
  orphaned. Assert against the built CSS, per the universal `build-verification.md` → Always required. On
  Next 16's default build it lands in `.next/static/chunks/` (and `out/_next/static/chunks/` under static
  export), not a `css/` directory.
- With Tailwind, a utility class that resolves to nothing also builds green: an unknown key raises no error,
  so a closed or renamed scale silently removes utilities. Compile a probe through the project's own PostCSS
  pipeline and assert the utility exists, rather than inferring it from the token file.
  - A probe answers only "does this resolve from the token layer". For "what shipped", read the real
    build's output.
- `notFound()` under static export emits a 404 body **at that path** rather than omitting the route. Verify
  "the route is gone" by finding the file in the export, never by reading the source.
- Next synthesises metadata it was not given (`twitter:*` from `openGraph`), so the built HTML can carry more
  tags than the source asks for. Audit tags against the output, not the metadata object.
- **A warning that names a missing declaration is not always fixed by supplying it.** Node's
  `MODULE_TYPELESS_PACKAGE_JSON` warning is not cleared by `"type": "commonjs"` — that makes every
  `import`/`export` file error. Silence it per script with `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON`.
- A per-commit quick check (build + lint + typecheck) may be required by `node/git.md`.
