# Scaffold kit — click guards

`DemoViewOnly` and `InertDemo` — the two guards that stop a gallery demo navigating or mutating, and
how they nest. Catalog primitives → `scaffold-kit.md` and `scaffold-specimen.md`.

**Token names below are examples from one project — the structure is what is fixed.** Stated in full
in `scaffold-kit.md`; it applies to every `scaffold-*.md` file.

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

law: DemoViewOnly MUST render as whatever element the gallery's own TOC builder scrapes
  — <article> where the rail reads h2s inside the page's <article>. The rail is mounted
  outside this element, so if the guard changes the element, the rail finds no sections and
  the page silently loses its navigation. Read the rail's own selector; do not assume.
  (Example: a rail scraping `article h2` requires <article> here.)
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

