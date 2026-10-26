# Component set

What a run does with the component set as a whole — the order it emits in, where each file
lands, and the demo affordances the gallery depends on. Read once per run. A single component's
own rules are in `component-shape.md` (boundary, API, markup) and `component-behavior.md`
(effects, mechanisms, motion); the operation framing is in `operations.md`.

Framework behavior below is `EXERCISED` on **Next.js 16.3.4 (App Router) with Tailwind CSS v4.3.3** —
rendered and compiled. Re-measure on another major version; on another framework the questions are
portable and the answers are not.

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
  hole in the rule: the forced presentational split of a client component (`component-shape.md`) produces a file the
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

**Use only the two named patterns, or the export below where it applies; the technique detail for each
pattern is in `curate-gallery/references/hard-to-demo.md`.**

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

### Export the real thing; never let the gallery hold a second copy

A demo target can be a fragment that is private to a page the gallery may not touch — a
page-local function the composition owns. The reflex is to reproduce its markup in the gallery
behind a comment saying the copy must follow the original. **Export the fragment and import the real
one instead.** It is a one-line change in the page, and the doc's `[inline]` tag stays true, because
the component still lives there and is still composed there — the tag states where a thing lives, not
whether anything may import it.

- **A comment is not a guard.** Two copies of geometry with a note asking the next reader to keep them
  in sync is the failure mode this whole skill reports as drift when it finds it in a doc; emitting it
  deliberately is worse, because it ships with a sanctioning comment attached.
- **This is the third option, and it outranks both patterns above where it applies** — it needs no
  affordance at all, so neither the extraction nor the prop has to be justified against a trigger.
- **Name the case in the report:** a fragment private to a page, which the gallery demos.
- **The production edit is an export, and nothing else.** Where making the fragment reachable would
  take any change beyond adding an export, it is not this case: fall back to the two patterns, or
  propose.
