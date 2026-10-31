# Demo placement and media

Where page-level demo pieces mount — the TOC rail, the theme selector, which specimen takes which click
guard — and the media a demo needs: sample assets, and live render versus a static capture. Techniques for
a single component that resists a specimen frame → `hard-to-demo.md`.

---

## TOC rail — live mount, cap, proportional indicator

A gallery with many sections needs a table of contents. **Reuse the project's existing section-nav
component** — building a parallel TOC introduces drift. Only build a gallery-specific TOC when the
project has none.

**Requirement:** mount the section-nav **live on the page** (not inside a ChromeFrame) so it
actually scrapes the gallery's `<article>` h2 elements and renders the real section list. The live
rail in `page.tsx` is the gallery's own TOC — it is not a specimen of itself. The rail demo
in the Domain → Project Detail section demos the component's visual and structural design using the
demo-affordance prop (`hard-to-demo.md` → Page-coupled + fixed + breakpoint-gated); the production rail at the top of the page is separately functional.

Where the rail and the theme selector mount in `page.tsx` → `page-and-css.md` → Key invariants.

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

The live selector mounts in the page header, outside `<DemoViewOnly>` (`page-and-css.md` → Key
invariants), because it must actually switch the gallery's theme. The UI catalog's `ThemeSelector`
specimen **references** that instance rather than duplicating it — a note in the specimen description
points to the page header. The ThemeSelector UI catalog entries (`PillThemeSelector`, `InlineThemeSelector`) are each wrapped
in `InertDemo` to neutralize their state-change behavior inside the article.

---

## Click guards — DemoViewOnly and InertDemo

What each guard blocks, how they nest, and the `SuppressionTip` contract → `scaffold-guards.md`.
`DemoViewOnly` blocks anchors only, so a button that must not fire needs `InertDemo`.

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

Generate all samples as **dev-only** (excluded from production — seam (e) in `stack-adapters.md` or `stack-adapter-static-html.md`).

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
