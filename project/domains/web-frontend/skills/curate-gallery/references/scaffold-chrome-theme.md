# Scaffold kit — chrome frame and theme media

The wrappers that stage a demo: `ChromeFrame` for fixed page chrome, and `ThemeShot`/`ThemeVideo` for
anything that must be shown in both themes at once. Catalog primitives → `scaffold-kit.md` and
`scaffold-specimen.md`; technique selection → `hard-to-demo.md`.

**Token names below are examples from one project — the structure is what is fixed.** Stated in full
in `scaffold-kit.md`; it applies to every `scaffold-*.md` file.

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

When to use static media vs live render → `demo-placement-and-media.md` → Live vs. screenshot.
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

CSS mechanism (gallery.css — not globals.css; that file's contents → page-and-css.md):
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
