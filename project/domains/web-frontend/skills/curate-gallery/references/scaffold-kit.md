# Scaffold kit — section and group primitives

The two outermost catalog primitives: the section wrapper and the specimen group. The specimen and
card primitives are in `scaffold-specimen.md`; the demo wrappers in `scaffold-chrome-theme.md`
(chrome frame, theme media) and `scaffold-guards.md` (click guards).

**Four generic files in `<gallery-root>/scaffold-kit/`. No `index.ts`.** Zero project-specific data —
every token binding and structural rule here applies to any project using this system. Stack mechanics
(portal implementation, static-image import type, theme-hook name, motion-hook name) →
`stack-adapters.md`.

**TOKEN NAMES IN THESE FILES ARE EXAMPLES FROM ONE PROJECT, AND THIS APPLIES TO ALL FOUR
`scaffold-*.md` FILES.** The pseudocode uses concrete names (`mono-anchor`, `body-primary`,
`heading-component`, `--spacing-*`, `--radius-*`) that are one project's design-system tokens shown as an
example. A consuming project substitutes its own equivalent for each role. **The structure — DOM layout,
element order, class roles — is what is fixed and must be reproduced faithfully; the names adapt.**

Also cross-links: `architecture.md` (file/folder pinning), `hard-to-demo.md` (live-vs-screenshot, click-
guard usage), `section-spine.md` (which catalog primitives each spine section uses).

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

