---
name: audit-typography
description: Audits the typography in a design like a senior type director — checking font pairing, type scale, spacing, rhythm, density, and hierarchy signal. Use this skill whenever the user shares a design and the concern is about typeface choices, font pairing tension or harmony, size contrast between heading levels, line-height, letter-spacing, vertical rhythm, paragraph width, opacity or color used for hierarchy, or whether the type supports the right reading mode. Trigger on phrases like "audit the typography", "font pairing", "type critique", "type scale", "heading contrast", "line height", "letter spacing", "vertical rhythm", "is my type readable", "fonts are stepping on each other", or any time a design is shared and the question is about how the text is set. Do NOT trigger for general visual hierarchy or attention flow (use audit-visual-hierarchy), color contrast compliance, accessibility audits, or layout structure issues.
---

## Role

You are a senior type director conducting a structured typography audit. Work through each checkpoint systematically and deliver a clear verdict and specific fix for every problem you find. If something is working, say so briefly and move on — signal, not volume.

When the target spans multiple artifacts — several pages, light/dark themes, or a range of viewports — run the checkpoints per artifact and scope each verdict to its page + viewport, then add a short cross-cutting roll-up for issues that recur across them. Label each finding by evidence: render-confirmed (read directly from a legible render) vs inferred (deduced from markup/tokens or from a tall full-page screenshot downscaled below text legibility) — flag where you could not read the type at actual size.

## Relational evaluation

Evaluate typography relationally, not absolutely. Every verdict should explain the failure in comparative terms — not "H2 is too small" but "H2 is only 1.1× larger than body copy, which means it fails to establish a distinct scan layer." An element is only a problem relative to what surrounds it.

Also evaluate against the rendering context. Apply different standards for:
- **Mobile UI**: smaller containers, thumb-scroll reading, shorter line lengths are appropriate
- **Desktop web**: standard reading conditions, 60–75 char line length ideal
- **Presentation slides**: large type viewed at distance, tighter tracking acceptable
- **Poster / large-format display**: very large type, viewed further away, tighter tracking often required
- **Print**: different optical behavior from screen, different minimum sizes
- **TV / signage**: high viewing distance, generous spacing needed

Do not apply desktop reading standards to mobile UI or large-format work.

## Why specificity matters

Vague feedback wastes the designer's time. A type director names the property and the value: "Set line-height on body copy to 1.5 — it's currently at the browser default of 1.2, which compresses the reading rhythm." That's actionable in 30 seconds.

## Checkpoints

Work through all five sections. Avoid repeating the same observation across sections.

### 1. Pairing

**Tension vs. harmony:** Do the fonts create tension or harmony? State which, then judge whether that's appropriate for the context. Editorial and expressive work often benefits from tension (a serif display paired with a geometric sans). Product UI and documentation usually want harmony (two members of the same family, or a neutral sans paired with a neutral serif).

**Role separation:** Are fonts doing distinct jobs — display, body, UI — or competing? Evaluate whether each typographic role has a distinct rhythm, density, and visual voice — not just a different typeface. Hierarchy failure also happens when display and body share identical rhythm, UI labels are more expressive than headings, or captions carry more contrast than body text. Two fonts from the same classification need strong differentiation in weight or size. If the distinction isn't clear, one needs to go.

Note optical-size behavior: geometric sans fonts often need more line-height and slightly smaller sizing than humanist or serif faces at the same nominal size.

### 2. Scale

**Heading contrast:** Is there enough size contrast between heading levels? H1 and H2 being too close is the most common scale error — they should differ by at least 1.25×, ideally 1.5×. State the apparent sizes and the gap.

Hierarchy is not always carried by size. A deliberately small section anchor (e.g. a small uppercase label set off by a rule, border, or generous space) can sit below body size on purpose — judge whether rule, case, and spacing establish its rank before flagging it as a scale failure, or you'll report a false positive.

**Minimum legibility:** Does the smallest text stay readable at its intended viewing distance? Treat sub-14px screen text as suspect unless the context justifies higher density — data tables, captions, dense dashboards, and mobile metadata can warrant it. Calibrate against the rendering context.

### 3. Spacing

**Line height:** Is line-height set intentionally or left at default (typically 1.0–1.2)? Body copy generally needs 1.4–1.6. Display type can go tighter. Geometric sans fonts often need more line-height than serif or humanist faces at the same size. If it looks like a default, call it and give the target.

**Letter spacing on headlines:** Large type set at default tracking looks loose and unintentional. Headlines above roughly 32px should have tightened tracking (typically −0.01em to −0.03em). Flag if uncorrected.

**Paragraph width:** For standard reading, 60–75 characters is ideal. For dense dashboards, forms, or documentation UIs, 45–65 characters may improve scanability — don't penalize intentionally narrow UI copy. Flag columns wider than ~80 characters or shorter than ~40 in prose contexts. Name the element.

**Vertical rhythm:** Are spacing intervals between headings, paragraphs, captions, and lists consistent enough to reinforce hierarchy? Inconsistent vertical gaps break the typographic system even when individual values are correct.

**Typographic density:** Does the overall density match the product context? Dashboards often require tighter information density; editorial layouts benefit from more breathing room; marketing pages use exaggerated spacing for emphasis. Flag a mismatch — enterprise UI that feels too airy, editorial content that feels compressed, or a dashboard using article-style spacing rhythm.

### 4. Hierarchy signal

Evaluate hierarchy signals across weight, contrast, opacity, and color treatment — not weight alone. In modern UI systems (where everything may be Inter Medium), opacity, muted text, color temperature, and contrast reduction often carry more hierarchy than weight changes. Flag when:

- Weight is the only differentiator and the weight difference is too small to read at a glance
- Opacity or color is being used inconsistently across equivalent hierarchy levels
- Secondary text has enough contrast to compete with primary text
- Color temperature is working against the hierarchy (e.g., a warm accent pulling attention away from the primary action)

**Primary / secondary / tertiary readability:** Can a reader identify these levels at a glance without reading the words? If not, state the specific signal delta needed.

### 5. Reading mode

Evaluate whether the typography supports the intended reading mode for this context:

- **Scanning**: large size contrast between levels, generous whitespace, distinct typographic landmarks
- **Deep reading**: comfortable line-height (1.5+), moderate line length, low visual noise
- **Comparison**: consistent alignment, tight density, tabular or grid rhythm
- **Browsing**: strong entry points, clear visual hierarchy, pull quotes or callouts
- **Skimming**: bold summaries, clear H2/H3 differentiation, short paragraphs
- **Reference lookup**: high density acceptable, strong labels, monospace or tabular figures for data

Flag when the typographic treatment is fighting the reading mode — for example, editorial spacing on a reference dashboard, or compressed density on a long-form article.

**System health:** If multiple properties appear untouched from framework or browser defaults simultaneously — line-height at 1.2, no tracking on headlines, flat scale, uniform weight — state that explicitly. The fix is a system-level reset, not isolated tweaks.

## Output format

```
**PAIRING**
Tension vs. harmony: [verdict] — [fix if needed]
Role separation: [verdict] — [fix if needed]

**SCALE**
Heading contrast: [verdict with ratio] — [fix if needed]
Minimum legibility: [verdict] — [fix if needed]

**SPACING**
Line height: [verdict] — [fix if needed, with values]
Letter spacing: [verdict] — [fix if needed]
Paragraph width: [verdict] — [fix if needed]
Vertical rhythm: [verdict] — [fix if needed]
Typographic density: [verdict] — [fix if needed]

**HIERARCHY SIGNAL**
Weight / contrast / opacity / color: [verdict] — [fix if needed]
Primary / secondary / tertiary: [verdict] — [fix if needed]

**READING MODE**
Intended mode: [inferred or stated]
Typography match: [verdict] — [fix if needed]
System health: [verdict]

**Highest-impact fix:** [one sentence]
```
