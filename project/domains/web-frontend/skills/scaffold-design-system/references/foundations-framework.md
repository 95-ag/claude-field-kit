# Foundations — framework mechanics

The framework behaviours that decide how the token layer must be written: what survives
compilation, which key names collide, and what closing a namespace costs. Every claim here is
measured, and every one of them builds green when got wrong. Which values become tokens is in
`foundations-mapping.md`; the probe that checks any of this is in `verification.md`.

Framework behavior below was observed on **Tailwind CSS v4, version 4.3.3**, by compiling — not read
from documentation. Re-measure on another major version; on another framework the questions are
portable and the answers are not.

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
  Re-run every finding established before a foundational decision changed).
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
toolchain-enforced rather than advisory.

**The test is three questions against the doc, all of which must answer yes. Any no means no closure.**
Without it this is the run's largest unforced decision, and two runs in a row reported it as such.

1. **Does the doc PROHIBIT off-scale values, in words?** A sentence like "never use a value outside
   this scale" is an enforcement philosophy; a table listing nine steps is an enumeration, and an
   enumeration is not a prohibition. **Quote the sentence in the report.** No sentence → no closure:
   the scale is documentation, and closing it legislates past the doc.
2. **Does the doc's scale cover every value the project needs from that namespace?** Enumerate the
   utilities the closure removes and check each against the doc, the zero step included. A removal the
   doc's own requirements still need means the scale is incomplete — report that as drift and do not
   close around it.
3. **Is the removal the point, or a side effect?** Where a closure's main effect is dropping utilities
   the doc never discusses, it is enforcing a rule nobody wrote.

Then state the cost:

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

