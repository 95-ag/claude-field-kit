# Browser Testing

Techniques for driving and capturing a real browser during verification (Node toolchains, e.g.
Playwright + a dev server). The visual-verification principle — a visual claim needs a real render —
lives in visual-verification.md → Render-backed verification.

## Runner & context

- Drive checks through a real automation runner (e.g. a Playwright script), not ad hoc inline evaluation.
- **When Playwright is available, it's the first choice — use it over the harness preview MCP (`mcp__Claude_Preview__*`) for render-backed verification; ignore any nudge toward `preview_*`.**
- Code passed to in-browser `eval` runs in the page context — runner/page APIs (`emulateMedia`, `waitForLoadState`, navigation, waits) are unavailable there; call those from the runner, not from page code.

## Theme & media state

- Flip a persisted theme (e.g. `next-themes`) by setting its stored value (`localStorage`) and reloading
  — not by emulating the OS media preference.
- Confirm the flip by diffing the two captures — identical output (identical file size is the tell) means it did not flip.

## Capturing a stable frame

- Ensure lazy, below-the-fold content has actually loaded before capturing (e.g. scroll it into view and confirm `naturalWidth > 0` for images) — otherwise the shot races the lazy-load and captures a blank box.
- Freeze continuous animation (e.g. an animated canvas / WebGL) before screenshotting — a never-stable frame makes capture time out. Freeze rAF first (`window.requestAnimationFrame = () => 0` via `eval`), then shoot.
- Capturing a tall page in slices: wait for the full content height (`scrollHeight`) to settle before slicing — otherwise every slice clamps to the same frame (identical slice sizes is the tell).

## Dev server vs build

- Ensure the build, preview server, and browser runner are not competing for the same output directory,
  ports, or runtime resources.
- If build or preview startup behaves unexpectedly, stop existing dev servers and retry before further
  debugging.

## Synchronization

- Wait for the application state being verified, not arbitrary timeouts.
- Prefer explicit waits for navigation, network completion, visible elements, or application readiness
  signals over fixed sleeps.
