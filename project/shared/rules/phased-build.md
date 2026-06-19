# Phased Build — Exit Gates

Phase-gate discipline for any staged build. Per-phase exit criteria and gate checklists live in the implementation plan (IMPLEMENTATION-PLAN.md → Phases). Stack-specific verification commands live in the applicable build-verification rule.

## Phase gates

- Each phase has explicit, objective, and verifiable exit criteria defined before implementation begins.
- Do not start phase N+1 until phase N's exit criteria are satisfied.
- Validate exit criteria against actual system behavior, generated artifacts, and observed output —
  never assumptions (see engineering.md → Implementation standards → Verify with evidence).
- Read the implementation plan's gate requirements before marking a phase complete.
- A phase is not complete until both its exit criteria and required verification gates pass.

## Findings override assumptions

- Real-world findings from implementation, testing, and verification override planning assumptions.
- When a finding conflicts with the plan, surface the conflict and determine whether the plan or architecture requires change.
- Do not silently diverge from approved planning or architecture documents.
- Present the conflict, evidence, impact, and proposed change to the user before updating planning or architecture artifacts.
- Record approved changes in the appropriate planning or decision documents before continuing implementation.
