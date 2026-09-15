# Components

How a documented component becomes a file: what order the set is emitted in, how each component's
boundary, API and markup are derived from what the doc describes, and which obligations the token
layer hands down to individual components. The operation framing a run is in `operations.md`; the
token layer is in `foundations-mapping.md`; what counts as proof is in `verification.md`.

Framework behavior below was observed on **Next.js 16.3.4 (App Router) with Tailwind CSS v4.3.3**, by
rendering and compiling. On another framework the questions are portable and the answers are not.

---

## Order the whole set topologically

**Emit leaves first, ordered topologically over the entire batch — never alphabetically, never folder
by folder.** Both naive orders emit a consumer before its dependency.

- **Alphabetical breaks on names.** A consumer whose name sorts early is written before the leaf it
  imports.
- **Folder-by-folder breaks worse, and it breaks on the structure rule's own order.** A dependency
  graph crosses folders in both directions, so walking folders in the order the repo's
  component-structure rule lists them emits a component whose import points into a folder not yet
  written. The rule's listing order is the premise; without it the clash does not arise.
- **Build the graph before emitting anything**, from each entry's spec — the doc names a component's
  dependencies as the components and roles its description composes.
- Foundations precede every component that consumes them (`SKILL.md` → Operation-decision flow).

*Example:* `divider` lives in `layout/` and its only consumer `event-card` lives in `ui/`,
while the structure rule lists `ui/` before `layout/` — so the rule's own folder order emits the
consumer first.

### A dependency edge that points outside the batch

**Never emit a component that is not in the run's item list — not even to satisfy an import.** This
is the rule; the paragraphs under it are its consequences. It binds on the **resolved scope**, not on
whether the doc documents the dependency: a documented component the run was not asked for is out of
scope exactly like an undocumented one.

**The test is whether the doc gives the thing its own entry.**

| The dependency | Emit? |
|---|---|
| Has its own entry in the doc, outside the run's scope | **Never** — not even to satisfy an import. Its entry is its own future run. |
| Has no entry of its own, existing only as an implementation consequence of an in-scope component | May be emitted, as part of that component's output. |

- **The entry test overrides a "plus whatever they depend on" instruction in the request.** Scope
  resolves over the doc's entries, so a documented dependency is a named entry the user could have
  put in the item list — a request that did not name it did not include it. A claim written from the
  dependency's side ("used inside …", "sits above …") is that entry stating its own consumers, not
  the consumer's entry naming it, and does not pull it into scope.
- **A structural necessity has no entry to defer to**, which is why it is the exception rather than a
  hole in the rule: the forced presentational split of a client component (below) produces a file the
  doc never names and no future run owns. It is counted into the batch as N+1 files, not treated as
  an unlisted component.
- **Resolving a dependency never widens the item list.** The list is fixed at scope time
  (`operations.md` → Scope resolution) and is the complete set of files the run may create. A
  dependency belongs in it only because the user's scope named it — decided there, never mid-emit.
- **Style the consumer from what the missing component wraps** — the token, type role, or class its
  spec entry names — and continue. The consumer is finished; the dependency stays unwritten. This
  is the normal outcome, not a degraded one.
- **An unrequested file is indistinguishable from a requested one.** It lands in the next run's item
  list as already built, so the run that owns the component never writes it against its real
  consumers — the reason the prohibition is absolute rather than a preference.
- **Report the edge**, so the component that eventually owns it is written against a known consumer.

---

## Derive the server/client boundary from described behavior

**A client boundary is forced only by a described behavior that requires the browser at runtime** —
local state, an event listener, a focus or scroll side-effect, or a measurement. Everything else is
server-rendered.

The framework rule owns how small the boundary must be kept (`SKILL.md` → Project-native contract);
this is the test for whether it is needed at all.

**Two naming traps, both of which promote a static component to a client one:**

- **A component's name is not its behavior.** Read the described action, not the noun. A component
  named for a control can be specified as navigation — handing off to an external destination and
  never opening an in-page view — which renders as a link with no handler and no boundary. Infer from
  the behavior, never from the words *button*, *action*, or *click* in the name.
- **A section's motion is not the component's.** Motion described under a domain or section entry
  belongs to the section that composes the component. Only motion under the component's **own**
  heading can force its boundary.

---

## `'use client'` is file-scoped, so an extraction is a two-file split

Where a client component's visual surface can be split off as a pure panel, split it — the client
leaf then stays as small as the framework rule requires, and the panel is renderable from a server
page.

**The purpose of the split is that the panel is not a client component.** It exists to take the
directive, the hooks and the side-effects off the visual surface, so that surface renders from a
server page and demos in a bounded frame with no runtime around it.

- **The extracted half carries no `'use client'`, no hooks, and no side-effects.** Marking it client
  re-imports precisely what the split removed: the mechanics are then performed, two files exist, and
  the extraction has bought nothing. A panel that needs a hook has not been split — re-cut it.
- **Everything that requires the browser stays on the wrapper** — state, listeners, focus, scroll
  lock, measurement — and so do the attributes that describe the wrapper's runtime behavior.
- The panel takes what it renders as props; the wrapper passes them.

**The directive is file-scoped, so the panel cannot share the wrapper's file.** A shared file
carrying `'use client'` makes the panel a client component too, which destroys the extraction's
entire purpose.

- **This overrides the structure rule's allowance that a tight family may share one file.** The split
  is forced by the directive's scope, not chosen by preference — say so, or the next reader tidies
  the two files back into one.
- **Every presentational extraction out of a client component is therefore two files, not one.**
  Count it into the expected output before generating: an extraction turns an N-component batch into
  N+1 files.

---

## Prop shape, prop type, and element choice

This is the decision that runs once per component, and it has three questions.

**1 — What shape are the props?** Pass the domain object when the component *is* the renderer of that
object and its fields move together; flatten to scalars when the component is a primitive that knows
nothing about the domain.

- **The test is the folder's own dependency contract, not convenience.** A portable component may not
  name a domain type — doing so drags the content types into the portable layer and reverses the
  dependency direction the structure rule sets.
- A domain renderer that flattens instead restates every field in its signature and couples each
  caller to the schema twice.

**A component's props decide which layer it can live in.** So where the doc files a component in a
portable layer and its job needs domain data, **flatten the props — do not move the component.** One
primitive prop per field; the composing page destructures. Flattening satisfies both authorities at
once: the doc's placement stands and the portable layer still names no domain type. Moving the file
satisfies the structure rule by contradicting the doc.

- **Relocation is never the cheap option.** A component moved into a domain folder becomes a domain
  entry, which the doc must then tag — so the move manufactures a second, untagged drift finding
  (`operations.md` → In scope: the placement tag decides) on top of the disagreement it was meant to
  settle.
- **Match the layer's siblings.** Portable components already in that layer take flat props; a lone
  object-shaped signature there is the tell that the flatten was skipped.
- **Only where flattening is genuinely impossible is the placement a conflict to report** — doc and
  rule then disagree irreducibly, which is drift for `design-write`, not a call to make mid-run.

**2 — What primitive type is each prop?** Take the value the component actually computes with, never
a pre-formatted string.

- **A string prop the component immediately splits or parses is a boundary defect, not an API** — it
  makes the component the wrong place to notice a malformed value (the repo's data-integrity rule
  validates at the boundary and never coerces a plausible-looking value).
- Prefer the type a real source yields, so no round-trip through a formatted form is needed.

*Example:* `ImagePlaceholder` takes `width`/`height` as numbers, not a `"4/5"` ratio
string, because it derives `aspect-ratio` arithmetically and numbers are what an image source yields.

**3 — Which element?** Pick the element whose *native* semantics already carry the role, then
override only what the design changes.

- **A design token overrides a presentational default, never a semantic one.**
- **Check what the framework's preflight already supplies before styling a semantic element.** A
  preflight commonly styles the semantic elements it resets, so the component sets only the delta.
  Re-declaring what preflight provides, or reaching for a generic element plus an ARIA role where a
  native one exists, both add markup the framework already gives.
- **Where no native element carries the role, add ARIA deliberately and in full** — the role and
  every attribute its pattern requires, per the repo's accessibility rule.
- **A type role never dictates a heading level.** A doc that defines a role as "H2 and event names"
  conflates a type role with a document level; a component cannot know its depth in the page, so it
  renders the level its own composition implies and leaves the outer level to the composing section.

*Example:* `<hr>` carries the separator role natively *and* preflight gives it a
top-only border, so `divider` sets width and color and nothing else.

---

## Tokens at the point of use

Which documented values become variables at all is the token layer's question
(`foundations-mapping.md` → Which keys become tokens). Two consequences land in component code.

**A component heading can carry its own fenced block, and this component's task owns it.** The token
resolver scans component sections too, and defers such a block here rather than emitting it into the
token layer (`foundations-mapping.md` → Triage the whole document). Materialize it by the same test
every block is triaged by (`foundations-mapping.md` → Which keys become tokens), and **record the
outcome in the report even when it emits nothing** — silence reads as a dropped block.

**A multi-value token composes into ONE utility, never a stack of them.** Where a token's design
meaning is several comma-joined values of a **single** CSS property — shadow, transition, background
layer, mask — two utilities for that property overwrite each other and the design silently loses a
layer.

- Emit the values comma-joined inside one arbitrary utility. It composes token references and
  introduces no design value of its own, so the design-system rule against arbitrary values is not
  in tension with it.
- **The failure is silent: both utilities compile**, and the gate reports nothing.

*Example:* an elevation defining a near and a far shadow emits as
`shadow-[var(--shadow-paper-near),var(--shadow-paper-far)]`; two `shadow-*` utilities would have
dropped one layer.

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

## Placement, naming, and the foldering threshold

Placement and file naming resolve from the repo's component-structure rule, and a disagreement
between that rule and the doc is reported to `design-write`, never silently fixed
(`SKILL.md` → Project-native contract; `operations.md` → Doc drift is reported, not fixed). An entry
the doc marks non-generatable is skipped and reported, never stubbed
(`operations.md` → Documented ≠ generatable).

**Evaluate the structure rule's foldering threshold against the run's *resulting* set, not per item.**

- A bulk run adds many components to one folder in a single change, so a per-item check passes on
  every item and the folder still lands over the threshold.
- **Count the folder's post-run membership before emitting**, and where it would cross, the same run
  performs the split the rule prescribes — the rule's split axis is pre-defined, so the split is
  mechanical, not a design decision.
- The threshold and the sub-group names are the repo's rule to state; this skill only evaluates them
  at the right moment.

---

## Demo affordances

Certain components cannot be rendered meaningfully in a bounded gallery frame without a small hook in
the production component. **This skill emits them at generation time.** The authorization — the two
conditions that must both hold, and who the per-case gate binds — is stated once in
`curate-gallery/references/boundaries-and-handoff.md` → Carve-out. This section is the procedure.

**Use only the two named patterns; the technique detail for each is in
`curate-gallery/references/hard-to-demo.md`.**

| Pattern | Choose it when |
|---|---|
| Presentational sub-component extraction | The component has a meaningful presentational/effect split — a pure visual panel inside a side-effecting wrapper. |
| Demo-affordance prop | There is no such split — the component *is* its visual surface, and only one input is unavailable in a bounded frame. |

- **Prefer extraction where the split exists**, because it removes rather than contains the problem:
  a panel positioned relative to its wrapper's layer needs only a plain bounded box in the gallery,
  where the unsplit component would need a frame that fakes a fixed viewport.
- **Keep every touch-point minimal** — a prop that is omitted by production callers, or a component
  boundary that production wraps. Never a logic change to the production behavior.
- **A prop's effect must be to skip the unavailable input, not to simulate it.** When present, the
  runtime binding is never attached and the component renders posed at the supplied value.

**Record every touch-point by name, so the gallery finds it without reading the source.** The run
report carries, per affordance:

| Field | For an extraction | For a prop |
|---|---|---|
| Mechanism | the pattern used | the pattern used |
| Name | the extracted component and its file | the prop and its type |
| Contract | the props the gallery passes, and which are optional | the effect when present |
| Owner | the component retaining every side-effect | — |
| Trigger | the documented trigger the component matched | the documented trigger the component matched |

- **Name the trigger, not just the mechanism.** The authorization requires both, so a report naming
  only the pattern cannot be checked against it.
- **A novel affordance, or one of these two patterns on a component matching no trigger, is
  proposed and waits for agreement** — it falls outside the pre-authorization.
