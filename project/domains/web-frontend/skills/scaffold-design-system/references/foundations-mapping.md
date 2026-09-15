# Foundations mapping

How the design doc's documented values become the project's token/theme layer — what happens between
reading the doc and writing the stylesheets. The operation framing a run is in `operations.md`; what
counts as proof is in `verification.md`.

Framework behavior below was observed on **Tailwind CSS v4, version 4.3.3**, by compiling — not read
from documentation. Re-measure on another major version; on another framework the questions are
portable and the answers are not.

---

## Triage the whole document

**Scan the entire doc for fenced blocks *and* for values stated only in prose, then triage by scope.**
A design doc normally carries more than one fenced block, and a generator that reads only the first
one silently drops the rest.

- **A block's scope is the heading it sits under.** Under a Foundations-level heading → the token
  layer owns it, emit it here. Under a component heading → that component's task owns it.
- **A deferred block is recorded as deferred**, naming the task that owns it. An unmentioned block is
  indistinguishable from a missed one, and the next reader re-derives the same question.
- **Prose carries tokens too.** A constant stated in a sentence with no block behind it is still a
  documented value — emit it, and report the prose-only statement as drift (`operations.md` → Doc
  drift is reported, not fixed).

---

## Which keys become tokens

Not every documented key becomes a variable. Decide per block, on two properties of its keys:

| Block shape | Materializes as | Why |
|---|---|---|
| Keys are **independently consumable** and one or more **lacks a native expression** | tokens, one per key | Without a variable the value gets copied into every consumer as an arbitrary utility. |
| Keys **jointly describe one property of one element**, and the framework composes that pair natively | nothing — resolved at the point of use | Each token would be either an alias of an existing token or consumable only by re-composing the pair by hand. |

**A block that emits nothing is stated in the report.** Silence here reads as a dropped block.

Two transcription rules hold throughout (`operations.md` → Fresh, step 4):

- **A token reference stays a reference.** A `{token.path}` value resolves to `var(--…)`, never to a
  copied literal — verified in the *built* CSS, where the `var()` must still be unresolved. A
  reference cannot desynchronize from the value it points at; a copy can.
- **Missing stays missing.** A property the doc leaves unstated is left unset, never filled with a
  plausible default.

*Example:* the `elevated-paper` block emits two shadow tokens (its shadows have no
expression but a variable); the `modal-scrim` block — a color that is already a palette token plus an
opacity — emits none and resolves as one `bg-<color>/<opacity>` at its use site. Line heights are
left unset on every role but the one the doc gives a value for.

---

## A token's home is its namespace

- A token whose name sits in a namespace the framework knows goes in the theme block and gets a
  utility family for free.
- A token with no such namespace goes in a plain custom-property block and is consumed as
  `utility-(--token)`.
- **A token is never rehomed into a namespace whose utilities would then lie about it.** The utility
  family a namespace mints is part of what the token publishes.

Observed on Tailwind 4.3.3 — namespaces that generate utilities: `--color-*`, `--font-*`, `--text-*`,
`--spacing-*`, `--radius-*`, `--ease-*`, `--breakpoint-*`, `--leading-*`, `--tracking-*`,
`--shadow-*`, `--container-*`, `--border-width-*`. There is **no `--z-*` namespace** and no
`--duration-*` (only the single `--default-transition-duration`). **`--spacing` is a multiplier, not
a named scale** — stock utilities resolve as `calc(var(--spacing) * n)`.

So z-index values, durations, stroke widths and accessibility floors are plain variables there:
`duration-(--duration-base)` compiles, `duration-base` does not.

**Z-index is the one scale that cannot be toolchain-enforced.** Every other scale can be closed (see
below), but `z-*` takes bare numerics against no namespace — an off-scale `z-999` compiles freely
while a token name does not compile at all. Z-index discipline stays a review concern; say so in the
report rather than implying the layer enforces it.

*Example:* the 44px touch-target floor is a plain `:root` variable read as
`min-h-(--touch-target)`. Filing it under the spacing namespace would publish `p-touch-target` and
`gap-touch-target` — an off-scale spacing utility minted to enforce an accessibility rule.

---

## `@theme static` — the layer is a published contract

**Plain `@theme` tree-shakes every token no utility references out of `:root` — regardless of
namespace.** A token published as a contract for hand-written CSS would then silently not exist, and
the failure surfaces late, at a `var()` that resolves to nothing.

- **Use the static form for a design system published as a contract.** On Tailwind 4.3.3 that is
  `@theme static`.
- **One mechanism, not two.** A token in a namespace the framework does not know behaves identically
  to an unreferenced token in a known one: both are dropped by plain `@theme`, both survive under
  `static`. Unknown namespaces are *utility-less*, never separately *discarded* — an earlier reading
  named namespace-discarding as a second mechanism and was wrong: it was measured while plain
  `@theme` was still the baseline and never re-run once `static` was adopted (`verification.md` →
  re-running every finding established before a foundational decision changed).
- **Splitting theme tokens from plain `:root` variables is a readability choice, not a compiler
  constraint.** Either block works for either group. Keep the split to show which tokens participate
  in utility generation, and justify it as legibility — never as forced by the framework.

---

## Scale keys that collide with the framework's own scales

**Before emitting a named scale, diff its key list against the framework's own scale key names in
every namespace those utilities can resolve against.** This is a naming problem caught at design time
by comparing two lists, not a compiler problem to be discovered by probing.

Observed on Tailwind 4.3.3: `max-w-<name>` and its siblings resolve against both the container and
the spacing namespaces, and where both define a key, **spacing wins**. A spacing scale named with
t-shirt keys therefore shadows the container scale across **five** utility families — `max-w-`,
`min-w-`, `basis-`, `w-`, `h-`. The result compiles clean and passes every gate: a silent wrong
value, not an error.

**The fix is at the key names: prefix the named steps, leave the zero step bare.**

- The zero step collides with nothing — the container scale has no `0` key.
- Prefixing it is actively harmful: it removes `inset-0`, `p-0`, `m-0`, `gap-0` and `top-0`. The zero
  step is the one scale value whose *name* is load-bearing to the framework.
- **The rename belongs to the doc.** Renaming keys only in the emitted CSS desynchronizes the doc
  from the layer it governs — report the collision as drift and hand off to `design-write`, which
  also records the naming rule so nobody tidies the prefix back off.

**The collision is independent of any namespace closure.** Reopening the shadowed scale leaves the
wrong value in place, which falsifies the closure as its cause; the key names are the whole
mechanism. This was named wrongly once here — the method rule that catches it is in
`verification.md` → Name a cause only once it is isolated by falsification.

*Example:* the nine named steps are emitted as `--spacing-space-3xs` … `--spacing-space-3xl`
and read as `p-space-md`; `--spacing-0` stays unprefixed.

---

## Namespace closures remove derived utilities

Closing a namespace (assigning it `initial`) makes "values outside the scale are not used"
toolchain-enforced rather than advisory. Emit a closure only where the doc's own enforcement
philosophy calls for one, and state the cost:

- **A closure removes every derived utility, including the zero step nobody thinks of as a scale
  value.** Closing a multiplier-based spacing namespace removes `inset-0`, `p-0`, `gap-0` and
  friends, because they are emitted from that multiplier. Sibling zero utilities in other namespaces
  survive, which makes the loss look arbitrary rather than systematic.
- **Publish the zero step as a scale value** where the doc defines one; that reopens exactly the zero
  utilities and nothing else.
- Static utilities are not theme tokens and survive a closure — on Tailwind 4.3.3, closing the color
  namespace leaves `bg-transparent` and `text-current` working while dropping `--color-white`/`black`.
- Closing the type-scale or breakpoint namespaces removes utilities most readers assume are always
  present. That is the point; name the removal in the report so it is not later diagnosed as a bug.

No claim in this section is one a green build can make — verify each closure by compiling
(`verification.md`).

---

## Composite typography roles force a class layer

A framework may honor several size-token modifiers, so one composite token can carry size, weight,
tracking and leading. **The properties it does *not* modify are what force a class layer.**

- On Tailwind 4.3.3, `--text-*--font-weight`, `--text-*--letter-spacing` and `--text-*--line-height`
  are all honored — one `text-<role>` utility emits all four properties.
- **`font-family` and `text-transform` have no `--text-*` modifier.** A size utility alone therefore
  cannot express a semantic role. That gap, not styling preference, is the reason a `.type-<role>`
  class exists for each role.
- Put those classes in the components layer, not the utilities layer, so ordinary utilities still win
  on override, and have them **read their metrics back out of the tokens** rather than restate values.
- A role that changes across viewports steps inside a **framework variant** (`@variant md { … }`),
  never a raw `@media` — a raw media query cannot read a CSS variable without hardcoding the literal
  the token exists to own.

Unstated, this reads as though the composite tokens suffice, and the class layer gets skipped —
losing family and case on every role.

---

## Motion: the layer emits no reduced-motion kill-switch

**Where the doc says reduced motion is honored at the source, the token layer emits no global
`prefers-reduced-motion` override.** A blanket suppression is the pattern such a spec rejects: it
attaches the animation and then hides it.

- **This is a reassignment, not a waiver.** Each motion-attaching component owns its own gate and
  honors it at the source — do not attach the animation (`components.md`).
- Nothing downstream catches a component that skips it: no global switch exists to fall back on. Say
  so in the handoff, explicitly.
- **A habitual best practice can be off-spec, and the doc wins.** The global kill-switch is the
  reflexive move here; re-read the doc's motion section before writing one. A lint rule objecting to
  the override's `!important` is a signal to re-read, not to suppress.

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

---

## The stylesheet file split

**The split resolves from the target repo's design-system rule, never from a layout hardcoded here**
(`SKILL.md` → Project-native contract). Read that rule and apply its own triggers.

- Where the rule offers both an **identity** trigger (a concern is a distinct self-contained block)
  and a **size** trigger, identity fires first — a full token set is its own file at any length.
- **Emit no file for a concern the project does not have.** A rule naming typical concerns names them
  as typical, not required; an empty prose or content layer is boilerplate by another name.
