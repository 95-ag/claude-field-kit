# Spine — Domain and Technical

The project's own page/feature areas, and the two Technical sections. Shared contract and
cross-section pins → `section-spine.md`.

Technical is always the last bucket. The section numbers below follow the worked example in
`section-spine.md` and shift with the number of domain areas a project has.

---

## Bucket 4: Domain — the project's page/feature areas

**The most project-specific bucket.** A project's domain areas (its pages / routes / features) are
whatever DESIGN.md → Domain Components defines — **derive them; don't assume a fixed set.** Everything
below is the generic method; project values appear only as worked examples.

**P1 — Composition + recipe (per domain area):**
- One `GallerySection` per domain area DESIGN.md → Domain Components defines. **Section order = DESIGN.md
  order** (not reorderable).
- Read each item's **[inline] / [standalone]** tag from DESIGN.md:
  - **[inline]** (page-bound composition, no own component file) → an `InlineList`
    (`<div class="prose-content"><ul>…</ul></div>`) naming each — **listed, never recreated** (never
    re-implement the markup).
  - **[standalone]** (own component file, imported by the page) → a live `Specimen`: the real component +
    **placeholder demo data** + a usage `description` + its code-path `source`.
  - **Pending design** (a placeholder entry whose design is not finished, under whatever token the
    project's DESIGN.md legend defines — e.g. `[pending design]`) → a **placeholder card**: a `Specimen`
    frame with no demo, a "Not yet designed" label, and one line naming what is pending. **Never rendered
    or built.** It cannot sit with the `[inline]` or `[standalone]` entries because it is neither yet, so
    it goes **last in its area**. Once designed, the doc gives it `[inline]` or `[standalone]` and it
    renders normally. Per `rules/web-frontend/component-structure.md` → Doc ↔ code bridge.
- An **all-inline** area = just an `InlineList` (no specimens). A **mixed** area = standalone specimens +
  a **trailing `InlineList` wrapped in its own `Specimen`** (name "Inline sections", with `source` +
  `description`) — so the inline remainder reads as a labeled sub-section, not a bare list.
- A **site-fixed domain component** (a `position: fixed` chrome element — e.g. a section-nav rail) is
  demoed the **Shell way** (`ChromeFrame` + a demo-affordance prop, *posed* not live), NOT as a plain
  inline specimen. It stays in its Domain section (home per DESIGN.md); only the demo technique is borrowed
  from Shell (see Components · Shell + `hard-to-demo.md`).

**Demo data (generic):**
- Standalone components get **schema-valid placeholder data** — generic, self-documenting text (a
  placeholder title / summary), NOT a real entity's actual content.
- Use a **real identifier only where the component dispatches by it** (e.g. a real slug if a cover/hero
  component looks up registered art by slug). Everything else stays placeholder.
- **Image-bearing domain components** (covers, hero / card media, overlay logos / avatars) → **sample
  assets**, theme-aware where the component exposes theme (logos/avatars fixed-color), via the asset rule
  — same as Document. → `hard-to-demo.md` → Sample assets. A **grid of image/cover specimens** (e.g. every
  registered cover) places each in a **`Card` well** (`scaffold-specimen.md` → Card → cover-grid usage) — never a
  hand-rolled box that re-implements Card's border/fill/aspect treatment.

**P2 — Visual alignment:** standalone components are real (own styling + own container); per-component
treatments (a media well for a cover, an overlay over a sunken/deep surface, a fixed rail in a
`ChromeFrame`, …) resolve from DESIGN.md; sample assets representative. A component that is **fluid/
responsive in the app** (cards, media) is demoed in a **fluid container capped at its real width there**
(grid-cell max — an instance value from the project's layout), NOT a fixed small box, so it flexes at true
size. No token resolution beyond what the components bring.

**P3 — Actual inputs:** the domain areas + their components + [inline]/[standalone] tags, ALL read from
DESIGN.md → Domain Components; the demo-data shape from the project's content schema.

> **Example — 5 domain areas, in DESIGN.md order** (ids in parens):
> - **Home Page** (`home`) — all `[inline]` → `InlineList` (Hero · Featured Projects Grid).
> - **Work Index** (`work`) — `[inline]` → `InlineList` (listing grid).
> - **Project Detail** (`project`) — mixed. Standalone specimens (live, fed one `demoProject` constant —
>   a schema-valid `Project` of generic placeholder text, with ONE real `slug` so the cover/hero
>   dispatches): `ProjectCard` · `ProjectHeader` · `HeroMedia` (16:9 in a surface-deep well) ·
>   **`HeroMetaOverlay` — SEPARATE specimen over a plain surface-deep well** (sample logos/avatars, no
>   HeroMedia behind it) · `Covers` (every registered cover, each in a `Card` well) · `ProjectOverview` ·
>   `TechStack` (both wrapped in `.prose-content` for their definition lists) · **`SectionProgressNav` in
>   a `ChromeFrame` via the `demoSections` demo-prop** (posed; long list so the rail caps + scrolls; it's
>   `project/`, NOT shell). Then a trailing `InlineList` (Project Detail · Prose deep-dive · Editorial
>   two-column layouts).
> - **About Layouts** (`about`) — mixed: `ViewDownloadButton` (standalone, `InertDemo`) + `InlineList`
>   (Two-panel Intro · Capabilities · Approach · Work with Me).
> - **404 Not Found** (`not-found`) — `[inline]` → `InlineList`.

---

## Bucket 5: Technical

### 20. Responsive Behavior

```
id:      "responsive"
title:   "Interaction · Responsive Behavior"
mapsTo:  "Interaction Rules → Responsive Behavior"
source:  "DESIGN.md → Responsive Behavior"
```

**P1 — Composition:** no `Specimen`/`SpecimenGroup` — a single `.prose-content` wrapper containing, IN
ORDER: `<SpanTable>` → `<DeviceRuler>` → touch-targets bullet prose → collapsing-strategy bullet prose.
```
<div class="prose-content flex flex-col gap-[{sp}]">
  <SpanTable zones={ZONES} />
  <DeviceRuler stops={ZONE_BARS} />
  <div class="flex flex-col gap-[{sp}]">
    <div class="flex flex-col gap-[{sp}]"><p class="{T_EMPHASIS}">Touch targets</p><ul>…</ul></div>
    <div class="flex flex-col gap-[{sp}]"><p class="{T_EMPHASIS}">Collapsing strategy</p><ul>…</ul></div>
  </div>
</div>
```
The `.prose-content` wrapper is required (SpanTable + the prose lists need its editorial styling).

**P2 — Visual alignment:** SpanTable + the bullet prose inherit the project's prose / editorial table
styling; DeviceRuler per its P2 (used = sunken/deep level, unused = raised level — surface+border paired;
radius 0; horizontal scroll on overflow); the `Touch targets` / `Collapsing strategy` labels = emphasis
token. (Full visualizer rules → `visualizer-layout.md` → SpanTable, and → DeviceRuler → P2.)

**P3 — Actual inputs:**
- `ZONES` (SpanTable) = the project's responsive zones, read from DESIGN.md → Responsive Behavior; each
  `{ name, width, changes[] }` with the **key** layout changes per zone. *(Example: Desktop(xl) ·
  Tablet(md) · Mobile(base).)*
- `ZONE_BARS` (DeviceRuler) = the fixed silhouette standard (geometry below) + which breakpoints the
  project marks `used`. *(Example: base/md/xl used.)*
- **Touch-targets** + **Collapsing-strategy** = **explicit bullet (`<ul>`) prose**, key points, read
  complete from DESIGN.md → Touch Targets + Collapsing Strategy.

`ZONE_BARS` fixed silhouette standard (reproduce verbatim; only `used` + token vary per project):

  | px | device | token | used | boxW | boxH |
  |---|---|---|---|---|---|
  | 0 | Mobile | base | true | 64 | 128 |
  | 640 | Large mobile | sm | false | 76 | 138 |
  | 768 | Tablet | md | true | 104 | 162 |
  | 1024 | Laptop | lg | false | 168 | 140 |
  | 1280 | Desktop | xl | true | 210 | 150 |
  | 1536 | Ultra wide | 2xl | false | 264 | 152 |

DeviceRuler renders AFTER SpanTable and BEFORE the prose blocks (order pinned above).

---

### 21. Z-Index Scale

```
id:      "z-index"
title:   "Technical · Z-Index Scale"
mapsTo:  "Technical Conventions → Z-Index Scale"
source:  "--z-*"
```

**P1 — Composition:** a single `<LayerStack items={Z_INDEX_LAYERS} />` directly inside `GallerySection` —
no `Specimen`/`Card`. The layers are the main visual (diagonal stack — full template →
`visualizer-depth.md` → LayerStack → P1).

**P2 — Visual alignment:** plane depth is **sign-mapped** (negative → sunken bordered · 0 → no-border ·
positive → raised bordered; uniform fallback) using simple bordered levels; labels role = **primary
text** / token = code / value = eyebrow; radius always 0 (full rules → `visualizer-depth.md` → LayerStack
→ P2).

**P3 — Actual inputs (`Z_INDEX_LAYERS`):** the project's z-index layers, read **complete** from DESIGN.md
→ Technical Conventions → Z-Index Scale for each layer's token and role. Each value comes from DESIGN.md
→ YAML Registry (`z-index:` group), joined on the token's name. A layer the Registry gives no value, or a
Registry entry no layer names, is a doc disagreement — handle it per `section-spine.md` → The three layers
(P1 · P2 · P3); a missing value falls back per `visualizer-kit.md` → Generic fallbacks, because
`LayerItem.value` is required. Each item is `{ token, value, role }`;
`LayerStack` sorts ascending by value internally — pass in any order.
*(Example: 6 — `--z-base` (0) · `--z-sticky-content` (20) · `--z-scroll-to-top` (40) ·
`--z-pill-nav` (50) · `--z-mobile-menu-overlay` (55) · `--z-mobile-menu-panel` (60).)*

---

