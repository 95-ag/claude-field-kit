# Contributing to claude-field-kit

How to author and maintain this project's reusable Claude assets — rules, skills, agents — well, and, when one
is reusable, contribute it to **claude-field-kit** (the shared kit) so other projects get it too. Most of this
is just good authoring for your own assets; the contribution steps matter only when you share one.

## What claude-field-kit is

The shared, durable home for reusable Claude assets. A project's `.claude/` is gitignored, so a rule or skill
you improve here would vanish on a clean or re-clone — the kit keeps it and delivers it across projects and
machines.

The flow an asset travels:

```
improve in this project  →  captured to the kit's incoming/  →  maintainer reviews  →  promoted to a tier  →  delivered
```

Tiers an asset can land in (the maintainer picks by reach): **global** (every environment) · **project shared**
(most projects) · **domain** (one kind of work, e.g. web-frontend) · **stack** (one tech, e.g. node) · **repo**
(one named project, kept verbatim). You author and improve; the maintainer reviews and promotes.

## Authoring conventions

Build every rule and skill to these — they are also what promotion expects, so a well-authored asset promotes
with little change.

- **Bullets over prose; one concept per line.** No filler. If a line gets overloaded, break it into multiple
  lines or sub-points rather than packing concepts onto one — machine-readable, never at the cost of human
  scannability.
- **No duplication — state a rule once, cross-reference it.** Even within a multi-file asset (a skill's
  `SKILL.md` + `references/`), put the rule in one canonical file and reference it from the others.
- **Name for what it does.** Skills use `<domain>-<verb>` with a non-colliding prefix (`design-write`,
  `spec-write`) — never noun-only or a broad `project-*` prefix that collides. Rules are noun-named like their
  siblings.
- **Match the house voice — kit conventions ONLY.** Reuse existing assets' terminology, section shape, and
  density; don't coin a synonym for a concept already named. Never import another framework's voice (e.g.
  superpowers' *Iron Law* / *Red flags — STOP*); a skill drafted via an external tool (`writing-skills`,
  `skill-creator`) is realigned to the kit's voice before promoting.
- **Principle, not recipe.** Write the general best-practice rule, not one situation's steps; prefer concrete
  metrics over vague thresholds ("split past ~10 items", not "when it gets big").
- **Principle vs mechanic.** Keep the principle in its own rule and a tool-specific mechanic in that tool's
  rule; don't duplicate one lesson across both.
- **Multi-mode asset → mode-neutral checks.** If a skill has modes, write its validation/check doc neutral by
  default, tag the genuinely mode-specific checks, and run validation in every mode — a check framed for one
  mode silently skips the others.
- **Clear, crisp, clean** — the smallest content that fully conveys the rule. Condense the wording; never drop
  a rule's actual content.
- **Split by what must load together** — keep unrelated concerns in separate files so a reader loads only
  what applies.
- **Keep an auto-loaded doc lean** — under ~200 lines; split a longer one by sub-topic.
- **The frontmatter `description` fails invisibly.** Keep it ≤1024 characters with no angle brackets — the
  claude.ai Skill validator rejects longer and reads `<that doc>` as a tag, though both load fine locally.
  Measure the *folded* string, and re-wrap with hyphen-breaking off: a break inside `spec-write` folds back
  as `spec- write` — valid YAML, wrong text. Condense wording; never drop a rule.
- **Audit a gate's own examples.** Every example in a constraint must itself conform to it — a wrong example
  licenses exactly what the rule forbids and reads as sanctioned (worse than a missing one).
- **Verify behavior, not just that it compiles.** A green build or consistency check proves a skill loads,
  not that it behaves; when a change alters behavior, dry-run it on a real input before sign-off. Strip any
  pre-seeded answers first, and check what the target project auto-loads — its agent-instruction files may
  import session notes, task lists, or lessons that restate the very decisions under test, so a genuinely
  cold trial needs a project that never made them. Otherwise the test measures the hint, not the skill.
- **Adopting a better output does not teach the asset.** When a run produces something better than the
  reference, record the *technique* in the asset — not just the artifact as a new baseline. An asset cannot
  reproduce a rule nobody wrote down, and the next run reverts.

## Keep project-specifics minimal

The closer your asset is to the kit's general form, the lighter its promotion. Author the general scaffolding
in general form, and keep **only the project-specifics you genuinely need** (real paths, your schema, named
components).

- Don't add gratuitous project flavor to the general parts — that is drift the maintainer must strip every time.
- Don't pre-generalize the specifics you *do* need — they are correct here; generalization is a promotion-time
  step, done kit-side.
- **Show a reference project only as a labeled `Example (…)`, never as law** — under-generalizing (leaving a
  specific as prose) and over-pinning (baking one project's constants in as the rule) are the same failure
  from opposite sides.

## Contribute a reusable asset

- **It captures automatically.** An edit under `.claude/{rules,skills,agents,hooks}` is staged into the kit's
  `incoming/` by the `asset-capture` hook — through the Edit tools directly, and through the shell via
  `bash-write-adapter`. Confirm it fired (the `incoming/` copy updated). Capture is fail-open, so a genuine
  hook failure is silent; but if staging is ever missing, suspect the channel before the hook. The one
  recorded case of "the hook lost my files" was a `sed -i` sweep that never reached it at all.
- **Repo-bound asset** (hardcoded to this one project) → it goes to the kit's `repos/<name>/` verbatim.
- **Spotted a global-asset fix while working here?** A global rule or the shared `CLAUDE.md` has no project
  `.claude/` copy, so it won't auto-capture. Stage a shaped fix by hand: write the improved version to a temp
  file, then copy it into the kit's `incoming/<type>/`. Unsure where it belongs, or don't want to touch it
  mid-task? Drop a note in `incoming/notes/` instead (see below).
- **Not a clean asset yet?** A candidate lesson with no clear rule home, a global edit you don't want to make
  in-flow, an idea that might need a new asset, or a bug in an existing hook → drop a short note in the kit's
  `incoming/notes/` rather than forcing it into a type bucket. The maintainer triages it.

## What happens next

The maintainer reviews each staged asset and promotes it to the right tier — generalizing shared-tier assets,
keeping repo-tier ones verbatim. You contribute; you don't promote.
