# Visualizers — type scale

`TypeScaleList` — the typography scale, whose left column is metadata and whose right column renders
each token live. Shared contract → `visualizer-kit.md`; gate → `visualizer-dogfood.md`.

---

## 2. TypeScaleList

**File:** `type-scale.tsx`

### Types

```
TypeToken = {
  token: string                         // CSS class name: "display-primary", "body-lead"
  family: string                        // font family: "Manrope", "Inter", "JetBrains Mono"
  size: number                          // desktop px value
  weight: number                        // 400 | 500 | 600
  lh?: number                           // line-height px; omit where the doc states none
  sample: string                        // one-line text describing WHERE the token is used in the
                                        // product (sourced from DESIGN.md Typography "Role" column);
                                        // NOT lorem ipsum, NOT an alphabet run.
                                        // e.g. "Major section headers across the home and work pages."
  responsive?: { tablet: number; mobile: number }  // only for tokens with responsive sizing
  tabletLh?: number                     // per-tier line height, px; omit where the doc states none
  mobileLh?: number                     // per-tier line height, px; omit where the doc states none
}
```

### P1 — Template (universal structure)

Treatment classes appear as `{PLACEHOLDERS}` throughout; P2 resolves them (`visualizer-kit.md`).

```
<div class="flex flex-col">             ← no gap; the row border provides rhythm

  {tokens.map(t =>
    <div class="grid grid-cols-1 gap-[{sp}]
                border-b {DIVIDER} py-[{sp}] last:border-b-0
                md:grid-cols-[280px_1fr] md:items-baseline md:gap-[{sp}]">

      LEFT COLUMN — token metadata (280px at md+), stacked in fixed order:
      <div class="flex flex-col gap-[{sp}]">
        <span class="{T_CODE}">.{t.token}</span>                      ← class name, leading dot
        <span class="{T_META}">{t.family} · {t.size}px / {t.weight}
                               {t.lh != null && " / lh " + t.lh}</span>
        {t.responsive &&
          <span class="{T_CAPTION}">↘ desktop {t.size}px
                                    → tablet {…}{t.tabletLh != null && " / lh " + t.tabletLh}
                                    → mobile {…}{t.mobileLh != null && " / lh " + t.mobileLh}</span>}
      </div>

      RIGHT COLUMN — live sample, class IS the token:
      <div class="{t.token} min-w-0">{t.sample}</div>
      ↑ the class is the token — the sample renders at its own type scale

    </div>)}

</div>
```

Fixed: one row per token; rows separated by `border-b` (no gap); two-column `280px_1fr` at md+, single
column on mobile; left-column stack order **class → metrics → responsive**. The **280px** left-column
width is a gallery layout constant (documented bare-px exception), not a design token. An omitted
line height drops its `/ lh …` clause rather than rendering a placeholder.

**A per-tier line height on a token with no responsive sizing is an open design gap, not a silently
dropped value.** `tabletLh` / `mobileLh` render inside the responsive caption, so a token stating
one without `responsive` has nowhere to show it. The row shows none and the entry is reported as an
open design gap for `design-write` — do not let the `t.responsive` guard swallow a documented value
in silence.

### P2 — Visual alignment (resolve from DESIGN.md)

- **`{T_CODE}` · `{T_META}` · `{T_CAPTION}`** — left-column metadata text by role: class name = code /
  identifier · the `family·size/weight/lh` line = eyebrow / metadata · responsive steps = secondary /
  caption.
- **`{DIVIDER}`** = the project's hairline / divider token.
- **`{sp}`** — row padding and gaps from the project's spacing scale.
- **Dogfood (ENFORCED):** the right-column sample carries **only** `class={t.token}` — no color, size,
  weight, line-height, or family override. The token class bakes its own color and metrics; any override
  is a violation. This is the section's whole point — render each token AS itself.

---

