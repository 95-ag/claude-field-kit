# Component shape

What a single component IS — which side of the client boundary it sits on, how many files that
forces, its props and element, and how it consumes tokens. Read while writing the signature and
the markup. What it DOES at runtime is in `component-behavior.md`; set-level ordering and
placement are in `component-set.md`.

Framework behavior below is `EXERCISED` on **Next.js 16.3.4 (App Router) with Tailwind CSS v4.3.3** —
rendered and compiled. Re-measure on another major version; on another framework the questions are
portable and the answers are not.

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

