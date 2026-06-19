# Cover Standards

Rendering modes, CSS conventions, annotation construction rules, composition
principles, and anti-patterns. Authoritative reference for the project-cover-generation skill.

---

## Rendering Modes

### Live React SVG component (preferred for diagram-based covers)

Use when: the composition requires theme-adaptive colors, or Caveat annotations
will be added, or freezing to one theme would break readability.

**File location:** `src/components/project/covers/<slug>.tsx`

**Registration:** Add to `src/components/project/covers/index.ts`:
```ts
import ModelExtractionAttacksCover from './model-extraction-attacks'
// ...
export const coverComponents: Record<string, ComponentType> = {
  'model-extraction-attacks': ModelExtractionAttacksCover,
  '<slug>': <SlugCover>,
}
```

**SVG requirements:**
```tsx
<div aria-hidden="true" className="...">
  <svg
    viewBox="0 0 1200 675"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* composition */}
  </svg>
</div>
```

- `viewBox="0 0 1200 675"` — fixed, never change
- `aria-hidden="true"` on both the wrapper `<div>` and the `<svg>` — covers are decorative
- No `width`/`height` attributes on the `<svg>` — sizing is handled by the wrapper

### Static asset

Use when: the composition is theme-independent (photograph, raster crop) and no
annotations are needed.

**File location:** `/public/projects/<slug>/hero-cover.webp` (prefer WebP; PNG if
transparency is required).

Update `heroImage` in the MDX frontmatter:
```yaml
heroImage: "/projects/<slug>/hero-cover.webp"
```

Omit `heroImage` when using a live component — the cover registry handles rendering.

---

## Color Rules (live SVG components)

**All colors must be CSS custom properties.** No hardcoded hex, rgb(), or rgba() values.

| Use | Token |
|---|---|
| Structural elements (nodes, connectors, text) | `var(--on-surface)` |
| Borders, edges | `var(--outline-variant)` |
| Surface backgrounds | `var(--surface)`, `var(--surface-container)` |
| Single focal highlight element (one only) | `var(--accent)` |
| Annotation text and arrow strokes | `var(--accent)` |

**Accent discipline:** One structural element in the base composition may use
`var(--accent)` as a focal highlight. All other structural elements use `--on-surface`
or `--outline-variant`. Annotations may freely use `--accent` for text and arrows.

**Graded neutrals (technique, not a mandate):** when a composition needs neutral shades
that *recede* in both themes (lighter-in-light, darker-in-dark), deriving a step from a
theme-flipping token with `color-mix` keeps every value theme-aware without hardcoding —
e.g. `color-mix(in srgb, var(--outline-variant) 65%, var(--surface))`. This is the same
approach `globals.css` already uses for `--outline-hair`, and it preserves the
all-custom-properties rule. Reach for it only when a graded neutral is actually needed.

**Faint fills must stay distinct from the page surface in BOTH themes.** A "receding" fill that
matches the hero/card background disappears — e.g. `--surface-sunken` can collapse into the page
surface, making faint cells vanish. Derive the faint step by mixing toward the *figure* ink
(`color-mix(in srgb, var(--on-surface) N%, var(--surface))`, small `N`) so it reads as present-but-
quiet in both light and dark, and confirm against the rendered cover, not just the markup.

---

## Composition Principles

### Focal structure

- Single dominant focal area — not a split composition with disconnected halves
- Asymmetric balance; preserved whitespace
- Left-to-right narrative flow for pipeline/process diagrams — terminal element far right
- Readable thumbnail silhouette — test the 320×180px card crop before finalizing

### Structural labels

- **Label all peer structural elements, or none** — labeling some (e.g. the two middle blocks) but
  not their peers (e.g. the input/output) reads as incomplete. The cover must be legible standalone,
  without the page caption.
- Structural labels are a separate layer from engineering annotations: neutral mono labels
  (`--on-surface`, JetBrains Mono) name the parts; Caveat/accent annotations carry the
  project-specific verdicts. Keep the real numbers for the annotation layer so the two don't compete.

### Shape vocabulary

Prefer the **recognizable domain icon over a paper-faithful but generic shape** — a cover is read at
a glance and at thumbnail scale, so instant recognition beats diagram precision. E.g. an autoencoder
reads instantly as a trapezoid *funnel* (encoder narrows, decoder widens), where stacked-rectangle
transformer blocks would read as anonymous boxes when small. Note the precision tradeoff to the user
when the iconic shape simplifies the real architecture.

### Safe zones

Keep important visual content away from extreme edges. Cards crop covers. Critical
elements near edges will be cut off in card layouts.

### Technical grounding

The cover encodes real project structure. Sources for cover concepts:
- Architecture diagrams and pipelines
- Data flows and model behavior
- Key experimental structure or findings
- Domain-specific structures (lane geometries, attention maps, etc.)

Not: generic neural network graphics, random particle systems, decorative circuitry.

**Test:** Can someone identify the project's central technical tension from the cover alone?
If no, the concept is wrong.

### Procedural and sampled marks

General craft for any cover built from computed or sampled elements, scene or not.

- **Discrete steps over a continuous ramp.** Encode gradation or motion as a few discrete
  graded steps rather than an opacity ramp — discrete steps read more crisply, especially at
  thumbnail scale. Where motion has a direction, place trailing echoes on the side the element
  moved *from* so the direction is unambiguous.
- **Uniform sampled marks read as a data sequence.** Points sampled along a path read as a
  deliberate sequence when uniform in size and spacing; perspective-scaling them reads as scatter.
- **Procedural placement must be deterministic.** Any computed placement or jitter must be
  deterministic (e.g. `Math.sin(i * k)`) — `Math.random` is unavailable at build time, since
  covers are statically generated.

### Depicting a physical or spatial scene (conditional)

When a project's concept *is* a real-world scene — a road, a field, a 3D volume — these
techniques can help. They are guidance for that case, not requirements for every cover.

- **Tonal value over hue for regions.** Separate scene regions (e.g. sky, mid-ground,
  foreground) by tonal *value* using neutral surface tokens, and let a *narrowing shape* carry
  perspective — usually more effective than outline strokes. Borders can be dropped once fill
  contrast alone defines the edge.
- **Faithful geometry, strong composition.** When drawing on a real source layout, preserve its
  essential shape and proportion while still achieving a strong composition. A literal source can
  clash with composition principles (e.g. a symmetric source versus the symmetry anti-pattern
  below); asymmetry is one possible resolution, not a fixed rule.

---

## Engineering Annotations

Annotations are second-pass additions after base composition approval. Build only
when explicitly approved.

### Content rules

Source annotation content from what is genuinely project-specific:
- Real numbers: "25k queries", "82.88%", "38ms/frame"
- Algorithm names specific to this project: "entropy-ranked coreset", "Double DQN refinement"
- Distinctive architectural decisions

Reject annotation content that could belong to any project in the domain:
- "ResNet-50", "PyTorch", "CIFAR-10" — these are context, not contribution
- Generic phase labels: "Training", "Inference"

**Phrasing:** prefer a short plain-language verdict alongside the number over a bare symbol —
e.g. "misses the latency budget by 2×" reads better at thumbnail scale than "38ms > 19ms". The
plain-language verdict carries the meaning where a terse inequality does not, especially for a
negative or comparative result. Lean slightly fuller over terse: a metric reads better with the
verdict or the thing it measures attached (illustratively, "0.91 IoU — beats baseline" or
"2.3× faster decode") than as a bare token ("0.91").

**Anchor each metric to the element that produces it.** Map a number to the element it is literally
computed on or from — e.g. a linear-probe accuracy is measured on the frozen *encoder*, so it points
at the encoder, not a downstream output. This is a credibility detail readers notice.

### Direction — point AT the note (notebook gesture)

**Default: the arrow runs FROM the figure TO the handwritten note** — the plain tail sits at the
diagram element, the arrowHEAD sits at the text. This reads as observations *jotted around an
inspected figure*, which is the authentic engineering-notebook feel a Caveat annotation is going for.
Pointing the head *at the object* (textbook-callout direction) is the less authentic choice; use it
only with a deliberate reason.

### Construction rules

```
Font:   Caveat (var(--font-caveat)) — the only permitted font in annotations
Color:  var(--accent) for both text and arrow strokes — no other color
Count:  2–3 annotations maximum; each targets a distinct diagram element
```

**Placement & attachment:**
- Place the note in open negative space, not over structure.
- Attach the leader at the **text block's edge facing the figure, at that edge's mid-height** (e.g.
  the left-middle when the figure is to the left) — reads as one leader, not anchored to a stray glyph.
- **Fixed, equal gap at both ends.** Use one gap value (≈8px is a good default) between the figure
  and the tail AND between the arrowhead tip and the text — symmetric. This is separate from the
  internal path↔arrowhead gap below. Measure the text's bounding box in the rendered DOM (`getBBox`)
  to place the text-end gap precisely rather than eyeballing.
- Balance multiple notes around the composition (e.g. one above, one below) rather than clustering them.

**Arrow geometry:**
- **Curves, not straight lines** — a bowed Bézier gives the hand-drawn feel. Convexity is a
  deliberate, adjustable choice; complementary convexity across notes (one arches, one sags) reads as
  organic and balanced.
- Bezier path ends **7–9px before the arrowhead tip** — the path and arrowhead must not share a point.
- Arrowhead: two independent `<line>` elements branching from the tip point.
- **Keep the arrowhead tangent-aligned** or it looks detached. Recipe (with the head at the note);
  note `headGap` here is the *internal* path↔arrowhead gap (the 7–9px above), distinct from the
  external ≈8px text/figure gaps:
  pick the final tangent unit vector `u` (the direction the line travels into the tip); set
  `tip` at the fixed external gap from the text; `path-end E = tip − headGap·u`; lock the Bézier's end
  tangent with the last control `P2 = E − k·u` (e.g. `k≈30`); draw barbs to `tip + L·rotate(−u, ±θ)`
  (e.g. `L≈10`, `θ≈28°`). The same recipe works for either direction — just put `tip` at whichever
  end carries the head.

**Example structure** (head at the note; figure element is to the lower-left of the text):
```tsx
{/* note */}
<text x={520} y={120} textAnchor="middle"
  fontFamily="var(--font-caveat)" fontSize={30} fill="var(--accent)">
  25k queries
</text>

{/* leader: tail at the figure (8px gap), curved, head at the note (8px gap from text) */}
<path d="M 360 200 C 380 170 440 140 470 122"
  stroke="var(--accent)" strokeWidth={1.5} fill="none" strokeLinecap="round" />

{/* arrowhead — two lines from the tip, splayed ±~28° about the final tangent */}
<line x1={476} y1={118} x2={466} y2={120} stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" />
<line x1={476} y1={118} x2={472} y2={129} stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" />
```
*(Coordinates are illustrative — derive real ones from the tangent recipe and the measured text bbox.)*

---

## Metadata Overlays

Optional presentational layers rendered on the cover. Both are driven by frontmatter
fields — omit the overlay entirely when the field is absent or empty.

### Organization / Logo Group

- **Frontmatter field:** `logos[]` — each entry `{src, alt}`
- **Placement:** bottom-left
- **Render when:** `logos` array is non-empty in frontmatter; omit otherwise
- **Spec:** 40×40px circle, white background, `outline-variant` border, `object-contain`
  with 4px inner padding
- **Purpose:** organizations, clients, institutions, companies

### Contributor Avatar Group

- **Frontmatter field:** `contributors[]` — each entry `{name, avatar, url?}`
- **Placement:** bottom-right
- **Render when:** `contributors` array is non-empty in frontmatter; omit otherwise
- **Spec:** 24×24px circular avatars, −6px overlap stack, `outline-variant` border
- **Links:** active on detail page when `url` is present; presentational only in cards
- **Purpose:** contributors, project contacts

### Metadata Density Rules

- Keep metadata visually secondary to project identity — never let it compete with the cover concept
- Maintain safe spacing from the image edges
- Limit logo and avatar counts — a long stack obscures the composition
- Do not place metadata where it will obscure the focal diagram element
- Interactions (links) apply only on the project detail page, not in card thumbnails

---

## Anti-Patterns

**Composition:**
- Generic AI art, fake holograms, random circuitry graphics, meaningless particles
- Dense unreadable labels; over-detailed UML-style diagrams
- Split compositions with disconnected regions and no reading direction
- Overly symmetrical compositions with no focal hierarchy
- Dead horizontal space that breaks reading flow
- Mixed element sizes and label styles within the same diagram

**Color:**
- Hardcoded hex or rgb() values in live SVG components
- Accent spread across multiple structural elements — one focal highlight maximum
- Annotations in any color other than `var(--accent)`

**Annotations:**
- Arrowhead pointing at the object by default — the notebook gesture points the head at the *note*
- Arrowhead barbs not aligned to the path's final tangent — reads as a detached chevron
- Straight (un-curved) leader lines; inconsistent gaps at the two ends
- Attaching the leader at a label corner or stray glyph instead of the text block's facing mid-edge

**Process:**
- Building annotations before the base is approved
- Writing code before a direction is selected
- Silently deviating from the approved direction (e.g. moving the accent to a different element) —
  flag it at the gate instead
- Exporting a theme-adaptive diagram as a static PNG — use a live SVG component
- Omitting `aria-hidden` from wrapper or SVG
- Using any font other than Caveat in annotation text
- Starting path and arrowhead at the same coordinate
