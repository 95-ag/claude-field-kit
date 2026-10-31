# Static-HTML adapter

The static-HTML implementation of the six adapter seams — its pinned structure, output-parity map and
each seam (a)–(f). The seams themselves, theme detection and the React/Next adapter → `stack-adapters.md`.

---

## Static-HTML adapter contract (EXERCISED)

> **Status: EXERCISED.** The adapter shape below was built and render-checked in one Inventory shakedown
> — treat the file tree and substrate mapping as concrete. It stays EXERCISED
> (not VERIFIED) until **a static-HTML project with a forward-written DESIGN.md** adopts the skill: a
> reverse-engineered doc full of documented debt (dead CSS, no spacing scale, off-token colors) is too
> vague a target to verify the fidelity gates against. The per-primitive and visualizer HTML expressions
> are built out on that project.

### Static-HTML pinned structure

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

**Specimen marker.** Give each specimen a
machine-readable descriptor comment so the gallery is scannable and (optionally) publishable to a
claude.ai/design project:
`<!-- @specimen group="Components·UI" name="card" variants=".card/.card-compact" status="live|posed|dead" -->`.
`group` reuses the bucket-prefixed section vocabulary.

**Split trigger.** The React tree is in `architecture.md`; the static-HTML tree is in this file's Pinned
structure section. That asymmetry holds only while the React side stays a single tree. When it needs full
treatment (tree + route-file and stylesheet contents from `page-and-css.md` + primitive expressions), move
it into a React/Next sibling of this file and leave `architecture.md` as the neutral spine and router, so a
builder loads only its stack's layout pin.

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

- Scroll-reveal — force the project's reveal class visible. Example: `.sr` → `.in`, forced with
  `.ds-frame .sr { opacity:1 !important; transform:none !important }`.
- Any OTHER JS-toggled hidden state has its own class — e.g. a grid item that starts `opacity:0` and
  reveals only when JS adds a class. Missing that one override leaves the whole grid rendered but
  invisible. There is no single universal reveal class — grep the source for `opacity:0` / `max-height:0` / `.classList.add` and cover each.
- Stub JS handlers for copied `onclick` attributes (e.g. `toggleMenu`, `submitForm`) in
  `gallery.js` so copied markup doesn't throw. JS-driven displays (e.g. a countdown, a scroll-progress bar) are posed
  with sample values, explicitly labeled.

**Rendering mechanics the kit files defer here** (SPECIFIED — not built in the shakedown):

| Mechanic | Static-HTML |
|---|---|
| Inline style | a `style` attribute string: `style="background: var(--token); height: 240px"` — units explicit |
| SVG markup | HTML attribute names — `stroke-width`, `class`, `viewBox` |
| Portal | `document.body.appendChild(el)` from `gallery.js` |
| Theme hook | none — CSS reads the theme class or attribute on `<html>`; JS that must know it reads that attribute |
| Motion hook | `matchMedia("(prefers-reduced-motion: reduce)")` in `gallery.js`, or a CSS media query |
| Static image | a plain path string relative to `index.html` |

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

### Gate 2 commands

No build step — a static HTML linter or validator, then the duplicate-id check in the browser.
