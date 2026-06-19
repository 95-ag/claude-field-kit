# Vercel

Host conventions for a Vercel-deployed Next.js app. Framework conventions live in `nextjs.md`; build/lint/test
gates in `build-verification.md`.

## Analytics & CSP

- **Vercel Web Analytics / Speed Insights are first-party on Vercel — do NOT extend CSP for them.** `@vercel/analytics` + `@vercel/speed-insights` load from same-origin `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js` (edge-rewritten) and beacon to same-origin `/_vercel/*`, so `script-src 'self'` + `connect-src 'self'` already cover them in production. The cross-origin `va.vercel-scripts.com` **debug** script only loads in `next dev` — its CSP block there is expected, not a prod issue.
- Verify live, not from assumption: an in-page `fetch('/_vercel/insights/script.js')` returning **200 under the live CSP** proves it loads un-blocked (a CSP block throws). Mount `<Analytics/>`/`<SpeedInsights/>` in the root layout; `window.va`/`window.si` becoming functions confirms they ran.
