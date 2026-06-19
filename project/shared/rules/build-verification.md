# Build Verification

Operational verification gates for any project. Run before marking any task, phase, or release complete.
Expands `engineering.md`'s "verify with evidence" principle into a concrete checklist; a stack rule adds the
tool-specific commands (e.g. `stacks/node/rules/build-verification.md`).

## Always required

- Linter passes with zero errors.
- Types compile with zero errors (where the stack is typed).
- The production build succeeds.
- No broken imports or unresolved path aliases.
- Generated types, schemas, and codegen artifacts are current.
- All relevant automated tests pass.
- No failing CI checks.
- No runtime or console errors on affected pages, routes, or flows.
- Run the FULL suite after each task, not just that task's own tests — a shared-type or shared-module change
  can break tests outside the task's scope, so a passing task-scoped run does not mean the whole suite passes.
- Outward-facing / integration-boundary behavior is verified against real data before a PR — a passing unit
  suite is not sufficient evidence on its own.

## Batch gate, not per-commit

- Run the full lint, typecheck, test suite, and production build at defined verification gates rather than on
  every commit (a stack's git rule may still require a quick per-commit check — see that stack's git rule).
- Auto-fixers may be used for formatting and import organization where configured.
- Unsafe fixes require manual review.
- Format-on-save remains format-only; linting, typechecking, testing, and builds are verification gates.

## Build troubleshooting

- If build output appears incorrect, verify generated artifacts and computed output before debugging
  application code.
- Clear stale caches and rebuild before investigating suspected build-system issues.
- Verify environment variables and build-time configuration when behavior differs between development and
  production.
