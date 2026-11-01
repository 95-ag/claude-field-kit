# Browser Testing

Techniques for driving and capturing a real browser during verification (Node toolchains, e.g.
Playwright + a dev server). The visual-verification principle — a visual claim needs a real render —
lives in `web-frontend/visual-verification.md` → Render-backed verification.

## Runner & context

- Drive checks through a real automation runner (e.g. a Playwright script), not ad hoc inline evaluation.
- **When Playwright is available, it's the first choice — use it over the harness preview MCP (`mcp__Claude_Preview__*`) for render-backed verification; ignore any nudge toward `preview_*`.** The preview tool can hang on continuous animation even with rAF frozen, and its panel-constrained viewport renders small; a runner gives element and clip captures and theme control.
- Some runners block the `file:` protocol (e.g. `playwright-cli`) — serve the page over HTTP from a local static server and open the `http://` URL.
- Code passed to in-browser `eval` runs in the page context — runner/page APIs (`emulateMedia`, `waitForLoadState`, navigation, waits) are unavailable there; call those from the runner, not from page code.
- **A different browser build or mode can lay out differently — measure in the one users run.**
  - *Example:* `chromium.launch()` defaults to the bundled `headless_shell`, which renders text about 3%
    wider than Chromium and manufactures phantom overflows; pass `channel: "chromium"` on every launch.
- **State the server, viewport and engine with every number** — a figure without them cannot be reproduced.
- A harness script lives inside the project: Node resolves modules from the script's own location, so a
  script outside the project cannot find the runner package, and the error reads like a missing dependency.

## Theme & media state

- Flip a persisted theme (e.g. `next-themes`) by setting its stored value (`localStorage`) and reloading
  — not by emulating the OS media preference.
- Confirm the flip by diffing the two captures — identical output (identical file size is the tell) means it did not flip.
- Assert in the page that an emulated feature took effect (`matchMedia`) before trusting any result that
  depends on it — each emulation API covers only some features.
  - *Example:* `Emulation.setEmulatedMedia` cannot emulate `(pointer: coarse)`;
    `Emulation.setTouchEmulationEnabled` can.

## Capturing a stable frame

- Ensure lazy, below-the-fold content has actually loaded before capturing (e.g. scroll it into view and confirm `naturalWidth > 0` for images) — otherwise the shot races the lazy-load and captures a blank box.
- Freeze continuous animation (e.g. an animated canvas / WebGL) before screenshotting — a never-stable frame makes capture time out. Freeze rAF first (`window.requestAnimationFrame = () => 0` via `eval`), then shoot.
- Capturing a tall page or an external reference site in slices: wait for the full content height (`scrollHeight`, iframe content included) to settle before slicing — otherwise every slice clamps to the same frame (identical slice sizes is the tell).
- **Settle the page before capturing.** What to capture — page, state, viewport — is
  `web-frontend/visual-verification.md` → Verification scope.
  - Request reduced motion *and* assert it has collapsed.
  - Assert the expected webfonts loaded (`document.fonts`). A dev server that fetches webfonts at compile
    time serves fallback faces after a failed download, re-wrapping text by whole lines; only a server
    restart clears it, made by whoever started the server (→ Dev server vs build).
  - Capturing a locator scrolls the target fully into view, which discards a deliberate partial scroll.
- **A render baseline is a gate only once two consecutive runs are byte-identical.** Record the capture
  method with it; an unrecorded method differs on an untouched tree — lazy images captured mid-load are
  the usual cause. Return to scroll 0 before each run.
- **The two runs of a diff must differ only in the change under test.** Hide page furniture identically
  in both, and validate the harness on a surface the furniture is absent from.
  - Hide it with an injected stylesheet rule — a framework re-render drops an inline style.
  - *Example:* a dev server's own badge counted as the subject's pixels; a production build gives the
    clean number.
- **A screenshot's geometry is the runner's, not the layout's** — read the element's own rect before
  calling a screenshot dimension a layout fact.
  - *Example:* an element shot taller than the window is stitched, so fixed chrome lands mid-crop; one
    starting at a fractional y is a device row taller than the element.

## Dev server vs build

- **Never stop a dev server you did not start.** Someone may be reviewing against it, and committed gates
  can hardcode its origin. Work around it; if it has to go, hand the command to whoever started it.
- Check what is already listening on a port before using it — a server asked for a held port may fall back
  to the next one, so the URL you open still serves the old process.
- Ensure the build, preview server, and browser runner are not competing for the same output directory or
  runtime resources — but check the installed version's behaviour first. *Example:* a Next version that
  writes dev output to its own directory under `.next` builds and dev-serves concurrently; an older one
  contends with `next build` on `.next`.
- **Open a dev server at the origin it serves.** A different loopback name (`127.0.0.1` for `localhost`)
  can be refused the dev server's own resources as cross-origin: the page renders, never hydrates, and the
  cause shows only in the server's log.
- **Serve a build the way production routes it.** A server whose routing differs — an SPA fallback that
  returns the index for any unknown path — masks a missing file: a 404 asset arrives as HTML, and a check
  of a missing route measures the home page.
- **Serialise heavy runs — one build and one browser at a time**, and check available memory first.
  Concurrent builds and browsers can exhaust memory and take down a server no command touched.
- If build or preview startup behaves unexpectedly, read the server's own log before concluding anything
  is broken.

## Performance measurement

- Measure a performance claim (e.g. a Lighthouse score) on a production build served locally — dev-server
  performance is not representative.
- Run it 2–3× and report the median; the score varies run to run, and total blocking time is the usual mover.
- Localhost has no CDN or network latency, so it reads high — state that measurement context with the number.
- Measure frame cost **against a control page** (dropped frames plus a main-thread delta), never as an
  absolute per-frame time — a static page already costs one frame interval.
- A rendering-cost figure holds only for the engine, rasteriser and device pixel ratio it was measured
  on — headless software raster can invert a real GPU's costs. Nothing is verified on a real phone or a
  non-Blink engine until it is measured there.
- Under WSL, set Chrome's profile dir yourself when `chrome-launcher` (used by Lighthouse) starts a Linux Chrome:
  `lighthouse <url> --chrome-flags="--user-data-dir=/tmp/lh-chrome"`.
  - Why: it detects WSL, assumes a Windows Chrome and passes a Windows-format profile path, which a Linux Chrome
    creates as a literal `C:\Users\…\lighthouse.<rand>` directory in the cwd on every run.

## Synchronization

- Wait for the application state being verified, not arbitrary timeouts.
- Prefer explicit waits for navigation, network completion, visible elements, or application readiness
  signals over fixed sleeps.
- **Wait only on what the measurement reads, and bound every wait** — an unbounded wait turns a missing
  resource into a hung run rather than a failed one.
- **Yield to the rendering pipeline between a change and its measurement.** Synchronous script that
  scrolls and then re-measures reads the old layout. *Example:* a double rAF and a ~250ms settle.
- Take a baseline after setup and before the event you measure. *Example:* a `ResizeObserver` delivers
  one callback on `observe()`, which a naive count reads as the event.
- **Do not write the files a running measurement reads — a generator included.** A write triggers HMR and
  reloads the page mid-run, even when the output is byte-identical; the error names neither the file nor
  the cause. Send a generator to a scratch directory, or wait.
- **Seed state before the page's code runs, and assert it after hydration.** Register an init script
  before the first navigation; a client component's mount sync can still overwrite the seed, so the run
  measures the default while reporting the variant.
- **Interact only after hydration — wait on the app's readiness signal, never on the DOM having rendered.**
  A click before hydration changes the DOM but not the state, and later clicks on the already-selected
  control fire no change event — every retry is silent.
- An empty attribute value still matches an attribute selector — remove the attribute to clear a variant.
