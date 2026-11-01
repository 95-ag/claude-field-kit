---
name: project-sync
description: project-sync — the owner runs this from the kit root to deliver the kit's project tier (rules, skills, agents, hooks) to projects that already hold a .claude/kit-delivery.json record. It shows each project's plan, applies on the owner's go, hand-merges conflicts, asks about edited skills, and gives the report. Owner-run only; never started by the model on its own.
disable-model-invocation: true
---

# project-sync — deliver the kit's project tier to set-up projects

Drives `global/tools/project-sync.mjs`: shows what each project is owed, writes it on the owner's go, finishes
what the tool cannot merge, and reports every outcome.

**Maturity:** EXERCISED on real projects — the dry run, `--apply` and `--status` on four, `--resolved` on three,
`--take-kit` on one. The limit: those runs predate the renamed-file, edited-binary, symlinked-target,
merge-workspace cleanup and `--restore` changes, whose paths have run only in the tool's harness, against
throwaway kits and projects; a harvest-prepared copy (step 5) has not run at all.

## When to use

- The owner says "project-sync", names projects to bring up to date, or asks what a project is behind on.
- After promoting a `project/` asset the owner wants delivered.

## Stop before running if

- The session's working directory is not the kit root (`global/tools/project-sync.mjs` is not under it).
- `ListAgents` shows a session open in a target project — its `bash-write-adapter` would capture the writes
  as new assets. Name the session and stop.
  - Check again immediately before every writing call (`--apply`, `--apply --resolved`,
    `--apply --take-kit`), not only here. A snapshot is not a lease.
- The owner has not said go for `--apply`. Steps 1–2 write nothing and need no go.
- The tool prints `REFUSED: …` — report the reason as printed and stop.
  - Never work around it. A dirty `project/` or a `HEAD` off `main` is the owner's to fix.
  - A skill pointer under `project/` that does not resolve refuses the dry run and every `--apply`: report the
    `skill-reference-check` lines printed above it; fixing the pointer is a kit change, then rerun. `warn:`
    lines do not refuse — report them for a read.
  - A missing record means `project-bootstrap` adopt.
  - Exception: the merge-workspace refusals of `--apply --resolved` — a stale copy (kit moved or project file
    changed), a missing sidecar, a marker left in the copy, or no copy. Step 6 gives each its remedy.
  - A workspace folder owned by a like-named project (its `project.json` names a different directory)
    is not that exception: stop.
    - The tool removes the folder when that other project's last copy is resolved, or consumed by a plain
      `--apply`; rerun then.
    - A copy deleted by hand, or left behind when its file was added to `skip` or removed by the project, keeps
      the folder: hand the owner `tmp/project-sync-merge/<name>/` in the kit to delete.
    - Never delete it yourself.

## Run it yourself — never from a subagent

The owner's go and the hand merges are this session's.

## Steps

All commands run from the kit root: `node global/tools/project-sync.mjs …`. Targets are project directories,
or `--all` for every folder beside the kit that holds a record.

1. **Status.** Run `--status` on the named projects (or `--all`). Show each project's `delivered` commit, how
   far behind it is, and what is owed.
2. **Plan.** Run without `--apply` and show the plan per project, including its Settings and Rules table
   previews. Nothing is written.
3. **Go.** Ask the owner for the go on `--apply`, naming the projects.
   - A go covers only the projects named.
4. **Apply.** Run `--apply`.
   - It backs up first, then writes.
   - It advances each resolved file's recorded base.
   - It exits 1 while anything is still owed.
   - Owed means a conflict, an edited file with no base, a file the kit renamed that the project edited, an
     edited binary, a symlinked or non-regular target the kit changed, or a held skill.
   - A symlinked or non-regular target is never written through. Ask the owner: replace it with a regular file
     outside this session, or add its kit path to `skip`.
     - A symlinked file inside a skill holds back the whole skill; the report names the skill and the file.
   - An edited binary is never merged. Ask the owner: keep the project's version (add its kit path to `skip`),
     or take the kit's.
     - Take the kit's with `--apply --take-kit <kit file>` (a kit path relative to `project/`) on that one
       project: it backs the file up, writes the kit's bytes and advances its recorded base. Never copy it by
       hand from this session (step 5 says why).
5. **Hand-merge** each path under Conflicts and Edited without base, and each renamed file under Notes, in the
   workspace copy the report names under the kit's `tmp/project-sync-merge/`.
   - Never edit the project's own file: a direct edit under its `.claude/` rules, skills, agents or hooks is
     captured into the kit's `incoming/` by `asset-capture` and has no backup.
   - A conflict's copy carries merge markers (`project` and `kit` labels); an edited file's copy is the
     project's version.
   - Two sidecars sit beside each copy: `.kit` holds the kit's `HEAD` version, `.project` the project bytes the
     copy was built from.
   - Before hand-merging a conflict, look for a resolved copy the kit's own `harvest` skill prepared (its
     step 6) at `tmp/harvest/<name>/`, at the workspace copy's path relative to its own folder:
     - the lines that harvest promoted are the project's own, reworded, so the copy is the merge;
     - use it only where its `.kit` and `.project` match the workspace copy's and the workspace copy is new
       this run — never over one the report marks "workspace copy kept" or stale;
     - to use it, write it over the workspace copy, keeping that copy's sidecars;
     - otherwise hand-merge as usual.
   - For a conflict, also read the base the project last received: `git cat-file blob` on its `files` entry.
   - For a conflict, keep the project's wording and deletions; take the kit's additions. Never put back a line
     the project removed.
   - For an edited file with no base, a project deletion cannot be told from a kit addition:
     - Find the copy's nearest past kit version: `git log -p -- project/<kit path>` in the kit.
     - Take only what the kit added after that version.
     - Add no other kit line the project lacks — it may have removed it.
     - List each such line under Edited without base in the Report as "not added — the project may have
       removed it".
     - If no past kit version matches the copy, add nothing: list every kit line that differs from the copy
       as "not added — no past kit version matches the project's copy".
   - For a file the kit renamed that the project edited, the copy sits at the new path.
     - With a recorded base, it holds the merge of the project's old-path file into the kit's new text, with
       markers where they conflict. Merge it as a conflict: the base is the old path's `files` entry.
     - When the report says "no recorded base", it is the project's old-path file as it is. Merge it as an
       edited file with no base (above), reading its history across the rename:
       `git log --follow -p -- project/<new kit path>`.
     - The project's old file stays where it is until step 6.
   - Remove every marker line.
   - Do not preview the merge to the owner — the plan and the go were the owner's gate.
   - A later plain `--apply` never overwrites an existing copy, so merge in progress is safe.
6. **Resolve.** Run `--apply --resolved <kit path>[,…]` on that one project.
   - It writes the merged copy into the project's file, after backing that file up.
   - It advances those paths' recorded bases to the kit's `HEAD`.
   - It removes the copy and both sidecars.
   - For a renamed file, name its new kit path. The tool writes the copy to the new path, removes the old
     file (both backed up), drops the old path's record entry and moves its Rules table row.
   - It refuses a copy that still holds markers: finish the merge, then run `--resolved` again.
   - It refuses a stale copy, one whose `.kit` sidecar no longer matches the kit's `HEAD` (kit moved) or whose
     `.project` sidecar no longer matches the project's file (project file changed). It refuses a copy whose
     `.kit` or `.project` sidecar is missing.
     - Remedy for both: delete the copy and its `.kit` and `.project` sidecars, re-run `--apply`, and merge
       again.
     - A plain `--apply` reports a stale copy as "stale (kit moved)", "stale (project file changed)" or
       "stale (.kit sidecar missing)" / "stale (.project sidecar missing)".
   - It refuses when there is no copy: run `--apply` first, then merge there.
   - If the tool says a path now merges cleanly, run a plain `--apply`; it takes the file.
   - Repeat steps 5–6 until the exit is 0 or only what steps 4 and 7 settle remains: held skills, edited
     binaries, and symlinked or non-regular targets.
7. **Held skills.** For each, ask the owner one question: "drop this edit, or keep the project's version?"
   - **Drop** — run `--apply --take-kit <kit skill dir>[,…]` on that one project.
     - The kit skill directory is the path under `project/` the Held skills entry names.
     - A skill the kit renamed is held under its new kit path, and the entry also names the project's copy at
       its old name. Take it by the new path; the tool removes the old copy's files, backed up, and the old
       directory with them unless a project-only file is left in it.
     - The tool backs up, then replaces the whole skill with the kit's version.
     - It advances the skill's recorded bases.
     - It refuses a skill that is not held.
     - It never touches the kit's `incoming/`.
   - **Keep** — add the skill's directory (a kit path under `project/`) to `skip` in the project's
     `.claude/kit-delivery.json`.
     - For a renamed skill, skip the new kit path; that also covers the copy still at the old name.
     - Touch nothing else in the record.
     - The skill is then reported under Skipped / opted out.
8. **Report.** Give the Report below.

## Report

One section per outcome, each saying "none" when empty. Compile from every `--apply` output of the run:
file writes appear in the first, resolutions in the later ones.

Rules the sections discharge:
- **Never silent** — a held, skipped, removed-by-the-project or unresolved item is reported with its reason
  until the owner resolves it.
- **Planned before written** — nothing changes that the plan did not show.
- **Backed up first** — every writing run can be undone.

Sections:
- **Replaced** · **Added** · **Merged** (clean merges and hand merges) · **Removed**
- **Conflicts** · **Edited without base** — with how each was resolved, or that it is still open; for an
  edited file, each kit line not added (discharges never silent)
- **Removed by the project** — with the suggestion to `skip` it; never re-added (discharges never silent)
- **Held skills** — with the owner's answer for each; a dropped one reads "taken from the kit"
  (discharges never silent)
- **Skipped / opted out** (discharges never silent)
- **Settings** · **Rules table** (discharge planned before written: the plan previewed both)
- **Still owed** — anything left, and why (discharges never silent)
- **Backup path** — every `--apply` that wrote makes its own; list each (discharges backed up first)
- **`delivered` before → after** — before from the first `--apply`, after from the last
- **Notes** — the tool's renamed-and-edited (until resolved), retired-but-edited, binary-edited, symlinked and
  project-only files, each edited binary "taken from the kit", and its
  "N file(s) already current, recorded" line (discharges never silent)

To undo a run: `--restore <backup path>` puts the backed-up files back and removes the files that run added.
After a `--resolved` run it also puts back the merge copies that run consumed, with their sidecars; it refuses
while a copy already sits at that path. It runs even when the kit has uncommitted changes.

## After running

- The owner checks the Rules table rows and Settings lines in the report against the project.
- A project session opened before the run still holds the old assets until restarted.
- Nothing is committed — project `.claude/` is gitignored, and the kit's `tmp/` backups stay until the owner
  removes them.
