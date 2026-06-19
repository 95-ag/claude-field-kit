# Content Rules

Full frontmatter schema, field definitions, and validation rules are in `docs/SCHEMA.md`. Read it before authoring or modifying any MDX content or content utilities. These rules govern authoring behavior.

## Frontmatter

- Slug is derived from the MDX filename — never add a `slug:` field
- Missing required fields fail the build — check `docs/SCHEMA.md` §3 for the required field list
- Missing optional fields render nothing — never use placeholders or "TBD"
- Image paths must start with `/` (web paths from `/public`, not filesystem paths)

## Hero Media

- If `heroImage` is a video, `heroPoster` is required — missing it fails the build
- No GIFs — use video instead
- No Lottie/JSON animations for hero media
- All videos are muted — no exceptions

## Project Type

- `projectType` is internal metadata — never display it as a badge, label, or tag in the UI
- It drives sort order and section visibility only — see `docs/SCHEMA.md` §3 for behavior

## MDX Body

- H1 is never used in MDX body — one H1 per page comes from the layout
- H2 is reserved for top-level deep-dive section headings only
- No raw HTML — use the available MDX components
- No `<br>` for spacing, no inline `style=` or `className=`

## Validation

- Zod schemas live in `/lib/schemas/` — keep them as the single source of validation logic
- Build-fail and build-warn conditions are documented in `docs/SCHEMA.md` §3.5
