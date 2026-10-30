# Procedure — fill the templates, wire CLAUDE.md, verify

Set-up steps 5 to 7 of `SKILL.md`. Read it when you reach them. `project-sync` has already composed the
project's rules, hooks, skills, agents and `settings.json`; everything here is what it does not deliver.

Plugins are reference catalogs and are never seeded; they install machine-wide
(`global/shared/plugins/README.md`). Global safety hooks and the session-checkpoint nudger are not seeded
either: `global-sync` delivers them to `~/.claude`.

## Fill the templates

Source folder: `project/shared/` in the kit.

| Template | Target in the project |
|---|---|
| `CLAUDE.template.md` | `.claude/CLAUDE.md` |
| `work/session.template.md` · `tasks.template.md` · `lessons.template.md` | `.claude/work/session.md` · `tasks.md` · `lessons.md` |
| `docs/README.md` (the structure, not a template) | `.claude/docs/` |

- Drop the `.template` suffix; a project holds no template.
- Never overwrite a file the target already holds. Report it as kept.
- Seeded once, then project-owned: `CLAUDE.md` and `work/*` are never re-pulled by `project-sync`.
- Fill every placeholder from the owner's answers.
- A fact the answers do not give stays a `TODO:` line, and the Report lists it with its file.
- Remove a template's HTML comment guidance once its section is filled.
- `session.md`:
  - `## Phase` names the set-up and the project's state.
  - `## Next` points at the seeded task.
  - `## Blockers` says "None" or the owner's blocker.
  - The other sections stay empty headings.
- `tasks.md`: the seeded task replaces the placeholder cluster under `## Now`.
- `lessons.md`:
  - Delete the example entries (`## <Short rule title>`, `## <Skill · file>`).
  - The header and the Custom-skill notes preface stay.

### Docs

- Mandatory: `PROJECT.md` and `IMPLEMENTATION-PLAN.md`. `ARCHITECTURE`, `SCHEMA` and `DESIGN` only when the
  answers show the project needs one — the fold rules are in `project/shared/docs/README.md`.
- A doc that exists is kept, whatever its name; `PRODUCT.md` stands in for `PROJECT.md`.
- Write an absent mandatory doc through `spec-write`, with the owner's answers as its substance. Where the
  answers decide nothing, `spec-write` stops; leave the doc absent and report why.

## Wire CLAUDE.md

- **Header.** Project name and a one-line identity from the answers.
- **Read first.** One row per doc that exists, naming what it owns. With no doc yet, replace the table with a
  `TODO:` line naming `PROJECT.md`.
- **Stack.** Language, framework and key libraries from the answers.
- **Commands.** One `TODO:` line per row. The installs have not run, so the commands are not yet known.
- **Rules table.** One row per `*.md` under `.claude/rules/` — what landed, not what the kit holds.
  - Path in full: `.claude/rules/node/git.md`, never `.claude/rules/git.md` for a bucket rule.
  - Covers: the rule's `purpose` from `project-sync --catalog`. Over ~120 characters, keep its first
    sentence — the cut `project-sync` makes when it later adds a row:
    - A sentence ends at `.`, `!` or `?` followed by a space and a capital letter, or at the end of the text.
    - Never cut inside parentheses or after `e.g.`, `i.e.`, `etc.` or `vs.`.
    - With no such end, keep the whole purpose.
  - Order: the flat shared rules first, then each bucket folder.
- **Project constraints.** Only what the answers state as true of this repo. A reusable rule belongs in a rule
  file.
- Keep the three `@work/` imports at the top.
- Repo-specific facts only. Workflow, git, guardrails and engineering live in the global `CLAUDE.md`; reference
  them, never restate them.
- Optional sections (Architecture, Conventions, Gotchas, Environment) only when no rule already covers them.

## Verify

Run every check, from the kit root, against the project. Report each result; a failed check is fixed, then the
check is rerun. Nothing is declared seeded while one fails.

- A fix that needs a file under `.claude/rules/`, `skills/`, `agents/` or `hooks/` — a missing hook script in
  check 3, or any other asset fix — goes through `project-sync`: correct the record or the kit, then re-run it.
- Never hand-write such a file: it has no backup, and `asset-capture` stages it into the kit's `incoming/` as a
  new capture.

1. **References resolve.** Every path in the Rules table and every `@import` in `CLAUDE.md` names a file that
   exists. An `@import` resolves relative to the file holding it.
2. **No `.template` leftovers.** No file under `.claude/` has a `.template` suffix, and `CLAUDE.md` and
   `work/*.md` never name a `.template.md` file.
3. **`settings.json` is valid.** It parses as JSON, and every `.claude/hooks/<script>` its `hooks` name exists
   in `.claude/hooks/`.
4. **Auto-loaded docs are lean.** `CLAUDE.md` and each `work/*.md` stay under ~200 lines; a longer one is split
   by sub-topic.
5. **No placeholders left unmarked.** No angle-bracketed template slot (`<Project>`, `<…>`) and no template
   HTML comment remains in `CLAUDE.md` or `work/*.md`; a deliberate gap is a `TODO:` line.

Collisions need no check: a shared rule keeps its bare name and a bucket rule lands under its bucket folder, and
`project-sync` refuses two buckets delivering one path.
