# Portfolio System Rules

Portfolio project generation is driven by four pipeline skills. Each skill is
self-contained — SKILL.md + references + evals. The skills are the operational
source of truth for all portfolio work.

## Pipeline — mandatory order for every project

```
project-content-extraction
  → project-assets-generation
  → project-cover-generation
  → project-review
```

Each step requires explicit user approval before the next begins.

| Skill | Owns | Key references |
|---|---|---|
| `project-content-extraction` | MDX content from report + repo | `evidence-and-modes.md`, `frontmatter-rules.md`, `extraction-procedure.md`, `narrative-structure.md` |
| `project-assets-generation` | Diagrams, charts, legacy PDF crops | `asset-procedure.md`, `asset-standards.md` |
| `project-cover-generation` | Hero cover (3-gate: directions → base → annotations) | `cover-procedure.md`, `cover-standards.md` |
| `project-review` | Two-pass QA (recruiter + technical hiring manager) | `review-protocol.md`, `assets/reviewer-*.md` |

## Always Prioritize

- implementation clarity over marketing language
- technical credibility over hype
- project-specific structure over generic AI aesthetics
- responsive and theme-aware compositions
- reproducible assets where practical

## Never

- invent metrics or deployment claims
- generate decorative visuals without technical meaning
- create generic AI/sci-fi hero artwork
- turn projects into academic documentation dumps
