# 08. Build Plan

Execution order for Antigravity. One milestone at a time; do not ask the coding agent to build the whole product in one pass.

## 0. First-session instructions
1. Read `AGENTS.md` and `docs/01_PRODUCT_SPEC.md` through `docs/08_BUILD_PLAN.md`.
2. Inspect repository/current changes before editing; do not overwrite existing work.
3. Check Node 22, pnpm, Git and PostgreSQL availability.
4. Propose and execute **M0 only**.
5. Write tests first for engine work.
6. Never invent registry source content; use `TODO_SEED` if not verified.
7. Stop before changing user-visible behaviour marked ⚑ in `06_PROVISIONAL_REGISTER.md`.
8. Do not implement campaign planning/creative generation in MVP.

## 1. Milestones

### M0 — Repository and quality baseline
- [ ] Inspect files and existing changes.
- [ ] Initialize pnpm workspace, strict TypeScript, Node 22 config if absent.
- [ ] Add format/lint/typecheck/test scripts and CI.
- [ ] Enforce engine import boundary (no I/O, network, clock, randomness, model imports).
- [ ] Create package skeleton matching `AGENTS.md`.
- [ ] Add ADR for stack deviations.
Acceptance: clean install, lint/typecheck/test commands work, engine-boundary smoke test passes, no feature behaviour added.

### M1 — Domain contracts and registry shell
- [ ] Define shared Zod schemas/types.
- [ ] Define provenance/strength/status enums and PV IDs.
- [ ] Define versioned registry schema/loader/release shape.
- [ ] Add fidelity validation: source page, verbatim statement, verification status, labels.
- [ ] Seed only verified verbatim entries; otherwise `TODO_SEED`/`verified:false`.
- [ ] Exclude toolkit p.5 stray drafting note.
- [ ] Test missing labels/source refs and missing PV IDs.
Acceptance: schema/validator tests pass; no invented toolkit language; registry cannot be edited silently at runtime.

### M2 — Data model and persistence boundary
- [ ] Add migrations for users, clients, memberships, sessions, context/evidence versions, registry releases, provisional configs, engine runs, responses, decision records and audit events.
- [ ] Add deny-by-default RLS policies and append-only triggers.
- [ ] Test cross-client denial and immutable record protection.
- [ ] Add staged-evidence confirmation endpoint with content-hash check.
- [ ] Keep privileged DB role out of browser.
- [ ] Redact credentials before persistence.
- [ ] Add export/delete workflow skeleton and explicit retention-policy TODO.
Acceptance: RLS integration tests pass; unconfirmed evidence cannot reach engine; normal roles cannot mutate immutable records.

### M3 — Deterministic engine (no LLM yet)
- [ ] Implement decimal metrics/reason codes.
- [ ] Implement evidence eligibility, canonical snapshot/hash.
- [ ] Implement W1 gate and explicit item criticality register; unknown classification blocks safely.
- [ ] Implement W5 classification against confirmed baseline/guardrail; no reference => cannot conclude.
- [ ] Implement W6 ordered seven-question state machine/verdict mapping.
- [ ] Implement PV-01/PV-05/PV-06/PV-08/PV-10 as versioned config, not scattered constants.
- [ ] Pass explicit `asOfDate`; no clock access.
- [ ] Implement immutable result, figure IDs, rule refs and replay.
- [ ] Write tests first; add fast-check properties.
Acceptance: truth tables pass; no Scale on failed/unknown required gates; replay exact; PV tests tagged.

### M4 — API and orchestration
- [ ] Authenticated session gateway and one-client binding.
- [ ] Closed-enum workflow router.
- [ ] State machines ask for next missing field.
- [ ] Typed evidence intake, paste and CSV staging.
- [ ] Server confirmation flow; model cannot confirm.
- [ ] Persist runs/responses atomically.
- [ ] Launch/learning/scaling log draft/commit/discard.
- [ ] Honest deferred responses for W2/W3/W4/W7.
Acceptance: integration tests prove gate-before-advice, first-stop W6 and human commit/discard.

### M5 — Model roles and output gate
- [ ] Thin replaceable model-provider adapter.
- [ ] Extractor has no tools and creates staged candidates only.
- [ ] Dialogue/hypothesis helper constrained to evidence/registry IDs.
- [ ] Narrator receives structured results/figure IDs/rule IDs only.
- [ ] Output gate validates numeric bindings, claim types, labels and schema.
- [ ] Deterministic fallback templates.
- [ ] Prompt-injection/fabricated-claim tests.
Acceptance: no unsupported numeric claims; no model-controlled calculation/gates/verdicts; malformed output falls back safely.

### M6 — Minimal marketer UI
- [ ] Auth/session/client binding.
- [ ] Client context editor with status/source/confirmation/version.
- [ ] Evidence staging/confirmation table.
- [ ] W1 checklist, W5 diagnosis, W6 guided sequence.
- [ ] Show blockers, uncertainty, provenance/strength and provisional notices.
- [ ] Review/commit/discard logs; overrides separate.
- [ ] Accessible responsive loading/error/empty states.
Acceptance: marketer completes all MVP workflows without bypassing confirmation/gates.

### M7 — Evaluation, security and pilot
- [ ] Build 20 golden cases per workflow and 15 adversarial cases.
- [ ] Run all seven layers in `07_EVALUATION_PLAN.md`.
- [ ] Run RLS, delete/export and isolation tests.
- [ ] GoUp/owner review of provisional rules and source fidelity.
- [ ] Track over-blocking and under-blocking separately.
- [ ] Produce release report and unresolved-risk list.
Acceptance: all release blockers pass; unresolved ⚑ behaviour remains visibly provisional.

## 2. Definition of done per task
- Tests precede engine/decision implementation.
- One focused task/commit, e.g. `M3-T2: tracking assessor`.
- Typecheck, lint and relevant tests pass.
- No unrelated refactors.
- Every provisional code path has `// @rule PV-xx` and a tagged test.
- Docs/registry versions update when behaviour changes.
- Replay compatibility considered.
- No secrets/client data committed.

## 3. Initial Antigravity prompt

> Read `AGENTS.md` and `docs/01_PRODUCT_SPEC.md` through `docs/08_BUILD_PLAN.md` completely. Inspect the existing repository before changing anything. Report the current structure, missing prerequisites, and the exact tasks you propose for M0 only. Do not build later milestones yet. Preserve existing files and changes. Follow `docs/08_BUILD_PLAN.md`, write tests first for engine work, and stop before changing any user-visible behaviour marked ⚑ in `docs/06_PROVISIONAL_REGISTER.md`. Never invent GoUp source content; use `TODO_SEED` and ask when a source statement cannot be verified. No Meta write path. Do not implement deferred workflows.

## 4. Milestone discipline
After M0, review the diff and run checks. Then ask Antigravity for M1 only. Continue one milestone at a time. Do not accept “implemented” without changed-file list, tests, commands run and results. Revert unrelated edits before continuing.
