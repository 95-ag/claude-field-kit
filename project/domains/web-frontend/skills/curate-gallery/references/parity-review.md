# Parity review — Gate 0

The first of the three gates (sequence → `verification.md`): each gallery section compared item by item
against the DESIGN.md sub-section it maps to, and the check that keeps the gallery a visual partner to the
doc rather than a second copy of it. Render and build gates → `verification.md`.

---

## Gate 0 — doc→gallery parity review (per section)

A green build (right files, right spine) does NOT guarantee per-section fidelity — that is exactly what
slips through. Walk each section against the DESIGN.md sub-section its `mapsTo` names (and the
reference implementation, if one exists).

**When it runs:**

- **Build mode** — every section, before declaring the gallery done.
- **Sync mode** — every section whose mapped sub-section changed. A DESIGN.md edit that lands without
  this gate is the drift the gallery exists to prevent.

**Who runs it: something that did not make the edits.** Dispatch a fresh-context reviewer given only
the mapped DESIGN.md sub-section and the gallery section — no conversation history, no summary of what
changed. The author greps for what they remember changing, which is structurally different from
comparing two artifacts, and it misses whole classes of defect that survive repeated self-review. Where
no separate reviewer is available, say so in the report rather than recording the gate as fully met.

**Walk the sub-section item by item.** Do not search the gallery for phrases you remember editing —
grepping proves what you changed, never that the two agree.

**Coverage is item-level, not rule-level, and the difference decides what the gate asks for.** Every
documented *item* — a token, a component, a variant, a state — is accounted for: present as a specimen,
or deliberately absent with a reason. A documented *rule* is a different thing: it earns gallery text
only where the render cannot show it (below). **A gate that asks for a gallery counterpart to every
rule is asking the gallery to become the doc again**, which is the failure the brevity rule below
exists to stop — and it passes while doing it, because a faithful copy agrees with its source.

For each section confirm:

- **Claim fidelity** — every sentence the section renders is a claim, and each one traces to a rule in
  the mapped sub-section: section intro, rule-list bullets, specimen `spec` and `description`, group
  labels, visualizer captions, and any code comment a reader of the rendered page reaches. A claim the
  doc does not make is drift even when it is true; a claim the doc contradicts is a defect. Named
  values (hex, ratios, sizes, counts) are checked against the doc, not against memory — a section that
  counts its own doc sub-section's entries recounts them.
  - **Follow a cross-reference before calling a claim unsupported.** The check is scoped to one
    sub-section, but a doc is not: where the mapped sub-section stops at "this would break the rule in
    X", the claim's support is **in X**, and the claim is true and sourced. Flagging it teaches the next
    pass to delete true content, and the deletion then passes every later review.
  - **Ask whether what is missing is the framing, not the claim.** The usual shape: the claim is
    supported and what the gallery dropped is the doc's framing — that a
    rule constrains *every* use rather than describing the current ones. That sentence is what stops a
    later session reading the rule as a description and dropping it, so losing it is the real defect and
    deleting the claim makes it permanent.

- **Visualizer / structure choice** — renders via the visualizer or prose structure pinned in
  its `spine-*.md` entry (Colors → SwatchGrid, Elevation → DepthGrid, Z-Index → LayerStack, …); no
  reinvented card or layout.
- **Per-item data fidelity** — token data matches the project's REAL tokens. Verify against the real
  CSS/tokens, not memory; the fixed visualizer standards hold too (DeviceRuler's silhouette geometry,
  LayerStack's borderless container). Example: each elevation level's own treatment (blur vs raised vs
  bordered), every color token of an animated layer enumerated.
- **Item coverage, both directions.** Section-level coverage is not enough: a sub-section that already
  maps to a gallery section can gain a documented item and stay green while that item has no specimen.
  Enumerate items from the doc at check time, never from a remembered inventory.
  - **Forward** — every item the mapped sub-section defines has a specimen, or a stated reason it has
    none. Count them; do not recognise them.
  - **Backward** — every shipped design asset traces to a specimen or to an explicit exclusion: icon
    files, the favicon and other metadata assets, fonts, sample assets, background layers. An asset
    that ships and appears nowhere in the gallery is the class this direction exists to catch, and the
    forward direction cannot see it.
- **New shapes are exercised, not just compiled.** For each schema or content shape that changed since
  the last run, name the specimen that renders a non-empty instance of it. A sample filled in to
  satisfy the type checker leaves the gallery unable to show the shape just introduced.
- **Prose-vs-box** — plain-prose sections (Imagery, inline domain lists, orchestration notes) render as
  `.prose-content`, not boxed; boxes appear only where the design system itself uses them.
- **Inline-vs-standalone** — `[inline]` compositions are listed in an `InlineList` (never recreated);
  `[standalone]` components are plugged in live; pending-design entries show a placeholder card last in
  their area, never a demo.
- **Component home** — each component sits in the section matching its real folder home (the
  `component-structure` rule); verify the import path (e.g. `SectionProgressNav` → Domain · Project
  Detail, not Shell).
- **Property-block scope** — only Foundations/Technical visualizers carry the structured token property
  grid; Component/Domain specimens do not (a multi-variant specimen may carry a concise per-variant
  `name · token · usage` caption — usage info, as in Iconography's icon-sizes view, `spine-foundations-visual.md` → Iconography).
- **No construction leak** — no gallery kit/section file paths appear in any rendered `source`; only
  real component / CSS / token / DESIGN.md references.
- **No pointer into an uncommitted or ignored path** — per `section-spine.md` → `source` points to REAL
  artifacts. Such a pointer reads as real until someone follows it, so no build check surfaces it.
- **Dogfood** — no typography overrides, no gratuitous boxes, all visual values from tokens.
- **Page shell** — reading-page wrappers (standard content primitives), uniform inter-section spacing.
- **Earns-its-place** — every line of text is there because something must be **seen**, not because the
  doc says it (below). Claim fidelity asks whether a line is *true*; this asks whether it belongs.

Self-correct each finding before the render and build gates. Cross-check any "this looks wrong" read against the
actual tokens / reference code — a single visual read over-flags (legit token-baked accent can look like
a violation). The reference code is the arbiter, not a screenshot impression.

---

### The gallery is a visual partner to the doc, not a second copy of it

**A parity gate alone cannot find this, and that is why it needs its own check.** Restatement *agrees*
with the doc — it is a faithful copy — so it passes claim fidelity every time while the defect grows.
The gate therefore asks the inverse question as well.

**The test, one line, applied per line of rendered text:** *if I delete this line, does the viewer lose
something they cannot get by looking?* If no, delete it. The doc keeps every value; that is the whole
point of the split.

| | |
|---|---|
| **Remove** | a figure or rule the specimen already demonstrates. A per-tier size ladder written out beside a specimen that shows those sizes as the window resizes is the clearest case. |
| **Keep** | a **token name** — it tells the viewer *which* token produced what they can see. |
| **Keep** | a label naming the **tier or state** a specimen is showing, without which the viewer cannot tell what they are looking at. |
| **Keep** | a rule the render **cannot** show — behaviour unobservable on the page (true only on a touchscreen, say), or a prohibition. |
| **Judge** | a device ruler's or a type-scale specimen's numbers are often the visible content itself, not restatement. |

**It is not a finding log or an exception log either.** "The gallery cannot demonstrate X" is not gallery
content and not a task — a specimen exists to show a documented rule, so a limit of the gallery belongs
in the report, never on the page.

**Density follows from the test, as a ceiling with a reason rather than a limit.** `spec` entries are
phrases, not sentences; at most ~5 per specimen; a `description` past ~25 words needs a reason to be
that long. The number is a prompt to justify, not a cap to enforce.

**Two cross-checks when applying it.** A deletion pass must confirm no specimen lost its
**identifiability** — a viewer who can no longer tell which tier or state they are seeing has lost more
than the prose saved. And it must **re-render**, because removing text reflows the page.

---
