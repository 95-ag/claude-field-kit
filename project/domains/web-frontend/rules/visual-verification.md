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
- Types, tests and the build cannot see a rendered result — a wrong coordinate space or unit passes all
  three.
  - A task with no surface to render on gets one built before it is called done.

## Verification scope

- Verify the specific page, component, state, and viewport relevant to the claim.
- Verify the actual state being discussed (default, hover, focus, active, expanded, loading, error, success, etc.).
- For responsive behavior, verify the relevant viewport sizes rather than assuming layout behavior.
- For theme-specific behavior, verify each theme independently.
- Judge a visual treatment (color, blend, texture, grain, shadow, glow) on the real surface at the density it will be seen at — its effect depends on that surface, so a stand-in measures nothing. *Example:* soft-light barely registers on near-white, since its effect shrinks toward both black and white.
- When a device check is handed to a person, name every part of the target they must touch.
  - A property set per element can differ between a control's anchor, label and icon, so the result
    depends on where their finger lands.

## Evidence

- Base conclusions on observed rendered output, not implementation intent.
- When reporting findings, identify what was visually confirmed versus what remains inferred.
- If a visual defect cannot be reproduced in a rendered environment, report the limitation rather than guessing.
- Beating a failed alternative is not success — "better than multiply" only shows multiply is worse. Measure each candidate against the real surface on its own terms; the best of a set may still not work.
- Some CSS no available render can confirm — an engine may not expose the property to `getComputedStyle`.
  - Confirm the rule in the source *and* in the built stylesheet, where a dropped rule would show; the
    minifier rewrites selectors, so grep the built form.
  - Report it as inferred from code, pending a device check.

## Capture guidance

- Ensure lazy-loaded and dynamically rendered content has finished loading before verification.
- Use component-level captures for component verification and page-level captures for layout verification.
- Ensure the captured state matches the state being evaluated.
- Don't judge color or visual fidelity from a downscaled screenshot.

## Local iteration

- A style edit not reflecting on the dev server is usually a stale build/HMR cache, not a CSS mistake — verify the **computed** style (`getComputedStyle`) before re-tuning, and re-`touch` the edited file to force a recompile. The file on disk is the source of truth; a production build compiles it correctly regardless of the dev cache.
- The re-`touch` remedy assumes the dev server's update channel works.
  - When no edit reaches the browser however often the file is touched, the channel itself has died —
    stop re-touching (→ `node/nextjs.md` → Dev server and HMR, in a Next.js project).
- To clear the build-cache dir, `rm -rf` is blocked by the global `command-firewall` — move it aside (non-destructive) or hand the user the exact `rm`.
  - Restart the dev server only if you started it (→ `node/browser-testing.md` → Dev server vs build).
- Render-to-compare for any visual choice: a throwaway scratch route rendering the real components/variants side-by-side (both themes) beats deciding from a description. Keep it uncommitted; delete it after the decision.

## Reviewing a design with the owner

The visual side of `working-with-a-reviewer.md`: who decides a design value, and how to offer one.

### Who decides what

- **The reviewer finalises every design value.**
  - Bring options and a recommendation.
  - A degree of a direction already set can be picked and shown; a fresh value cannot be chosen for them.
- Mechanical work — rendering, measuring, probing, building a scratch route — never needs asking.
- **Never let a reviewer pick a design value off a table of figures, even when they are willing to.**
  - Figures do not predict how a thing reads, and a defensible table is how "review live" gets broken
    without anyone deciding to break it.
  - Build the candidates, ask them to look, and say plainly that the numbers cannot answer the question.
- Review live, one item at a time — never a batch, never from screenshots alone.
- **Measure before offering a preference.** A question framed as taste can turn out to be priced.
  - When an element's role changes, re-ask which recorded decisions now reach it, because the decision
    may be made by a cost nobody has looked at yet.

### Reading what they see

- **Ask their window size and browser zoom before acting on "this looks wrong."** A reviewer at 80% zoom
  on a short window is judging a composition you have never seen.

### Offering a choice

- **Report the first collision as the ceiling.** When a request rules out moving neighbours, measure
  every axis before offering steps: the constraint on record is rarely the binding one.
- **Price a rule-break before arguing the rule.**
  - A value that is exactly right can still be the wrong choice, and "it is off the scale" is not by
    itself the reason.
  - If the break buys less than an on-scale alternative, there was never a trade.
