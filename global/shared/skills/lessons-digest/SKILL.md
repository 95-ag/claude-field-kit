---
name: lessons-digest
description: >
  Use when a project's correction log (`lessons.md`) has grown past one reading — "digest the lessons",
  "triage lessons.md", "which of these should be rules?" — to decide which entries become rules, which file
  each belongs in, which are not rules, and which are already carried and should go. Owns the triage and its
  safety checks: lossless re-cluster, same-rule groups, already-carried and no-loss proofs, and a back-pass
  over promoted rules a later lesson has falsified. Not for writing the receiving rules' prose, capturing a
  new lesson, or pruning session notes and task lists (`checkpoint`).
---

# lessons-digest — triage a correction log into rules

A correction log is written one entry at a time and read by someone looking for something else. Left alone it
becomes both log and rule set, and neither works. The triage's costly failures are a promoted rule naming the
wrong mechanism, and an entry deleted as "already carried" whose only copy does not last.

## Scope

| Stage | Owner |
|---|---|
| Capturing a lesson | the project's own workflow |
| Re-cluster · triage · promotion decision · no-loss proof | **this skill** |
| The prose of a promoted rule | the receiving file's own conventions |
| Pruning session notes and task lists | `checkpoint` |

## Triage on three axes

| Axis | Question | Values |
|---|---|---|
| **Destination** | Which file owns it? | cross-project rule · project rule · stays a lesson |
| **Quality** | Root cause or a patch over it? | root · patch · bare fact · stale |
| **Reader** | Who must read it to obey it? | the planner · the executor · whoever drives a harness |

- **Destination answers content, not tier.** Cross-project means the rule survives losing every specific.
  - Which projects receive it is the destination owner's call, usually argued on reach.
  - Recommend a tier and name the reading you used.
- **Cross-project + patch is the dangerous cell** — promotion publishes a wrong mechanism. Where the remedy is
  sound and the cause is not established, carry the remedy and say so; never invent a mechanism.
- **Reader is the axis a two-axis pass skips.** A rule binding a dispatched executor must land in its brief
  (`sessions-and-subagents.md` → Subagents).
  - Unreachable and present-but-unapplied look alike in the log — diagnose which first.
  - Present-but-unapplied is fixed in the brief — name the rule, or restate it where its breach hangs or
    destroys work — not by another copy of the rule.

## Two modes

| Mode | When | Runs |
|---|---|---|
| **Full pass** | the log has outgrown one reading | every step |
| **Sitting** | one person reads it in one pass | steps 2, 4, 5, 6, the back-pass and the report |

Steps tagged `[full]` belong to the full pass only.

## Order of operations

1. **`[full]` Re-cluster losslessly** so the headings become the work order; prove nothing was lost before
   triaging.
2. **Split bundled entries** — one bullet carrying several rules has no single destination.
3. **`[full]` Collapse same-rule groups** before assigning destinations, or the pass emits one rule per entry.
4. **Check already-carried** — many entries are deletions, not promotions.
5. **Promote, then delete** — never delete before the receiving rule exists.
6. **Prove no loss** mechanically, and again at session end.

## Already-carried

- **Carried means carried in a versioned file.** A staging folder that version control ignores is not a
  destination — deleting the entry moves its only copy.
- **Drafted and handed over is not a destination.** Hold the entry with no "held" marker or task — the next
  pass's versioned check protects it, a marker goes stale, and tracking the hold is the destination owner's.
- **Read the residue before deleting.** An entry whose imperative a rule states often carries more — a cheaper
  test, a mechanism, a counter-case. Merge the residue into the carrying bullet, then delete.
- **Same subject is not carried.** The rule must state the same imperative; evidence for it counts, a different
  imperative on the topic does not.

## The back-pass

Promotion only reads new entries, so nothing re-checks a promoted rule. Every digest reads the rule files and
asks whether any later entry contradicts a bullet. Report four kinds apart:

- **falsified** — the rule is wrong;
- **narrowed** — true in a smaller case than it claims;
- **contradicts a standing decision** — tells a reader to do what the project forbids;
- **dangling** — points at a section that does not exist.

- Verify each live in the files as they stand, cross-project tier included.
- A rule and a lesson on one topic, or an incomplete rule, is not a finding; a rule wrong, or wrong outside an
  unstated scope, is.

## Mechanics

- **Flatten newlines before every grep** — a phrase across a line break returns a false "not carried" or
  "already fixed".
- **A promotion is a rewrite, not a move** — no project name, date or log pointer in the receiving file.
- **Prove no loss by set containment both ways** over normalised entry bodies, not by eye.
- **Apply multi-hunk edits tolerantly** and print every miss with its found-count, so one stale anchor does not
  discard the batch.
- **Verify each entry against the tree** — entries outlive their fixes.

## Who runs it

- **`[full]` Dispatch the classification** — the log's author greps for what they remember; a reader with no
  context compares artifacts.
- **The controller makes every log edit** (`sessions-and-subagents.md` → Shared work documents); delegate the
  gathering only.
- **"No destination exists" is an outcome** — never force an entry into an existing file, and never create a
  file that only restates its neighbours.
- **Surface a conflict with a standing decision, including the one that commissioned the pass.** Never override
  it silently.
- **Leave an entry a live peer is writing where it is** — mis-filed costs less than editing under a writer.
- **Record a dissent on a tier, with the reading each side used,** then execute the ruling.

## The regrowth rate

- Promotion resets the level, not the arrival rate. Count entries at each dated milestone and state the rate.
- Size the sitting from that rate, never from another project's number.
- Recommend the cadence — a better method leaves the arrival rate where it was.

## Report

One section each, in this order; a section with nothing says "none":

1. **Promoted** — each rule, its file, the tier recommended and the reading used.
2. **Deleted as carried** — each entry and the versioned bullet that carries it.
3. **Held** — each entry and the destination it waits on.
4. **No destination** — each entry and why no file fits.
5. **Back-pass** — findings by the four kinds.
6. **Conflicts and dissents** — each standing decision met, and each tier ruling with both readings.
7. **Regrowth** — the rate and the recommended cadence.
