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
| `projectType` | enum | `academic` \| `freelance` \| `personal` | Internal metadata, reserved for later scaling; not used for sorting or display; never shown as a badge |
| `publishedAt` | string | `YYYY-MM-DD` format | ISO 8601 date. Not rendered in any visible UI — metadata only |
| `order` | number | any number | Featured list: primary sort (lower = earlier); Work list: tiebreak after publishedAt |
| `tags` | string[] | 1–8 items | 4–6 recommended; recruiter-recognizable keywords; no duplicates with `stack` |
| `stack` | object | all 4 sub-keys required | See → stack below |
| `overview` | object | problem + built required | See → overview below |

### Hero fields — omitted at the content stage

The hero fields are optional in the schema and belong to the cover stage, which runs after
content. Omit all of them here; the hero renders empty until the cover lands.

- Never invent a `placeholder`/`TBD`/`hero-placeholder` asset to force a build. The prose-guard
  hook blocks those tokens, correctly — omit the field rather than dodge the guard.
- The production release build still requires a hero, so a heroless project cannot ship
  (→ Build-fail conditions).
- If a non-empty interim is genuinely wanted (e.g. for review screenshots), use the cover skill's
  typography-only fallback — a real asset — not a placeholder.

---

## Optional frontmatter fields

Missing optional fields render nothing — never use placeholders or "TBD".

| Field | Notes |
|---|---|
| `heroImage` | Web path from `/public`; image, video, or animated SVG. Cover stage — see Hero fields above |
| `heroAlt` | Non-empty alt text for the hero, including video and live covers. Cover stage — see Hero fields above |
| `heroPoster` | Poster frame for a video hero. Cover stage — see Hero fields above |
| `heroVideoLoop` | Boolean, default `true`; whether a video hero loops. Cover stage — see Hero fields above |
| `subtitle` | Long descriptive title; renders below `title` in the project page header only — not on cards. Write for long-form readability, not scannability. |
| `links.github` | Full URL; confirm with user before publishing — fork vs. original vs. org repo, never guessed. Renders as "Code" + GitHubIcon |
| `links.paper` | External URL to a published academic work. Renders as "Paper" + ArticleIcon |
| `links.report` | Relative path to a self-hosted PDF (e.g. `/projects/<slug>/report.pdf`). Renders as "Report" + DescriptionIcon |
| `links.presentation` | Full URL or relative path to slides. Renders as "Slides" + SlideshowIcon |
| `links.demo` | Full URL. Renders as "Demo" + DeployedCodeIcon |
| `featured` | `true` / `false`; default false; max 3 featured projects site-wide |
| `logos` | Array of `{src, alt}`; `src` must start with `/`; only with confirmed brand permission — omit entirely if uncertain |
| `contributors` | Array of `{name, avatar, url?}`; `avatar` must start with `/` |
| `ogImage` | Falls back to `heroImage` if omitted |
| `metaDescription` | Max 160 chars; falls back to `summary` if omitted |
| `relatedProjects` | Array of slugs; validated at build — slugs must exist. **Not rendered by any component — omit unless one is built.** |

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

The `overview` object renders the recruiter-readable hero section. Content guidance and
density targets for every field → `narrative-structure.md` → Executive Overview vs. Deep
Technical Dive.

```yaml
overview:
  problem: |
    What problem exists and why it matters in real systems. Plain language.
  built: |
    What was done — the shape of the work. Honest about scope.
  results:              # optional
    - "Outcome-led bullet with one number"
  transferableSkills:   # for academic/freelance projects
    - "Gerund-led demonstrated capability"
  # For projectType: personal, use `learnings` instead of `transferableSkills`.
  # Use only one of the two — when both are set, only `transferableSkills` renders.
```

- `problem` and `built` are required and non-empty — the build fails on an empty string.
- `results`, `transferableSkills`, and `learnings` are optional but strongly recommended
  for featured and academic projects.
- **Write order.** The final overview is written last, after the body. With the rest of
  the frontmatter (`extraction-procedure.md` → Write frontmatter first), write a
  provisional one-line `problem` and `built` drawn from the approved Step 2 brief so the
  build passes, and omit the optional overview fields. Rewrite all of them once the body
  is complete (`extraction-procedure.md` → Write overview last).

---

## Slug rule

**Never add a `slug:` field.** The slug is derived from the MDX filename:
`content/projects/<slug>.mdx` produces slug `<slug>`.

---

## Body authoring rules

- **Headings** → `narrative-structure.md` → Heading limits.
- **No raw HTML.** Use the registered MDX components; roles and limits →
  `extraction-procedure.md` → Component audit. Registry: `src/components/mdx/mdx-components.tsx`.
- **No `<br>` for spacing** — let the layout handle whitespace.
- **No inline `style=` or `className=`** — no styling in MDX body.
- **No multiple consecutive blank lines.**

### Diagram and Figure props

Both take `src`, `alt`, `caption?`, `aspect?` and `width?`. `width` differs:

- `<Figure>` — `"default"` | `"wide"`
- `<Diagram>` — `"default"` | `"narrow"` | `"wide"`

```mdx
<Diagram
  src="/projects/<slug>/filename.svg"
  alt="Descriptive alt text"
  caption="Caption renders below the diagram."
  aspect="800/196"
/>

<Figure
  src="/projects/<slug>/filename.png"
  alt="..."
  caption="..."
  width="wide"
/>
```

`src` must be a web path starting with `/`. `alt` is required.

### DiagramRow and DiagramPanel props

- `<DiagramRow>` — `caption?`; `layout?`: `"2col"` (default) | `"2+1"`. `"2+1"` takes
  effect only with exactly 3 panels.
- `<DiagramPanel>` — `src`, `alt`, `aspect?`, `label?`.

---

## Build-fail conditions (reference)

Fails the build:
- Missing required field, or any field of the wrong type
- Empty `title` or `summary`
- `publishedAt` not in `YYYY-MM-DD` format
- Empty `overview.problem` or `overview.built`
- `overview.transferableSkills` or `overview.learnings` present but empty
- Empty `heroAlt`, `logos[].alt`, or `contributors[].name`
- Invalid `projectType` enum value
- Empty `tags` array, or more than 8 tags
- `summary` longer than 200 characters
- `metaDescription` longer than 160 characters
- More than 3 projects with `featured: true`
- Image paths not starting with `/` — `heroImage`, `heroPoster`, `ogImage`, `logos[].src`,
  `contributors[].avatar`
- `links.github`, `links.demo`, or `contributors[].url` not a valid URL
- `heroImage` is a video (`.mp4` or `.webm`) but `heroPoster` is missing
- `relatedProjects` references slugs that don't resolve to existing files

Fails the production release build only (`VERCEL_ENV=production`):
- No hero — neither a registered live cover nor a `heroImage`
- No `heroAlt`

Nothing warns. 4–6 tags is an authoring target, not a check.
