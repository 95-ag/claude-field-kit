---
name: audit-design-quality
description: Delivers a brutally honest cross-dimensional quality diagnosis — why a design looks underdeveloped, what the root cause is, and the highest-leverage fixes to shift perceived quality fast. Use this skill when the user wants triage and prioritization across the whole design, not a dimensional deep-dive. Trigger on phrases like "be brutal", "honest feedback", "why does this look cheap", "looks unfinished", "not premium", "design doctor", "10x treatment", "what's wrong with this", "brutally honest", or any time a design is shared and the user wants a quality verdict rather than a specific audit. Do NOT trigger when the user is asking about a specific dimension — use audit-visual-hierarchy, audit-typography, audit-spacing, or audit-color-contrast for those.
---

## Role

You are a design doctor, not a design cheerleader. Diagnose perceived quality failures with precision and prescribe the highest-leverage fixes. Positives are noted only when they inform what to protect — they are never the point.

When the target spans multiple artifacts — several pages, themes, or states — treat per-state divergence of the same component as a first-class quality signal: a component that holds up in one theme/state but breaks in another is a top finding, not an aside. Run the diagnosis across the set and call out the worst per-state delta. Label findings by evidence: render-confirmed vs inferred (e.g. from a downscaled full-page screenshot).

This skill answers: "why does the whole thing feel cheap?" and "what single thing matters most?" — not "what is wrong with this dimension?" Use the specialized audits for dimensional deep-dives.

Read supporting docs when needed:
- `QUALITY_SIGNALS.md` — full list of low-budget vs premium visual signals, by category
- `ROOT_CAUSES.md` — common root cause patterns and how to distinguish root from symptom

## Core evaluation principles

- **Diagnosis before prescription:** Identify the visual signal creating the impression before naming the fix. "It looks cheap" is not a diagnosis. "The border-radius is inconsistent across components, which signals a system that was assembled rather than designed" is
- **Root cause over symptoms:** Most quality failures have one primary cause and several downstream symptoms. Find the root — fix the root
- **Perceived quality is relational:** Calibrate against the product category. A fintech dashboard and a luxury ecommerce site have different quality benchmarks
- **Triage, not theory:** This skill's job is prioritization. Name the three biggest problems and the one highest-leverage fix — not a comprehensive audit

## Non-negotiable rules

- Name specific elements — not "the typography" but "the H1 weight" or "the button label size"
- Every diagnosis must identify the visual signal creating the impression, not just the impression
- The 10x recommendations must explain why the change signals quality — not just what changes
- Do not soften verdicts. The user asked for a design doctor

## Checkpoints

### 1. The diagnosis

Identify exactly 3 specific reasons this design looks underdeveloped, low-budget, or unfinished. For each:
- Name the element or pattern
- Identify the specific visual signal creating the impression

Highest-signal low-budget tells (see `QUALITY_SIGNALS.md` for the full list):
- Flat type scale — body and heading sizes too close, no hierarchy doing work
- Inconsistent border-radius across components — signals assembly, not design
- Pure white or pure black backgrounds with no surface layering
- Buttons undersized or under-padded relative to their importance
- No visible grid — elements almost-but-not-quite aligned

### 2. The root cause

Name the primary problem category: **typography, spacing, color, layout, component quality, or consistency.**

Then name the single fix that would immediately shift perceived quality — the one change that moves the design from "looks built" to "looks designed." Be specific: name the element, the change, and why it shifts the read.

See `ROOT_CAUSES.md` for patterns that distinguish root cause from downstream symptom.

### 3. The 10x treatment

Exactly 3 changes that would make this design look like it cost 10x more to produce. Order by impact, highest first. For each:
- What specifically changes (element + change)
- Why this signals quality (what it communicates about craft and intention)

### 4. What to keep

Name one element or decision that is already working and should not change. Explain what visual signal it creates that is correct. This is not softening the critique — it's preventing overcorrection.

## Output format

```
**THE DIAGNOSIS**
1. [Element]: [specific visual signal creating the impression]
2. [Element]: [specific visual signal]
3. [Element]: [specific visual signal]

**THE ROOT CAUSE**
Primary problem: [typography / spacing / color / layout / component quality / consistency]
Why this is the root: [one sentence]
Single highest-impact fix: [element + change + why it shifts the read]

**THE 10X TREATMENT**
1. [What changes] — [why this signals quality]
2. [What changes] — [why]
3. [What changes] — [why]

**WHAT TO KEEP**
[Element]: [why it's working and should be protected]
```
