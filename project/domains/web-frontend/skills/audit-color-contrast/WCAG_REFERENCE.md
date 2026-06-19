# WCAG Contrast Reference

Objective thresholds for contrast compliance. Use this during the accessibility checkpoint in `SKILL.md`.

## Contrast ratio thresholds (WCAG 2.1 AA)

| Content type | Minimum ratio |
|---|---|
| Body text (below ~24px regular / ~18.5px bold in CSS pixels) | 4.5:1 |
| Large text (~24px+ regular / ~18.5px+ bold in CSS pixels) | 3:1 |
| UI components (structural/informational borders, icons, input outlines) | 3:1 |
| Graphical elements conveying information | 3:1 |
| Decorative elements | No requirement |
| Disabled / inactive elements | No requirement |

Note: WCAG defines large text as 18pt regular (~24px CSS) or 14pt bold (~18.5px CSS). WCAG AAA raises body text to 7:1 and large text to 4.5:1 — note if the design is targeting AAA.

**Which borders the 3:1 applies to:** The threshold covers borders that carry structure or information — input outlines, focus rings, the edge that delimits a control or separates content the user must perceive. A purely decorative hairline (a subtle divider or surface seam that conveys no state and bounds no control) has no contrast requirement. Before flagging a low-contrast border, decide which kind it is; only the structural/informational case is a failure.

## How to estimate contrast without a tool

When you can't measure precisely, estimate from the colors described or visible:

- White (#FFF) on mid-gray (#767676) ≈ 4.5:1 — the AA floor for body text
- White on dark gray (#595959) ≈ 7:1 — AAA for body text
- White on light gray (#AAAAAA) ≈ 2.3:1 — fails AA entirely
- Black on yellow (#FFFF00) ≈ 19.6:1 — always passes
- White on blue (#0057D9) ≈ 5.9:1 — passes AA for body text
- White on light blue (#4DA6FF) ≈ 2.9:1 — fails AA for body text

**Anti-overconfidence safeguard:** Visual estimation is approximate. If a ratio appears borderline, recommend verification with a measurement tool (WebAIM Contrast Checker, Figma Contrast plugin, Stark) rather than asserting compliance confidently. Contrast perception is especially unreliable with gradients, overlays, transparency, anti-aliased text, and tinted neutrals.

## Common failure patterns

**Light gray text on white:** Very common in minimal designs. Text at #999 on white = 2.85:1 — fails AA for all text sizes.

**White text on mid-saturation color:** A brand blue at #4A90D9 with white text ≈ 3.2:1 — passes for large text only, fails for body.

**Placeholder text:** Often styled at 40–50% opacity. Almost always fails — flag if placeholder text conveys required information.

**Disabled states:** Exempt from contrast requirements, but must be visually distinguishable as inactive.

**Focus indicators:** Must have 3:1 contrast against adjacent colors (WCAG 2.2). Commonly missed.

**Color-only status indicators:** Red/green status dots with no label or icon fail for colorblind users regardless of contrast ratio — this is a separate failure from contrast.

## Interactive element distinction

WCAG requires that interactive elements be identifiable without relying on color alone. Acceptable non-color differentiators:
- Underline on links
- Border or outline on buttons and inputs
- Shape change on hover/focus
- Text label ("Click here", not just a colored region)

A blue link with no underline in a body of blue-tinted text is a failure even if contrast is sufficient.
