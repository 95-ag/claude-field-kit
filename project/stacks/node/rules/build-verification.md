# Build Verification — node (stack delta)

Node/TypeScript specifics. Load alongside the universal `project/shared/rules/build-verification.md` (seeded
as `.claude/rules/build-verification.md`); this file adds only the node toolchain commands and quirks.

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
- A per-commit quick check (build + lint + typecheck) may be required by `stacks/node/rules/git.md`.
