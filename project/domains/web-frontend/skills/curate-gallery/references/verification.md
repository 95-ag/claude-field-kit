# Verification

Verification is non-negotiable and render-backed. A gallery that passes a build check but has not
been observed in a real browser is unverified. Run all gates before
marking the gallery complete.

**Gate sequence:** Parity review (Gate 0) → Render (Gate 1) → Build (Gate 2). Gate 0 compares each
gallery section against the DESIGN.md sub-section it maps to. Passing Gate 2 without Gate 0 is not a
passing state. Gate 0 is in `parity-review.md`; Gates 1 and 2 are below. (A maintainer-only skill
self-test follows the gates — not part of a normal build.)

---

## Gate 1 — Render-backed visual verification

**A visual claim is only valid when backed by an actual browser render.** Code inspection, computed
styles, and static snapshots are not substitutes.

### Runner

Use a **script-file-driven automation runner** (playwright-cli or equivalent) — not inline shell
one-liners, and not the harness preview MCP. The preview MCP hangs on full-viewport WebGL
backgrounds and renders in a panel-constrained viewport. A script-file runner gives element/clip
captures, theme control, and reliable rAF-freeze.

*Example:* playwright-cli driven via a WSL script file (not an inline one-liner); the
WSL script-file pattern is documented in `rules/node/browser-testing.md`.

### Theme flip

1. Flip the theme the stack's way — the project's adapter (`stack-adapters.md` or `stack-adapter-static-html.md`) → (d) Theme flip.
2. **Confirm the flip worked** by diffing the two captured PNGs — identical file sizes mean the
   theme did not change. If sizes match, the flip failed; debug before continuing.

Do not infer that theming works from inspecting CSS variables. Observe it.

### Stabilize before capturing

- **Freeze continuous animation** before screenshotting any animated canvas or WebGL layer:
  `window.requestAnimationFrame = () => 0` (via eval), then capture. A never-stable frame causes
  capture to time out or produce a blur.
- **Scroll lazy elements** into view and confirm `naturalWidth > 0` before capturing below-fold
  specimens — a lazy-load race produces a blank box.
- Wait for application state (navigation, network, visible elements) rather than fixed sleep
  durations.

### What to verify

- **Every measurable rule the gallery renders, verified on the gallery itself, at the value it states.**
  The gallery is the one page guaranteed to contain the design system's rules, so each stated threshold
  is a ready-made test case — a minimum viewport, a touch-target floor, a contrast ratio, a reflow
  claim. Render at the stated value and check the gallery obeys it. A gallery that breaks a rule it
  prints is the cheapest defect in the system to find and the easiest to overlook.
- Key sections in both themes (confirm colors, type, spacing render from tokens — no overrides).
- Fixed-chrome / page-coupled demos render inside their `ChromeFrame` bounds and show click-guard
  tooltips on interaction.
- Build-time-transform-dependent specimens (e.g. CodeBlock via Shiki) render styled with syntax
  highlighting, not plain monochrome text.
- Overlaid-component specimens appear over a plain backdrop that changes with the theme, not over the
  real component beneath.
- TOC / section nav scrolls; the proportional indicator tracks correctly at 2xl+.
- *(only when the project scopes surface tokens to a document-level mode)* Scoped-override preview
  (`SwatchGrid` `scopeClassName`) — confirm overridden token values render correctly in each theme.
- ThemeSelector in page header stays interactive (not suppressed); ThemeSelector specimens inside
  the article are inert (wrapped in `InertDemo`).

Report each finding as **confirmed by browser render** or **inferred from markup** — never present
an inferred conclusion as visually verified.

---

## Gate 2 — Build gate

Run the full toolchain before marking the gallery done:

1. **Linter** — zero errors (e.g. Biome `check` for a TypeScript project; equivalent for other
   stacks. No `!important` where enforceable; zero unused lint suppressions).
2. **Type check** — zero errors under strict mode.
3. **Production build** — succeeds. Where the build includes the gallery route (option 1 of
   `stack-adapters.md` → (e) Production exclusion), it prerenders static (no server-side-only APIs, no
   dynamic-only data fetching); otherwise confirm the production output holds no gallery content.
4. **Zero duplicate `id`s** — gallery section ids are `ds-<slug>`-namespaced so the reused
   section-nav's text-derived `h2` ids never collide. Verify post-build:
   `document.querySelectorAll('[id]')` → check for duplicates (or run a static DOM audit).

*Adapter note:* the commands are in the project's adapter (`stack-adapters.md` or `stack-adapter-static-html.md`) → Gate 2 commands.

*Static-HTML per-specimen render-check (EXERCISED in the Inventory shakedown):*
whole-page dup-id is not enough — check each `.ds-frame` actually paints content. Three signals per
specimen: **bad** (empty / zero-height box), **thin** (rendered height below a min threshold),
**variantsIdentical** (two variants with identical computed render — a dead-variant / dead-CSS tell). It
catches a specimen that renders but paints nothing, which a dup-id gate cannot see.

A green build is necessary — not sufficient; Gate 0's per-section parity review (`parity-review.md`) catches what compiles but diverges.

---

## Skill self-test — parity dogfood (maintainer-only; requires a reference gallery)

**NOT a per-build gate.** A normal gallery build has no prior gallery to compare against — the gates
(parity review + render + build + the dogfood gate) are the whole bar. This is a **maintainer** method for
testing the SKILL when a known-good **reference gallery already exists**: dispatch a fresh / zero-context
subagent given only the skill (no prior conversation or session state), have it rebuild at a temp route,
then diff its file tree, section spine, and per-section visualizer usage against the reference. Any
divergence = a skill gap (fix the skill, re-run). Remove the temp gallery after. **Skips entirely when no
reference exists.**

**Test hygiene — neutralize answer keys before the rebuild:** wipe (or explicitly decide the status of) any
pre-existing dev sample assets under the gallery's `/public` samples path first. A prior build's leftover
figures / diagrams / background captures otherwise act as answer keys the fresh build reuses instead of
exercising the skill's own sample-asset path. Same principle for any prior gallery route left on disk — the
rebuild must not be able to read it.

---

## Stack-proof status

The skill claims to be stack-agnostic. Proof requires at least two adapters VERIFIED against real
projects:

| Stack | Modes run | Status |
|---|---|---|
| **React/Next** | Build, Sync | EXERCISED — Inventory SPECIFIED on this stack |
| **Static-HTML** | Inventory (shakedown) | EXERCISED — adapter shape built + render-checked; awaits a static-HTML project with a forward-written DESIGN.md (see `stack-adapter-static-html.md` → Static-HTML pinned structure) |

No row is VERIFIED yet, so this proof is open. The static-HTML
Inventory shakedown built and render-checked the adapter shape and harvested
the pinned structure + component-build contract, but the **authoritative dogfood waits for a static-HTML
project with a forward-written DESIGN.md** — a reverse-engineered doc is too debt-ridden to verify
the fidelity gates against. Until that dogfood completes, React/Next is EXERCISED in Build and
Sync, static HTML is EXERCISED in Inventory, and neither is VERIFIED. Do not describe the skill as fully
stack-agnostic in materials that imply both adapters are tested.

---

## Cross-links

- Runner setup and theme-flip detail → the host project's browser-testing rule.
  *Example:* `rules/node/browser-testing.md`
- Stack-specific build commands and exclusion confirmation → `stack-adapters.md`
- Visual-verification principles (render-backed vs inferred labeling) — stated inline above; see
  also the host project's visual-verification rule.
  *Example:* `rules/web-frontend/visual-verification.md`
- Pinned file/folder structure → `architecture.md`; the section spine's shared contract, pins and full
  order → `section-spine.md`
- Per-section template (which visualizer per section, prose-vs-box) → the four `spine-*.md` files
- Visualizer pseudocode → the per-visualizer `visualizer-*.md` files; dogfood constraints →
  `visualizer-dogfood.md`
