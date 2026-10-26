# Foundations mapping

Which documented values become tokens, and what each one is called — the decisions between
reading the doc and writing a declaration. The framework mechanics that constrain those
decisions are in `foundations-framework.md`; what the layer cannot satisfy on its own is in
`foundations-boundaries.md`. The operation framing is in `operations.md`; proof is in
`verification.md`.

Framework behavior below is `EXERCISED` on **Tailwind CSS v4, version 4.3.3** — compiled, not read from
documentation — except where marked `SPECIFIED`. Re-measure on another major version; on another
framework the questions are portable and the answers are not.

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

Three transcription rules hold throughout (`operations.md` → Fresh, step 4):

- **A token reference stays a reference.** A `{token.path}` value resolves to `var(--…)`, never to a
  copied literal — verified in the *built* CSS, where the `var()` must still be unresolved. A
  reference cannot desynchronize from the value it points at; a copy can.
- **Missing stays missing.** A property the doc leaves unstated is left unset, never filled with a
  plausible default.
- **Units are transcribed, never converted.** A value the doc states in one unit is emitted in that
  unit.
  - A conversion is a reinterpretation wearing the look of a transcription: it assumes a root size the
    doc never fixed.
  - So the emitted value tracks the user's text-size setting where the doc said it should not, or stops
    tracking it where the doc said it should — and the two agree at the default, so every check passes.
  - Where the doc's unit is wrong for what it governs, that is drift to report, not a conversion to
    perform.

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
- **Name a namespace-less token for the role it serves, in the doc's own vocabulary** — the framework
  mints no utility family to borrow a convention from, so nothing else supplies the name. Take the
  doc's term for the thing (*Example* below), and keep the name free of any known namespace's prefix —
  a prefix files the token into that namespace (previous bullet).
  - **Where the doc names the value, that name is the token name**; where it does not, the name is an
    inferred value like any other and is reported as one (`operations.md` → The run report).
  - Unstated, a namespace-less token — a stroke width, a duration, a z-index step, the focus ring — gets
    a freshly invented name on every run, so its name comes from the doc or is reported.

**The run probes every namespace it relies on** and reports the result (`verification.md` → A green
build never proves a utility exists); a namespace taken from the `SPECIFIED` list below without a probe
is an assumption the run reports.

`SPECIFIED` — documented on Tailwind 4.3.3 as generating utilities, not compiled here: `--color-*`,
`--font-*`, `--text-*`, `--spacing-*`, `--radius-*`, `--ease-*`, `--breakpoint-*`, `--leading-*`,
`--tracking-*`, `--shadow-*`, `--container-*`, `--border-width-*`.

**`EXERCISED` — compiled here** (limit: version 4.3.3 only): there is **no `--z-*` namespace** and no
`--duration-*` (only the single `--default-transition-duration`), and **`--spacing` is a
multiplier, not a named scale** — stock utilities resolve as `calc(var(--spacing) * n)`.

So z-index values, durations, stroke widths and accessibility floors are plain variables there:
`duration-(--duration-base)` compiles, `duration-base` does not.

**Z-index is the one scale that cannot be toolchain-enforced.** Every other scale can be closed
(`foundations-framework.md` → Namespace closures), but `z-*` takes bare numerics against no namespace — an off-scale `z-999` compiles freely
while a token name does not compile at all. Z-index discipline stays a review concern; say so in the
report rather than implying the layer enforces it.

*Example:* the 44px touch-target floor is a plain `:root` variable read as
`min-h-(--touch-target)`. Filing it under the spacing namespace would publish `p-touch-target` and
`gap-touch-target` — an off-scale spacing utility minted to enforce an accessibility rule.

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
  honors it at the source — do not attach the animation (`component-behavior.md` → Motion).
- Nothing downstream catches a component that skips it: no global switch exists to fall back on. Say
  so in the handoff, explicitly.
- **A habitual best practice can be off-spec, and the doc wins.** The global kill-switch is the
  reflexive move here; re-read the doc's motion section before writing one. A lint rule objecting to
  the override's `!important` is a signal to re-read, not to suppress.

---

