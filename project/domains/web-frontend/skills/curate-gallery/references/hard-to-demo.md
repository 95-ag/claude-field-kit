# Hard-to-Demo Components

Techniques for components that cannot be dropped into a specimen frame naively. This file covers
the *how*. Whether to add a production touch-point at all — the carve-out gate and user-approval
requirement — is in `boundaries-and-handoff.md`.

---

## Fixed chrome — ChromeFrame

`position:fixed` elements resolve to the **viewport**, not to a parent `div`. A plain wrapper in a
specimen frame does nothing: the component escapes it and overlaps the real page.

**Requirement:** wrap every fixed-chrome demo in a `ChromeFrame`. A `ChromeFrame` applies
`transform: translateZ(0)` to its container div. A non-zero transform establishes a new containing
block, so `position:fixed` descendants resolve to the frame instead of the viewport. Pass an explicit
`height` to bound the frame; the component stays within it.

For chrome that duplicates a live page landmark (nav, footer already present on the gallery page),
set `ariaHidden` on the `ChromeFrame` so assistive technology does not encounter inert duplicate
landmarks.

**Example:**

| Specimen | ChromeFrame height | ariaHidden | InertDemo? |
|---|---|---|---|
| PillNav | 120px | yes | no |
| MobileNav | 420px | yes | yes |
| Footer | auto (no height) | yes | no |
| ScrollToTop | 160px | no | yes |
| SectionProgressNav | 260px | yes | no |

MobileNav pattern: inside the `ChromeFrame`, a scrim div (`bg-[--ink]/30`, `absolute inset-0`) and
a panel div (`absolute top-0 right-0 h-full w-[min(280px,80%)]`) hold the `MobileNavPanel` — this
renders the drawer open at a realistic width as a side panel, not a full-port takeover.

---

## Components with side-effects — presentational sub-component extraction

Some components have hard side-effects that cannot be neutralized from outside: scroll-lock,
focus-trap, route or resize listeners, keyboard-escape handlers. Passing a prop does not help —
the effects fire from inside the component.

**Requirement:** extract a **presentational sub-component** — a pure inner panel with no hooks, no
DOM side-effects, no route dependency. The original component wraps the panel and retains all its
side-effecting logic. The gallery renders the panel directly.

Route state the panel needs (current `pathname`, active link) is passed as a **prop** instead of
read from a hook, so a server page can render it without a client boundary at the panel level.

**Example:** `MobileNavPanel` extracted from `MobileNav`. The gallery renders
`<MobileNavPanel pathname="/about" />` inside a `ChromeFrame`, showing the drawer open as a right-
aligned side panel. `InertDemo` wraps the whole frame because the panel contains buttons (close,
theme toggle, links).

See `boundaries-and-handoff.md` for the carve-out policy that governs when this extraction is
permitted.

---

## Page-coupled + fixed + breakpoint-gated — demo-affordance prop

A component can be simultaneously `position:fixed`, DOM-scraping (querying `article h2` to build
a section list), and breakpoint-gated (hidden below a wide-screen threshold). A `ChromeFrame` bounds
the fixed positioning, but the component still scrapes the live page and stays invisible below its
breakpoint — so a naive frame shows nothing useful.

**Requirement:** add a **demo-affordance prop** to the production component. When the prop is present
the component:

1. Skips the DOM scrape and observer; renders the provided section list directly.
2. Drops the breakpoint gate (`display:block` unconditionally) so it is visible at any viewport width
   inside the frame.

Production callers never pass the prop; it is dead code in production.

The demo is **posed, not live**. Scroll-tracking needs a scrolling page; a bounded frame has none.
This is expected and consistent — the other fixed-chrome specimens (PillNav, ScrollToTop) are also
posed.

**Demoing a scroll affordance (e.g. a proportional scroll indicator) inside the frame:**

A scroll indicator that appears only when content overflows needs: content that actually overflows,
and a cap small enough to trigger that overflow. The production cap is often viewport-relative
(e.g. `60vh`) and never triggers inside a bounded frame. In demo mode, override it with a
**compact fixed cap** (e.g. 200px) and pass a **long sample list** so the list overflows the cap
and the indicator appears.

**Example:** `demoSections` on `SectionProgressNav`. The demo passes a 12-item list so
the section list overflows the capped height, the proportional indicator appears, and hover reveals
it. `forceVisible` on `ScrollToTop` is the same pattern — it bypasses the scroll-depth gate.
`SectionProgressNav` is wrapped in `ChromeFrame height={260} ariaHidden` with no `InertDemo` (the
component itself has no interactive buttons in demo mode).

See `boundaries-and-handoff.md` for the carve-out gate and user-approval requirement.

---

## Build-time-transform-dependent components — demo through the real pipeline

**This is a requirement, not a suggestion.** A component whose rendered appearance depends on a
build-time transform MUST be demoed through that transform. Rendering the component with hand-crafted
props bypasses the transform — the specimen shows wrong (unstyled, plain) output and misrepresents
the component. A bare component here is a defect.

**Why bare-component composition fails:** a build-time transform runs as a pre-render step over
source content and produces markup that the component's CSS expects. Passing the component raw
children (as if the transform had already run) skips the step — the output is unstyled plain text
or unenhanced markup.

**Requirement:** render the specimen through the real pipeline. Pass the same source content and
plugin configuration (plugins, options) as production pages use, so the transform runs and the
output is identical to what users see.

**Verify the specimen shows the TRANSFORMED output** (e.g. highlighted code with syntax coloring,
not monochrome text). A bare component is a defect — flag and fix it before marking the section
done.

**Example — CodeBlock via MDX + Shiki:**

```
// In sections/components.tsx:
const SAMPLE_CODE_MDX = `\`\`\`ts
export function add(a: number, b: number) {
  return a + b;
}
\`\`\``;

// In the Specimen:
<div className="prose-content">
  <MDXRemote
    source={SAMPLE_CODE_MDX}
    components={mdxComponents}
    options={{
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [rehypeShiki, {
            themes: { light: "vitesse-light", dark: "vitesse-dark" },
            defaultColor: false,
          }],
        ],
      },
    }}
  />
</div>
```

The `<div className="prose-content">` wrapper is required — see the caveat below.

### `.prose-content` scope caveat

Build-time highlighting pipelines often emit CSS that depends on a scoping class applied to a
content container. If the gallery specimen is not wrapped in that same scoping class, the markup
is correct but the colors do not appear — the CSS variables are defined only within the scope.

**Requirement:** wrap the code specimen in the same scoping class used on production content pages.
The pipeline rendering alone is not sufficient — the scope wrapper is also required. Both must be
present for the specimen to show the correctly styled output.

**Example:** Shiki dual-theme (`defaultColor: false`) emits `--shiki-light` and
`--shiki-dark` variables. The CSS that maps those to actual colors is scoped to `.prose-content` in
`src/styles/prose.css`. Without the wrapper, the highlighting markup is present but renders as
unstyled monochrome text. The specimen MUST be wrapped in `<div className="prose-content">`.

`.prose-content` restyles every `<a>`, `<p>`, `<ul>`, `<table>` inside it — never wrap an entire
page section or component demo in it. Use it only as a tight wrapper around the specific content
that needs it (the code block, a prose body, a list). See `rules/web-frontend/design-system.md →
Scoping reused styles & chrome`.

---

## Overlaid components — one specimen each, over a plain theme-adapted backdrop

A component that is absolutely positioned **in production** within another component's bounds is a
**separate specimen** from the component beneath it, one per DESIGN.md component boundary. Combining
them blurs the boundary and makes it hard to see each component's own behavior. Two neighbours own the
cases this one does not: anything `position:fixed` in production goes to `ChromeFrame` above, and a
Display or Feedback component with a bounded variant set renders live in its own UI section
(→ `spine-background-components.md` → Bucket 3: Components) even where it is corner-pinned.

**Requirement:** the overlying component's specimen sits over a **plain, theme-adapted backdrop**,
never over the real component beneath. Use a `Card` (→ `scaffold-specimen.md` → Card) for the project's
sunken/deep fill and card treatment, and pass it `relative overflow-hidden p-0` — `Card`'s box is
neither positioned nor clipping on its own, so an absolutely positioned child would otherwise resolve
against an ancestor instead of the backdrop. Size it with the underlying component's own classes, taken
from that component's specimen or from its production container where it has none. The subject of the
specimen is the overlying component, not what sits behind it.

Supply **at least two items per collection**, and enough to reach any truncation or max-item behavior
the component has. A single placeholder hides the layout logic.

**Example:** `HeroMetaOverlay` receives two logos and two contributors:

```
const demoLogos = [
  { src: "/design-system/samples/logo-a.svg", alt: "Sample logo A" },
  { src: "/design-system/samples/logo-b.svg", alt: "Sample logo B" },
];
const demoContributors = [
  { name: "Sample One", avatar: "/design-system/samples/avatar-a.svg" },
  { name: "Sample Two", avatar: "/design-system/samples/avatar-b.svg" },
];

<Specimen id="project-hero-overlay" name="HeroMetaOverlay" ...>
  <Card className="relative aspect-video overflow-hidden p-0">
    <HeroMetaOverlay logos={demoLogos} contributors={demoContributors} />
  </Card>
</Specimen>
```

---

## TOC rail — live mount, cap, proportional indicator

A gallery with many sections needs a table of contents. **Reuse the project's existing section-nav
component** — building a parallel TOC introduces drift. Only build a gallery-specific TOC when the
project has none.

**Requirement:** mount the section-nav **live on the page** (not inside a ChromeFrame) so it
actually scrapes the gallery's `<article>` h2 elements and renders the real section list. The live
rail in `page.tsx` is the gallery's own TOC — it is not a specimen of itself. The rail demo
in the Domain → Project Detail section demos the component's visual and structural design using the
demo-affordance prop (see above); the production rail at the top of the page is separately functional.

The section-nav is placed in `page.tsx` **above** the `<header>` element, before `<DemoViewOnly>`,
so it scrapes the `<DemoViewOnly>` article's h2 elements. `InlineThemeSelector` lives in the
`<header>` **outside** `<DemoViewOnly>` so it stays interactive (not suppressed by the click guard).

**Cap + scroll:** cap the nav height at a fixed proportion of the viewport (e.g. `max-h-[60vh]`)
with `overflow-y: auto`. Short section lists fit without scrolling; long lists become scrollable.
Always set both axes intentionally: `overflow-x: hidden` and `overflow-y: auto`. Setting
`overflow-x: auto` alone silently promotes `overflow-y` to `auto`, which can cause an unwanted
vertical scrollbar on content with absolutely-positioned labels that poke outside the box.

**Custom indicator — proportional thumb:** if the native scrollbar is hidden, a custom indicator
must replace it. The thumb height and position must be **proportional** to scroll state:

- Thumb height = `(visible height / total list height) × track height`
- Thumb top = `(scrollTop / total list height) × track height`

Do NOT cap the thumb to a fixed short height while letting it travel the full track. A
disproportionate thumb moves faster than the content, which is disorienting and breaks the
affordance. Never hide the native bar without a visible replacement.

**Autoscroll:** scroll the active item to center on selection change so the current section and
its neighbors are always visible as the page scrolls.

---

## Theme selector — lives outside DemoViewOnly

`InlineThemeSelector` is mounted in the page `<header>` **outside** the `<DemoViewOnly>` article.
The `DemoViewOnly` click-guard intercepts all anchor clicks inside the article — any interactive
control inside it that needs to fire must be either outside `DemoViewOnly` or wrapped in `InertDemo`
(which shows the suppression tooltip but blocks propagation).

The theme selector must stay **interactive** (it actually switches the theme for the gallery), so
it lives outside `DemoViewOnly`. The UI catalog's `ThemeSelector` specimen **references** this
selector rather than duplicating it — a note in the specimen description points to the page header.
The ThemeSelector UI catalog entries (`PillThemeSelector`, `InlineThemeSelector`) are each wrapped
in `InertDemo` to neutralize their state-change behavior inside the article.

---

## Click guards — DemoViewOnly and InertDemo

Two guards, different scopes:

**`DemoViewOnly`** renders as `<article>` and wraps ALL gallery content. It intercepts
`anchor[href]` clicks via `onClickCapture` (capture phase, fires before any bubbling handler):
calls `preventDefault` + `stopPropagation` and shows a `SuppressionTip` tooltip at the pointer
position for 1600ms. It does NOT block button clicks — `InertDemo` handles those.

**`InertDemo`** renders as `<div>` and intercepts ALL clicks (`onClickCapture` with
`stopPropagation` + `preventDefault` on every event, not just anchors). Used for components with
buttons that should not fire (theme selectors, submit buttons, close buttons). Nesting: `InertDemo`
inside `DemoViewOnly`; `stopPropagation` prevents the double-tip firing.

**`SuppressionTip`** portals to `<body>`. This is required: a tooltip rendered inside a
`ChromeFrame` is clipped by the frame's `overflow:hidden`. Portaling to `<body>` puts it outside
the containing block entirely. Token classes:
`body-caption z-[--z-mobile-menu-panel] rounded-[--radius-sm] border border-[--hairline]
bg-[--surface-elevated] px-[--spacing-sm] py-[--spacing-xs] max-w-[240px]`.

Click guard placement rules per specimen type:

| Situation | Guard |
|---|---|
| Anchor-only chrome (PillNav, Footer in ChromeFrame) | none (DemoViewOnly handles anchors) |
| Button-bearing chrome (ScrollToTop, MobileNav, theme selectors, Button grid) | InertDemo |
| Copy-action UI (CopyLink, CopyableCode) | none — copy intentionally works |
| Code block, Figure, Diagram, Callout, Highlight | none |
| SectionProgressNav in ChromeFrame | none (no interactive buttons in demo mode) |

---

## Sample assets — prefer the project's asset system, else a representative SVG

Gallery specimens that need image / diagram / media assets (Figure, Diagram, DiagramRow, hero, cover,
logo, avatar, …) use **sample assets** — dev-only, under the gallery's samples path. Source them in this
order:

**1 — Use the project's asset-creation system if it has one.** If the project maintains an asset
generator / pipeline (reproducible scripts or otherwise), generate the samples THROUGH it so they match
the project's asset style and stay consistent. **Timing — don't block the build:** specimens without a
sample get a placeholder + gap note during the build; when the gallery is built, present the needed-asset
list and **ASK the user** whether to generate each via the asset system or keep the placeholder.
*Example: Python generators in `assets-source/` (pinned deps) emit
SVG to `public/<route>/samples/`; match the DESIGN.md → Imagery specs (diagram style, bordered vs
contained).*

**2 — Fallback: hand-author a simple representative SVG.** If the project has NO asset-creation system,
hand-make a simple SVG using the project's DESIGN.md **colors + typography**, **always borderless**, and
**representative of what the component shows** — the sample should read as its content KIND at a glance:

| Component kind | Sample should look like |
|---|---|
| Figure / image | an image (photo-like block + subject) |
| Diagram | a flow (nodes + arrows) |
| Chart | a graph (axes + bars/line) |
| Hero / poster | image + text |
| Avatar | a person (head/shoulders silhouette) |
| Logo | a generic logo mark |

A **self-representative** placeholder (reads as its content kind at a glance), NOT a generic gray box.
Borderless; colors/type from DESIGN.md; **color usage/count scales with the image area** — a small avatar
uses fewer colors, a large hero/figure more.

**Logo and avatar samples** are fixed-color (not theme-adaptive): logos sit on a white badge, avatars crop
into a small circle. **Background clips** (`ThemeShot`/`ThemeVideo`) require the gallery to already render
to capture — generate them as an explicit prerequisite; if none exist yet, render a plain-surface fallback
with a descriptive note and document the gap (never block the build on uncapturable clips).

Generate all samples as **dev-only** (excluded from production — `stack-adapters.md` has the per-stack
exclusion).

---

## Live vs. screenshot

**Live rendering is the default.** A live specimen is the component itself — it never drifts, it
shows real hover and focus states, and it adapts to the theme switch automatically.

**Screenshot only when live is technically infeasible.** A full-viewport WebGL or canvas layer
(e.g. a shader background) cannot be mounted inside a bounded frame: it sizes to the window,
builds DOM at full scale, and hangs on software WebGL renderers. For these, use:
- A **static screenshot pair** (`ThemeShot`) — one PNG per theme, swapped via the `data-theme`
  attribute. CSS mechanism in `gallery.css`: `[data-theme="dark"] .ds-shot-light { display:none }`
  and `[data-theme="light"] .ds-shot-dark { display:none }`.
- A **looping clip pair** (`ThemeVideo`) — a short dense segment of the effect encoded as MP4, one
  per theme, with a poster image fallback for pre-hydration and `prefers-reduced-motion`.

Load only the active theme's clip — never preload both simultaneously. The poster covers the gap
before hydration and when motion is reduced.

A **reference pointer** (a prose note linking to the live component) is a last resort for cases
where a screenshot is not yet available — not a permanent substitute.
