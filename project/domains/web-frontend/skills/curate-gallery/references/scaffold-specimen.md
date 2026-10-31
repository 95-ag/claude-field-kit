# Scaffold kit — specimen and card

The two primitives every demo is built from, and the rule for kit pieces a project adds of its own.
Section and group wrappers are in `scaffold-kit.md`. **How much text belongs on the page at all is
not decided here** — that is `parity-review.md` → The gallery is a visual partner to the doc, not a
second copy of it.

**Token names below are examples from one project — the structure is what is fixed.** Stated in full
in `scaffold-kit.md`; it applies to every `scaffold-*.md` file.

---

### `Specimen`

```
props:
  id:            string      // scroll-target id on the wrapper div (no ds- prefix)
  name:          string      // heading text; rendered at h3 or h4
  source?:       string      // import/file path shown in mono-code below the heading
  description?:  string      // body-primary caption shown below source, before children
                             // role + where used, plus any interaction hint ("resize below 768px
                             // and tap the menu"). Hints go HERE — there is deliberately no `note`
                             // prop, because `description` and `spec` already cover it.
  spec?:         string | string[]
                             // mono-anchor note shown BELOW children (token list, variant notes)
                             // string   → one block, as prose; prefer a `·`-separated token string
                             // string[] → a list inside the SAME block, one concept per entry.
                             //            Use the array for token/variant LISTS, not to hold prose.
  headingLevel:  3 | 4 = 3  // 3 at section level; 4 when inside a SpecimenGroup
  children:      node        // the demo (live render, ChromeFrame, ThemeShot, etc.)

structure:
  <div id={id}
       class="flex scroll-mt-[--spacing-4xl] flex-col gap-[--spacing-md]">

    // heading-component is the project's component-label type token
    <h3|h4 class="heading-component">{name}</h3|h4>

    {source      && <span class="mono-code">{source}</span>}
    {description && <span class="body-primary">{description}</span>}

    {children}

    {spec && <div class="mono-anchor">
               {isArray(spec) ? <ul>{spec.map(s => <li>{s}</li>)}</ul> : spec}
             </div>}

  </div>

field order (top to bottom): heading → source → description → children → spec
spec is ALWAYS last — it annotates the demo that precedes it.
```

**Prefer the array for a multi-part LIST — a set of tokens or variants — not for multi-part prose.**
The house convention is bullets, one concept per line, and a list of tokens is where that matters most:
written as one string it renders as a wall of prose under the demo it annotates, and readers skip it.
The string form stays for a single-clause spec, and a `·`-separated token string
("mono uppercase chip · surface-tag · radius-sm") is the house shape for the common case. Both forms
share the same `mono-anchor` block, so the token binding and the field order do not change either way.

**Read this as a formatting rule, never as a licence to say more.** It exists to stop long specs
rendering badly, never to encourage writing them: an array makes ten bullets look
tidy, which is exactly how a specimen becomes a copy of its doc sub-section. How much belongs on the
page at all is decided by `parity-review.md` → The gallery is a visual partner to the doc, not a second
copy of it: phrases not sentences, about five spec items at most, and every line present because
something must be seen.

`note`-shaped fields elsewhere in the kit (`SwatchGrid` and friends) already take a node and can hold a
list as-is — they need no widening.

**Full width by default:** the children container **stretches** (`align-items: stretch`) — each demo fills
the column, correct for the majority (cards, tables, chrome, diagrams, layer stacks, def-lists). The only
opt-out is a **bare single control** that must stay at intrinsic width (a lone button, tag, chip, copy-link,
code chip, or icon): wrap it in a `w-fit` (or a `flex` row) so the wrapper stretches while the control sits
natural + left-aligned. Multi-variant demos already sit in a `flex`/`grid` and need nothing. **Do NOT put
`items-start` on the Specimen** — that inverts the default and forces a `w-full` opt-in on every wide demo
(the common case), which is the error-prone direction. The opt-out list (single controls) is short; the
opt-in list (all wide demos) is not.

```
token bindings:
  --spacing-4xl    scroll-mt
  --spacing-md     gap between all fields
  heading-component h3/h4 type token (component label scale)
  mono-code        source path
  body-primary     description
  mono-anchor      spec note

headingLevel rule: every Specimen heading is exactly one level below its parent context.
  GallerySection context → h3. SpecimenGroup context → h4.
  Never skip levels.
```

---

### `Card`

```
props:
  label?:    string   // mono-code label below the box; typically a token name or slug
  className?: string  // classes merged into the inner box (e.g. "relative aspect-video overflow-hidden p-0")
  children:  node     // the demo content centered inside

structure:
  <div class="flex flex-col gap-[--spacing-xs]">

    <div class="flex min-h-[--spacing-3xl] items-center justify-center
                border border-[--hairline] bg-[--surface-deep]
                p-[--spacing-lg] {className}">
      {children}
    </div>

    {label && <span class="mono-code">{label}</span>}

  </div>

token bindings:
  --spacing-xs    outer gap (box to label)
  --spacing-3xl   min-h of the inner box
  --hairline      border
  --surface-deep  background fill
  --spacing-lg    internal padding
  mono-code       label text

law: Card adopts the project's existing card treatment exactly.
  border = --hairline, fill = --surface-deep, radius = per project (e.g. none).
  Never introduce new elevation, shadows, or radius values.

positioning: the inner box is neither positioned nor clipping. Pass "relative" in className
  for an absolutely positioned child (else it resolves against an ancestor), and
  "overflow-hidden" only when the child must be clipped.

cover-grid usage: cover component specimens use className="relative aspect-video overflow-hidden p-0"
  to give the cover a cinematic stage, its absolute-fill child clipped to the box (see positioning).
```

---

### Local extensions, and the one to watch

A project will grow kit pieces this reference does not pin — a gallery is a real codebase. That is
expected: build them in the project's own `_kit/`, and name them in the report so a later sync does not
read them as drift.

**`RuleList`-shaped pieces are the one to watch.** A component whose job is to render a list of rules is
the mechanism restatement arrives through — it makes copying a doc sub-section look like using the kit,
and a parity gate passes it because every bullet is true.

- **It earns its place only where the render cannot show the rule** — a prohibition, or behaviour
  unobservable on the page. That test, and the categories it resolves into, are in
  `parity-review.md` → The gallery is a visual partner to the doc.
- **Where a specimen can demonstrate the rule instead, the specimen replaces the bullet** rather than
  sitting beside it.
- Count its uses per section when reviewing. A rising count is the earliest signal the gallery is
  turning back into the doc, and it is visible long before anyone reads the page.

---

