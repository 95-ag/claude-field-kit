---
name: project-bootstrap
description: project-bootstrap — the owner runs this from the kit root to set up a new project's .claude/ from the kit's project tier, or to adopt a project whose .claude/ was composed by hand. It asks about the project, shows tiers and files pre-selected for correction, writes the delivery record, then hands the copy to project-sync and fills the templates. Owner-run only; never started by the model on its own.
disable-model-invocation: true
---

# project-bootstrap — set a project up, or adopt one

Writes a project's `.claude/kit-delivery.json` from the owner's answers. Set-up then has `project-sync` copy
the assets and fills the templates once; adopt writes the record only. A project that already holds a record
is `project-sync`'s.

**Maturity:**
- **Set-up — EXERCISED.** Walked end to end on a scratch repository with the owner's answers simulated.
  - `spec-write` and a live project session were not part of the run.
  - The resume path for an interrupted set-up is unexercised.
- **Adopt — SPECIFIED.** Never run. The `--record-bases` mode beneath it is EXERCISED by the `project-sync`
  harness against throwaway projects only.

## When to use

- The owner says "project-bootstrap" or "set up this project", naming a project directory.
- The owner wants an existing hand-composed project to receive `project-sync` deliveries.

## Choose the mode

Read the target's `.claude/` first.

| Target holds | Mode |
|---|---|
| nothing, or only `docs/` | Set-up |
| a record and no `.claude/CLAUDE.md` | Set-up resumed: an earlier set-up was interrupted |
| any of `rules/`, `settings.json`, `hooks/`, `skills/`, `agents/`, and no record | Adopt: the `.claude/` was composed by hand |
| a record and a `.claude/CLAUDE.md` | `project-sync`; adopt only if the owner wants the tiers or `skip` corrected |

An interrupted set-up resumes by `delivered`:
- Re-ask the step-2 questions first — a resume has no answers.
- `delivered` null: the record is written, so resume at step 4 with the plan and `--apply`.
- `delivered` set: the copy is done, so resume at step 5.

## Stop before running if

- The session's working directory is not the kit root (`global/tools/project-sync.mjs` is not under it).
- `ListAgents` shows a session open in the target project — its `bash-write-adapter` would capture the writes
  as new assets. Name the session and stop.
  - Check again immediately before every step that writes to the project, not only here.
  - A snapshot is not a lease.
- Set-up is asked of a target with a record and a `.claude/CLAUDE.md` — that is `project-sync`'s.
- Set-up is asked of a hand-composed `.claude/` with no record — that is Adopt.
- The owner has not said go for `--apply`.
- The tool prints `REFUSED: …` — report the reason as printed and stop.
  - A dirty `project/` or a `HEAD` off `main` is the owner's to fix.

## Run it yourself — never from a subagent

The questions, the corrections and the go are this session's.

## The record

`.claude/kit-delivery.json` in the project. Both modes write `tiers` and `skip`; only `project-sync` writes
`delivered` and `files`.

`{ "tiers": { "domains": [], "stacks": [], "repo": null }, "skip": [], "delivered": null, "files": {} }`

- **`tiers`** — the domain and stack folders chosen.
  - `project/shared` is always on and is not listed.
  - `repo` is the folder name under `project/repos/`, which need not match the project's folder.
  - A tier the owner unticks is dropped from `tiers`, not skipped file by file.
- **`skip`** — the files the owner unticked, each as the catalog entry's `kit` field: a kit path relative to
  `project/`.
  - A skill is skipped by its directory.
- **`delivered` and `files`** — null and empty at set-up; an existing record keeps its own.

## Set-up

Commands run from the kit root. `node global/tools/project-sync.mjs --catalog` prints every tier and
deliverable file as JSON: `tiers`, and `entries` with `kit`, `bucket`, `type`, `target`, `files` and `purpose`.
Choose from it, so a tier or file added to the kit appears with no edit here.

1. **Read what exists.** `.claude/docs/*` and any manifest in the project (`package.json`, `pyproject.toml`).
   Expect little or none — set-up runs alongside installs.
2. **Ask open questions, one at a time, in the owner's words.** Skip any the docs already answer.
   - What the project is.
   - How it will be built: language and framework, UI or not, where it deploys, external APIs or auth.
   - What the owner already knows it will not need.
3. **Show the inference pre-selected.** A numbered chat list; the owner answers with numbers to flip.
   - Tiers first: each domain, each stack and the named repo is on or off.
   - A named repo's assets load in that one project only.
   - Then each active tier's files, grouped by tier.
   - Every line ends with a one-clause reason from the answers and the entry's `purpose`.
     Example: `7. node/vercel.md — on: deploys to Vercel`.
   - Apply the owner's corrections and show the list once more if they changed a tier.
4. **Write the record, then deliver.**
   - Write the record (→ The record) with the tiers and `skip` chosen.
   - Run `node global/tools/project-sync.mjs <project-dir>` and show the plan. Nothing is written yet.
   - On the owner's go, run `--apply`.
   - Anything it leaves owed goes through `project-sync/SKILL.md` steps 5–7.
   - Its Rules table line reads "no Rules table — not edited", because no `CLAUDE.md` exists yet.
   - Step 5 writes the table.
5. **Fill the templates once** — `CLAUDE.md`, `work/*`, `docs/` → `references/procedure.md` → Fill the
   templates and Wire CLAUDE.md.
6. **Seed one task** in the new `tasks.md` → `references/procedure.md` → Fill the templates.
   Example: `- [ ] After installs: fill CLAUDE.md Commands, re-run ensure-formatters`.
7. **Verify** → `references/procedure.md` → Verify. Fix a failure and rerun the check.
8. **Run `ensure-formatters`.**
   - Run `git ls-files` in the project. With no tracked file, say plainly: "nothing to judge — no tracked
     files yet". Never report a pass.
   - Otherwise follow `ensure-formatters/SKILL.md` against the project and report its result.

## Adopt

Writes the record only. It copies nothing and touches no `CLAUDE.md` or work doc.

1. **Read** the project's `.claude/rules/` subfolders, `.claude/skills/` and `.claude/docs/`.
   - A rules subfolder named like a kit stack, domain or repo folder points at that tier.
   - Where a record exists, start from it instead.
2. **Show tiers and files pre-selected** as in Set-up step 3; the owner corrects.
   - A kit file the project lacks is pre-selected **on**, reason: "kit has it, project lacks it — untick to
     skip".
   - A missing file is as often new in the kit as unwanted.
   - A project file the kit does not hold is project-only; never list it.
3. **Write the record** (→ The record) with the tiers and `skip` chosen.
   - Then ask the owner one question: "Was this project fully delivered from the kit at a commit — which?"
   - **No, or unsure** — run `node global/tools/project-sync.mjs --record-bases <project-dir>`.
     - Each present file equal to a past kit version is recorded at that blob.
     - An edited file gets no entry, so the first `project-sync` reports it "edited, no base" for one hand
       merge.
   - **Yes** — run it with `--at <commit>`, the commit the owner names.
     - Every present file is recorded at that commit's blob.
     - Never propose a commit.
   - The tool refuses once `delivered` is set; `tiers` and `skip` are then all adopt can change.
4. **Suggest `/project-sync`** as the next step; its dry run shows what the project is owed.

## Report

One section per outcome, each saying "none" when empty; Adopt reports "none" for the sections it does not run.

- **Answers** — the owner's answers and every correction to the pre-selection.
- **Record written** — `tiers`, `skip`, and for Adopt the `--record-bases` output with its backup path.
- **`project-sync` report** — the plan shown and the `--apply` report, in the sections `project-sync` defines.
- **Templates filled** — each file created, and each kept because it existed.
  - Each mandatory doc left absent, with why.
  - Each `TODO:` left in a file, with the file.
- **Verify results** — each of the five checks, passed or fixed.
- **`ensure-formatters` result** — the report, or "nothing to judge".
- **Seeded task** — the line written.

## After running

- Nothing is committed; the project's `.claude/` is gitignored.
- The `--apply` backup stays in the kit's `tmp/project-sync-backup/` until the owner removes it.
- `--restore` undoes the delivery, not the template fill.
- A session opened in the project before the run still holds the old assets until restarted.
