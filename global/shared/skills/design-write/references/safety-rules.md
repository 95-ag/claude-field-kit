# Safety Rules

Constraints that keep DESIGN.md edits safe and auditable — across both everyday **Updates**
(minimal-diff) and the **Realign** recovery pass (lossless restructuring).

---

## Update posture — minimal-diff

- **Smallest viable edit.** The narrowest change that satisfies the intent: one bullet before a
  paragraph, one paragraph before a section, one section before its neighbors. Editing content the
  request didn't mention is cleanup, not an update — stop and report it as `NOTED`.
- **Preserve local wording.** Match the surrounding section's voice, cadence, and bullet density. Don't
  rephrase, compress, expand, or "improve" prose that wasn't part of the request, even if suboptimal.
- **No opportunistic cleanup.** A contract violation near the edit (prose wall, wrong token format,
  heading too deep) is reported as `NOTED`, not fixed inline — unsolicited edits make diffs hard to
  review. Recommend a targeted follow-up or a Realign.
- **No structural moves.** Updates never relocate content across sections. A request that implies
  relocation → recommend a Realign; do not move it yourself.
- **Hierarchy is mostly read-only.** An Update MAY add a subsection within an existing section, or a row
  to an existing table. It MUST NOT change heading depths, add top-level sections without explicit
  approval, or rename existing headings (renames propagate to cross-references — use a Realign or
  confirm explicitly first).

---

## Realign posture — lossless

- **Lossless by default.** Every paragraph, bullet, token, table row, and code example in the input must
  appear — semantically — in the output. Anything that looks missing must be accounted for in the
  manifest as relocated (`MOVED`), merged (`MERGED`), or a flagged duplicate (`FLAGGED`). If it isn't in
  the manifest, it must be in the output.
- **No silent deletion.** Content believed duplicative, redundant, or obsolete is surfaced with a direct
  quote and a proposed action — never deleted on the model's own judgment. Flagged content stays in the
  document until the user confirms removal.
- **One pass at a time.** A single invocation runs one defined pass unless the user explicitly requests a
  combined pass. Combined passes segment the manifest with `--- PASS: name ---` dividers so each set of
  changes is independently auditable. (Pass catalog: `rewrite-passes.md`.)
- **Canonical-ordering preservation.** Reordering must comply with the contract's canonical spine (see
  `writing-contract.md` → Canonical Structure Model). Optional / bracketed sections may be absent without
  violation. A reorder that places a section outside the spine is rejected — surface the conflict and ask.
- **Section-preserving by default.** Prefer migrations that keep existing section boundaries. Merging two
  distinct sections requires duplication that is **substantial and explicit** (the same information, not
  just the same concept area) AND user confirmation. Overlap of concept scope alone is not grounds to
  merge — when in doubt, flag and leave separate. (Carve-out: an explicit Architectural-Migration pass
  suspends this default — cross-section restructuring is its entire point.)
- **Empty placeholder headings are not violations.** A heading with no content is a placeholder — not an
  orphan, hierarchy violation, or merge candidate. Use `PLACEHOLDER` in the manifest; leave it in place.
  Never invent content to fill it.

---

## Shared rules (both postures)

- **Never originate.** Neither mode invents new tokens, components, rules, or design principles. A
  structural gap that suggests a missing section is flagged (`FLAGGED: Section X appears empty/absent —
  no action taken`), never filled by invention.
- **Design identifiers are sacred.** Token, component, semantic-role, and domain-component names, and
  stable vocabulary, change only via explicit instruction or a user-confirmed terminology migration.
  Before *adding* a token, confirm name, resolved value, and role — names are load-bearing; a wrong one
  cascades across the registry and every reference.
- **New content complies with the contract.** All added content follows `writing-contract.md`; the
  contract owns the format (component structure, token form, bullet limits) — it is not restated here.
- **Cross-references are upkept.** Renaming a token, term, or heading means updating every reference in
  the doc — and in any sibling docs the user names — enumerated individually in the manifest, never a
  vague "updated references." (Process: `cross-reference-rules.md`.)
- **Terminology is auditable.** Every replaced term is logged `UNIFIED: "old" → "new" (N occurrences)`;
  whole-doc sweeps propose the full unification list and wait for confirmation before applying.
