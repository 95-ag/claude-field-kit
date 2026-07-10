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

Verified against the portfolio project (App Router, next-themes, Tailwind CSS v4, MDX via next-mdx-remote +
rehype-shiki, Biome, release-allowlist deployment).

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

Example (portfolio): name section modules `*-section.tsx` (e.g. `layout-section.tsx`), never a
reserved Next.js filename (`layout`/`page`/`loading`/`error`/`not-found`/`template`/`route`/`default`)
— a reserved name is silently adopted as the route file and breaks the build.

### (b) Live render

Import and render components directly in the route's section modules. Server components render on the
server; client components hydrate normally. `ChromeFrame` (scaffold-kit) establishes a CSS containing
block (`transform: translateZ(0)`) so `position:fixed` descendants resolve to the frame rather than the
viewport — required for any fixed-position chrome demo.

See `scaffold-kit.md` for the full `ChromeFrame`, `DemoViewOnly`, and `InertDemo` contracts.

### (c) Build-time transforms

Any component whose rendered appearance depends on a build-time transform must be demoed through that
same transform — not hand-mocked. The pattern for Shiki syntax highlighting:

1. Configure `MDXRemote` in the section module with **the same rehype-shiki config** (themes,
   `defaultColor: false`) used by content pages.
2. Pass the code string as MDX content (a fenced block).
3. Wrap the output as described in `hard-to-demo.md` → `.prose-content` scope caveat.

The same pattern applies to any other build-time processor (remark plugins, image optimization, etc.) —
identify what the production pipeline applies and route the specimen through the same path.

See `hard-to-demo.md` → Demo through the real build pipeline for detail.

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

Example (portfolio): in a React/Next App Router route, export a `metadata` object from the route's
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

## Static-HTML adapter contract (SPECIFIED — UNVERIFIED)

> **Status: SPECIFIED / UNVERIFIED.** This contract is designed for a raw-static project (no build
> step, no bundler, single HTML file or folder of HTML files). It will be co-developed and verified
> against the first static-HTML project that adopts the skill. Do not treat the implementation details
> as confirmed. Defer any concrete code to that project's phase.

### (a) Dev-only route

Create a separate HTML file or subdirectory (e.g. `design-system/index.html`) alongside the project
files. It is reachable by opening the file in a browser or via a local dev server (e.g. `live-server`,
`python -m http.server`). No framework routing — the gallery is just another file.

### (b) Live render

Copy or inline the components (HTML fragments + their CSS classes) from the project into the gallery
file. No import system — include the same CSS file(s) the project uses so tokens and styles are live.
Theme-adaptive specimens apply the project's theme class/attribute to their wrapper.

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

- Scaffold-kit mechanics (ChromeFrame, click-guards, ThemeShot/ThemeVideo) → `scaffold-kit.md`
- Demo patterns that interact with seam (b) and (c) → `hard-to-demo.md`
- Mode procedures including Inventory discovery → `modes.md`
- Render-backed verification of the completed adapter → `verification.md`
