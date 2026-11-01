---
name: plan-visualize
description: Generate a Plannotator visual explainer of a finished plan document (e.g. a plan under ~/.claude/plans/) and open it for feedback. Advisory only — never blocks or replaces the plan's normal chat sign-off.
---

# plan-visualize — a visual review page for a finished plan

Builds a themed HTML explainer of a plan and opens it in Plannotator for annotation. Delegates to
`plannotator-visual-explainer`'s Plan path rather than duplicating it.

1. **Check the prerequisites; stop plainly if either is missing:**
   - the skill — `~/.claude/skills/plannotator-visual-explainer/SKILL.md`;
   - the binary — `command -v plannotator`.
2. **Take the plan file** — the one just finalized under `~/.claude/plans/`, or a path the user names.
3. **Build the page** next to the plan as `<plan-name>.review.html`, following that skill's `## Plan path` and the
   two references it names there.
4. **Theme it from the host:**
   - put `<meta name="plannotator-theme" content="host">` in the page's `<head>`, and use the `:root` block of
     `~/.claude/skills/plannotator-visual-explainer/references/theme-override.md` unmodified — why is that file's
     Host theme opt-in;
   - a page that opens in that block's default palette means the opt-in did not take — say so.
5. **Open it:** `plannotator annotate <that html>` — no `--gate`, so there is no Approve button.
6. **Fold any annotations into the plan doc.** The chat sign-off stays the only gate.
