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
