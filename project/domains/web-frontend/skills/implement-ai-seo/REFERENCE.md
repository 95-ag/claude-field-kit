# Implementation Reference

Templates and examples for machine-readable infrastructure. Use these as starting points — populate with real content values only.

---

## JSON-LD schema templates

### Article / BlogPosting

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Page title here",
  "description": "Short description of the article",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://example.com/about"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Site Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "datePublished": "2024-01-01",
  "dateModified": "2024-01-01",
  "url": "https://example.com/article-slug",
  "image": "https://example.com/article-image.jpg"
}
```

### Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Organization Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "contact@example.com",
    "contactType": "customer support"
  },
  "sameAs": [
    "https://github.com/org",
    "https://linkedin.com/company/org"
  ]
}
```

### Person

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Full Name",
  "url": "https://example.com",
  "jobTitle": "Job Title",
  "description": "One to two sentence professional positioning statement.",
  "image": "https://example.com/profile-photo.jpg",
  "worksFor": {
    "@type": "Organization",
    "name": "Employer Name"
  },
  "knowsAbout": ["Topic A", "Topic B", "Topic C"],
  "sameAs": [
    "https://github.com/username",
    "https://linkedin.com/in/username"
  ]
}
```

> **`sameAs` safety (Organization and Person):** Enumerate values explicitly — avoid `Object.values()` on a data object, which leaks any non-URL keys added to it later.

### FAQPage

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text here?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer text here."
      }
    }
  ]
}
```

### BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Section",
      "item": "https://example.com/section"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Current Page",
      "item": "https://example.com/section/page"
    }
  ]
}
```

### WebSite (homepage only)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Site Name",
  "url": "https://example.com"
}
```

### SoftwareApplication

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "App Name",
  "description": "What the application does",
  "url": "https://example.com",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web"
}
```

### CreativeWork

Use for portfolio projects, technical case studies, produced artifacts, or any non-editorial content that is not a standard article.

```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "Project or Work Title",
  "description": "What this work is and what it demonstrates.",
  "url": "https://example.com/work/project-slug",
  "datePublished": "2024-01-01",
  "inLanguage": "en",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://example.com"
  },
  "keywords": "keyword-one, keyword-two, keyword-three",
  "image": "https://example.com/project-image.jpg",
  "codeRepository": "https://github.com/username/repo"
}
```

`image` and `codeRepository` are optional — include only if the values exist. Omit `codeRepository` for works that are not software.

---

## Raw HTML metadata template (`<head>`)

```html
<!-- Core -->
<title>Page Title — Site Name</title>
<meta name="description" content="120–160 character description of this page's actual content.">
<link rel="canonical" href="https://example.com/current-page">

<!-- OpenGraph -->
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description.">
<meta property="og:url" content="https://example.com/current-page">
<meta property="og:image" content="https://example.com/og-image.jpg">
<meta property="og:type" content="website">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description.">
<meta name="twitter:image" content="https://example.com/og-image.jpg">

<!-- JSON-LD -->
<script type="application/ld+json">
{ ... }
</script>
```

---

## Next.js App Router — Metadata API (TypeScript)

Declare metadata as a typed export. The framework renders the tags server-side.

**Static metadata (layout or page):**

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"), // required in root layout for URLs to resolve
  title: {
    default: "Site Name",
    template: "%s | Site Name",
  },
  description: "120–160 character description.",
  alternates: {
    canonical: "/current-page",
  },
  openGraph: {
    type: "website",
    url: "/current-page",
    images: [{ url: "/opengraph-image" }], // always explicit — no inheritance from layout
  },
  twitter: {
    card: "summary_large_image",
  },
};
```

**Dynamic metadata (page with route params):**

```typescript
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // fetch or resolve data for slug
  return {
    title: "Page Title",
    description: "Page description.",
    alternates: { canonical: `/section/${slug}` },
    openGraph: {
      type: "article",
      url: `/section/${slug}`,
      images: [{ url: "/path/to/og-image.jpg" }],
    },
  };
}
```

`metadataBase` in the root layout is required for canonical and OG URLs to resolve as absolute URLs. A page-level `openGraph` object fully replaces the layout's `openGraph` — there is no field-level inheritance. Always include `images` explicitly when overriding `openGraph` on a page.

---

## robots.txt patterns

### Allow all crawlers, reference sitemap

```
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

### Block a specific AI crawler

```
User-agent: *
Allow: /

User-agent: GPTBot
Disallow: /

Sitemap: https://example.com/sitemap.xml
```

### Block multiple AI training crawlers

```
User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

Common AI crawler user-agent strings: `GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`, `CCBot`.

---

## llms.txt format

`llms.txt` is placed at the site root (`/llms.txt`). It describes the site's purpose and structure to AI agents in plain text. A richer structure is more useful than a bare sitemap in prose — include identity, positioning, capabilities, content, and contact.

```
# Site or Person Name

> One-line positioning or purpose statement. What this site is for and who it serves.

## About

Two to three sentences of substantive context — who created it, what it represents, what
distinguishes it. Write as if briefing a knowledgeable reader who has not seen the site.

## Capabilities / Expertise

- Capability area one: specific skills or subtopics
- Capability area two: specific skills or subtopics
- Capability area three: specific skills or subtopics

## Content

- /section-one: What this section covers and who it is for
- /section-two: What this section covers
- /blog: Type and frequency of content published here

## Key Pages

- /about: About the organization or person
- /work/project-slug: [Title](https://example.com/work/project-slug) — one-line summary
- /contact: Contact information and availability

## Contact

- [Platform Name](https://platform.com/handle)
- [Portfolio or contact form](https://example.com/contact)
```

Do not pad with marketing copy. Do not keyword-stuff. The goal is to give an AI agent enough structured context to accurately represent the site in summaries, answer questions about it, or recommend it to users.
