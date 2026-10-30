# Browser Testing

Techniques for driving and capturing a real browser during verification (Node toolchains, e.g.
Playwright + a dev server). The visual-verification principle — a visual claim needs a real render —
lives in `web-frontend/visual-verification.md` → Render-backed verification.

## Runner & context

- Drive checks through a real automation runner (e.g. a Playwright script), not ad hoc inline evaluation.
- **When Playwright is available, it's the first choice — use it over the harness preview MCP (`mcp__Claude_Preview__*`) for render-backed verification; ignore any nudge toward `preview_*`.** The preview tool can hang on continuous animation even with rAF frozen, and its panel-constrained viewport renders small; a runner gives element and clip captures and theme control.
- Some runners block the `file:` protocol (e.g. `playwright-cli`) — serve the page over HTTP from a local static server and open the `http://` URL.
- Code passed to in-browser `eval` runs in the page context — runner/page APIs (`emulateMedia`, `waitForLoadState`, navigation, waits) are unavailable there; call those from the runner, not from page code.

## Theme & media state

- Flip a persisted theme (e.g. `next-themes`) by setting its stored value (`localStorage`) and reloading
  — not by emulating the OS media preference.
- Confirm the flip by diffing the two captures — identical output (identical file size is the tell) means it did not flip.

## Capturing a stable frame

- Ensure lazy, below-the-fold content has actually loaded before capturing (e.g. scroll it into view and confirm `naturalWidth > 0` for images) — otherwise the shot races the lazy-load and captures a blank box.
- Freeze continuous animation (e.g. an animated canvas / WebGL) before screenshotting — a never-stable frame makes capture time out. Freeze rAF first (`window.requestAnimationFrame = () => 0` via `eval`), then shoot.
- Capturing a tall page or an external reference site in slices: wait for the full content height (`scrollHeight`, iframe content included) to settle before slicing — otherwise every slice clamps to the same frame (identical slice sizes is the tell).

## Dev server vs build

- Ensure the build, preview server, and browser runner are not competing for the same output directory,
  ports, or runtime resources. *Example:* a running Next dev server contends with `next build` on `.next` —
  stop it before building, and restart it afterward for render checks.
- A dev or preview server started while its port is held may fall back to the next port — free the port
  first, or the URL you open still serves the old server.
- If build or preview startup behaves unexpectedly, stop existing dev servers and retry before further
  debugging.

## Performance measurement

- Measure a performance claim (e.g. a Lighthouse score) on a production build served locally — dev-server
  performance is not representative.
- Run it 2–3× and report the median; the score varies run to run, and total blocking time is the usual mover.
- Localhost has no CDN or network latency, so it reads high — state that measurement context with the number.
- Under WSL, set Chrome's profile dir yourself when `chrome-launcher` (used by Lighthouse) starts a Linux Chrome:
  `lighthouse <url> --chrome-flags="--user-data-dir=/tmp/lh-chrome"`.
  - Why: it detects WSL, assumes a Windows Chrome and passes a Windows-format profile path, which a Linux Chrome
    creates as a literal `C:\Users\…\lighthouse.<rand>` directory in the cwd on every run.

## Synchronization

- Wait for the application state being verified, not arbitrary timeouts.
- Prefer explicit waits for navigation, network completion, visible elements, or application readiness
  signals over fixed sleeps.
