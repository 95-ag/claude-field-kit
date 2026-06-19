# Cover Procedure

Three-gate operating guide for building a portfolio project hero cover. Authoritative reference for the project-cover-generation skill.

---

## Gate 1 — Direction Proposals

Generate cover directions from the project's technical content before building anything.

### Source extraction

Read the approved MDX (and PDF if available) to identify:
- The core algorithmic contribution or technical tension
- Data flows, pipelines, model behavior
- Key experimental findings that could be visualized
- Domain-specific structures worth showing

The cover must encode real project structure. If the composition could belong to
any ML project in the domain, it belongs to none.

### What a direction proposal includes

For each of the 3–4 proposed directions, write:
1. **Concept** — what the cover communicates and why it is specific to this project
2. **Key elements** — what visual elements appear (nodes, flows, data, curves, etc.)
3. **Placement** — rough spatial layout: what is left/center/right, foreground/background
4. **Rendering mode** — whether this calls for a live SVG component or a static asset
5. **What it encodes** — the test: can someone identify the project's central tension from
   this cover alone?
6. **ASCII skeleton** — a rough text sketch of the layout (key structures, focal element,
   reading direction). It surfaces placement problems cheaply,
   before any code is written, where prose alone would hide them. Carry the same skeleton
   forward into Gate 2 when building the base.

### Always include a typography-only fallback

Include one direction that relies entirely on typography — project name, key metric,
brief descriptor. This is the safe baseline that always works. Escalate to diagram-based
directions only when the project has strong technical structure worth visualizing.

### Do not build before a direction is selected

Write no code. Produce no assets. Wait for the user to select a direction — or ask for
modifications — before proceeding to Gate 2.

---

## Gate 2 — Base Composition

Build and get the base approved as a standalone diagram before touching annotations.

### Base must stand alone

The base composition must be readable and technically legible without any annotations.
It should work at thumbnail scale (card crop ≈320×180px). If the base looks acceptable
only with annotations to explain it, the composition is wrong — fix the base first.

### Accent discipline

Accent color is permitted on **one single focal highlight element** in the base —
one standout node, one data point, one structural element that carries the key tension.
Do not spread accent across multiple structural elements.

All structural elements use `--on-surface` (or `--outline-variant` for borders).
Accent is reserved for the single focal element and all annotation content.

### Rendering mode decision

**Use a live React SVG component when:**
- The composition requires CSS custom property colors (dark/light theme adaptation)
- Handwritten Caveat annotations will be added later
- The composition would look wrong or unreadable frozen to one theme

**Use a static asset when:**
- The composition is theme-independent (e.g., a photograph, a raster crop)
- No annotations planned
- No CSS custom property colors needed

In practice, any diagram-based cover almost always needs a live component.

### Live component requirements

See `references/cover-standards.md` for the full spec. Summary:
- All colors: CSS custom properties only — no hex, no RGBA literals
- `viewBox="0 0 1200 675"` (fixed — do not change)
- `aria-hidden="true"` on both the wrapper div and the `<svg>` element
- File: `src/components/project/covers/<slug>.tsx`
- Registered by slug in `src/components/project/covers/index.ts`

### Get explicit approval before proceeding to Gate 3

Present the live component or static asset. Wait for the user to approve the base
before writing any annotation code.

---

## Gate 3 — Annotations (optional, separate approval)

Only start after the base is explicitly approved.

### Source for annotation content

Read the MDX to identify what is genuinely project-specific:
- Real budget or query numbers from the experiments
- Headline accuracy or fidelity metrics (exact, not rounded)
- Algorithm names and techniques that are distinctive to this project
- Architectural decisions or constraints that shaped the system

Good annotation content: "25k queries", "82.88% extraction accuracy", "entropy-ranked
coreset". Bad annotation content: "ResNet-50", "CIFAR-10" — these are domain context,
not distinctive to the project's contribution.

### Propose directions before building

Offer 2–4 annotation directions with specific content options. The user selects one.

### Annotation count and placement

Keep to 2–3 annotations maximum. Each must target a **distinct** diagram element.
Do not cluster multiple annotations at the same region. If an annotation could belong
to any project in the same domain, cut it. Balance them around the composition (e.g. one
above, one below) rather than stacking them on one side.

### Annotation direction

Default to the **notebook gesture**: the arrow runs from the figure to the note, with the
arrowHEAD at the handwritten text — observations jotted around an inspected figure, not
textbook callouts. See `references/cover-standards.md` → Engineering Annotations → Direction.

### Annotation construction rules

See `references/cover-standards.md` → Engineering Annotations for exact construction rules
(direction, attachment, fixed gaps, curves, the tangent-aligned arrowhead recipe). If the
build deviates from the approved direction or focal choice, flag it at the gate — don't change
it silently.

---

## Visual verification

Use this throughout building and at each gate to confirm what the cover actually renders.

**Playwright-CLI is the preferred path.** Navigate to the page, set `data-theme` to light and
to dark, locate the cover by selector (`svg[viewBox="0 0 1200 675"]`), screenshot *that element*
per theme, and inspect the PNGs. Capture the cover by selector, not the whole viewport.

For annotation placement (notebook-gesture default), verify both ends programmatically from the
live DOM rather than eyeballing: the arrowHEAD tip sits the fixed gap (≈8px) off the **note text**
(measure the text `getBBox`), and the plain tail sits the same gap off the **target element**
(recompute its coordinates — `getBBox`, circle `cx`/`cy`). Confirm the head is at the note and the
tail at the figure, not reversed.

**If Playwright-CLI or browser rendering is unavailable, stop and ask the user how to proceed
before using any alternative.** Do not substitute pixel analysis or HTML inspection for a
rendered-page check (see `lessons.md` → Visual verification).

## Visual review (final gate, after the last gate)

Before handing off, run a **separate-agent "fresh eyes" review** — not a self-check. Dispatch a
review subagent that views the rendered cover cold and judges the *outcome*, not construction
details. It assesses:
- thumbnail readability at card scale (≈320×180px card crop);
- immediate visual hierarchy — what the eye lands on first;
- whether the core project idea is understandable when viewed cold;
- overall compositional coherence in both light and dark themes.

If readability or coherence is broken, fix the composition — do not add a workaround.

---

## Sequence summary

```
Read MDX/PDF → propose 3–4 directions (with typography fallback) → [gate: direction approval]
→ build base composition → [gate: base approval]
→ (optional) propose annotation directions → build annotations → [gate: annotation approval]
→ visual review (separate-agent fresh eyes) → update MDX heroImage/heroAlt if static → hand off
```
