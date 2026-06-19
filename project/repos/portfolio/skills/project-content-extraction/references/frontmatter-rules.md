# Frontmatter and Body Rules

All rules for writing valid, build-passing portfolio MDX. The Zod schema that
enforces these lives at `src/lib/schemas/project.ts`.

---

## Required frontmatter fields

Build fails if any of these are missing or invalid.

| Field | Type | Constraint | Notes |
|---|---|---|---|
| `title` | string | non-empty | Prefer recruiter-readable, action-led; use paper title only if it's already compelling |
| `summary` | string | max 200 chars | One sentence, specific metric, honest framing. **Primary text on project cards — write for scannability, not long-form readability. Include the headline metric.** |
| `projectType` | enum | `academic` \| `freelance` \| `personal` | Drives sort and display; never shown as a badge |
| `publishedAt` | string | `YYYY-MM-DD` format | ISO 8601 date |
| `order` | number | any number | Lower = earlier in lists; ties broken by publishedAt desc |
| `heroImage` | string | starts with `/` | Web path from `/public`; image, video, or animated SVG |
| `heroAlt` | string | non-empty | Required for all hero types, including video |
| `tags` | string[] | 1–8 items | 4–6 recommended; recruiter-recognizable keywords |
| `stack` | object | all 4 sub-keys required | See §stack below |
| `overview` | object | problem + built required | See §overview below |

### heroPoster — conditional required

`heroPoster` is required when `heroImage` is a video (`.mp4` or `.webm`). Build fails
without it when the hero is a video. Always a web path starting with `/`.

---

## Optional frontmatter fields

Missing optional fields render nothing — never use placeholders or "TBD".

| Field | Notes |
|---|---|
| `subtitle` | Long descriptive title; renders below `title` in the project page header only — not on cards. Write for long-form readability, not scannability. |
| `links.github` | Full URL; confirm with user before publishing. Renders as "Code" + GitHubIcon |
| `links.paper` | External URL to a published academic work. Renders as "Paper" + ArticleIcon |
| `links.report` | Relative path to a self-hosted PDF (e.g. `/projects/<slug>/report.pdf`). Renders as "Report" + DescriptionIcon |
| `links.presentation` | Full URL or relative path to slides. Renders as "Slides" + SlideshowIcon |
| `links.demo` | Full URL. Renders as "Demo" + DeployedCodeIcon |
| `featured` | `true` / `false`; default false; max 3 featured projects site-wide |
| `logos` | Array of `{src, alt}`; `src` must start with `/`; only with confirmed brand permission |
| `contributors` | Array of `{name, avatar, url?}`; `avatar` must start with `/` |
| `ogImage` | Falls back to `heroImage` if omitted |
| `metaDescription` | Max 160 chars; falls back to `summary` if omitted |
| `relatedProjects` | Array of slugs; validated at build — slugs must exist. **Not rendered by any component as of Phase 6 — omit unless the component is built.** |
| `publishedAt` | **Not rendered in any visible UI component as of Phase 6.** Metadata only — do not optimize for display. |

---

## stack

All four sub-keys required as arrays. Empty arrays are valid and render nothing.

```yaml
stack:
  languages: [Python]          # Python, TypeScript, Go, etc.
  frameworks: [PyTorch]        # PyTorch, Next.js, FastAPI, etc.
  libraries: [NumPy, scikit-learn]   # NumPy, Pandas, recharts, etc.
  tools: [Git, Docker, Linux]  # Docker, Git, Linux, AWS, etc.
```

Do not add CUDA as a library dependency — it's a platform, not a library. Pull
framework and library names from the repo's imports and requirements files.

---

## overview

The `overview` object renders the recruiter-readable hero section. Write it last,
after the body, so it accurately reflects what was built.

```yaml
overview:
  problem: |
    What problem exists and why it matters in real systems.
    One or two paragraphs, plain language.
  built: |
    What was built. One or two sentences focused on solution, system behavior,
    approach. Honest about scope.
  results:              # optional; 2–3 bullet strings
    - "~80% accuracy at 25k queries"
    - "OOD extraction reached 59% at 15k queries"
  transferableSkills:   # for academic/freelance projects
    - "Designing end-to-end ML research pipelines"
  # For projectType: personal, use `learnings` instead of `transferableSkills`.
  # Use only one of the two per project — they are not both rendered cleanly.
```

`problem` and `built` are required. `results`, `transferableSkills`, and `learnings`
are all optional but strongly recommended for featured and academic projects.

---

## Slug rule

**Never add a `slug:` field.** The slug is derived from the MDX filename. A file at
`content/projects/model-extraction-attacks.mdx` produces slug `model-extraction-attacks`.

---

## Body authoring rules

- **H1 never used in the body.** One H1 per page comes from the layout (the `title`
  field). H2 is reserved for top-level section headings only.
- **H2 for sections, H3/H4 for subsections.** H4 only when a nested concept
  genuinely improves flow and cannot be absorbed into prose.
- **No raw HTML.** Use the available MDX components:
  - `<Figure>` — images with caption and width control
  - `<Diagram>` — architecture/flow diagrams (same props as Figure, different visual treatment)
  - `<Callout title="...">` — editorial aside for key insights or caveats
  - `<Stack gap="md">` — consistent spacing for grouped components
  - `<Highlight heading="...">` — pull-quote panel for a single key insight; one per deep dive max
- **No `<br>` for spacing** — let the layout handle whitespace.
- **No inline `style=` or `className=`** — no styling in MDX body.
- **No multiple consecutive blank lines.**

### Diagram and Figure props

```mdx
<Diagram
  src="/projects/<slug>/filename.svg"
  alt="Descriptive alt text"
  caption="Caption renders below the diagram."
  aspect="800/196"
  className="max-w-[700px]"
/>

<Figure
  src="/projects/<slug>/filename.png"
  alt="..."
  caption="..."
  width="default"   {/* "default" | "wide" | "full" */}
/>
```

`src` must be a web path starting with `/`. `alt` is required.

---

## Build-fail conditions (reference)

Fails the build:
- Missing required field
- Invalid `projectType` enum value
- More than 3 projects with `featured: true`
- Image paths not starting with `/`
- `heroImage` is a video but `heroPoster` is missing
- `relatedProjects` references slugs that don't resolve to existing files

Warns (does not fail):
- Empty `tags` array
- More than 6 tags
- `summary` longer than 200 characters
- `metaDescription` longer than 160 characters
