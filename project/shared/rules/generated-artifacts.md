# Generated Artifacts

Code that writes committed artifacts — codegen output, derived assets, computed tables. Their failures are silent:
the build stays green and the artifact is wrong. Whether one reached the build output is `build-verification.md`
→ Always required.

## Never hand-edit the output

- Change the generator, never its output — a hand edit vanishes at the next regeneration, and the breakage
  surfaces somewhere unrelated.
- Mark a generated file as generated in its own header, naming its generator; "never hand-edit" binds only the
  files a reader can recognise.
- Regenerate into a scratch directory and diff against the committed copy before copying over — the diff catches
  a generator change doing more than intended.
- Run the project's formatter on both sides before that diff, or formatting noise hides whether anything changed.

## When to regenerate

- Regenerate when any input an artifact is derived from changes, not only the obvious one — a content edit moves a
  derived value and nothing announces it.
- A stale derived value reads like a harness bug — check the artifact first (`build-verification.md` → Build
  troubleshooting).
- Derive from the value's owning source, never from a copy of it, and assert the count of entries read — two
  hand-kept copies diverge and the artifact ships wrong.

## Deleting: a generator owns only what it owns

- A write-only generator leaves orphans when an input is renamed or removed, and a wholesale copy ships them.
  Enumerate the destination to prune — a pass over the source can only add.
- Prune only directories the generator fully owns, named explicitly; a shared destination also holds hand-kept
  files.
- Assert in a test that no shared destination is in the prune list. State it as that negative — an allowlist fails
  each time a new fully-owned directory is legitimately added.
- Give the destructive step a dry run that lists what would go and writes nothing.

## Whole-set generators

- A generator that writes every member in one pass silently drops a member whose input is gone. Check every member
  has an input first, and carry an absent one through unchanged rather than omit it.
- Where the committed output looks like the only record, a plain run would overwrite it — verify where the
  generator reads from first; a scratch regenerate and diff settles it.

## Changing a shared emitter

- Before changing what a function emits, grep for consumers that count or index its output by position — they
  break without being touched. Derive such an index from the emitter's own exported helper, never from the input's
  length.
- Write the invariant on the emitter's doc comment and gate it with a test.

## Values a person tuned by eye

- A derivation step silently overwrites a value settled by eye. Pin each with a test asserting the value itself, or
  its ratio to another value — not its shape.
