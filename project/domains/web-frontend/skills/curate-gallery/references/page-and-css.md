# The route file and the gallery stylesheet

What `page.tsx` and `gallery.css` must each contain. Split out of `SKILL.md` so the always-loaded
header stays short: these are read once, while writing those two files. The file tree they sit in is
in `architecture.md`.

---

## `page.tsx` requirements

The gallery page is a thin server component with this structure:

```
export const metadata = { title: "Design System", robots: { index: false, follow: false } }

export default function DesignSystemPage() {
  return (
    <Section><Container>
      <SectionProgressNav />          {/* LIVE rail — above the header; scrapes DemoViewOnly article */}
      <header>
        <Heading level={1} type="display-title">Design System</Heading>
        <p class="body-lead">...</p>
        <div class="flex items-center gap-[--spacing-sm]">
          <span class="mono-anchor">Theme</span>
          <InlineThemeSelector />     {/* OUTSIDE DemoViewOnly — stays interactive */}
        </div>
        <div class="body-caption">Dev-only reference, excluded from the production build.</div>
      </header>
      <DemoViewOnly class="flex flex-col gap-[--spacing-4xl]">
        <FoundationsSections />
        <BackgroundSection />
        <ComponentsSections />
        <DomainSections />
        <TechnicalSections />
      </DemoViewOnly>
    </Container></Section>
  )
}
```

Invariants: `robots: { index: false, follow: false }` always present; `SectionProgressNav` above the
header (not inside `DemoViewOnly`); `InlineThemeSelector` in the header outside `DemoViewOnly` (the
UI catalog references this instance, never duplicates it); section order Foundations → Background →
Components → Domain → Technical. Full template with annotated imports → `references/architecture.md`.

---

## `gallery.css` requirements

The route-scoped stylesheet contains **exactly three rule blocks, and nothing else** — the gallery
borrows every other value from the project's own stylesheets rather than restating them:

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
No other rules belong in this file. Full contents with comments → `references/architecture.md`.

---

