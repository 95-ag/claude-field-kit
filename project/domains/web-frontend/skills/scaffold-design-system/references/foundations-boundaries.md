# Foundations — boundaries

Where the token layer's own edges are: what it removes beyond its scope, what it publishes but
cannot satisfy, and how its files are laid out. Each of these reaches past what this skill may
edit, so each ends in the run report rather than in a fix (`operations.md` → The run report).
Which values become tokens is in `foundations-mapping.md`.

Framework behavior below was observed on **Tailwind CSS v4, version 4.3.3**, by compiling — not read
from documentation. Re-measure on another major version; on another framework the questions are
portable and the answers are not.

---

## Exhaustive replacement

**Scaffold boilerplate the doc does not sanction does not survive a foundations run.** A generated
starter ships its own fonts, color variables, theme wiring and a dark-mode block; anything the doc
does not state is removed, not left beside the real tokens where it reads as sanctioned.

- Where the doc defines no dark mode, state the single scheme explicitly rather than leaving the
  starter's media-query block in place.
- Prefer overriding the framework's own default role tokens (the body font family, for instance) to
  restating the value on `body` — the preflight then carries it.
- Confirm removal by grepping the finished stylesheets for the starter's identifiers.
- **Removal reaches outside this skill's scope, and that is not a reason to skip it.** A starter's
  variables and utility classes are consumed by starter *pages*, which this skill never edits
  (`SKILL.md` → Scope). After the replacement those consumers compile to nothing: green build, wrong
  page, no error anywhere.
- **Name the collateral breakage in the report** — the file, the identifiers it still consumes, what
  it renders as now, and an owner. Silence here is worse than the breakage: the next reader meets a
  broken page with no record and diagnoses it as a defect in the token layer.

**A consequence that breaks the TYPECHECK is a different case from one that breaks the page.** Report-
and-leave works above because the tree still compiles. Where the skill's own type edit makes an
out-of-scope file invalid — a union narrowed to one member, so its prop must go, and the only caller
sits in a page this skill never touches — neither move is right: leaving it hands over a red tree, and
widening scope to "fix the page" abandons the boundary. **Make the forced edit and nothing more**, when
all four hold:

- it follows from **this run's own type edit**, not from drift noticed in passing;
- it is **mechanical** — deleting or renaming what the type no longer admits, with no behaviour change
  and no judgement about what the file should do instead;
- the tree **does not typecheck without it**, which is what distinguishes this from the page-breakage
  case above;
- it is named in the report as a **forced consequence**, with its file and the type edit that forced it.

Any one of the four failing puts the finding back under report-and-leave. The licence is narrow on
purpose: it exists so a boundary cannot oblige the run to hand over a build that was green before it
started and is not now.

---

## A published contract names its mount point

A token layer can publish a variable it cannot itself satisfy. **A font-family token names a family;
it does not load one.** The loader the framework rule requires is mounted in a root file that is
neither a stylesheet nor a component, so this skill's scope table never reaches it — and the tokens
resolve to a fallback stack while every gate stays green.

- **Emit the token anyway.** Publishing the contract is the token layer's job; satisfying it is not
  always the token layer's to do.
- **Name the mount point in the handoff** — the file, the mechanism the repo's framework rule
  prescribes, and the exact variable names it must define — and state that the contract is
  unsatisfied until it is wired.
- **Never read the token back as proof.** Confirm the family against a rendered element's computed
  style; until the mount point exists, that is what shows the fallback
  (`verification.md` → Framework configuration the gate cannot report).
- The same shape holds for any published value whose satisfaction lives outside the run: state the
  contract, name the mount point, mark it unsatisfied.

**A font token is a contract at two levels, and only the upper one is this skill's.** The design token
(`--font-<role>`) is emitted here and mints the utility family; its **value** is a `var()` naming a
second variable that the loader defines at the mount point. So the token references a name the skill
does not own, and both levels have to be stated in the handoff: the token's own name, and the exact
loader variable its value points at.

- **The token's value is a reference, never a literal family name.** A restated family compiles,
  renders, and quietly drops the loader's generated fallback stack and its own `font-display`
  behaviour — the page looks right on a warm cache and reflows on a cold one. This is the
  reference-stays-a-reference rule in `foundations-mapping.md` → Which keys become tokens, at the one
place where the thing referenced does not exist
  yet.
- **A mismatch between the two names fails silently in both directions**: the loader defines a variable
  nothing reads, and the token resolves to nothing. Neither end errors, so the names are checked
  against each other by reading both, not by building.

---

## The stylesheet file split

**The split resolves from the target repo's design-system rule, never from a layout hardcoded here**
(`SKILL.md` → Project-native contract). Read that rule and apply its own triggers.

- Where the rule offers both an **identity** trigger (a concern is a distinct self-contained block)
  and a **size** trigger, identity fires first — a full token set is its own file at any length.
- **Emit no file for a concern the project does not have.** A rule naming typical concerns names them
  as typical, not required; an empty prose or content layer is boilerplate by another name.
