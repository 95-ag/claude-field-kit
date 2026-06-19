# Next.js

Framework conventions for a Next.js (App Router) project. Build/lint/test gates live in build-verification.md → Build Verification (Node); design tokens live in DESIGN.md → Foundations.

## Rendering

- App Router only — no Pages Router patterns.
- Default to server components.
- Add `'use client'` only when browser APIs, local state, effects, event handlers, or client-only libraries require it.
- Keep client boundaries as small as practical.
- Do not promote whole trees to client components when only a leaf requires client behavior.
- Read the installed Next.js version's documentation before using an unfamiliar API — the installed version may differ from training data.

## Data fetching

- Fetch data in server components whenever possible.
- Avoid client-side data fetching when data is available during rendering.
- Keep secrets, privileged operations, and server-only dependencies on the server.
- Generate routes statically where the data allows.

## Routing

- Prefer nested layouts over duplicated page structure.
- Keep route-specific logic within the route segment that owns it.
- Co-locate route-specific components with the route that owns them until a reuse trigger fires.

## Caching

- Choose caching behavior intentionally rather than relying on framework defaults.
- Make static, revalidated, and dynamic rendering decisions explicit.
- Cache invalidation and revalidation rules belong to the data source that owns the data.

## Fonts

- Load all fonts via `next/font`.
- Never load fonts from external CDNs when a local or `next/font` solution exists.
- Font families and CSS-variable names are defined in DESIGN.md → Foundations → Typography.

## Images & media

- Use `next/image` for application images unless a documented exception exists.
- Provide explicit dimensions or an equivalent layout strategy that prevents layout shift.
- Image paths reference web paths from `/public`, never filesystem-relative paths.
- Video elements use appropriate loading, poster, caption, and accessibility behavior as defined by accessibility.md.

## Imports

- Use path aliases defined in `tsconfig.json`.
- Avoid deep relative import chains.
- Prefer named exports over default exports for reusable components.

## React hooks

- Satisfy hook dependency requirements rather than disabling lint rules.
- Effects should synchronize external systems, not perform derived-state calculations that belong in render logic.
- Prefer derived values, memoization, and server-side computation over unnecessary effects.
