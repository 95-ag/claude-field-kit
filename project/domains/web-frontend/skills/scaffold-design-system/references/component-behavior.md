# Component behavior

What a single component DOES once mounted — its first paint, its effects, the mechanism a spec
leaves open, and the gates it owns. Read while writing the effects and the motion. What the
component IS — boundary, props, markup — is in `component-shape.md`; proving any of this is in
`verification.md`, which is structurally blind to most of it.

Framework behavior below was observed on **Next.js 16.3.4 (App Router) with Tailwind CSS v4.3.3**, by
rendering and compiling. On another framework the questions are portable and the answers are not.

---

## A default value is a claim about the first paint

**Check every default against every case that reaches it — including the case where script
immediately overwrites it.**

- **When the cases disagree, give each its own default.** Do not average them, and do not repair the
  difference after paint.
- A single default that is correct for the fallback cases can be wrong for the common one: the
  component paints that value, then the runtime binding drops it to the real one on the first client
  frame. Every load flashes, and every frame sampled after it settles looks correct.
- Prefer defaults the stylesheet can state per case, so **no case needs script to reach its correct
  first paint** and nothing is written inline.
- **State the residue.** A per-case default usually leaves a narrow case it cannot reach; naming it
  is cheaper than the next reader rediscovering it as a defect.

*Example:* a scroll-bound custom property defaults to `0` for a normal client, `1` under
`motion-reduce:`, and `1` under `@media (scripting: none)` — each case correct on first paint.

---

## Effects: dependencies, and work that must not share one

**An effect's dependency list is a statement about when its work must be redone.**

- **A callback prop is almost never stable.** A caller writing the idiomatic inline arrow passes a
  fresh reference on every parent render, so an effect listing it tears down and re-runs on every
  parent render.
- **Never co-locate acquire/release work with work that has real dependencies.** Focus acquisition, a
  scroll lock, a subscription — each is mount-scoped by nature and must run exactly twice, at acquire
  and at release. Sharing an effect with a listener that legitimately re-creates makes the release
  fire on every re-run.
- **Read a callback through a ref**, updated in its own bare effect, so it is current at call time
  without being a dependency.

The defect this prevents is invisible to any static check: the component is correct on mount and
correct at rest, and only a parent re-render mid-interaction exposes it
(`verification.md` → Mount, render, drive, and watch the first client frame).

*Example:* one effect owning focus init, a keydown listener and focus restoration with
`[onClose, step]` deps stole focus mid-interaction on every parent render. Split into focus
init/restore at `[]`, the listener at `[step]`, and `onClose` held in a ref.

---

## A spec names a side-effect; it rarely describes the technique

Where the spec names a behavior but not its mechanism, the reflexive implementation is often the
wrong one — and it is wrong in a way that violates a *different* line of the same spec.

**A component that locks scroll owns capture and replay, not just the overflow.** Hiding overflow on
the document discards the scroll position on some platforms, so the page returns to the top on
release — usually the exact outcome the doc forbids. The working shape is capture the offset → fix
the document at the negative offset at full width → replay the offset in cleanup.

The general move: **when the spec names an effect without a technique, check the naive technique
against the spec's other requirements before adopting it.**

---

## Two sanctioned mechanisms are not two valid choices

Where the doc sanctions two mechanisms for one effect — "via A **or** B" — read it as two candidates,
not a free choice. **The component's other constraints routinely eliminate one**, and the doc is not
where that shows: it describes the effect, while the eliminating constraint comes from the
component's own geometry, layout, or token obligations.

- **The eliminated mechanism fails by wrecking the effect, not by failing to compile.** Where one
  mechanism measures in a coordinate space that another part of the component has already changed —
  a transform the layout forces, a scaling opt-out a token width requires — the two halves
  desynchronize and the effect renders in pieces. Nothing below gate 3 sees it.
- **Choose by render, not by reading.** Implement a candidate, render it, and isolate the suspected
  constraint by removing it live in the page (`verification.md` → Name a cause only once it is
  isolated by falsification). Elimination is proven, never assumed — and the surviving mechanism is
  re-rendered to confirm it satisfies the effect, not merely that it stopped breaking.
- **Record which constraint forced the choice**, in the source and in the report. Unrecorded, the
  next reader sees the doc's free choice, picks the other branch, and reintroduces the defect.
- **Report the "or" as drift** (`operations.md` → Doc drift is reported, not fixed). A spec offering
  a choice its own other requirements do not permit is missing a case — the constraint that decides
  it belongs in the doc.

This is the sibling of the rule above: there the spec names **no** technique, here it names **two**.
Both fail the same way — the reading that looks sanctioned violates a different line of the same spec.

---

## Prefer the platform's declarative mechanism over a scripted one

Where an effect is driven by a state the platform can express declaratively — scroll position,
element visibility, container size — **implement it with the declarative CSS mechanism the engine
provides, and reach for script only where none does.** The two are not interchangeable
implementations of one behavior: the declarative form removes defect classes the scripted form has to
defend against, and removes them by construction.

- **The reduced-motion gate stops being author-dependent.** An animation *declared* inside the
  reduced-motion preference query cannot be attached when the preference is set. The obligation is the
  same one stated below (Motion: each component owns its own gate) — declaring the motion inside the
  query is what makes it structural rather than remembered, which matters precisely because nothing
  downstream catches a missed gate.
- **No pre-script default has to be reconciled.** A scripted version needs one value that is correct
  before script runs and another after; the declarative version has no client default to get wrong, so
  the whole first-paint claim (above — A default value is a claim about the first paint) does not
  arise.
- **Guard it so an unsupported engine falls through to a correct static state.** Declared only inside
  the feature query, the effect is absent where the feature is — leaving the element's base state,
  which is a correct render rather than a broken one. **Confirm that state by rendering it; never
  assume it.**
- **Where script is genuinely forced, name what forces it** — the described behavior no declarative
  mechanism expresses. The scripted implementation then owns the reduced-motion gate, the pre-script
  default, and the first client frame's reconciliation, each explicitly and each in the report.
- **Verify all three paths by render — supported, unsupported, and reduced-motion.** They are three
  different rendered states, and confirming one says nothing about the other two
  (`verification.md` → Mount, render, drive, and watch the first client frame).

---

## The first component to establish a contrast ground rebinds the focus ring

A doc that defines an on-contrast focus-ring color usually leaves it bound to no selector, because
nothing global knows where the contrast ground is.

- **The component that creates the contrast ground redefines the focus-ring variable on its own
  subtree.** The global `:focus-visible` rule reads the variable and inherits the new value.
- **No second rule, no duplicated ring definition** — one variable rebinding, scoped to the subtree.
- Report the binding, so a later component establishing the same ground does not add a second one.

---

## A runtime-state fallback is not a data check

**Before branching on data to choose a fallback, check whether the spec scopes that fallback to a
runtime state.** A doc that scopes a placeholder to "missing or still loading" is describing render
time, not the data.

- **A runtime state is never derivable from the data, so a data check that imitates one is always
  either dead or wrong.**
- Where the schema cannot even express the absence being tested, the branch is unreachable code
  defending against an impossible state — and it violates the repo's data-integrity rule, which
  forbids an empty string standing in for absence.
- Prefer a form that satisfies the whole stated state set. Rendering the fallback as a **base layer**
  underneath the real content covers both "still loading" and "never arrived" without a handler, and
  keeps a server-rendered surface hook-free.
- **State the chosen form's weakness** where one exists, rather than leaving it to be rediscovered.

---

## Motion: each component owns its own gate

The token layer emits **no** global reduced-motion kill-switch where the doc says motion is honored at
the source, and reassigns the obligation here (`foundations-mapping.md` → Motion). This file is where
it lands.

- **Each motion-attaching component honors reduced motion at the source: do not attach the
  animation.** Attaching it and then suppressing it is the pattern such a spec rejects.
- **Nothing downstream catches a component that skips this** — there is no global switch to fall back
  on (`foundations-mapping.md` → Motion). A missed gate is a shipped defect, not a degraded one.
- **Re-evaluate the preference on change**, not once at mount.
- Where the gate has a visual resting state, express it as a per-case default so the reduced-motion
  path needs no script at all (above).
- **Report reduced motion as discharged, per component** — including the components that attach no
  motion, so the next reader can tell "gated" from "not applicable".

---

