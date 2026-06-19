# Root Cause Patterns

Use this to distinguish root causes from downstream symptoms. Most quality failures have one primary cause — fixing symptoms without the root produces temporary improvement at best.

## Important safeguard

Only force a single root cause when one problem clearly explains most downstream symptoms. Some designs fail from multiple interacting root causes, or cascading failures with no single dominant root. In those cases, name the two or three contributing causes rather than forcing false certainty.

## The key question

Ask: "If I fixed only this one thing, would the other problems resolve or persist?"

If they'd resolve → you found the root.
If they'd persist → you're looking at a symptom.

## Root cause patterns by category

### Typography
**Root indicator:** The design has no type system — size, weight, and spacing decisions were made element-by-element rather than from a defined scale.

**Downstream symptoms:** Heading levels feel similar, body and labels are indistinguishable, hierarchy can't be read at a glance, spacing between text elements is inconsistent.

**Distinguishing question:** Do heading sizes follow a ratio? Do weights follow a consistent step? If no to both, typography is likely the root.

---

### Spacing
**Root indicator:** No underlying grid. Spacing values were set by feel rather than a scale, producing values that are almost-but-not-quite consistent.

**Downstream symptoms:** Components look misaligned, section gaps feel indistinct from component gaps, internal padding is inconsistent across cards and forms, the layout feels restless.

**Distinguishing question:** Do spacing values land on a 4pt or 8pt grid? If not, spacing is likely the root.

---

### Color
**Root indicator:** The palette lacks hierarchy — too many colors at roughly equal weight, or an accent that appears everywhere and therefore emphasizes nothing.

**Downstream symptoms:** The design feels visually noisy, no single element draws the eye, the interface feels effortful to scan, the emotional signal is muddled.

**Distinguishing question:** Can you name the dominant, secondary, and accent color and point to where each appears? If not, color structure is the root.

---

### Layout
**Root indicator:** No grid system or content width constraint. Elements are positioned relative to each other rather than to a shared structure.

**Downstream symptoms:** The design looks different at every breakpoint, columns feel arbitrary, text runs too wide or too narrow, the page lacks a stable visual frame.

**Distinguishing question:** Is there a max content width? Do columns share a common grid? If not, layout is the root.

---

### Component quality
**Root indicator:** Individual components look assembled rather than designed — inconsistent radius, padding, border treatment, or interactive states across components that should share a system.

**Downstream symptoms:** The design feels inconsistent at the micro level even when the macro layout is reasonable, interactive elements behave differently in different contexts.

**Distinguishing question:** Do all cards, all buttons, all inputs share the same structural properties? If the same component type has multiple unintended variations, component quality is the root.

---

### Consistency
**Root indicator:** The same design decision was made differently in different parts of the product — producing a design that feels like multiple designers working without shared rules.

**Downstream symptoms:** Heading capitalization changes between sections, some elements have hover states and others don't, icon stroke weights vary, neutral grays are subtly different throughout.

**Distinguishing question:** Is the inconsistency isolated to one area (likely a symptom) or spread throughout the product (likely the root)? Systemic inconsistency points to a missing design system, not a collection of individual mistakes.

---

### Design tokens / theming
**Root indicator:** In a token-driven or multi-theme system, a shared token was tuned for one theme or state and not validated against the others — so quality diverges by theme/state rather than by component.

**Downstream symptoms:** A component looks right in one theme and degraded in another (washed-out, low-contrast, or off-weight), the same fix has to be reapplied per theme, emphasis or surface depth reads differently across themes for no intentional reason.

**Distinguishing question:** Does the same component hold up across every theme and state? If it breaks only in one, suspect a per-theme token value, not the component itself.

---

## Common misdiagnoses

**"The colors are wrong" is often a spacing problem.** When spacing is poor, colors compete more visibly because there's no breathing room to separate them. Fix spacing first — the color problem may partially resolve.

**"The typography is weak" is often a consistency problem.** When the same heading is styled differently across pages, it reads as weak — even if individual type choices are sound.

**"The layout feels off" is often a component quality problem.** When components have inconsistent internal structure, the layout around them can't resolve properly regardless of the grid.

## Highest-leverage fix patterns

- **Root is typography →** Set 4 scale levels with clear size and weight differentiation. Everything else responds
- **Root is spacing →** Establish the grid and spacing tiers. The layout will snap once spacing is systematic
- **Root is color →** Simplify the palette: remove arbitrary colors, establish one clear accent, tint the neutrals
- **Root is layout →** Set a max content width and column grid first. Content will find its place once the container is defined
- **Root is component quality →** Standardize one component type end-to-end (usually the primary button or card). Use it as the reference for everything else
- **Root is consistency →** Audit one pattern across the entire product (border-radius, button states, heading levels) and resolve it everywhere before moving to the next
- **Root is tokens / theming →** Fix the offending token at its source and validate it across every theme and state, rather than patching the component per theme
