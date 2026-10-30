---
name: design-tweak
description: >
  Use when a design value needs to be changed by eye rather than derived — "try a few options for
  this spacing", "tune the accent until it reads right", "let me see this at three sizes", "preview
  this before we commit to it" — and on any equivalent intent: running the preview-and-confirm stage
  of a design change, then carrying each confirmed value through doc, code, gallery and page without
  losing one. Owns the stage BEFORE the doc is written: the scratch preview route, the tuning panel's
  contract, and the per-item ledger that proves every confirmed value actually landed. Do NOT use it
  to write the design doc (that is design-write), to generate component or token code (that is
  scaffold-design-system), or to build the component gallery (that is curate-gallery) — it hands off
  to all three and tracks that they finished.
---

# design-tweak

Runs the **preview → confirmed** stage of a design change, then makes sure each confirmed value reaches
the doc, the code, the gallery and the page.

A value judged by eye cannot be derived from a spec, so it is chosen on a render. That stage fails in its
own ways: a panel reporting a value it did not paint, an option ladder inviting a settled value to be
re-decided, a toggle that cannot show a cost living outside CSS, and a value confirmed but only half landed.

---

## Scope — the prefix and the sequencing, nothing else

| Stage | Owner |
|---|---|
| Scratch preview route · tuning panel · the reviewer's confirmation | **this skill** |
| The aesthetic direction a round's candidates come from | `frontend-design` |
| The design doc | `design-write` |
| Tokens and component code | `scaffold-design-system` |
| The component gallery | `curate-gallery` |
| The shipping page | the project's own composition work |

- **Own the one stage nothing else covers, plus the ledger** — the only artifact that sees all five
  stages at once.
  - Owning the downstream stages too would make this a wrapper that breaks whenever one of them changes.
- **Never originate a design value** — who decides a value, and what needs no asking, is the project's
  visual-verification rule (Reviewing a design with the owner → Who decides what).
- **A direction is not a degree.** Choosing what the thing should look like is a direction: take it from
  `frontend-design`, then render what comes back as the round's candidates. Without that step a round
  produces plausible defaults nobody chose.
  - `frontend-design` is a marketplace skill — referenced, never vendored or edited.
  - Where it is not installed, bring direction options to the reviewer as a decision instead.

---

## Project-native inputs

Resolve each from its owner before building anything; none is defined here.

| Input | Owner |
|---|---|
| How a dev-only route is created and excluded from production | the project's framework rule |
| How render checks and measurements are run | the project's render-verification rule |
| How the styling framework maps tokens to utilities | the project's styling-framework rule |
| Token names, the type scale, every visual constant | the design doc |
| Where a confirmed value's code belongs | the project's component-structure rule |
| The commands that prove the work | the project's build-verification rule |

Three render-verification rules govern every probe this skill writes; the project's rule holds their
detail:

- **Pin the render engine** — a default headless build can quantise glyph advances and manufacture
  overflows that do not exist.
- **Validate a harness against a figure already known to be true** before trusting a new number from it.
- **Never model a give-way chain arithmetically** — where elements yield space in turn as a container
  narrows, apply each step and measure.

---

## The loop

One item at a time, in this order — a doc that describes the current code instead of the decision is
debt, and a figure the doc needs cannot exist before the code does.

```
preview  →  confirmed  →  doc  →  code  →  gallery  →  page
└── this skill ───────┘   └── design-write · scaffold-design-system · curate-gallery ──┘
```

1. **Strip the route.** The preview route is scratch and never committed, so it still carries the last
   round's toggles, each now comparing a shipped value against itself. Start from bare.
2. **Mount the real page, do not re-compose it.** The route imports and renders the shipping page
   component; a re-composed preview is a second copy that drifts. *Example:* a route whose whole body is
   `<Home />`, importing the real page module.
3. **Where the round needs a direction rather than a degree, get it first** (→ Scope — the prefix and the
   sequencing, nothing else), and bring its options to the reviewer before building a panel around them. A
   panel chooses among candidates; it cannot supply them.
4. **Build this round's panel** to `references/panel-contract.md`.
5. **Review live** (the project's visual-verification rule → Reviewing a design with the owner).
6. **Open a ledger row at each confirmation**, with the value as the panel painted it (→ The ledger).
7. **Hand off, in order**, and close the row. Ask the reviewer whether `design-write` may take the
   confirmed rows (Value and Scope) as a pre-approved batch — only the user can grant one.

---

## The ledger

**Every confirmed value gets a row the moment it is confirmed; the round is not finished until every row
is closed or carried.** Each downstream skill sees only its own stage, so the ledger is the one place the
whole loop is visible.

| Field | Holds |
|---|---|
| **Item** | what was being decided |
| **Value** | the confirmed value, read off the element that paints it — never the value written into the panel |
| **Scope** | which tiers, states or breakpoints it applies to, and which it explicitly does not |
| **Doc** | the doc entry that now states it, by heading — or `n/a` with a reason |
| **Code** | the token or component that implements it |
| **Gallery** | the specimen that shows it — or `n/a` with a reason |
| **Page** | confirmed on the shipping page at the viewport it was judged at |
| **Open** | anything deferred, with what it is waiting on |

- **Open a row at confirmation, not at handoff.** A value confirmed and not written down is re-decided
  later, differently, with nobody aware of the first decision.
- **`n/a` is a valid cell; empty is not.** An empty cell and a forgotten stage are indistinguishable.
- **The page column is not implied by the code column.** Code that compiles and a page that reads right
  at the judged viewport are different claims; the reviewer approved the second.
- **Carry a row that cannot close**, with what it waits on — never drop it because the round ended.
- **Where the ledger lives is the project's call** — its task or session docs, or a file beside the plan
  — as long as it is one artifact per round, written as the round runs.

---

## Report

Every claim that a round is done carries this report. **A section with nothing to report says "none".**

1. **Ledger** — every row, closed or carried (→ The ledger).
2. **Count** — rows closed against rows opened, e.g. "9 of 9 closed" (→ The ledger: the round is not
   finished until every row is closed or carried).
3. **Carried** — each row still open, with what it waits on (→ The ledger: carry a row that cannot close).
4. **Questions** — each value brought as options and still undecided, with a recommendation (→ Scope —
   the prefix and the sequencing, nothing else), and each pre-approved batch asked for at handoff.

---

## Maturity

`EXERCISED` — run through full rounds in one Next.js project; not yet run in its current wording, on another
stack, or by a reader without that project's context. The panel contract is the settled part; the stage
order is the part most likely to need revision — treat a surprise in the ordering as a finding about this
skill.
