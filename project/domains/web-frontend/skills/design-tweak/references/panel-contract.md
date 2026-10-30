# The tuning panel — contract

Read while building a round's panel. The loop it sits in, the handoffs and the ledger are in `SKILL.md`.

**The panel is rewritten every round, and that is correct.** A round's panel carries that round's items and
is worthless to the next one; what recurs is its **shape**, which this contract fixes.

---

## Where it mounts

- **A sibling of the page's sections — never a wrapper.**
  - A wrapper that establishes a stacking context isolates a blend mode. *Example:* a wrapper carrying
    `transform`, `filter`, `opacity` below 1 or `isolation: isolate`.
  - A layer that multiplies against the page then composites against the wrapper, repainting its own
    background as a visible rectangle.
  - Nothing errors and every gate stays green — only a sampled pixel shows it.
- **Fixed to the viewport, outside the reading column**, so it never changes the layout it is measuring.
- **On a scratch route that is never committed**, so the panel may be rough and leaves nothing to maintain.

## Where its values come from

- **Seed every control from the rendered element, via `getComputedStyle`** — never from a hardcoded default
  and never from zero. A control that starts at zero discards whatever is shipped the moment it is touched.
- **Read the value off the element that PAINTS it** — not off an ancestor and not off the value the panel
  wrote. Those differ whenever a cascade, a clamp or a unit conversion sits between them.
  - A readout that echoes what the panel set is a mirror, not a measurement: it agrees with itself whatever
    the page does.
- **Read the viewport with `matchMedia` and `documentElement.clientWidth`**, never the window's own width —
  under device emulation they disagree, and the panel reports a tier the page is not in.
- **An empty read fails loudly.** A control that falls back to a default on an empty read reports a value
  the page never had.

## What it shows

- **The live values, even when every toggle is off.** "Unchanged" and "whatever the panel last set" must
  never look the same.
- **Shipped-vs-new, not an option ladder.** A ladder fits while a direction is open; once a value is chosen,
  rejected options left on the panel invite re-deciding it.
- **Which toggles are CSS-only.** A value the layout derives in code — a padding chain, a computed fit, a
  conditional reveal — does not re-derive from a CSS override, so the panel can render a composition the
  production build cannot produce. Mark those toggles, or the reviewer approves a render that fails the
  build.
- **One item at a time.** A panel offering several decisions at once produces a judgement about their
  combination, not about any one of them.

## A readout is a measuring instrument

**Validate it before trusting any new number it gives** (`SKILL.md` → Project-native inputs). A wrong
readout in the alarming direction is the one that gets acted on.

- **A framework that inlines a token's value into its utilities makes a custom-property override do
  nothing** — the project's styling-framework rule names the mechanic. Confirm against the computed style,
  never the declaration.

## State that outlives a reload

A panel that persists its settings keeps one contract:

1. **Read existing state before editing it** — a control that writes before reading destroys what is
   stored.
2. **Export all of it.** A copy-out that drops one field loses that field's tuning with no sign.
3. **Restore before anything persists.** A save that can run before the restore completes overwrites the
   session it just loaded (*Example:* a save gated on a ref).
4. **Drive a value the renderer actually reads.** Grep for a value's readers before shipping its control —
   a control on a property nothing reads appears to work and changes nothing.

**Prove the round trip across a real reload** before using the panel for a decision — set, reload, confirm
every field returned. Three of the four failures above are invisible without it.

## Editing while measuring

**Do not edit the files a running measurement reads.** A hot reload mid-call destroys the execution context,
and the error names neither the edit nor the file. Finish the measurement, then edit.
