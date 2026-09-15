# Scaffold Kit — Pseudocode Templates

Four generic files in `<gallery-root>/scaffold-kit/`. No `index.ts`. Zero project-specific
data — all token bindings and structural rules apply to any project that uses this system.
Stack mechanics (portal implementation, static-image import type, theme-hook name, motion
hook name) → `stack-adapters.md`.

**Token names in this file are examples from one project.** The pseudocode below uses
concrete token names (`mono-anchor`, `body-primary`, `heading-component`, `--spacing-*`,
`--radius-*`, etc.) — these are one project's design-system tokens shown as an
example. A consuming project substitutes its own equivalent tokens for each role; the
**structure** (DOM layout, element order, class roles) is what is fixed and must be reproduced
faithfully. Token names adapt to the project.

Cross-links: `architecture.md` (file/folder pinning), `hard-to-demo.md` (live-vs-screenshot,
click-guard usage), `section-spine.md` (which catalog primitives each spine section uses).

---

## `catalog` — `GallerySection · SpecimenGroup · Specimen · Card`

### `GallerySection`

```
props:
  id:       string       // namespaced section id; rendered as "ds-{id}"
  title:    string       // rendered as h2; the rail scrapes this text for the TOC label
  intro:    string       // body-primary paragraph; appears after the mapsTo eyebrow
  mapsTo:   string       // full DESIGN.md path, e.g. "Foundations → Colors"
  source?:  string       // optional source path/selector; shown below mapsTo when present
  children: node

structure:
  <section id="ds-{id}"
           class="flex scroll-mt-[--spacing-4xl] flex-col gap-[--spacing-2xl]">

    <div class="flex flex-col gap-[--spacing-md]">

      // h2 in a scoped prose wrapper — the prose rule sets heading typographic tokens;
      // [&_h2]:mb-0 removes the prose bottom-margin so the flex gap controls rhythm instead.
      // The rail (SectionProgressNav) assigns its own text-derived id to this h2;
      // the section's ds-{id} and the rail's h2 id are DIFFERENT — two ids per section.
      <div class="prose-content [&_h2]:mb-0">
        <h2>{title}</h2>
      </div>

      <span class="mono-anchor">→ DESIGN.md → {mapsTo}</span>
      {source && <span class="mono-code">{source}</span>}
      <div class="body-primary">{intro}</div>

    </div>

    <div class="flex flex-col gap-[--spacing-2xl]">
      {children}
    </div>

  </section>

token bindings:
  --spacing-4xl   scroll-mt (keeps section header below sticky chrome after anchor jump)
  --spacing-2xl   section-level gap between header block and children; also children gap
  --spacing-md    tight gap within the header block (mapsTo / source / intro stack)
  mono-anchor     mapsTo eyebrow and spec text
  mono-code       source path
  body-primary    intro paragraph

law: id MUST be "ds-{id}" — never bare "{id}". Bare ids from the rail and the section's
     ds-prefixed id must never collide. Two ids coexist on every section (one on <section>,
     one on the rail-assigned <h2>).

single-specimen fold: when a section has exactly one specimen, omit the inner Specimen
  wrapper. Render the visualizer directly as GallerySection's child and use the section's
  own source prop for the path. This avoids a redundant heading level.
```

---

### `SpecimenGroup`

```
props:
  title:    string   // h3 group eyebrow; mirrors a DESIGN.md "####" sub-group heading
  children: node     // Specimen nodes at headingLevel=4

structure:
  <div class="flex flex-col gap-[--spacing-xl]">
    <h3 class="mono-anchor">{title}</h3>
    <div class="flex flex-col gap-[--spacing-2xl]">
      {children}
    </div>
  </div>

token bindings:
  --spacing-xl    outer gap (h3 eyebrow to first specimen)
  --spacing-2xl   children gap (between specimens inside the group)
  mono-anchor     h3 eyebrow

usage: wrap Specimens in a SpecimenGroup when a GallerySection has named sub-groups
  (e.g. Components · UI has "Controls / Actions", "Links", "Display").
  Specimens inside a group use headingLevel=4.
  Flat sections render Specimens directly at headingLevel=3 (the default).
```

---

### `Specimen`

```
props:
  id:            string      // scroll-target id on the wrapper div (no ds- prefix)
  name:          string      // heading text; rendered at h3 or h4
  source?:       string      // import/file path shown in mono-code below the heading
  description?:  string      // body-primary caption shown below source, before children
  spec?:         string | string[]
                             // mono-anchor note shown BELOW children (token list, variant notes)
                             // string   → one block, as prose
                             // string[] → a list inside the SAME block, one concept per entry
  headingLevel:  3 | 4 = 3  // 3 at section level; 4 when inside a SpecimenGroup
  children:      node        // the demo (live render, ChromeFrame, ThemeShot, etc.)

structure:
  <div id={id}
       class="flex scroll-mt-[--spacing-4xl] flex-col gap-[--spacing-md]">

    // heading-component is the project's component-label type token
    <h3|h4 class="heading-component">{name}</h3|h4>

    {source      && <span class="mono-code">{source}</span>}
    {description && <span class="body-primary">{description}</span>}

    {children}

    {spec && <div class="mono-anchor">
               {isArray(spec) ? <ul>{spec.map(s => <li>{s}</li>)}</ul> : spec}
             </div>}

  </div>

field order (top to bottom): heading → source → description → children → spec
spec is ALWAYS last — it annotates the demo that precedes it.

**Prefer the array for anything multi-part.** The house convention is bullets, one concept per line,
and a spec is where it matters most — a multi-clause spec written as one string renders as a wall of
prose under the demo it is meant to annotate, and readers skip it. The string form stays for a genuinely
single-clause spec. Both forms share the same `mono-anchor` block, so the token binding and the field
order do not change either way.

`note`-shaped fields elsewhere in the kit (`SwatchGrid` and friends) already take a node and can hold a
list as-is — they need no widening.

**Full width by default:** the children container **stretches** (`align-items: stretch`) — each demo fills
the column, correct for the majority (cards, tables, chrome, diagrams, layer stacks, def-lists). The only
opt-out is a **bare single control** that must stay at intrinsic width (a lone button, tag, chip, copy-link,
code chip, or icon): wrap it in a `w-fit` (or a `flex` row) so the wrapper stretches while the control sits
natural + left-aligned. Multi-variant demos already sit in a `flex`/`grid` and need nothing. **Do NOT put
`items-start` on the Specimen** — that inverts the default and forces a `w-full` opt-in on every wide demo
(the common case), which is the error-prone direction. The opt-out list (single controls) is short; the
opt-in list (all wide demos) is not.

token bindings:
  --spacing-4xl    scroll-mt
  --spacing-md     gap between all fields
  heading-component h3/h4 type token (component label scale)
  mono-code        source path
  body-primary     description
  mono-anchor      spec note

headingLevel rule: every Specimen heading is exactly one level below its parent context.
  GallerySection context → h3. SpecimenGroup context → h4.
  Never skip levels.
```

---

### `Card`

```
props:
  label?:    string   // mono-code label below the box; typically a token name or slug
  className? string   // additional classes merged into the inner box (e.g. "aspect-video p-0")
  children:  node     // the demo content centered inside

structure:
  <div class="flex flex-col gap-[--spacing-xs]">

    <div class="flex min-h-[--spacing-3xl] items-center justify-center
                border border-[--hairline] bg-[--surface-deep]
                p-[--spacing-lg] {className}">
      {children}
    </div>

    {label && <span class="mono-code">{label}</span>}

  </div>

token bindings:
  --spacing-xs    outer gap (box to label)
  --spacing-3xl   min-h of the inner box
  --hairline      border
  --surface-deep  background fill
  --spacing-lg    internal padding
  mono-code       label text

law: Card adopts the project's existing card treatment exactly.
  border = --hairline, fill = --surface-deep, radius = per project (e.g. none).
  Never introduce new elevation, shadows, or radius values.

cover-grid usage: cover component specimens use className="aspect-video p-0" to give the
  cover a cinematic stage. The inner box becomes a relative positioned container with
  overflow-hidden and a nested absolute-fill child.
```

---

## `chrome-frame` — `ChromeFrame`

```
props:
  height?:    number   // px; sets explicit height on the frame (required for position:fixed children)
  width?:     number   // px; caps the frame narrower than the column; OMIT → fills the column (see width rule)
  className?: string
  ariaHidden? boolean  // true when the framed component duplicates a live landmark on the page
  children:   node

structure:
  <div aria-hidden={ariaHidden}
       class="relative overflow-hidden border border-[--hairline] bg-[--surface] {className}"
       style="transform: translateZ(0); height: {height}px; width: {width}px; max-width: 100%">
    {children}
  </div>

token bindings:
  --hairline    border
  --surface     background fill

CRITICAL — containing-block mechanism:
  transform: translateZ(0) creates a new CSS containing block.
  position:fixed children resolve TO THE FRAME, not the viewport.
  This is the entire mechanism that makes chrome demos possible.
  Without it, a fixed nav or FAB positions relative to the viewport and escapes the frame.

height rule: `height` is OPTIONAL.
  - Pass it (in px) when the frame must bound a `position:fixed` child (nav, rail, FAB,
    scroll-to-top). The frame's explicit height gives the fixed child a capped stage.
  - OMIT it for flow/auto-height content (e.g. Footer). When `height` is absent the frame
    sizes to its content naturally — passing `undefined` or leaving the prop out are both correct.

  Signature (React example): `height?: number` — the prop is typed optional; when omitted the
  `style` object carries no `height` key, yielding auto-height behavior.

  Stack adapter note: how `height` is applied (inline style object vs attribute string) → stack-adapters.md.

width rule: `width` is OPTIONAL.
  - OMITTED → the frame fills its column. The `Specimen` children container stretches
    (`align-items: stretch`), so a width-less frame — a normal block — fills the full column width. This is
    the default for every Shell specimen (none pass a width). The frame's `position:fixed` children are out
    of flow and don't set its width; the stretch does.
  - Pass an explicit px width only to cap the frame narrower than the column.
  - `max-width: 100%` stays so an explicit px width never overflows a narrow column.

ariaHidden rule: set true when the demo duplicates a component that already exists as a
  live accessible landmark on the page (nav, footer, scroll-to-top, section-progress rail).
  The live component is the accessible version; the demo is decoration for sighted users.

never mount inside ChromeFrame:
  - full-viewport WebGL canvases (size to viewport, not frame; can hang on software renderers)
  - document-height canvas/ASCII fields (same issue, plus thousands of DOM nodes)
  Use ThemeShot or ThemeVideo for these layers instead.
```

---

## `click-guards` — `DemoViewOnly · InertDemo`

Both guards install **capture-phase** event listeners. Capture phase fires before bubbling —
the router or component handler never sees the event.

Shared tooltip behavior: both guards show a suppression tooltip at the pointer position for
1600ms when they cancel a click. The tooltip is **portaled to `<body>`** — not rendered inside
the guard wrapper — so a ChromeFrame's transform containing block cannot clip it. Stack
portal mechanism → `stack-adapters.md`.

```
SUPPRESSED_MESSAGE = "Interactions are disabled in the design-system preview."

SuppressionTip (internal, not exported):
  portaled to <body>
  position: fixed; left: pointer.x + 12px; top: pointer.y + 12px
  role="status"
  classes: body-caption pointer-events-none fixed
           z-[--z-mobile-menu-panel]
           max-w-[240px]
           rounded-[--radius-sm]
           border border-[--hairline]
           bg-[--surface-elevated]
           px-[--spacing-sm] py-[--spacing-xs]

token bindings for SuppressionTip:
  --z-mobile-menu-panel   z-index (floats above all chrome including panels)
  --radius-sm             corner radius
  --hairline              border
  --surface-elevated      background fill
  --spacing-sm            horizontal padding
  --spacing-xs            vertical padding
  body-caption            text token
```

### `DemoViewOnly`

```
props:
  className?: string
  children:   node

structure:
  // renders as <article> — the rail (SectionProgressNav) scrapes h2s from this element
  <article class={className}
           onClickCapture={handler}>
    {children}
    <SuppressionTip />
  </article>

handler (capture phase, anchor-only):
  if event.target.closest("a[href]"):
    event.preventDefault()
    event.stopPropagation()    // prevents InertDemo (if nested) from also firing its tip
    show tip at (event.clientX, event.clientY)

scope: wraps the entire gallery content area — one DemoViewOnly per gallery page,
  not one per specimen.

what it blocks: anchor navigation only.
what remains live:
  - button clicks (copy, theme toggle, submit) — InertDemo handles those per-specimen
  - hover / focus-visible styles — interaction states remain demonstrable
  - pointer cursor changes

law: DemoViewOnly MUST render as <article>. The live SectionProgressNav (mounted above
  the header, outside this element) scrapes h2 elements inside the page's <article> to
  build the TOC. If this renders as a <div>, the rail finds no sections.
```

### `InertDemo`

```
props:
  className?: string
  children:   node

structure:
  <div class={className}
       onClickCapture={handler}>
    {children}
    <SuppressionTip />
  </div>

handler (capture phase, all clicks):
  event.stopPropagation()    // prevents the outer DemoViewOnly from also showing a tip
  event.preventDefault()
  show tip at (event.clientX, event.clientY)

scope: per-specimen; wraps individual chrome components that contain button-based
  interactions (theme toggles, scroll-to-top buttons, close/open controls).

nesting rule: InertDemo is always INSIDE DemoViewOnly, never outside.
  stopPropagation prevents the anchor guard from showing a second tip on the same click.

what it blocks: all click events (buttons, anchors, anything).
what remains live: hover, focus-visible, pointer cursor.

when to use InertDemo vs nothing:
  use InertDemo   → component has buttons that would fire state changes (theme toggle,
                    scroll-to-top, form submit)
  skip InertDemo  → component's interactive elements are intentionally kept live
                    (CopyLink, CopyableCode — copy behavior works in the gallery)
```

### Nesting pattern

```
<DemoViewOnly class="flex flex-col gap-[--spacing-4xl]">

  // anchor-only guard covers all sections
  <FoundationsSections />
  <BackgroundSection />

  // per-specimen button guard where needed:
  <Specimen name="Theme Selector" ...>
    <InertDemo>
      <InlineThemeSelector />
    </InertDemo>
  </Specimen>

  // intentionally live — no InertDemo:
  <Specimen name="CopyLink" ...>
    <CopyLink value="hello@example.com" />
  </Specimen>

</DemoViewOnly>
```

---

## `theme-media` — `ThemeShot · ThemeVideo`

Both components are **client components** — they read the active theme at runtime.
Stack theme-hook → `stack-adapters.md`.

Both render inside the same frame wrapper:
```
FRAME class = "w-fit max-w-full overflow-hidden rounded-[--radius-md]
               border border-[--hairline] bg-[--surface-deep]"

token bindings for FRAME:
  --radius-md      corner radius
  --hairline       border
  --surface-deep   background (visible while image/video loads)
```

When to use static media vs live render → `hard-to-demo.md` → Live-vs-screenshot.
Short rule: live by default; static only when live is technically infeasible (full-viewport
WebGL, document-height DOM fields).

---

### `ThemeShot`

```
props:
  light:  StaticImageData | string   // static import (carries intrinsic size) OR a public path string
  dark:   StaticImageData | string
  alt:    string
  width?, height?: number            // REQUIRED when light/dark is a string — a bare path gives
                                     // next/image no intrinsic size; static imports don't need it.
                                     // (String src is the common case for dev-only /public captures.)

structure:
  <div class={FRAME}>
    <Image src={light} alt="{alt} (light theme)" class="ds-shot-light h-auto max-w-full" />
    <Image src={dark}  alt="{alt} (dark theme)"  class="ds-shot-dark  h-auto max-w-full" />
  </div>

CSS mechanism (gallery.css — not globals.css):
  [data-theme="dark"]  .ds-shot-light { display: none }
  [data-theme="light"] .ds-shot-dark  { display: none }

Both images are always in the DOM. The active theme's image is shown; the inactive one
is hidden via CSS. Theme switching requires no JS — the data-theme attribute change
propagates through CSS. No hydration gap.

StaticImageData import: stack-specific (Next.js `import img from "./file.png"` →
  StaticImageData; static-HTML uses a plain string path). → stack-adapters.md.

use case: elements that cannot render live in the gallery:
  - full-viewport canvas/WebGL (AsciiField, particle systems)
  - document-height DOM fields
Capture both themes at the same viewport size. Alt text describes the subject, not the
theme — the theme suffix "(light theme)" / "(dark theme)" is appended automatically.
```

---

### `ThemeVideo`

```
props:
  lightVideo:  string           // public path, e.g. "/design-system/meteor-light.mp4"
  darkVideo:   string
  lightPoster: StaticImageData | string  // still frame; shown pre-hydration + under reduced-motion
  darkPoster:  StaticImageData | string  // (string posters need dims on the fallback <Image>, as ThemeShot)
  alt:         string

client behavior:
  reads: resolvedTheme (light | dark) from theme hook
  reads: prefersReducedMotion from motion hook
  reads: mounted state (boolean; starts false, set true on mount)

  // Pre-mount (SSR + first client paint) resolvedTheme is undefined — pin isLight to a DETERMINISTIC
  // default (light) until mounted so server and first-render client markup match. Reading the real theme
  // before mount is a hydration mismatch: the server resolves it one way (dark) and the client another.
  isLight  = !mounted || resolvedTheme === "light"
  poster   = isLight ? lightPoster : darkPoster
  videoSrc = isLight ? lightVideo  : darkVideo

pre-hydration OR reduced-motion state:
  <div class={FRAME}>
    <Image src={poster} alt={alt} class="h-auto max-w-full" />
  </div>

post-hydration AND motion allowed state:
  <div class={FRAME}>
    // key={videoSrc} forces a remount on theme switch so the new clip loads and autoplays.
    // Without key, React reuses the <video> element and the src change does not trigger autoplay.
    <video key={videoSrc}
           src={videoSrc}
           poster={poster.src}
           autoPlay muted loop playsInline
           preload="metadata"
           aria-label={alt}
           class="block h-auto max-w-full" />
  </div>

CRITICAL — load only the active theme's clip:
  Only one src is active at a time. The inactive theme's URL is never assigned to a
  src attribute, so the browser makes no request for it.
  key={videoSrc} achieves this: on theme switch, the old element unmounts (drops the
  old src) and a new element mounts with the new src. No stale request.

reduced-motion: reduced-motion state uses the poster Image, not the video.
  This satisfies prefers-reduced-motion without a separate code path.

use case: continuous ambient effects that are technically renderable in a bounded frame
  but would drain performance or hang on software GPU (WebGL particle systems, canvas
  animations). A short looping clip shows the effect credibly at minimal cost.

encoding guidance: find a dense, visually interesting segment via ffmpeg contact-sheet
  thumbnails. Sparse content compresses very small (often ~25 KB per clip).
  Both clips should cover the same moment in the effect so a theme switch cuts cleanly.
```
