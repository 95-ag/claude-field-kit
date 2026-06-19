---
name: implement-ai-seo
description: Implements machine-readable and agent-readable web infrastructure — semantic HTML, JSON-LD structured data, metadata, llms.txt, robots.txt, canonical URLs, and OpenGraph/Twitter tags. Use this skill when the user wants to improve how crawlers and AI agents read a site. Trigger on phrases like "implement AI SEO", "add structured data", "set up llms.txt", "add JSON-LD", "improve semantic HTML", "machine-readable infrastructure", "add metadata", "robots.txt", "OpenGraph tags", or "make this site machine-readable". Do NOT trigger for content strategy, keyword research, link building, or analytics — this skill covers infrastructure and semantics only.
---

## Role

You implement machine-readable and agent-readable web infrastructure. Add what is missing, correct what is wrong, scaffold what does not exist — without fabricating content, degrading accessibility, or disrupting existing layout and styling.

Read `REFERENCE.md` for JSON-LD schema examples, llms.txt format, robots.txt patterns, and metadata templates.

## Non-negotiable rules

- Pull all metadata values from actual page content — never invent titles, descriptions, or entity data
- Do not add semantic HTML tags that misrepresent the actual structure
- Do not keyword-stuff metadata fields
- Do not add JSON-LD types that do not accurately describe the page content
- Preserve existing styling, layout, and accessibility behavior
- Skip areas that are already correctly implemented — do not rewrite working infrastructure
- If a value cannot be determined from the content, leave the field out and flag it for the user to fill in

## Workflow

Inventory first, implement second. Never skip the inventory step.

### 1. Inventory

Read the codebase to understand:
- Current HTML structure and semantic element usage
- Existing `<head>` metadata
- Presence/absence of JSON-LD
- robots.txt and sitemap configuration
- Whether the site uses SSR, SSG, or client-side rendering
- Whether the site uses a framework metadata API (e.g., Next.js `export const metadata`) or raw `<meta>` tags
- Presence/absence of llms.txt

State what exists and what is missing before making any changes. Skip areas that are already correctly implemented.

### 2. Semantic HTML

Ensure the document uses structural semantic elements correctly:
- `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`
- One `<h1>` per page, logical heading hierarchy with no skipped levels
- `<time datetime="">` for dates
- `<address>` for contact information
- `aria-label` on landmark elements where multiple of the same type exist

Do not add semantic elements that do not reflect actual content structure.

### 3. JSON-LD structured data

Implement the appropriate schema type for the page content:
- `Article` / `BlogPosting` — editorial content
- `Organization` / `Person` — about pages, author profiles
- `Product` — product pages
- `FAQPage` — FAQ sections
- `BreadcrumbList` — navigation path
- `WebSite` — homepage with sitelinks search
- `SoftwareApplication` — app or tool pages
- `CreativeWork` — portfolio projects, technical case studies, produced artifacts that are not standard editorial articles

Place JSON-LD in a `<script type="application/ld+json">` tag. Google accepts it in either `<head>` or `<body>` — both are valid. In Next.js App Router, inject it via a server component in the JSX body using `dangerouslySetInnerHTML`. Use only fields that can be populated from real content. See `REFERENCE.md` for schema structure.

### 3a. Framework metadata APIs

Some frameworks expose a structured API for `<head>` metadata instead of raw HTML tags. Check before writing raw `<meta>` elements. In Next.js App Router: static metadata uses `export const metadata: Metadata = { ... }` in a layout or page; dynamic metadata uses `export async function generateMetadata({ params })`. The framework renders the tags server-side. See `REFERENCE.md` for the TypeScript pattern.

Regardless of which approach is used, the required fields (title, description, canonical, OpenGraph) remain the same.

### 4. Canonical and core metadata

In `<head>`, ensure:
- `<title>` — descriptive, under 60 characters, reflects actual page content
- `<meta name="description">` — 120–160 characters, summarizes actual content
- `<link rel="canonical" href="...">` — absolute URL of the current page

### 5. OpenGraph and Twitter metadata

See `REFERENCE.md` for the full template. Use real values only. If no OG image exists, flag it rather than omitting silently.

In Next.js App Router, an `opengraph-image.tsx` file in a route segment auto-generates an OG image at that route's URL (e.g., `/opengraph-image`). Reference it explicitly in each page's `openGraph.images` array — a page-level `openGraph` object fully replaces the layout's (no field-level inheritance). If you override `openGraph` on any page, always include `images` explicitly.

### 6. robots.txt

Verify robots.txt:
- Exists at the root
- Does not accidentally block crawlers that should have access
- Includes a `Sitemap:` directive
- AI crawler directives (GPTBot, ClaudeBot, etc.) match the site's intent

If blocking specific AI crawlers is intentional, confirm with the user before modifying. See `REFERENCE.md` for directive patterns.

### 7. llms.txt

If the site serves content intended to be read by AI agents, scaffold `/llms.txt` at the root. Populate from actual site content — purpose, structure, key pages. Do not pad with marketing copy. See `REFERENCE.md` for format.

In Next.js App Router, implement it as a Route Handler at `app/llms.txt/route.ts` (adjust for your project's directory structure — some projects use a `src/` prefix) returning a plain text `Response` with `export const dynamic = "force-static"`. This allows the content to be generated from site data rather than maintained as a separate static file. A static file at `public/llms.txt` is also valid for simpler cases.

### 8. SSR / initial HTML visibility

If the site uses client-side rendering:
- Flag content that is invisible in the initial HTML response
- Recommend SSR or SSG only for content-critical, publicly-indexed pages where crawler visibility has practical value
- Do not recommend SSR/SSG migrations for dashboards behind authentication, highly interactive tools, or low-index-value surfaces
- Note which pages are affected and explain the tradeoff

Do not implement SSR changes directly unless the user confirms — flag and explain.

## Output

After implementing changes, summarize:
- What was added or modified
- What was skipped (already correct)
- What requires user input to complete
- Any rendering issues flagged but not changed
