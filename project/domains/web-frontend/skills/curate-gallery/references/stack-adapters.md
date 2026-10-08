# Stack Adapters

The gallery spine (modes, dogfooding, handoff) is stack-neutral. Six concrete mechanics vary by stack —
these are the **adapter seams**. This reference defines the seams, gives the verified React/Next adapter
concretely, and specifies the static-HTML adapter contract. All other references defer stack-specific
wiring here; do not repeat adapter detail elsewhere.

---

## The six adapter seams

| Seam | What the adapter must solve |
|---|---|
| **(a) Dev-only route** | Create a gallery entry-point visible only during development |
| **(b) Live render** | Mount a component so it renders, hovers, and updates in the gallery |
| **(c) Build-time transforms** | Re-run any transform the production pipeline applies (syntax highlighting, MDX compilation, etc.) so the gallery specimen matches the real output |
| **(d) Theme flip** | Switch between the project's themes at runtime without a page reload where possible |
| **(e) Production exclusion** | Ensure the gallery never ships to users |
| **(f) Code/token discovery** | Locate components and token definitions in the codebase (for Inventory mode) |

An adapter implements all six. Seams (b)–(d) are always needed. (a), (e), and (f) depend on mode and
project context — see notes per seam below.

---

## Theme detection (applies to all adapters)

Before implementing the toggle:

- **N = 0 or 1 theme** — no toggle. The gallery states explicitly that one (or no) theme is present.
  Do not add a toggle for a theme system that does not exist.
- **N ≥ 2 themes** — add a real toggle using the project's own theme selector component. Never build
  a bespoke switcher when the project already has one.

---

## React/Next adapter (VERIFIED)

Verified against a project using App Router, next-themes, Tailwind CSS v4, MDX via next-mdx-remote +
rehype-shiki, Biome and release-allowlist deployment.

### (a) Dev-only route

Create `src/app/design-system/` as a standard App Router route segment. No special marking is needed
during development — it is present and navigable by default. Production exclusion is handled separately
(seam e).

**Reserved filename warning:** section and module files placed inside an App Router route directory
must NOT be named after Next.js reserved filenames: `layout`, `page`, `loading`, `error`, `not-found`,
`template`, `route`, `default`. Next.js treats any file with one of these names as a framework
convention (route layout, error boundary, etc.) regardless of where it sits in the app directory — a
section file named `layout.tsx` inside `src/app/design-system/sections/` will be silently adopted as
the route layout and break the build. Suffix section/module files to avoid the collision:
`layout-section.tsx`, `error-display.tsx`, etc.

Example: name section modules `*-section.tsx` (e.g. `layout-section.tsx`), never a
reserved Next.js filename (`layout`/`page`/`loading`/`error`/`not-found`/`template`/`route`/`default`)
— a reserved name is silently adopted as the route file and breaks the build.

### (b) Live render

Import and render components directly in the route's section modules. Server components render on the
server; client components hydrate normally. `ChromeFrame` (scaffold-kit) establishes a CSS containing
block (`transform: translateZ(0)`) so `position:fixed` descendants resolve to the frame rather than the
viewport — required for any fixed-position chrome demo.

See `scaffold-chrome-theme.md` for the full `ChromeFrame` contract and `scaffold-guards.md` for
`DemoViewOnly` and `InertDemo`.

### (c) Build-time transforms

Any component whose rendered appearance depends on a build-time transform must be demoed through that
same transform — not hand-mocked. The pattern for Shiki syntax highlighting:

1. Configure `MDXRemote` in the section module with **the same rehype-shiki config** (themes,
   `defaultColor: false`) used by content pages.
2. Pass the code string as MDX content (a fenced block).
3. Wrap the output as described in `hard-to-demo.md` → `.prose-content` scope caveat.

The same pattern applies to any other build-time processor (remark plugins, image optimization, etc.) —
identify what the production pipeline applies and route the specimen through the same path.

See `hard-to-demo.md` → Build-time-transform-dependent components, for detail.

### (d) Theme flip

next-themes persists the active theme in `localStorage`. To flip themes in the gallery:

- Render the project's real `InlineThemeSelector` (or equivalent) in the gallery header.
- For automated verification: set `localStorage.setItem('theme', 'light' | 'dark')` then reload.
- Confirm the flip worked by diffing the two captured screenshots — identical sizes mean the theme did
  not actually change.

Do NOT force `data-theme` on individual frames. JS-theme components (`useTheme`, animated layers,
the selector itself) read global state; scoping `data-theme` per frame breaks them.

### (e) Production exclusion

Three options — choose the one that fits the project's deploy model:

1. **Release allowlist** — the `release.sh` (or equivalent) allowlist simply omits the `design-system/`
   route folder. Anything not in the allowlist is excluded from the production snapshot.
2. **Env-gate at build** — wrap the route with `if (process.env.NODE_ENV === 'production') notFound()`
   or exclude it from `generateStaticParams`. The route is absent from the SSG output.
3. **Route omission** — remove the route segment from the production route manifest. Equivalent to
   option 2 but done at the config level rather than in the route file.

All three achieve the same result for a Next.js/SSG project: the gallery does not appear in the
production build output. The allowlist approach (option 1) is preferred when a curated snapshot model
already exists — no code changes needed.

**Defense-in-depth — also mark the route non-indexable.** Regardless of which exclusion option is
used, the gallery route should carry route-level metadata declaring it non-indexable. Build exclusion
is the primary gate, but if the route is ever accidentally present in a build (a config change, a
staging environment, a preview deploy), the noindex declaration prevents it from being indexed by
search engines. These two layers are independent and both should be present.

Example: in a React/Next App Router route, export a `metadata` object from the route's
`page.tsx`:

```ts
export const metadata = {
  robots: { index: false },
};
```

**Build-type explanation:** these options only exist because there is a build step (Next.js SSG / SSR)
that produces the output the deploy pipeline consumes. The dev/prod split is enforced at the output
boundary. Without a build step, production exclusion is a deployment/placement concern — see the
static-HTML adapter.

### Lint-clean (React/Next)

Two Biome rules surface reliably in gallery code; handle them at authoring time:

**(a) `noArrayIndexKey` — key repeated demo cells off a static array literal, not an index.**
Biome flags array index as a React key even when the index is embedded in a template string.
The pattern `Array.from({length: N}, (_, i) => …)` with `key={i}` (or `key={\`col-${i}\`}`)
triggers the rule.

```tsx
// WRONG — Biome noArrayIndexKey fires on both forms
{Array.from({ length: 3 }, (_, i) => <div key={i} />)}
{Array.from({ length: 3 }, (_, i) => <div key={`col-${i}`} />)}

// CORRECT — key off a stable identity from a static literal
{[1, 2, 3].map((n) => <div key={n} />)}
{["before", "after"].map((label) => <div key={label} />)}
```

Use a static array literal with semantically meaningful values where possible; when the
values are truly interchangeable, at minimum use a stable non-index string (`"a"`, `"b"`, …).

**(b) Click handlers on non-interactive elements — scope suppressions precisely.**
A `<div onClick={…}>` triggers two separate Biome rules:
- `noStaticElementInteractions` — add `role="presentation"` (or the appropriate semantic role)
- `useKeyWithClickEvents` — add the keyboard event handler OR suppress this rule separately

These are independent lint errors; a single biome-ignore comment on the line above only
suppresses the rule named on that comment. Suppress each rule on its own line, or add both
to one `// biome-ignore` comment with both rule identifiers. Prefer `role` + handler over
suppression where feasible.

```tsx
// biome-ignore lint/a11y/noStaticElementInteractions: click-guard div, not interactive
// biome-ignore lint/a11y/useKeyWithClickEvents: capture-phase guard; keyboard handled by inner elements
<div onClick={handler}>…</div>
```

### (f) Code/token discovery

For Inventory mode (messy/no doc, code exists):

- **Components:** locate files under the component root (e.g. `src/components/`). Infer
  reusability from file presence (own file = candidate) and import graph (imported by 2+ pages →
  reusable; page-only import → domain/inline). Tags in any DESIGN.md that exists are a hint; missing
  tags surface as an evidence-based concern, not a hard rule.
- **Tokens:** locate CSS custom properties in theme files (`:root { --token: value }` blocks) and any
  Tailwind/CSS `@theme` mappings. Group by prefix where possible.

Classification is provisional and user-confirmed — see `modes.md` for the full Inventory procedure.

---

## Static-HTML adapter contract (EXERCISED)

> **Status: EXERCISED.** The adapter shape below was built and render-checked in one Inventory shakedown
> — treat the file tree and substrate mapping as concrete. It stays EXERCISED
> (not VERIFIED) until **a static-HTML project with a forward-written DESIGN.md** adopts the skill: a
> reverse-engineered doc full of documented debt (dead CSS, no spacing scale, off-token colors) is too
> vague a target to verify the fidelity gates against. The per-primitive and visualizer HTML expressions
> are built out on that project.

### Static-HTML pinned structure (EXERCISED)

The static-HTML gallery is the **layout pin** for this stack — the equal-authority sibling of the
React/Next tree in `architecture.md`, selected by the same stack detection. Same concept pins (catalog
primitives, 9 visualizer roles, the section spine, build order); different substrate. The "kits" do not
disappear — they change from component files to **CSS classes + a small JS shim**. Reproduce these files
with these names:

```
design-system/
├── index.html            ← page shell + every section block   (≈ page.tsx + sections/*.tsx)
├── gallery.css           ← gallery chrome: .ds-* catalog + visualizer classes
│                            (≈ gallery.css + scaffold-kit + visualizer-kit)
├── gallery.js            ← click-guard + copied-handler stubs    (≈ click-guards capture-phase logic)
└── <site-styles>.css     ← the project's REAL CSS, linked live (verbatim copy when the source has no
                             separate stylesheet — e.g. inline <style> in a monolith)
   + copied static assets (backgrounds/images the real CSS references) and CSS-shape stand-ins
```

**Output-parity map** — every React pinned piece has a static-HTML equivalent, so both adapters emit the
same gallery (the same sections, specimen frames, visualizers, noindex, dev-only banner) in different clothes:

| React/Next pinned piece | Static-HTML equivalent |
|---|---|
| `page.tsx` (metadata, header, mounts sections) | `index.html` — noindex `<meta>`, header, section blocks |
| `gallery.css` (route-scoped dev rules) | `gallery.css` (chrome only) |
| `scaffold-kit/*.tsx` (GallerySection/Specimen/Card/ChromeFrame/guards) | `.ds-section` / `.ds-specimen` / `.ds-frame` / `.ds-chrome-frame` classes + `gallery.js` stubs |
| `visualizer-kit/*.tsx` (9 visualizers) | `.ds-swatch-grid` / `.ds-type-row` / `.ds-bar-scale` / `.ds-shape-row` / `.ds-depth-grid` / `.ds-motion-*` classes |
| `sections/*.tsx` (token data + composition) | section `<section>` blocks inline, values as `var(--token)` |
| imported real components | copied markup (monolith) OR included partials (multi-file) |
| `public/<route>/samples/` | copied assets + CSS-shape stand-ins |

**Specimen marker (EXERCISED).** Give each specimen a
machine-readable descriptor comment so the gallery is scannable and (optionally) publishable to a
claude.ai/design project:
`<!-- @specimen group="Components·UI" name="card" variants=".tc/.fam-card/.ev-card/.cc" status="live|posed|dead" -->`.
`group` reuses the bucket-prefixed section vocabulary.

**Split trigger.** The React tree is in `architecture.md` and the static-HTML tree is in this file's
Pinned structure section; keep it that way while one of them stays a single table. When BOTH need full
treatment (tree + route-file and stylesheet contents from `page-and-css.md` + primitive expressions),
split by stack into symmetric siblings — `architecture.md` (neutral spine + router) plus one file per
stack, named for it — so a builder loads only its stack's layout pin. **Those per-stack files do not
exist yet**; this names the shape the split should take, not a path to follow today. Not asymmetric (React-in-main,
HTML-in-adapter) — that scatters one concept across two docs.

### (a) Dev-only route

Create a separate HTML file or subdirectory (e.g. `design-system/index.html`) alongside the project
files. It is reachable by opening the file in a browser or via a local dev server (e.g. `live-server`,
`python -m http.server`). No framework routing — the gallery is just another file.

### (b) Live render

**Component-build contract — reference vs rebuild.** The split is stack-agnostic; only the "call" verb
changes with the production reuse boundary:

- **Reusable component with a real reuse boundary** → reference it, never rebuild. "Reference" = the
  stack's instantiation verb: React `import`, web-component mount, templated-static `include`/partial,
  or (CSS-component projects) apply the canonical class to canonical markup.
- **Single-file monolith with no reuse boundary** → nothing to call; **copy the
  canonical markup verbatim + link the same CSS**. The gallery is doing Inventory here, not referencing
  a system — which is why a monolith's specimens are hand-copied markup, not imports.
- **Foundations / tokens** (any stack) → never referenced; always a **visualizer specimen** consuming
  `var(--token)`. A token is a value, not a callable unit.
- **Domain / page compositions** → reference if extracted into a boundary; else copy canonical markup inline.

Map production's reuse boundaries (`rules/web-frontend/component-structure.md` taxonomy: portable
ui/layout/icons → shell → domain): reference exactly what production reuses; visualize foundations; copy
inline page sections. Include the same CSS file(s) so tokens and styles are live; theme-adaptive specimens
apply the project's theme class/attribute to their wrapper.

**Posed, not live (static-HTML).** The gallery does not run the site's own `<script>`, so anything the JS
reveals or drives is hidden/blank at rest. Audit **every** JS-driven reveal/toggle pattern — not just the
obvious one — and force each visible inside `.ds-frame`:

- Scroll-reveal (`.sr`, `.tl-row` → `.in`): `.ds-frame .sr { opacity:1 !important; transform:none !important }`.
- Any OTHER JS-toggled hidden state has its own class — e.g. `.fam-member` starts `opacity:0` and only
  reveals when JS adds `.photo-visible`. Missing that one override leaves the whole grid rendered but
  invisible. There is no single universal reveal class — grep the source for `opacity:0` / `max-height:0` / `.classList.add` and cover each.
- Stub JS handlers for copied `onclick` attributes (`toggleFam`/`toggleEvent`/`submitRSVP`/`closeNav`) in
  `gallery.js` so copied markup doesn't throw. Countdown / scroll-progress are posed with sample values,
  explicitly labeled.

### (c) Build-time transforms

Raw static HTML has no build pipeline by definition — there are no build-time transforms to replicate.
If the project uses a static site generator or preprocessor, define the seam at that boundary. For a
pure HTML project, specimen markup is hand-authored or copy-pasted from the rendered project.

### (d) Theme flip

Toggle a class or attribute on a top-level element (e.g. `document.documentElement.classList.toggle('dark')`
or `data-theme`). A dedicated toggle button in the gallery header applies this. No reload needed when
CSS custom properties handle theming — the browser re-evaluates the cascade immediately.

### (e) Production exclusion

There is no build step to gate on. Exclusion is a deployment/placement concern:

- **Deploy-ignore file** — add the gallery path to `.vercelignore`, `netlify.toml` exclude, or
  equivalent. The deploy pipeline skips the path.
- **Non-published folder** — place the gallery under a folder that the deploy config explicitly
  excludes or that is outside the published root.
- **Copy/deploy allowlist** — the deploy script copies only an explicit allowlist; omit the gallery.
- **No deploy pipeline** — if the project is shipped by handing over files, no tool can enforce
  exclusion. Surface this explicitly and offer: (i) place in an ignored/clearly-marked directory,
  (ii) delete before handoff. Document the chosen approach in the gallery header.

Because there is no build step, there is no "dev vs prod" binary — the gallery is simply present or
absent in whatever files are delivered. Make the chosen approach explicit rather than assuming any
tooling enforces it.

### (f) Code/token discovery

For a single-file or monolith HTML project (the expected shape):

- **Components:** scan for **repeated markup/class clusters** — the same structural block appearing
  in multiple places is a reusable candidate. One-off page-flow blocks are domain/inline. Use the
  repetition count as the primary signal (threshold: 2+ occurrences = candidate).
- **Tokens:** look for CSS custom properties in `<style>` blocks or linked stylesheets. Repeated
  hard-coded values with no custom property are a signal to define a token — surface as a concern,
  not an auto-fix.

Classification is provisional and user-confirmed — see `modes.md` for the Inventory procedure.

---

## Cross-links

- Scaffold-kit mechanics — ChromeFrame + ThemeShot/ThemeVideo → `scaffold-chrome-theme.md`; click-guards
  → `scaffold-guards.md`
- Demo patterns that interact with seam (b) and (c) → `hard-to-demo.md`
- Mode procedures including Inventory discovery → `modes.md`
- Render-backed verification of the completed adapter → `verification.md`
