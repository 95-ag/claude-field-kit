# Working With a Reviewer

How to work with the person who judges the result — client, owner or reviewer. Verifying the work itself
is `build-verification.md`; this is about the exchange. A domain rule adds the visual side (e.g.
`domains/web-frontend/rules/visual-verification.md` → Reviewing a design with the owner).

## Reading what they tell you

- **Feedback that reads as confusion is still an instruction.** A sentence carrying an imperative and no
  question mark is a decision, however it is phrased. Ask what they want rather than arguing the opposite
  and shipping.
- Check a proposed fix against every rule they have already stated, and against the defect it claims to
  fix on the shipped tree — not on the tree you are imagining.
- **Their terminology for their own domain is not yours to normalise.** A passive voice in domain copy
  may be carrying a fact you do not have.

## Closing a review

- **Every finding gets one of three verdicts at the moment it is read** — fix now, drop as not-a-defect,
  or a named decision from the reviewer. "Deferred" is honest only when something owns it.
- A finding about a test the same round wrote is almost never worth carrying.
- **A rejected mechanism kept switched off needs a stated condition for its own removal**, written where
  the code is. Otherwise "off by default" is dead code with a story attached.
