# The route file and the gallery stylesheet

What `page.tsx` and `gallery.css` must each contain — this file owns both. Split out of `SKILL.md` so the
always-loaded header stays short: these are read once, while writing those two files. The file tree they sit
in is in `architecture.md`.

---

## `page.tsx` template

The gallery page is a thin server component. Reproduce this structure exactly:

```
// File: <gallery-route>/page.tsx
// Route: dev-only; NOT accessible in production builds

// imports (in this order):
import type { Metadata } from "next"        ← metadata export
import "./gallery.css"                       ← route-scoped CSS (ThemeShot swap + .ds-reading)
// layout primitives
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
// live rail (scrapes DemoViewOnly <article> h2s)
import { SectionProgressNav } from "@/components/project/section-progress-nav"
// UI primitives
import { Heading } from "@/components/ui/heading"
import { InlineThemeSelector } from "@/components/ui/theme-selector"
// click-guard (DemoViewOnly wraps ALL gallery sections)
import { DemoViewOnly } from "./scaffold-kit/click-guards"
// 5 section exports (named exports, one per bucket file)
import { BackgroundSection }   from "./sections/background"
import { ComponentsSections }  from "./sections/components"
import { DomainSections }      from "./sections/domain"
import { FoundationsSections } from "./sections/foundations"
import { TechnicalSections }   from "./sections/technical"

export const metadata: Metadata = {
  title: "Design System",
  robots: { index: false, follow: false },   // NOINDEX — dev-only, excluded from search
}

export default function DesignSystemPage() {
  return (
    <Section>
      <Container>

        // 1. LIVE TOC RAIL (only if the project has one) — position:fixed (renders in the gutter);
        //    mounted OUTSIDE the scraped DemoViewOnly article so it doesn't ingest itself
        <SectionProgressNav />

        // 2. HEADER — outside DemoViewOnly so InlineThemeSelector stays interactive
        <header class="mb-[--spacing-3xl] flex flex-col gap-[--spacing-lg]">
          <Heading level={1} type="display-title">Design System</Heading>
          <p class="body-lead">
            Components and tokens rendered live, mirroring the DESIGN.md structure.
            Inline page sections are listed, not previewed; background layers are
            static captures. Switch themes with the Theme control below.
          </p>
          {/* InlineThemeSelector is OUTSIDE DemoViewOnly — stays fully interactive.
              The UI catalog references this instance rather than duplicating it. */}
          <div class="flex items-center gap-[--spacing-sm]">
            <span class="mono-anchor">Theme</span>
            <InlineThemeSelector />
          </div>
          <div class="body-caption">
            Dev-only reference, excluded from the production build. Components render
            on the page background; fixed and route-aware chrome render live in
            bounded frames.
          </div>
        </header>

        // 3. GALLERY BODY — DemoViewOnly is the <article> the rail scrapes for h2s
        <DemoViewOnly class="flex flex-col gap-[--spacing-4xl]">
          <FoundationsSections />
          <BackgroundSection />
          <ComponentsSections />
          <DomainSections />
          <TechnicalSections />
        </DemoViewOnly>

      </Container>
    </Section>
  )
}
```

> Component + type-token names in this template are the project's — examples shown. Substitute
> the project's own **theme-control component** and **display / lead / eyebrow / caption** type tokens; the
> page **structure** (wrappers, rail-outside-article, header, uniform-gap article, section order) is what's
> fixed.

**Key invariants:**

- Page title: `"Design System"` at `display-title` type token — never a raw font-size.
- `robots: { index: false, follow: false }` — always noindex; this is a dev tool.
- **Live TOC rail (conditional).** Use the project's section-nav / TOC rail **if it has one** — mounted
  `position: fixed` (renders in the gutter), **outside** the `<DemoViewOnly>` article it scrapes (so it
  reads the article's h2s without ingesting itself; DOM mount order doesn't affect where it renders). **No
  such rail in the project → omit it; the gallery has no TOC.**
- `<InlineThemeSelector />` is in the header, OUTSIDE `<DemoViewOnly>` — this is the only theme
  control on the page; the UI catalog section references it, never duplicates it.
- Section order inside `<DemoViewOnly>`: Foundations → Background → Components → Domain → Technical.
  This order mirrors DESIGN.md document order exactly.
- Ambient background is NOT suppressed — the gallery renders on the normal page background. The
  Background section shows static captures (`ThemeShot` / `ThemeVideo`), not a live background layer.
- **Reading-page styling** — the page is wrapped in the project's standard content-page primitives
  (here `Section` › `Container`), exactly like a normal reading/content page, so it inherits the
  editorial reading column (max content width + responsive padding) and vertical rhythm. "Reading-page
  style" here means these standard wrappers — NOT the long-form `data-read="long"` reading *mode* (that
  is for MDX deep-dives only and is NOT applied to the gallery).
- **Uniform section spacing** — sections inside `<DemoViewOnly>` are separated by a single uniform gap
  (`flex flex-col gap-[--spacing-4xl]`); within a section, `GallerySection` uses `gap-[--spacing-2xl]`.
  One inter-section gap value — do not vary it per section.
- **No gallery file paths rendered** — `source`/`mapsTo` props reference the project's real components /
  CSS / tokens / DESIGN.md only, never the gallery's own kit/section files (see `section-spine.md` →
  Cross-section pins → `source` points to REAL artifacts).

---

## `gallery.css` requirements

The route-scoped stylesheet is imported by `page.tsx` and applies on that route alone — kept out of the
project's global stylesheet to avoid prod-stylesheet noise, and referencing the global token vars it defines.
It contains **exactly three rule blocks, and nothing else** — the gallery borrows every other value from the
project's own stylesheets rather than restating them:

1. **The theme-shot swap** — hide the inactive theme's screenshot.
2. **An element-scoped mirror of any reading-mode surface overrides**, so a surface specimen can preview
   that mode live and theme-adaptively. The project's own global rules scope those surfaces to a
   document-level attribute, which a specimen cannot opt into; mirroring them onto a class is what makes
   the preview possible. **This block holds the only values in the file, and they are the PROJECT'S —
   copied from its global rules, kept in step with them, never invented here.**
3. **Reading-mode-only cards** — hidden in whichever theme they are identical in.

*Example* — the shape, with one project's values standing in for yours:

```css
/* ThemeShot theme swap — only the active theme's screenshot is shown */
[data-theme="dark"]  .ds-shot-light { display: none }
[data-theme="light"] .ds-shot-dark  { display: none }

/* Reading-mode surface scope — mirrors globals.css data-read="long" blocks */
.ds-reading { --surface: #f8f8f9; --surface-floating: #f8f8f9d9; }
[data-theme="dark"] .ds-reading {
  --surface: #1a1a1a; --surface-elevated: #292929;
  --surface-deep: #141414; --surface-floating: #1f1f1fd9;
}

/* Reading-mode-only cards — hidden in light where they hold */
[data-theme="light"] .ds-reading-darkonly { display: none }
```

The light and dark blocks differ on purpose — override only the tokens that theme actually changes in
reading mode. The `.ds-reading` values must stay in sync with `globals.css`'s `[data-read="long"]` blocks.
No other rules belong in this file.

**Maintenance rule:** the reading-mode mirror is the only place the gallery holds copied values, so it is the
only place that can drift. When the project's reading-mode surface tokens change, `gallery.css` is updated to
match — the block states values the project owns, not values the gallery chose. A theme in which a surface is
unchanged in reading mode needs no override for it.

---
