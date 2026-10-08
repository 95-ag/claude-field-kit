# Verification

What counts as proof that a run's output is correct, and the order the checks run in. The operation
framing is in `operations.md`. The token layer states its own rules in `foundations-mapping.md`,
`foundations-framework.md` and `foundations-boundaries.md`; the component layer in
`component-set.md`, `component-shape.md` and `component-behavior.md`.

Framework behavior below was observed on **Next.js 16.3.4 (App Router, static export) with Tailwind
CSS v4.3.3**, by running the gates. On another framework the questions are portable and the answers
are not.

---

## The gate ladder

Five gates, in order. **Each one proves something the one before it cannot**, so a later gate is
never a substitute for an earlier one, and none of them run after staging.

| Gate | What it is | What it proves |
|---|---|---|
| **0 — authoring self-review** | Re-read every emitted file against its spec entry and every rule that governs it from outside | The output says what the doc says; nothing was invented, nothing restated twice |
| **1 — cold-regeneration diff** | Regenerate in a fresh context and diff against the baseline | What the author's own context supplied silently, rather than the instructions |
| **2 — build** | The repo's gate: typecheck, lint, production build | The code compiles and satisfies the repo's static rules |
| **3 — render** | Mount, render, drive, watch the first client frame | Anything visual, and the defect classes gates 0–2 are structurally blind to |
| **4 — human sign-off** | The user confirms, **per visual layer** | The output is what was wanted — the only gate that can judge that |

- **Gate 1 applies wherever a baseline exists** — validating the skill against a hand-built pass, or
  re-running an Align on code that was already correct. With no baseline it is skipped, and the skip
  is stated.
- **Gate 4 is per visual layer, not per run.** A run that emits foundations and components carries
  two sign-offs; batching them hides which layer the user actually looked at.
- **No staging before gate 4.** Verification is not sign-off (the repo's own rules own this
  distinction); a green gate 2 is one input to it.

---

## A green build never proves a utility exists

**Assert against the *compiled* CSS, never against a build's exit code.** A utility that does not
compile emits no declaration and raises no error — it typechecks, it lints, it builds, and it does
nothing. This is the failure class the whole layer is most exposed to, and every gate below 3 is
blind to it.

- **Compile the project's real stylesheets** through the project's own compiler, and read the emitted
  declarations out of the output.
- **Assert in both directions.** Name the utilities that must compile *and* the utilities that must
  **not** — an enforcement that leaks is as much a defect as one that over-removes, and only the
  negative list catches it.
- **Verify a token reference is still a reference in the built output** — a `var()` that survives
  compilation, not a copied literal (`foundations-mapping.md` → Which keys become tokens).
- Re-run the probe after any change to the token layer, including one that looks purely additive.

*Example:* closing the spacing namespace also stopped `inset-0` compiling, because the
zero-valued utilities come from the same multiplier — only a compile probe caught it. The fix was
asserted both ways: `inset-0`/`p-0`/`gap-0` compile, and `p-7`/`gap-13` still do not, proving the zero
step reopened only the zero step.

### The probe harness

Build it first; it pays for itself repeatedly. Compile a scratch stylesheet through the project's own
compiler and read the result.

- **The probe stylesheet must live inside the repo.** A framework import resolves relative to the
  stylesheet, so a probe in a scratch directory outside the project fails to resolve the framework at
  all.
- **The runner must also live inside the repo**, so module resolution works. Only the scanned content
  fixture can sit elsewhere.
- **State the scan target explicitly** rather than relying on a directory auto-scan. An auto-scan that
  honors ignore files skips a fixture under an ignored path and returns a confusing partial result.
- **A stale fixture beside the probe silently contaminates the next run** with candidates you thought
  you had removed. Write a fresh fixture per run, or misread the result.
- **The probe lives in the repo and therefore fails the repo's linter.** Move it out before gate 2 —
  see the command order below.
- **Read the probe's output as nested CSS, not as lines.** Compiled utilities sit **inside** an
  `@layer`, so they are emitted indented; a line-anchored match (`^\.utility`) finds none of them and
  reports every utility as missing — a total failure that is entirely the reader's. The direction of
  the error is what makes it dangerous: it fails toward "nothing compiled", which looks like exactly
  the defect the probe exists to find, so it gets believed and acted on. **Validate the reader against
  a utility that cannot be missing** (a stock one the project does not touch) before trusting any
  negative result from it — the same rule the method section below states for findings generally.

---

## Mount, render, drive, and watch the first client frame

**A component pass must mount its output before any build result means anything.** Nothing imports a
freshly generated component, so it never enters the route graph: the typechecker and linter cover it,
the production build does not compile it at all.

**A static render is not enough either.** Two defect classes are invisible in any frame sampled after
things settle, and both shipped through a fully green gate:

- **Effect lifecycle** — an effect keyed on an unstable dependency misbehaves only when the parent
  re-renders, which a mounted-and-photographed component never does
  (`component-behavior.md` → Effects).
- **Hydration transition** — a wrong default paints, then the client binding overwrites it on the
  first frame. Every screenshot taken after that moment looks correct
  (`component-behavior.md` → A default value is a claim about the first paint).

So the method is **mount → render → *drive* (open, close, tab, swipe, re-render the parent) → watch
the first client frame**. A settled frame proves layout, and nothing more.

Two mechanical traps in mounting a scratch route:

- **A route directory whose name marks it private produces no route at all** — it builds silently and
  appears nowhere. Check the build's own route listing rather than assuming the mount worked.
- **Deleting the scratch route leaves a stale generated validator behind** that fails the typechecker
  with a missing-module error until the framework's cache directory is cleared.

Delete the scratch route, restore any config changed to test, and re-run the gate cold.

---

## Framework configuration the gate cannot report

**Some misconfiguration builds green and fails only at runtime — and for these, the development
server is the stricter check, reversing the usual assumption.** Verify against both.

*Example:* with static export, the image component emits an optimizer URL that has no
handler in the exported output, so **every raster image 404s while the build reports success**. The
development server is the opposite: it refuses outright with an explicit incompatibility error.
`images: { unoptimized: true }` is the fix. Vector sources mask the whole thing — they bypass the
optimizer and pass through unchanged — so testing with a scaffold's placeholder SVGs shows nothing.

The general rule: **where a configuration choice changes what the *output* does rather than whether
it compiles, the build's exit code carries no information about it.** Name such settings in the
handoff, and check them against a running server with a realistic asset.

**This is the one place the skill may edit framework configuration: where generated code would
otherwise be non-functional at runtime despite a passing gate.** Never for preference, convenience or
style — those edits belong to whoever owns the config. **Name every such edit in the run report with
what breaks without it**, so its owner reads it as load-bearing rather than incidental.

The boundary sits here because forbidding the edit would make the gate lie — a gate that passes over
broken output is the exact failure the rules in this file exist to catch, and a run that only
*reported* the setting would hand over a green gate and a broken page. Where the missing piece is
outside this skill's own output — a starter file, a page, a mount point — it stays reported and
unedited (`foundations-boundaries.md` → A published contract names its mount point).

---

## Command order

- **Run the repo's own fix pass before the verifying pass — the command that applies every
  auto-fixable rule, not the format-only one.** A generator writes files programmatically, so it
  inherits no on-edit formatting hook, and the first verifying run otherwise reports a wall of
  mechanical errors that look like rule violations and are not.
- **A format-only command is the wrong command.** Formatting is a subset of what a modern toolchain
  auto-fixes; import organization in particular sits outside it, so formatter-then-linter produces
  exactly the error wall the rule above exists to prevent. Read the repo's build-verification rule
  for which command covers both, and run that one. *Observed on Biome 2:* `format --write` does not
  apply `organizeImports`; `check --write` applies both.
- **The fix pass is not the gate.** Run the verifying pass afterwards, unfixed, and read its result.
- **Tear the probe harness down before gate 2**, since it lives inside the repo and the linter will
  otherwise lint it (above).
- **A cold cache can fail the typechecker for a reason that is not a code error.** Where the framework
  *generates* global types into its cache directory, a typecheck run before the first build fails on
  names that do not exist yet. The build must have run at least once. **Do not read a cold-cache
  typecheck failure as a defect in the emitted code**; run the build, then re-run the typecheck.
- Where the repo's own destructive-command guards block removing a scratch directory, move it out of
  the repo instead of deleting it.

---

## Two method rules that govern every finding

These apply to every finding this skill records, not only to the layer that produced them. Each one
was paid for: both framework findings this skill's references were built from named a **false
mechanism** first, and both were reasoned to rather than measured.

### Re-run every finding established before a foundational decision changed

A finding is only valid against the baseline it was measured on.

- **Date each finding against the decision it assumes**, and treat a baseline change as invalidating
  the whole batch until re-measured.
- A finding that survives a baseline change unexamined does not merely go stale — its stated *cause*
  can be wrong, because the old baseline explained the result by a mechanism the new one removes.

### Name a cause only once it is isolated by falsification

Confirming the symptom is not confirming the mechanism.

- **Isolate by removing the suspected cause and checking whether the symptom persists.** If it
  persists, the cause is falsified.
- **The trap is that the nearest deliberate, memorable decision in view takes the blame** while a
  mundane fact goes unexamined.
- A wrong cause produces a correspondingly wrong remedy, which fixes nothing and reads as sanctioned.

