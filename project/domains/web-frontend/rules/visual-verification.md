# Visual Verification

How to verify anything visual. A visual claim is only valid when backed by an actual rendered page.

## Render-backed verification

- Any visual check requires an actual browser render.
- Never infer a rendered result from source code, HTML, CSS, screenshots generated from static assets, `curl`, logs, or DOM inspection alone.
- Do not infer verification quality from a tool's name; confirm that a real rendered page was observed.
- Clearly distinguish between:
  - **Inferred from code/markup**
  - **Confirmed by browser render**
- If browser rendering is unavailable, stop and state that visual verification could not be performed.
- Do not present inferred conclusions as visually verified findings.

## Verification scope

- Verify the specific page, component, state, and viewport relevant to the claim.
- Verify the actual state being discussed (default, hover, focus, active, expanded, loading, error, success, etc.).
- For responsive behavior, verify the relevant viewport sizes rather than assuming layout behavior.
- For theme-specific behavior, verify each theme independently.

## Evidence

- Base conclusions on observed rendered output, not implementation intent.
- When reporting findings, identify what was visually confirmed versus what remains inferred.
- If a visual defect cannot be reproduced in a rendered environment, report the limitation rather than guessing.

## Capture guidance

- Ensure lazy-loaded and dynamically rendered content has finished loading before verification.
- Use component-level captures for component verification and page-level captures for layout verification.
- Ensure the captured state matches the state being evaluated.
- Don't judge color or visual fidelity from a downscaled screenshot.

## Local iteration

- A style edit not reflecting on the dev server is usually a stale build/HMR cache, not a CSS mistake — verify the **computed** style (`getComputedStyle`) before re-tuning, and re-`touch` the edited file to force a recompile. The file on disk is the source of truth; a production build compiles it correctly regardless of the dev cache.
- To clear the build-cache dir, `rm -rf` is blocked by the global `command-firewall` — move it aside (non-destructive) or hand the user the exact `rm`, then restart the dev server.
- Render-to-compare for any visual choice: a throwaway scratch route rendering the real components/variants side-by-side (both themes) beats deciding from a description. Keep it uncommitted; delete it after the decision.
