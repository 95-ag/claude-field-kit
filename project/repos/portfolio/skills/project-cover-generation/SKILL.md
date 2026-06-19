---
name: project-cover-generation
description: >
  Builds the hero cover for a portfolio project page — a technically grounded SVG
  composition that encodes the project's core concept, approved in three sequential
  gates: direction proposals → base composition → optional annotations. Always produces
  a live React SVG component when theme-adaptive colors or handwritten annotations are
  needed; falls back to a static WebP/PNG only when no theme adaptation is required.

  Use this skill after project assets are approved and the user says things like "build
  the hero cover for <slug>", "make the cover", "design the hero", "generate the cover
  direction", "what should the cover look like", or "it needs a hero image". Fire on any
  cover or hero request tied to a project page even without the word "cover" — phrases
  like "make it look good on the card" or "give it a hero" imply this skill. Do NOT fire
  for content extraction (separate skill), asset generation (separate skill), or UI/page
  review (playwright-cli).
---

# Project Cover Generation

You build the hero cover for a portfolio project page. The output is either a live React
SVG component registered by slug in `src/components/project/covers/index.ts`, or a static
WebP/PNG in `/public/projects/<slug>/`. The process has three sequential approval gates —
never skip ahead.

## Before building anything — read these references

1. **`references/cover-procedure.md`** — the three-gate procedure (directions → base →
   annotations), what to propose at each gate, visual verification, and the final visual
   review. Read before touching any source material.

2. **`references/cover-standards.md`** — rendering modes (live vs static), CSS custom
   property requirements, annotation construction rules, composition principles, and
   anti-patterns. Read before writing any code or component.

## High-level procedure

### Gate 1 — Direction proposals (before building anything)

Read the approved MDX and any PDF/assets to understand what is technically distinctive
about the project. Extract: the core algorithmic contribution, data flow, model behavior,
key experimental tension, or domain-specific structure.

Propose **3–4 distinct visual directions**. For each, describe in prose:
- The composition concept and what it encodes about the project
- The key visual elements and where they appear
- Rough placement (left/center/right, foreground/background)
- Whether it calls for a live component or could be a static asset

Always include one **typography-only fallback direction** as the safe baseline. Escalate
to diagram-based directions where the project has strong technical structure worth visualizing.

**Do not write any code or produce any asset before the user selects a direction.**

### Gate 2 — Base composition (approval required before annotations)

Build and get the base composition approved as a standalone diagram before touching
annotations. The base must work on its own — readable at thumbnail scale, technically
grounded, no annotations.

**Accent discipline — one focal anchor, no exceptions:**

Accent marks the single focal anchor of the composition — the one element that carries the
project's central tension. Every other element is neutral structure (`--on-surface`,
`--outline-variant`).

- The anchor may be a single element OR a **coherent subject that reads as one thing** — e.g. a
  masked-input image whose scattered visible patches are accent *as a unit*. The unit is one focal
  subject, not many competing marks.
- A highlighted cluster of *unrelated/competing* nodes is a failure — if the accent reads as several
  marks fighting for attention, pick one or collapse it to a single representative.
- Competing focal structures (two separate accent subjects that both "want" attention) are a failure
- If you are uncertain which element/subject to accent, that is a signal the composition needs
  simplification, not more accent
- When in doubt: remove accent from all candidates, read the composition, then apply it to exactly one
- Confirm with the user *which* element is THE focal subject when a direction is approved, and flag it
  if the build ends up deviating from that choice

This applies to the base composition only. Annotations (Gate 3) may freely use `--accent`
for text and arrow strokes — those are additive overlays, not structural elements.

**Live component** when any of these apply:
- Composition requires CSS custom property colors for dark/light adaptation
- Handwritten Caveat annotations will be added
- The visual would look wrong frozen to one theme

**Static asset** when the composition is theme-independent and requires no annotations.

Live component requirements (see `references/cover-standards.md` for full spec):
- All colors via CSS custom properties — no hardcoded hex
- Fixed `viewBox="0 0 1200 675"`
- `aria-hidden` on wrapper and SVG
- Register by slug in `src/components/project/covers/index.ts`

### Gate 3 — Annotations (separate approval step, optional)

Only after the base composition is approved. Read the MDX to find what is genuinely
project-specific: real budget or query numbers, headline metrics, algorithm names,
distinctive architectural decisions. Propose 2–4 annotation directions with specific
content options.

Build only after the user selects a direction. Keep to 2–3 annotations targeting
distinct diagram elements. Cut anything that could belong to any project in the same
domain.

Annotation construction rules in `references/cover-standards.md`.

## Output

- **Live component:** `src/components/project/covers/<slug>.tsx` + registered in index
- **Static asset:** `/public/projects/<slug>/hero-cover.webp` (or `.png`)

After Gate 3 (or Gate 2 if no annotations): run the final visual review — a separate-agent
"fresh eyes" pass (see `references/cover-procedure.md` → Visual review). Update `heroImage` /
`heroAlt` in the MDX last — omit `heroImage` if using a live component (the cover registry
handles rendering).

Stop here — hand off for user approval. Do not run the project-review reviewers (Stage 4) or
generate other assets.

## Validation — check before handing off

- Gate sequence followed: directions → base approval → annotations (if any)
- No hardcoded hex colors in live SVG component
- `viewBox="0 0 1200 675"` on the SVG element
- `aria-hidden` present on wrapper and SVG
- Slug registered in `src/components/project/covers/index.ts`
- Composition encodes the project's specific technical idea — not generic ML aesthetics
- Thumbnail readable at card scale (≈320×180px crop)
