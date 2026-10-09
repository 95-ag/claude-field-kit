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
- **A passing build does not prove an artifact reached the output.** A bundler can tree-shake, skip, or
  silently drop a file the build never errors on. Assert the artifact's presence in the **built** output,
  not in the source and not from a green exit code.
- **Confirming a symptom is not confirming its mechanism.** A plausible cause that explains the symptom is a
  hypothesis, not a finding — name a cause only after removing it and observing the symptom change. A fix
  built on an unfalsified cause encodes the wrong rule even when the symptom disappears.
- **A doc sync is verified against the code before it is committed.** Diff every claim the doc makes against
  the implementation, not only the section you edited.
- **A counted claim is re-checked everywhere it appears, not only where you edited it.** Grep each one
  (`N-rule`, a property tally) across the whole file, including any decision log.
- **A finding names one instance; the fix owns the class.** Before closing a review finding, search for every
  other instance of the same problem within the task's scope and fix those too.

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
