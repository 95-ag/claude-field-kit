# Modes

The four operating modes and when to use each one. Covers mode-decision flow, item-list source per mode,
and component classification rules; coverage derivation → `build-coverage.md`.

---

## The four modes

The gallery operates in one of four modes, determined by what exists when the skill runs:

| Mode | Situation | Item-list source |
|---|---|---|
| **Build** | DESIGN.md exists and is structurally sound; code exists (or is being built alongside the gallery); no gallery yet | DESIGN.md sub-sections |
| **Inventory** | Code exists; DESIGN.md is missing, partial, or unreliable | Code discovery (files, patterns, clusters) |
| **Sync** | DESIGN.md exists and is structurally sound; code exists; a gallery is already built | DESIGN.md ↔ code ↔ gallery cross-check |
| **Bootstrap** | DESIGN.md exists and is structurally sound; no code yet | DESIGN.md → scaffold hand-off (seam only) |

**Key principle:** the item list comes from DESIGN.md when the doc is source-of-truth (Build, Sync),
and from the codebase when the code is (Inventory). Bootstrap is a special case — no code means no
gallery to render, so the mode terminates with a hand-off to the scaffold skill rather than building
a gallery.

---

## Mode-decision flow

Run this sequence first, before any gallery work:

1. **Detect stack** — which adapter applies (React/Next, static HTML, other)? See `stack-adapters.md`.
2. **Detect DESIGN.md** — does it exist? Does it have a recognizable structure (Foundations / Components
   / Domain / Technical buckets, or equivalent)? A partial or structurally unsound doc is treated as
   absent for mode-selection purposes and surfaces a concern (see Classification below).
3. **Detect code** — are there components, tokens, or patterns in the codebase to render?
4. **Detect the gallery** — is one already built in the project?
5. **Pick mode** — from the table above. With a sound doc and code, the gallery decides: none yet →
   Build; one already built → Sync. Drift is what Sync finds, never the test for choosing it.
6. **Confirm dev-only vs shipped** — the gallery is dev-only by default; confirm with the user before
   proceeding (production-exclusion options: `stack-adapters.md` or `stack-adapter-static-html.md`, seam (e)).
7. **Build or refresh the gallery** — per the chosen mode's procedure below.
8. **Report mismatches** — detect, report, suggest classification; never auto-fix. See Handoff in
   `boundaries-and-handoff.md`.

---

## Build mode

**When:** DESIGN.md is the source-of-truth and code is available (or being built now).

**Item-list source:** the DESIGN.md sub-sections, in document order. Read `section-spine.md` for the
shared contract, the cross-section pins and the complete section order, then the per-section entries in
the `spine-*.md` file for the bucket you are building. The spine is the authoritative ordered list;
nothing in this mode overrides it.

When composing specimens, verify each component's real props first — `scaffold-kit.md` for
`GallerySection` and `SpecimenGroup`, `scaffold-specimen.md` for `Specimen` and `Card`,
`scaffold-chrome-theme.md` for `ChromeFrame` / `ThemeShot` / `ThemeVideo`, `scaffold-guards.md` for the
click guards.

**Build the full structure — no silent omissions.** Build each cataloged visualizer the design system
calls for. Do not substitute ad-hoc inline markup for a cataloged visualizer (e.g. a plain HTML table
in place of `SwatchGrid` or `TypeScaleList`) — the catalog exists so visualizers stay consistent and
reusable. If the project has a section-nav component, mount it on the gallery page (as the live TOC),
not only as a specimen inside a frame. If you deliberately substitute or omit a cataloged piece for a
stated reason, say so explicitly — do not drop it silently.

Coverage derivation, the strict spine mapping, what goes in or stays out, Domain sections and the
real-component import rule → `build-coverage.md`.

---

## Inventory mode

**When:** code exists but DESIGN.md is absent, partial, or structurally unreliable. The gallery is the
instrument for making the codebase visible enough to author DESIGN.md from it.

**Item-list source:** code discovery — files, component signatures, CSS patterns, repeated markup.

On static HTML this mode is EXERCISED in one shakedown — `stack-adapter-static-html.md` → Static-HTML adapter
contract; (f) Code/token discovery. The React/Next discovery path follows the
same logic: discover → render provisionally → surface for user confirmation.

### Discovery heuristics

**File-per-component codebases** (typical of component-library repos, React/Next projects):

- Each file in a components folder is a candidate.
- Reuse signal: a component imported by two or more pages is reusable; a component only used within one
  page is domain-specific or inline.
- Tokens: look for CSS custom properties defined in global stylesheets; repeated class name patterns;
  theme-aware conditionals.

**Single-file or monolith codebases** (e.g. a hand-coded HTML site):

- Identify repeated markup or class clusters — blocks of HTML that appear with the same structure more
  than once across pages are reusable candidates.
- One-off page-flow blocks (hero, footer content unique to a page) are domain/inline candidates.
- Tokens: CSS custom properties in `:root` or repeated literal values (colors, sizes) that appear 3+
  times suggest a token that the project may not have formalized.

### Classification in Inventory mode

Classification is **provisional** — the gallery groups candidates into likely buckets (Foundations
tokens, Shell chrome, reusable UI, domain/page-specific, inline) and surfaces them for the user to
confirm or move. Misclassification is expected and cheap to correct; grouping is data.

Label each candidate's provisional classification explicitly in the gallery section so the user can
see the reasoning: "appears in 3 pages → reusable candidate", "only in `about.html` → likely inline".

---

## Sync mode

**When:** DESIGN.md is sound, code exists, and a gallery is already built — whatever has changed since:
tokens, components, the doc, or nothing.

**Item-list source:** DESIGN.md (same as Build), cross-checked against code.

### Sync procedure

**Sync has three artifacts, not two.** The doc, the code, and **the gallery's own rendered prose** —
its section intros, rule lists, specimen specs and captions, which restate the doc's rules in a second
copy that drifts silently. A gallery asserting the opposite of its doc typechecks, lints and renders
clean. Check all three pairs, not just doc-to-code.

1. Start from DESIGN.md sub-sections (the authoritative item list for Sync).
2. For each section, verify **both** counterparts against the documented intent: the code, and the
   prose the gallery section renders.
3. Note mismatches on either axis: documented but no code; code exists but undocumented; values differ
   between doc and implementation; **the gallery asserts something the doc does not say, contradicts,
   or has since changed**.
4. Update the gallery sections to reflect the doc and the current code (within the gallery's own area).
5. **Re-run Gate 0 for every section whose mapped sub-section changed** — `parity-review.md` → Gate 0.
   This is the step that catches the prose axis; without it a doc edit lands with nothing comparing the
   two. Walk the sub-section item by item rather than searching the gallery for remembered phrases.
6. Report all mismatches via the inform-only handoff protocol — see `boundaries-and-handoff.md`.

The gallery **never edits DESIGN.md or production code** during Sync. It detects and reports.

**A doc change has a cost in the gallery.** Every rule the gallery restates needs a matching edit;
budget it into the doc change — it is not follow-up work.

---

## Bootstrap mode

**When:** DESIGN.md is present and structurally sound, but no code exists yet.

There is no gallery to build — the code layer does not exist. Bootstrap mode terminates with a
**hand-off to the scaffold-design-system skill** (see `boundaries-and-handoff.md`), which can
materialize the code layer from DESIGN.md.

---

## Classification rules (all modes)

### Provisional → evidence-based → user-confirmed

Classification always starts provisional, moves to evidence-based, and is finalized by the user:

1. **Provisional** — a first-pass grouping based on the primary signal (DESIGN.md section membership, or
   code location / reuse pattern in Inventory mode).
2. **Evidence-based** — the provisional classification is supported by observable evidence: file
   structure, import graph, DESIGN.md tags, reuse count. State the evidence explicitly.
3. **User-confirmed** — the user reviews the provisional+evidence grouping and confirms or adjusts.
   The gallery never finalizes a classification on its own.

### Tags as hints

When DESIGN.md uses `[inline]` / `[standalone]` tags on component entries, treat them as the primary
signal for domain classification. Tags take precedence over code inference.

Tags are a project-specific convention — not all projects use them. When absent, fall back to code
inference. Missing tags on a component that has been around long enough to be settled are an
evidence-based concern to flag (see below).

### Evidence-based concerns

When classification evidence is weak or contradictory, surface a concern rather than guessing:

- **Repeats but not extracted** — a pattern appears multiple times in code but has no standalone
  component and no DESIGN.md entry. Signal: flag as a candidate for **both** documentation and
  code extraction; the fixers and their order are `boundaries-and-handoff.md` → Fixer triad. Do not auto-invoke either.
- **Missing `[inline]`/`[standalone]` tags** — a DESIGN.md component entry with no tag and no clear
  code signal. Surface as a documentation gap; suggest the user add the tag. A pending-design token defined
  in the project's DESIGN.md legend is a tag, not a missing one — report the entry as an open design gap
  for `design-write` instead.
- **Single-file monolith with repeated clusters** — each repeated cluster is a provisional reusable
  candidate; clusters that appear only once are provisional inline. Flag the entire classification as
  pending user review when the codebase is too tangled to infer confidently.

Cross-reference: the fixer triad for mismatches is in `boundaries-and-handoff.md`.

---

## Cross-references

- Ordered section template (ordered sub-sections, visualizer assignment, prose-vs-boxed, component
  sub-grouping, domain `[inline]`/`[standalone]` treatment) → the four `spine-*.md` files, with the shared
  contract, pins and full order in `section-spine.md`
- Adapter-specific discovery (how to find components and tokens in code per stack) → `stack-adapters.md`
- How `GallerySection` and `SpecimenGroup` work → `scaffold-kit.md`
- Handoff protocol, fixer triad, code-write boundary → `boundaries-and-handoff.md`
- Section-id namespacing (`ds-<slug>`) and pinned file/folder structure → `architecture.md`
- Hard-to-demo techniques (ChromeFrame, demo-prop, Shiki pipeline) → `hard-to-demo.md`; sample assets → `demo-placement-and-media.md`
