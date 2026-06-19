# MDX

Conventions for projects that render authored content through MDX. Include this guide only when the project uses MDX or a comparable authored-content system.

## Content boundaries

- MDX is content, not application code.
- Keep business logic, data fetching, and application state outside MDX files.
- Use frontmatter for structured metadata and the content body for authored content.

## Components

- Use the project's registered MDX component set.
- Do not embed arbitrary application components directly into content without registering them through the MDX renderer boundary.
- Component behavior should remain predictable for non-technical content authors.

## Markup

- Prefer standard Markdown syntax whenever it can express the content.
- Do not use raw HTML in MDX bodies unless the project explicitly permits it.
- Do not use `<br>` for layout or spacing.
- Do not use inline styling (`style=`) or presentation-specific classes in authored content.
- Presentational decisions belong to the design system and MDX component layer, not the content itself.

## Headings

- The page title (`<h1>`) is supplied by the page layout or document shell.
- Do not author an H1 within the MDX body.
- Heading levels within content must remain sequential and accessible.

## Code blocks

- Syntax highlighting is performed at build time.
- Do not introduce client-side syntax highlighting unless explicitly required.
- Code block styling and theme behavior are owned by the renderer, not individual documents.

## Assets

- Reference images and media using the project's approved asset paths and components.
- Image alt-text and decorative-image rules follow accessibility.md → Images & media.

## Frontmatter

- Frontmatter fields must match the project's documented content schema.
- Missing values remain null or absent rather than using placeholder strings.
- Do not invent metadata that the source content does not provide.

## Authoring

- Content should remain portable, readable, and source-controlled as plain text.
- Repeated content patterns should become MDX components rather than copy-pasted markup.
- Structural changes to content rendering belong in the renderer layer, not individual documents.
