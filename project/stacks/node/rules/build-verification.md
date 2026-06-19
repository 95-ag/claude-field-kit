# Build Verification — node (stack delta)

Node/TypeScript specifics. Load alongside the universal `project/shared/rules/build-verification.md` (seeded
as `.claude/rules/build-verification.md`); this file adds only the node toolchain commands and quirks.

## Commands

- Linter: `biome check` (or the project's configured linter).
- Types: `tsc` with zero errors under `strict`.
- Production build: `next build` (or the project's build command).

## Node / Next specifics

- Resolve all path aliases (tsconfig `paths`) — no unresolved aliases in the build.
- No React hydration errors on affected pages or routes.
- Keep generated types / schemas / codegen current (e.g. `*.d.ts`, ORM or client codegen).
- A per-commit quick check (build + lint + typecheck) may be required by `stacks/node/rules/git.md`.
