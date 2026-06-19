# Edit Patterns

Common maintainer operations with the correct approach for each.

---

## Add a token to the YAML registry

1. Confirm with the user: token name, resolved value, semantic role.
2. Determine the correct registry group (e.g., colors, typography, spacing, rounded, motion, breakpoints, z-index, or another canonical primitive-token group).
3. Add the entry to the YAML registry at the top of the document, in the appropriate group and position.
4. If the token also needs a row in a semantic-role table (e.g., a color token with a semantic-role mapping), add a follow-on markdown update with its own diff entry.
5. Diff summary: `ADDED: token \`token-name\` to YAML Registry → [group]`

---

## Update a token's resolved value

1. Find the token in the YAML registry.
2. Update the resolved value in the registry — this is the single source of truth.
3. Scan the markdown body for inline resolved-value mentions (e.g., `(44px)` in prose) and update them as cross-layer follow-ons.
4. Diff summary: `UPDATED: \`token.name\` resolved value old → new in YAML Registry; N inline references updated in markdown body`

---

## Rename a token

This is a cross-reference-heavy operation. Read `references/cross-reference-rules.md` before proceeding.

1. Confirm the new name with the user.
2. Update the token's canonical definition (primary source) — the YAML registry entry, or the Foundations table where a colocated color/typography token lives.
3. Find and replace all markdown body references (prose, bullets, component spec blocks).
4. Find and replace in sibling docs the user names (e.g. project config, session/work notes, rules files).
5. Diff summary lists every touched location — registry first, then markdown body, then sibling docs.

---

## Add a new component section

1. Identify the correct location within the `# Components` section (alphabetical, or by category if the section is grouped).
2. Create the component using the contract-defined format (`writing-contract.md` → Component Writing Contract).
3. Confirm contextual usage examples are included.
4. Shared interaction-state baselines (hover/focus/disabled/loading/responsive defaults) belong in `# Interaction Rules`. Component sections may include local interaction behavior, sequencing, or affordance details when they are structurally tied to the component itself.
5. Diff summary: `ADDED: component \`component-name\` to Components`

---

## Add a semantic-systems mapping

For adding a row to a surface hierarchy, typography roles, interaction semantics, or state semantics table — whether that table lives in `# Semantic Systems` or colocated in a Foundations subsection.

1. Identify the target table (e.g., `Foundations → Colors → Semantic Roles` or `Semantic Systems → Surface Hierarchy`).
2. Add the row in the correct semantic grouping.
3. Check whether the same semantic concern is referenced elsewhere in the document — if so, update those references rather than adding a competing restatement (anti-fragmentation rule).
4. Diff summary: `ADDED: semantic mapping row \`role-name\` to [table location]`

---

## Remove a section or component

1. Confirm with the user — never remove without explicit instruction.
2. Check for cross-references to the removed section and update or remove them.
3. Diff summary: `REMOVED: section/component name — N cross-references updated`

---

## Propagate a terminology change

When a stable-vocabulary term is renamed (e.g., "tonal depth" → "tonal layering"):
1. Ask user to confirm the canonical new term.
2. Find all occurrences in the document.
3. Replace consistently.
4. Check sibling docs if named by the user.
5. Diff summary: `UNIFIED: "old term" → "new term" (N occurrences in DESIGN.md, M in sibling docs)`

Note: whole-doc terminology sweeps are better handled by the rewriter's Terminology Consistency Pass.

---

## Add a YAML spec block to an existing component

1. Confirm the component already has: name, identity statement, semantic bullets.
2. Place the YAML block after the bullets, not before or between them.
3. Diff summary: `ADDED: YAML spec block to \`component-name\``

---

## Fix or update a cross-reference

E.g., a broken `Foundations → Colors` path after a heading rename.

1. Find the broken reference.
2. Trace the correct current heading path.
3. Update the reference.
4. Scan for other instances of the same broken path.
5. Diff summary: `UPDATED: cross-reference "old path" → "new path" (N occurrences)`

See `references/cross-reference-rules.md` for heading-path format rules.

---

## Add/modify a section in Iteration Notes

Iteration Notes use bullet-first, concise, non-defensive writing. No prose walls.

1. Add or update the relevant bullet or entry.
2. Do not restructure surrounding content.
3. Diff summary: `UPDATED: Iteration Notes — [description of what changed]`

---

## Structural Move

Structural moves are not ordinary updates. Recommend a Realign pass — Structure-Only, Migration, or Architectural Migration depending on scope (`rewrite-passes.md`) — rather than performing the move as an edit.

---

## Specification Conflict

When two locations define different values or behaviors:

1. Flag the conflict.
2. Identify the competing sources.
3. Do not choose automatically.
4. Request resolution.
