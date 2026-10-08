# Final checks — the dogfood gate and the validation checklist

The two lists a run finishes against: the gallery must obey the design system it displays, and every
pinned requirement must be present. Both are **non-negotiable** and neither is a substitute for the
gates in `verification.md`, which this checklist points into.

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

Before handing off to the user, confirm all items pass:

- [ ] Mode chosen matches the evidence (DESIGN.md state + code state)
- [ ] Dev-only vs shipped confirmed with the user
- [ ] Build order followed: `scaffold-kit → visualizer-kit → sections → page`
- [ ] **Pinned structure reproduced exactly** — file names, folder names, and counts match
      (`references/architecture.md`)
- [ ] **Every DESIGN.md sub-section present as an `<h2>`, in document order** — bucket-prefixed titles, `ds-{slug}` ids
      (order: `references/section-spine.md` → Appendix; per-section entries: the four `references/spine-*.md`)
- [ ] **Dogfooding gate passes** — no raw hex, no typography overrides (no `text-sm`, `font-medium`,
      `text-[--ink]` alongside a token class), no gratuitous boxes around prose, all visual details
      resolve from the project's own design-system tokens
- [ ] **Real components imported** — every import path resolves; no hand-faked markup
- [ ] **Sample assets handled** — every specimen needing an image/diagram/media sample has one or a
      placeholder + gap note; the needed-asset list was surfaced and the user asked (generate / placeholder)
- [ ] **Doc→gallery parity review done** — every section (Build) or every changed section (Sync)
      compared against its mapped DESIGN.md sub-section item by item, **by something that did not
      make the edits**: claim fidelity, visualizer choice, per-item token-data fidelity, item coverage
      in both directions, new shapes exercised, prose-vs-box, inline-vs-standalone, component home,
      property-block scope, no construction leaks (`references/verification.md` → Gate 0). Where no
      separate reviewer was available, that is stated rather than the gate being recorded as fully met.
- [ ] **No invented affordance** — every rendered action, link, field and state traces to a rule in
      DESIGN.md or the product doc; sample data introduces no field the real schema lacks
- [ ] Render-backed verification done — real browser render at relevant viewport(s) and both themes
- [ ] Build gate green — linter, typecheck, and production build pass; gallery route prerenders; zero
      duplicate ids
- [ ] Code-write boundary respected — no edits to production code without explicit per-case user agreement
- [ ] Every mismatch reported to the user; no auto-fixes applied
