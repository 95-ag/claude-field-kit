# Quality Signals Reference

Visual signals that create low-budget vs premium perception. Use this when the runtime diagnosis needs more pattern depth. Do not reproduce this list verbatim in output — use it to calibrate judgment.

## Important safeguard

These are heuristics, not universal laws. A signal only becomes a quality failure when it:
- conflicts with the product category
- breaks internal consistency
- reduces clarity
- or undermines intentionality

Many premium products intentionally violate individual rules. What matters is whether the system feels deliberate and cohesive overall. Evaluate against that standard — not against an aesthetic checklist.

Broadly reliable signals (apply in most contexts):
- inconsistent border-radius across components
- mixed icon weights or sources
- flat type scale with no hierarchy
- equal-weight color palette
- no distinct spacing tiers

Context-sensitive signals (evaluate against category and intent before flagging):
- pure white or black backgrounds
- centered layouts
- system fonts
- high saturation
- no shadows

## Typography signals

| Low-budget signal | Premium signal |
|---|---|
| Flat type scale — H1 and H2 nearly the same size | Distinct scale with 1.5×+ ratio between levels |
| Body and label weights indistinguishable | 2+ weight steps between primary, secondary, tertiary |
| Default system font with no sizing intentionality | Intentional typeface with considered size/weight choices |
| Letter-spacing on headlines left at default | Headlines tightened (−0.01em to −0.03em) |
| Line-height at browser default (1.2) | Body at 1.5–1.6, display tighter |
| Mixed font families with no clear role distinction | Each face has a distinct job: display, body, UI |

## Spacing signals

| Low-budget signal | Premium signal |
|---|---|
| No visible grid — elements almost-aligned | Consistent 8pt grid, everything snapped |
| Same spacing value at every level | Distinct tiers: internal, grouping, section |
| Cards with 8px internal padding | Generous padding — 20–32px — content has room |
| Section gaps indistinct from component gaps | Section gaps 2× or more of largest internal gap |
| Inconsistent vertical rhythm between elements | Predictable interval scale throughout |

## Color signals

| Low-budget signal | Premium signal |
|---|---|
| Too many colors at equal weight | Clear dominant / secondary / accent hierarchy |
| Accent color used everywhere | Accent used sparingly — 10–15% max surface |
| Pure neutral grays on chromatic surfaces | Tinted neutrals that harmonize with primary hue |
| Full-saturation colors at full opacity | Saturation calibrated — often 70–85% of max |
| Colors that feel added rather than chosen | Every color has a named functional role |

## Layout signals

| Low-budget signal | Premium signal |
|---|---|
| No max content width — text runs full viewport | Controlled reading column and content max-width |
| Columns that don't share a baseline grid | Consistent baseline alignment across columns |
| Elements that float without container relationship | Clear container hierarchy, everything belongs somewhere |

## Component quality signals

| Low-budget signal | Premium signal |
|---|---|
| Inconsistent border-radius across components | Single radius scale applied consistently |
| Buttons undersized or under-padded | Buttons with generous padding — min 44px height |
| Icons from mixed sources (different stroke widths) | Single icon set, consistent stroke and style |
| Borders at full-opacity black | Borders using surface-relative color tokens |
| Inconsistent shadow values | Single elevation scale or no shadows (tonal only) |

## Consistency signals

| Low-budget signal | Premium signal |
|---|---|
| Two or three versions of the "same" component | One component, applied everywhere |
| Slightly different grays that should be one | Gray derived from a single scale |
| Mixed icon stroke weights | One icon weight throughout |
| Some interactive elements have hover states, others don't | Consistent interactive behavior across all elements |
