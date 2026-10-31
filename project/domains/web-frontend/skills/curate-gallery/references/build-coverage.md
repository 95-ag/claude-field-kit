# Build coverage

How Build and Sync turn DESIGN.md into the gallery's sections: coverage derivation, strict spine mapping
and headings, sub-groups, what goes in versus stays out, Domain sections, and the real-component import
rule. Mode choice and each mode's procedure → `modes.md`.

---

## Coverage derivation

Each DESIGN.md sub-section maps to exactly one gallery section (`GallerySection`). The bucket vocabulary
follows the design-write contract template:

| Bucket | Sub-sections (project determines exact names) |
|---|---|
| **Foundations** | Colors · Typography · Prose · Spacing · Shapes · Elevation & Depth · Motion · Layout · Imagery · Iconography — and any project-specific additions |
| **Background** | Background (optional top-level bucket; omit when a project has no ambient background layer) |
| **Components** | Shell · UI · Document |
| **Domain** | One entry per named domain component or page layout in DESIGN.md |
| **Technical** | Responsive Behavior · Z-Index Scale — and any project-specific technical concerns |

Do not hardcode a specific section count. The gallery has as many sections as DESIGN.md has sub-sections.
If DESIGN.md changes (a new token group, a new component), the gallery sections change accordingly.

## Section ordering and headings — strict DESIGN.md spine mapping

**Sections MUST appear in DESIGN.md document order. No reordering. No clubbing of sub-sections.**
Each DESIGN.md sub-section becomes exactly one `GallerySection` `<h2>`. Combining two sub-sections
into one `<h2>`, or splitting one sub-section into multiple `<h2>` entries, is a mapping violation.

The complete ordered section template — every `<h2>` section with its exact `id`, `title`, `mapsTo`,
`source`, visualizer assignment and prose-vs-boxed treatment — is split across four files by bucket:
`spine-foundations-base.md`, `spine-foundations-visual.md`, `spine-background-components.md` and
`spine-domain-technical.md`. `section-spine.md` holds the contract they share, the pins that apply to
every section, and the complete order as an appendix. Use the entries verbatim. Verify the mapping
before building; do not reconstruct it from memory.

H2 titles are **bucket-prefixed** to disambiguate sections in the TOC and rail (e.g. "Foundations ·
Colors", "Components · Shell", "Technical · Z-Index Scale"). The `Background` bucket, when present, is
a single-section bucket and needs no prefix. Section DOM elements use `id="ds-{id}"` namespacing
(see `architecture.md`).

Each section's `GallerySection` carries a `mapsTo` reference pointing to the full DESIGN.md heading
path for that sub-section. This is the bridge between the gallery and the doc — it is not decorative.

## Sub-groups

When a Components bucket entry has documented sub-groups (e.g. UI → Controls/Actions · Links · Display;
Document → Annotations · Figures & Media · Code), those sub-groups become `SpecimenGroup` h3 eyebrows
within the section, and their specimens render at h4. The sub-group vocabulary — and which component
belongs in which group — are pinned in `spine-background-components.md` → Bucket 3: Components.

Flat sections (Shell, Layout, most Foundations entries) render specimens at h3 with no sub-group layer.

## What goes in vs stays out

In: every named sub-section in DESIGN.md that has a visual or interactive counterpart in the code —
token groups, components, layout primitives, background layers, responsive behavior, z-index scale.

Out: pure-rule sections (interaction rules, accessibility rules, cross-cutting constraints) that describe
behavior rather than render a visual specimen. These are documented in DESIGN.md but not cataloged in
the gallery.

Example: Foundations · Colors through Technical · Z-Index Scale = 21 `<h2>` gallery
sections; pure-rule sections (Interaction Rules other than Responsive Behavior, Accessibility, Cross-Cutting)
stay out.

## Domain sections

Domain components listed as `[inline]` (page-section content embedded in a page, not a standalone
component file) are **listed, not rendered** — render as a `<div class="prose-content"><ul>…</ul></div>`
(a local `InlineList` helper), noting their page location. Domain components listed as `[standalone]`
(have their own component file) are **rendered live** via `Specimen` blocks. Entries the doc marks as
pending design get a placeholder card, last in their area, never a demo — see `spine-domain-technical.md` →
Bucket 4: Domain.

When `[inline]` / `[standalone]` tags are absent from DESIGN.md, infer from code: a component with its
own file is standalone; a JSX block that only appears inside a single page file is inline. Missing tags
should be flagged as a concern (`modes.md` → Classification rules (all modes)).

## Real-component import rule

**Every specimen MUST import and render the real component with representative sample data — never
hand-faked markup.** This is non-negotiable in Build mode:

- Do not replicate a component's HTML/CSS output by hand. Import the component and pass it props.
- Sample figures and diagrams use assets from `public/design-system/samples/` — generated by the
  project's asset pipeline (see `demo-placement-and-media.md` → Sample assets). Do not inline SVG data or use
  placeholder images from other sources.
- Placeholder data (e.g. `demoProject`, `demoLogos`, `demoContributors`) must be schema-valid (passes
  the project's type/Zod validators) so the rendered output matches a real instance.
- **Schema-valid is the floor, not the test. When a schema gains a shape, at least one sample carries a
  non-empty instance of it in the same change.** A sample exists to exercise a shape, not to satisfy a
  compiler: filling a new nested collection with `[]` everywhere typechecks clean and leaves the check
  surface unable to render the shape just introduced — the gallery then hides the defect it exists to
  expose. Empty and zero states are worth a specimen of their own; they are not a substitute for one.
- **Sample data may not introduce a field the real schema does not have** — see `final-checks.md` →
  Dogfood gate. A demo field manufactures the affordance built on top of it.
- A demo object's identifier MUST be a real registered one wherever a component dispatches by it to
  load content; a fake identifier produces no output.
- Components that render through a build pipeline (e.g. `CodeBlock` via Shiki + MDX) MUST use that
  pipeline — see `hard-to-demo.md` → Build-time-transform-dependent components. A bare code component bypassing Shiki
  renders unhighlighted; that is a fidelity failure, not a compile failure.
