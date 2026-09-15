# Operations

The two operations, how a run's scope is resolved, and what the skill does with an entry it
cannot generate. Scope boundaries and the reference index live in `SKILL.md` — read them there.

---

## Fresh — create from spec

**Precondition:** DESIGN.md describes the item; no code exists for it.

1. **Read the entry, then every rule that governs it from outside.** No component's spec is
   contained in its own heading — hit area comes from the accessibility rules, focus ring
   from the interaction rules, shape from Foundations. A generator that reads only the
   component heading emits an under-specified component that still compiles.
2. **Resolve placement and name** from the contract table's owners (`SKILL.md` →
   Project-native contract), not from the doc's section order.
3. **Emit in dependency order** — foundations before the components that consume them,
   components topologically within the batch (`components.md`).
4. **Transcribe; never invent — and never stall.** A value DESIGN.md does not state stays unset, and
   a token variant the system does not define is not created to fill a gap. The absence is recorded
   in the run report, not patched with a plausible value.

   **Where the omission is one that rendering requires, unset is not an option.** A foreground color
   left unstated renders invisible; a padding given as a *range* is not a value; a tone described
   only in prose names no token; a vector's geometry cannot be blank. Leaving those unset ships a
   broken component, and refusing the item ships nothing. For that case only:

   - **Infer the minimum defensible value from what the doc does state** — an adjacent token, the
     nearest stated case, the other half of the pair the value belongs to. Take the narrowest
     inference that renders, and never carry a second one along with it.
   - **Mark it in the run report as an inferred value**, listed apart from the transcribed ones,
     naming the gap it fills and what it was derived from.
   - **Hand the gap to `design-write`** as drift, with a status and an owner (below), so the value
     lands in the doc rather than living on in the code.
   - **Where the missing thing is the component's defining artifact** rather than one of its values,
     say so plainly: mark the stand-in provisional in the source as well as the report, so it is not
     mistaken for a transcribed one.

   The rule this preserves: nothing is invented **silently**, and nothing inferred is left looking
   transcribed.
5. **Verify with compiled evidence, then run the repo's gate** (`verification.md`).

---

## Align — bring existing code to the spec

**Precondition:** code exists and disagrees with the spec.

1. **Read both** — the spec entry with its governing rules, and the current code.
2. **Name the drift per item before editing**, so the change is bounded by a stated
   finding rather than by what the code looks like.
3. **Apply the minimum change.** Align corrects the named drift; it does not restyle,
   re-architect, or modernize working code that already matches the spec.
4. **Where the code is right and the doc is stale, that is doc drift** — report it (below).
   Do not edit correct code to match a wrong doc, and do not edit the doc.
5. **Re-verify each item, including the ones that needed no change.** "The code already
   matches" is a conclusion, not evidence; a correction that produced no edit is confirmed
   by checking, and the check is recorded.

**Align never widens.** Drift spotted outside the run's scope is reported, not fixed in
passing.

**Status: unverified.** Fresh was exercised end to end; Align's steps are specified from it and
have not yet been run against real drifted code. Treat a surprise here as a finding about this
file, and record it.

---

## Scope resolution

A run covers **one item**, a **named subset**, or **all documented-but-missing items**.

- "Build everything from the design" is Fresh with a wide scope, not a third operation.
- Derive the item list from DESIGN.md's own structure, filtered by the placement tags.
- **Scope is per-run; the operation is per-item.** A wide run is normally mixed — Fresh for
  what is absent, Align for what exists and has drifted.
- Fix the scope before generating. An undocumented item discovered mid-run is reported and
  left for the user to add to the scope — never absorbed silently.
- **A dependency outside the batch does not stop the run and does not widen it.** The rule, and the
  prohibition on emitting a component the item list does not name, are stated once in
  `components.md` → A dependency edge that points outside the batch.

---

## In scope: the placement tag decides

`[standalone]` domain components are in scope; `[inline]` ones are not. The tag is the
operational form of the page-bound test — the mapping table is in `SKILL.md`.

This supersedes any earlier wording where "standalone" meant "portable, with its own file".
Portability and file-existence are different properties; the tag states file-existence, and
that is what determines scope.

---

## Documented ≠ generatable

An entry can be documented before its design is finished. A doc marks such a placeholder with a
token its legend defines (e.g. `[pending design]`); the design, the doc update and the code come later.

- **Skip and report — never emit a stub.** A placeholder file that satisfies the item list
  is worse than the gap: it compiles, it looks generated, and it hides the intent.
- **Every skipped entry appears in the run report with its reason.** An unexplained skip is
  indistinguishable from a dropped entry, and the next reader re-derives the same question.
- Keep three cases distinct in the report — they have different futures:

  | Case | Meaning |
  |---|---|
  | Pending design | marked unfinished in the doc; generates once designed and tagged `[inline]` or `[standalone]` |
  | Out of this run's scope | generates in a later run |
  | Blocked by a spec gap | would generate, but the spec is incomplete — the gap is the finding |

*Example:* `scroll-cue` and `Background → Botanical Edge` are placeholders whose
design is not finished; the implementation plan schedules each for design, a doc update, then code.

---

## Doc drift is reported, not fixed

The skill never edits DESIGN.md. It surfaces the finding and, on the user's confirmation,
hands off to `design-write` (fixer triad →
`curate-gallery/references/boundaries-and-handoff.md`).

What counts as drift:

- **Placement disagreement** — the doc files a component where the structure rule puts it
  elsewhere (resolution → `SKILL.md` → Project-native contract).
- **Internal contradiction** — two statements in the doc cannot both hold.
- **A value stated only in prose**, or a prose constant with no token behind it.
- **A missing placement tag** on a domain entry.
- **A named alternative with no token behind it** — the alternative is unimplementable as
  written, whichever branch the code took.

Two rules for the report:

- **A forced binary choice between two readings of a spec is itself evidence the spec is
  missing a case.** Report the contradiction rather than picking a side quietly; the answer
  is often neither option.
- **Report what the code did in the meantime.** A drift finding without the code's current
  behavior cannot be judged.

Report shape: what was found · where (DESIGN.md heading path) · what the code does now ·
**status** · **owner** (the suggested fixer, or the later task that will see the evidence first).

**Every logged gap carries both.** A gap with neither is indistinguishable from a note nobody will
act on: `OPEN` / `DEFERRED` / `RESOLVED` / `CLOSED here` says whether it still needs a decision, and
the owner says who makes it. A gap resolved by a spec correction that matches what was already built
is still logged, or the next reader re-derives the same question.

---

## Invocation paths

**Direct** (the user names an item, a layer, or the whole system) or **dispatched** by
`curate-gallery` on user confirmation — the seam is in
`curate-gallery/references/boundaries-and-handoff.md`.

On a dispatch, the gallery supplies the mismatch and its suggested classification. **Resolve the
operation from the evidence, not from the label** — re-read the spec entry and the code before
deciding between Fresh and Align.
