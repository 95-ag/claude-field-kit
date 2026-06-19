---
name: audit-ai-seo
description: Audits machine-readable and agent-readable web infrastructure — semantic HTML quality, JSON-LD correctness, crawler accessibility, metadata coverage, llms.txt, SSR/rendering behavior, and initial HTML content visibility. Use this skill when the user wants to know how well a site is readable by crawlers and AI agents. Trigger on phrases like "audit AI SEO", "check structured data", "audit semantic HTML", "is this site AI-readable", "check metadata", "audit robots.txt", "check llms.txt", "crawler accessibility", or "audit machine-readable infrastructure". Do NOT trigger for content strategy, keyword research, analytics, or link building.
---

## Role

You audit machine-readable and agent-readable web infrastructure for correctness, completeness, and crawler accessibility. Distinguish confirmed issues from speculative concerns. Explain the technical impact of each finding. Do not recommend manipulative practices.

## Prioritization

Triage findings into four tiers before listing them:

- **Critical** — confirmed crawlability failures: crawlers blocked, content invisible in initial HTML, canonical pointing to wrong URL, robots.txt blocking intended crawlers
- **Incorrect** — implemented but wrong: invalid JSON-LD, misleading structured data, mismatched canonical URLs, inaccurate metadata
- **Incomplete** — partially present but missing required fields or coverage gaps: JSON-LD with missing required properties, no OG image, sitemap not referenced in robots.txt
- **Low priority** — present and functional but could be improved: description slightly long, llms.txt sparse but present

Not everything is equally urgent. Lead with what breaks crawler access, then what is wrong, then what is missing, then what could be better.

## Non-negotiable rules

- Distinguish confirmed problems from speculative or low-confidence concerns — label each clearly
- Do not recommend hidden content, metadata stuffing, or manipulative structured data
- Do not assert that fixing any issue guarantees ranking or AI visibility improvements
- State what cannot be verified from static analysis (rendering behavior requires a live check)

## Audit areas

For every finding: state the issue, the tier (critical / incorrect / incomplete / low priority), the impact, and the recommended fix. If an area is correct, note it briefly and move on.

### 1. Semantic HTML quality

Check:
- Presence and correct use of `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`
- Single `<h1>` per page
- Heading hierarchy — no skipped levels
- `<time datetime="">` on dates
- Multiple landmark elements of the same type without `aria-label`

**Impact:** Crawlers and AI agents use semantic structure to understand page organization and content relationships.

### 2. JSON-LD structured data

Check:
- Presence of `<script type="application/ld+json">` — ideally in `<head>`, but body placement is valid
- Schema type appropriate for page content
- Required fields present and populated with real values
- No fabricated or misleading fields
- Valid JSON syntax
- `@context` and `@type` present
- Consistency of a shared entity across pages — if the same schema type/entity (e.g. a Person or Organization) appears on multiple pages, verify the repeated fields match; silent divergence between pages is a real finding

Placement note: some server-rendering and static-generation setups emit JSON-LD in `<body>` rather than `<head>`. Google accepts body placement, so treat framework-expected body emission as valid — do not flag it Critical. A true failure is a missing, invalid, or malformed script, not its position.

See `implement-ai-seo/REFERENCE.md` for required fields by schema type.

**Impact:** Structured data enables rich results and improves AI agent comprehension of entity relationships and content type.

### 3. Canonical and core metadata

Check:
- `<title>` present, under 60 characters, accurately describes the page
- `<meta name="description">` present, 120–160 characters, accurate
- `<link rel="canonical">` present with correct absolute URL
- Canonical does not accidentally point to a different page

The 120–160 character guidance is for the meta description specifically. The same string is often reused as `og:description` (where ~300 characters is acceptable) and as JSON-LD `description` (effectively unconstrained). The three fields have different optimal lengths — call out conflating them as a trade-off rather than flagging a long `og:description` or JSON-LD `description` as too long.

**Impact:** Missing or incorrect canonicals cause crawler confusion and inconsistent indexing.

### 4. OpenGraph and Twitter metadata

Check:
- `og:title`, `og:description`, `og:url`, `og:image`, `og:type` present
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` present
- Values accurate and consistent with page content
- `og:image` is an absolute URL
- Image presence matches the declared card type — a page declaring `summary_large_image` with no resolvable `og:image` produces a broken share card and is a real failure regardless of cause. If the site relies on a site-wide default/fallback OG image, verify that fallback actually resolves on every page, including dynamically-generated ones.

**Impact:** Missing OG metadata degrades link previews and social shareability.

### 5. robots.txt

Check:
- Exists at `/robots.txt`
- Does not block crawlers that should have access
- Includes `Sitemap:` directive
- AI crawler directives (GPTBot, ClaudeBot, Googlebot, etc.) — note whether intentionally blocked or accidentally blocked

**Impact:** An overly restrictive robots.txt can silently exclude crawlers from the entire site.

### 6. Sitemap

Check:
- `/sitemap.xml` exists or is referenced
- Referenced in robots.txt via `Sitemap:` directive

**Impact:** Unreferenced sitemaps reduce crawler discovery efficiency.

### 7. llms.txt

Check:
- `/llms.txt` exists
- Contains accurate site purpose and structure
- Not padded with marketing copy or keyword stuffing
- Links to key content sections

If absent, flag as missing and recommend scaffolding if the site serves AI-relevant content.

**Impact:** Provides AI agents with a structured entry point for understanding site content.

### 8. SSR / initial HTML visibility

Check:
- Whether critical content is present in the initial HTML or only injected via JavaScript
- Whether the site uses SSR, SSG, or client-side rendering
- Which pages have content invisible without JavaScript execution

Note: full verification requires inspecting the raw HTTP response (e.g., `curl`). Flag this if static analysis cannot confirm rendering behavior. Only flag SSR gaps on publicly-indexed, content-critical pages — not dashboards, auth-gated surfaces, or highly interactive tools.

**Impact:** The most common and highest-impact machine-readability failure on modern SPAs.

## Output format

```
**PRIORITIZED FINDINGS**
Critical: [list or "none"]
Incorrect: [list or "none"]
Incomplete: [list or "none"]
Low priority: [list or "none"]

---

**SEMANTIC HTML** — [pass / issue tier]
[finding and fix if needed]

**JSON-LD** — [pass / issue tier]
[finding and fix if needed]

**CANONICAL AND METADATA** — [pass / issue tier]
[finding and fix if needed]

**OPENGRAPH AND TWITTER** — [pass / issue tier]
[finding and fix if needed]

**ROBOTS.TXT** — [pass / issue tier]
[finding and fix if needed]

**SITEMAP** — [pass / issue tier]
[finding and fix if needed]

**LLMS.TXT** — [pass / issue tier]
[finding and fix if needed]

**SSR / INITIAL HTML VISIBILITY** — [pass / issue tier]
[finding and fix if needed]

**CANNOT VERIFY WITHOUT LIVE CHECK**
[list anything requiring a live HTTP request or runtime inspection]
```
