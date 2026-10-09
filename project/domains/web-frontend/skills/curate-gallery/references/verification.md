# Verification

Verification is non-negotiable and render-backed. A gallery that passes a build check but has not
been observed in a real browser is unverified. Run all gates before
marking the gallery complete.

**Gate sequence:** Parity review (Gate 0) → Render (Gate 1) → Build (Gate 2). Gate 0 compares each
gallery section against the DESIGN.md sub-section it maps to. Passing Gate 2 without Gate 0 is not a
passing state. (A maintainer-only skill self-test follows the gates — not part of a normal build.)

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
  - **Ask whether what is missing is the framing, not the claim.** Three flags in one pass were all
    this shape: the claim was supported and what the gallery had dropped was the doc's framing — that a
    rule constrains *every* use rather than describing the current ones. That sentence is what stops a
    later session reading the rule as a description and dropping it, so losing it is the real defect and
    deleting the claim makes it permanent.

- **Visualizer / structure choice** — renders via the visualizer or prose structure pinned in
  its `spine-*.md` entry (Colors → SwatchGrid, Elevation → DepthGrid, Z-Index → LayerStack, …); no
  reinvented card or layout.
- **Per-item data fidelity** — token data matches the project's REAL tokens (DepthGrid: L2 blur vs L3
  raised, L4 bordered; all meteor color tokens enumerated; DeviceRuler uses the standard silhouette
  geometry; LayerStack container has no border). Verify against the real CSS/tokens, not memory.
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
  `name · token · usage` caption — usage info, the icon-sizes pattern).
- **No construction leak** — no gallery kit/section file paths appear in any rendered `source`; only
  real component / CSS / token / DESIGN.md references.
- **No pointer into an uncommitted or ignored path** — no committed gallery text, rendered **or** in a
  comment, cites a path that is not in the repo: a working-notes file, a scratch harness, a plan, an
  ignored directory. This is wider than the construction leak above, which only covers the gallery's own
  kit paths. **Every such pointer is dead for anyone who clones**, and it reads as a real reference
  until someone tries to follow it, so a build check will never surface it.
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
that long. Measured against two real galleries, a hard one-or-two-sentence rule would be wrong — in
practice 7 of 38 descriptions run past 25 words, the longest 57 — so the number is a prompt to justify,
not a cap to enforce.

**Two cross-checks when applying it.** A deletion pass must confirm no specimen lost its
**identifiability** — a viewer who can no longer tell which tier or state they are seeing has lost more
than the prose saved. And it must **re-render**, because removing text reflows the page.

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

1. Set `localStorage.setItem('theme', 'light')` (or `'dark'`) via eval.
2. Reload the page.
3. **Confirm the flip worked** by diffing the two captured PNGs — identical file sizes mean the
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
- Reading-mode scoped preview (`SwatchGrid` `scopeClassName="ds-reading"`) — confirm overridden
  token values render correctly in each theme.
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
3. **Production build** — succeeds. The gallery route prerenders static (no server-side-only APIs,
   no dynamic-only data fetching).
4. **Zero duplicate `id`s** — gallery section ids are `ds-<slug>`-namespaced so the reused
   section-nav's text-derived `h2` ids never collide. Verify post-build:
   `document.querySelectorAll('[id]')` → check for duplicates (or run a static DOM audit).

*Adapter note:* exact commands are in `stack-adapters.md`. React/Next: Biome + tsc + `next build`.
Static HTML: no build step — run a static linter or validator and a DOM duplicate-id check in the
browser.

*Static-HTML per-specimen render-check (EXERCISED):*
whole-page dup-id is not enough — check each `.ds-frame` actually paints content. Three signals per
specimen: **bad** (empty / zero-height box), **thin** (rendered height below a min threshold),
**variantsIdentical** (two variants with identical computed render — a dead-variant / dead-CSS tell). This
is the automated form of the `.fam-member` catch (a specimen that rendered but painted nothing); a dup-id
gate cannot see it.

A green build is necessary — not sufficient; Gate 0's per-section parity review catches what compiles but diverges.

---

## Skill self-test — parity dogfood (maintainer-only; requires a reference gallery)

**NOT a per-build gate.** A normal gallery build has no prior gallery to compare against — the gates above
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

## Gate 4 — Dual-stack proof

The skill claims to be stack-agnostic. Proof requires at least two adapters VERIFIED against real
projects:

| Stack | Modes run | Status |
|---|---|---|
| **React/Next** | Build, Sync | EXERCISED — Inventory unrun on this stack |
| **Static-HTML** | Inventory (shakedown) | EXERCISED — adapter shape built + render-checked; awaits a static-HTML project with a forward-written DESIGN.md (see `stack-adapters.md` → Static-HTML pinned structure) |

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
