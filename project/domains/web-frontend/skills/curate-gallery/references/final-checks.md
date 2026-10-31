# Final checks — the dogfood gate, the validation checklist and the run report

The two lists a run finishes against: the gallery must obey the design system it displays, and every
pinned requirement must be present; the run report closes the run. Both lists are **non-negotiable**,
and neither is a substitute for the gates in `parity-review.md` and `verification.md`, which this checklist points into.

---

## Dogfood gate

The gallery renders the design system **with** the design system. These rules are enforced in every
section, every visualizer, and every specimen:

**Typography — no overrides.** All text uses the project's type-scale token classes directly
(e.g. `body-primary`, `mono-anchor`, `heading-component`). Never add raw Tailwind utilities
(`text-sm`, `font-medium`, `text-[--ink]`) alongside a token class. The token class IS the style.
A needed text pairing with no token → add a token to the design system first, then consume it.

**Prose stays prose — no gratuitous boxes.** Prose content (rules, lists, notes) renders as
plain `.prose-content` markup. Wrapping prose in a `Card`, bordered `div`, or visual well when the
design system itself has no such treatment is a violation. Visualizer cards and `Card` primitives
are used only where the design itself uses them (color swatches, depth cards, icon grids, etc.).

**Real components, real sample data.** Component and Domain specimens import and render the REAL
production component with representative sample data. Never hand-fake markup that approximates the
component's output.

**Every rendered affordance traces to a doc rule.** The other rules govern HOW something renders; this
one governs WHETHER it may render at all. A gallery may frame its own demo — labels, inert wrappers,
chrome, click guards, "this control is disabled in the preview" — but it may NEVER invent product
behavior. An action, link, field, or state with no rule behind it in DESIGN.md or the product doc is
drift that a build, a linter, and a type checker all report as fine.

**Sample data is bounded by the content schema.** Schema-valid is the floor, not the test. Sample data
may not introduce a field the real schema does not have — a demo field manufactures the affordance
built on top of it. Where a shape is missing
and the demo needs one, that is a gap to report, not to fill.

**Real imports.** Every import path resolves in the actual codebase. Fabricated or placeholder
imports fail the build.

---

## Validation checklist

Before handing off to the user, confirm all items pass. Bootstrap ends at the hand-off and runs none of
them; an item tagged *(Build, Sync)* needs a sound DESIGN.md and does not apply in Inventory.

- [ ] Mode chosen matches the evidence (DESIGN.md state + code state)
- [ ] Dev-only vs shipped confirmed with the user
- [ ] Build order followed: `scaffold-kit → visualizer-kit → sections → page`
- [ ] **Pinned structure reproduced exactly** — file names, folder names, and counts match
      (`references/architecture.md`)
- [ ] *(Build, Sync)* **Every DESIGN.md sub-section present as an `<h2>`, in document order** — bucket-prefixed titles (Responsive Behavior's exception → `spine-domain-technical.md` → Bucket 5: Technical), `ds-{slug}` ids
      (order: `references/section-spine.md` → Appendix; per-section entries: the four `references/spine-*.md`)
- [ ] **Dogfooding gate passes** — no raw hex outside `gallery.css`'s scoped-override mirror
      (`page-and-css.md` → `gallery.css` requirements), no typography overrides (no `text-sm`, `font-medium`,
      `text-[--ink]` alongside a token class), no gratuitous boxes around prose, all visual details
      resolve from the project's own design-system tokens
- [ ] **Real components imported** — every import path resolves; no hand-faked markup
- [ ] **Sample assets handled** — every specimen needing an image/diagram/media sample has one or a
      placeholder + gap note; the needed-asset list was surfaced and the user asked (generate / placeholder)
- [ ] *(Build, Sync)* **Doc→gallery parity review done** — every section (Build) or every changed section (Sync)
      compared against its mapped DESIGN.md sub-section item by item, **by something that did not
      make the edits**, covering every Gate 0 check (`references/parity-review.md` → Gate 0). Where no
      separate reviewer was available, that is stated rather than the gate being recorded as fully met.
- [ ] **No invented affordance** — every rendered action, link, field and state traces to a rule in
      DESIGN.md or the product doc; sample data introduces no field the real schema lacks
- [ ] Render-backed verification done — real browser render at relevant viewport(s) and both themes
- [ ] Build gate green — linter, typecheck, and production build pass; gallery route prerenders; zero
      duplicate ids
- [ ] Code-write boundary respected — no edits to production code without explicit per-case user agreement
- [ ] Every mismatch reported to the user in the run report; no auto-fixes applied

---

## The run report

Every rule in these references that says "report it", "say so" or "surface it" discharges here — one report
per run, handed to the user. **A section with nothing to report says "none"**; an omitted section and a
forgotten one look the same.

| Section | Carries | Stated in |
|---|---|---|
| **Gates** | each gate's result; whether Gate 0's reviewer was separate; each finding as confirmed by render or inferred from markup | `parity-review.md` → Gate 0; `verification.md` → Gate 1 |
| **Mismatches** | each doc⇄code mismatch, in the inform-only finding shape | `boundaries-and-handoff.md` → Inform-only handoff |
| **Design gaps** | each documented value the gallery cannot place, each fallback used for a missing token, and each content-schema shape a demo needs that the project lacks — open gaps for `design-write` | `section-spine.md` → The three layers; `visualizer-type.md` → P1 — Template (universal structure); `visualizer-kit.md` → Generic fallbacks; → Dogfood gate; `modes.md` → Evidence-based concerns |
| **Classification concerns** | each candidate, missing tag or pending classification surfaced for the user | `modes.md` → Evidence-based concerns |
| **Omitted pieces** | each cataloged piece substituted or omitted, with its stated reason | `modes.md` → Build mode |
| **Gallery limits** | what the gallery cannot show, kept off the page | `parity-review.md` → The gallery is a visual partner to the doc, not a second copy of it |
| **Local extensions** | each piece built in the project's `_kit/` beyond the pinned kit | `scaffold-specimen.md` → Local extensions, and the one to watch |
| **Deploy** | a project with no deploy pipeline, stated, and the offer made | `stack-adapter-static-html.md` → Static-HTML adapter contract → (e) Production exclusion |
| **Assets** | each placeholder, the needed-asset list, and the user's choice | `demo-placement-and-media.md` → Sample assets |
