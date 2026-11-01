# Rename Safety

Renaming or moving anything a repository refers to by name — a token, file, path, component or number. Compilers
and tests see almost none of a rename's damage, so it passes every gate and leaves the codebase wrong. A renamed
input's orphaned output is `generated-artifacts.md` → Deleting: a generator owns only what it owns.

## What a gate does not see

- **A merge destroys a distinction.** Collapsing two names into one also removes every place they were used
  against each other — ask what the pair was for before merging it.
- **One spelling under-counts.** A name also appears as a string, inside a longer identifier, hyphenated or
  re-cased; a count from one form describes the query, not the repository.
- **A comment naming the old thing survives every gate**, and a reader trusts it.
- **Overlapping renames corrupt each other in sequence** — A→B then B→C destroys A. Rename through placeholders,
  and delete a rename script after its one use.
- **A name or path can be data** — printed on a page, quoted as a test literal, stamped into a generated file's
  header. No import-graph reasoning finds it. *Example:* a move proven behaviour-neutral still changed rendered
  pixels, because a dev page printed import paths as text.

## A label that changes meaning is not a rename

- When a renumbering gives an existing label a new referent, every old reference stays valid and points at the
  wrong thing; a sweep corrupts it silently.
- Classify every occurrence by what it means before editing any; move the ones that move through placeholders,
  re-point the rest by hand.
- State whether dated or historical records are rewritten or left as written — a record true when written is not
  a defect.

## The grep is the gate, not the list

- A planned list of locations is a starting point. Map every reference before the first edit, searching by the
  real prefix read from the defining file, not the concept's English name.
- Re-grep after the edits and read every hit — the second pass catches what the first one created.
- Where the work is batched or dispatched, return every unlisted reference to the dispatcher in one list, so they
  rule on it once per batch.
