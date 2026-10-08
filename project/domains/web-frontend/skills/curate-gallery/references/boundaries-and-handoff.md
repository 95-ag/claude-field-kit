# Boundaries and Handoff

What the gallery skill may and may not touch, and how it hands off detected mismatches for resolution.
Demo technique detail lives in `hard-to-demo.md` — cross-linked where noted.

---

## Code-write boundary

**The gallery is read-only on the repo's real production code by default.** It:

- Writes only its own gallery area (`<route>/design-system/` and its sub-folders).
- References production components and tokens from outside — never copies or re-implements them.
- Never edits production component code, foundation CSS, or DESIGN.md when a doc change is detected, when a Sync mismatch is found, or for any reason other than the carve-out below.

Updating the gallery's own sections and visualizers to reflect new tokens or components is fine — that is entirely within its area.

---

## Carve-out — minimal demo affordances in production components

Certain components cannot be meaningfully demoed without a small hook in the production component itself. This is the **only permitted exception** to the read-only rule.

**When it applies:** a component that is `position:fixed`, page-coupled (DOM-scraping, route-reading, scroll-tracking), or breakpoint-gated cannot be demoed live in a bounded frame without some affordance. The gallery cannot fake this from outside. See `hard-to-demo.md` for the techniques.

**Gate — it binds the gallery.** The carve-out is an exception to *the gallery's* read-only rule, so the per-case gate is the gallery's: it surfaces the need, proposes the minimal change, and waits for **explicit per-case user agreement**. It never adds a production touch-point unilaterally.

**scaffold-design-system is pre-authorized** to emit an affordance at generation time — it never had a read-only rule to except — when **both** conditions hold:

- the mechanism is one of the two patterns below, **and**
- the component matches one of the triggers this section names: fixed, page-coupled, breakpoint-gated, or hard side-effects.

Both are required. The trigger is the occasion, the pattern is the mechanism; bounding by mechanism alone would licence any prop. A novel affordance, or one of these two patterns on a component matching no trigger, still needs per-case agreement. Procedure — which pattern applies, how each touch-point is named and recorded — is
`scaffold-design-system/references/component-set.md` → Demo affordances.

**Constraint:** keep every touch-point minimal. Prefer a **prop** (the simplest possible hook) or a **presentational sub-component extraction** (splitting the presentational panel out of a side-effecting wrapper) over logic changes to the production component. The production callers always omit the demo prop; the sub-component is wrapped by the real component for production use.

**The two patterns:**

| Pattern | When to use | How (mechanism) |
|---|---|---|
| **Demo-affordance prop** | A fixed/page-coupled component that needs live rendering — e.g. a section-progress nav or a scroll-to-top button. | See `hard-to-demo.md` |
| **Presentational sub-component extraction** | A component with hard side-effects (focus-trap, scroll-lock, route/resize/escape handlers) where a prop alone can't neutralize them — e.g. a mobile nav. | See `hard-to-demo.md` |

Example: three verified touch-points are `demoSections` on the section-progress nav (demo-affordance prop), `forceVisible` on the scroll-to-top button (demo-affordance prop), and `MobileNavPanel` extracted from the mobile nav (presentational extraction). These are named as the known reference implementations; the patterns generalize to any project.

---

## Inform-only handoff

**The gallery is a detector, not a fixer.** When it finds a mismatch between DESIGN.md, the gallery, and production code, it never auto-invokes another skill or makes changes outside its own area.

The handoff protocol:

1. **Detect** — identify the mismatch during Build, Sync, or Inventory.
2. **Report** — surface the finding with enough evidence for the user to judge it: what was found, where, the suggested classification.
3. **Suggest** — propose the appropriate fixer (see Fixer Triad below).
4. **Wait** — the user decides whether to act and which fixer to invoke.
5. **Invoke only on confirmation** — if the user confirms, invoke the suggested fixer. Never pre-emptively invoke.

The gallery never authors DESIGN.md and never runs design-write or scaffold-design-system without explicit user confirmation.

---

## Fixer triad

| Mismatch | Suggested fixer (on user confirmation) |
|---|---|
| Doc is out of line with intent or code | **design-write** (update DESIGN.md) |
| Code is out of line with the doc | **scaffold-design-system** in Align mode (bring code to match DESIGN.md) |
| Code is missing (documented but not built) | **scaffold-design-system** in Fresh mode (create from spec) |
| Repeats in code but not extracted as reusable | **both** — scaffold-design-system (extract) and design-write (document it) |

When "both" applies, surface both needs together. The user may confirm one, both, or neither.

---

## design-write boundary

design-write owns DESIGN.md — authoring, updating, and realigning it (it treats DESIGN.md as a referenceable contract surface with stable heading paths). The gallery **never authors the doc**, even when it detects that the doc needs updating. It informs and, on confirmation, triggers design-write.

The gallery's section vocabulary (bucket structure: Foundations · Background · Components · Domain · Technical) is derived from the design-write contract template, so the two stay aligned by construction.

---

## scaffold-design-system boundary

scaffold-design-system materializes the design system's **code layer** from DESIGN.md — foundations (token/theme CSS) and reusable components. **Its scope is its own**, defined in `scaffold-design-system/SKILL.md` → Scope; it is not restated here.

What this file owns is the seam: the gallery is read-only on production code (above), it is inform-only on handoff (above), and scaffold-design-system is one of the fixers it dispatches to on user confirmation. It is equally invokable by the user directly. The gallery defines the seam; scaffold-design-system owns the execution.
