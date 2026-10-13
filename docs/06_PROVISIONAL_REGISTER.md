# 06. Provisional Register and Decision Closure

Status: working register. A ⚑ means owner review is required before the affected behaviour is treated as approved. Provisional rules are not GoUp methodology.

## 1. Labels
Every rule has exactly one provenance label: `[GoUp]`, `[Decision]`, `[Provisional]`, `[Marketer-set]`, or `[Architecture]`, and one strength: `firm rule`, `guideline`, `illustrative`, or `provisional`. User-visible provisional rules must say **“Provisional, not GoUp method.”**

## 2. Provisional rules

| ID | Rule | Safe interim treatment | Owner action | Status |
|---|---|---|---|---|
| PV-01 | Tracking confidence criteria | Configurable criteria in Engine Spec; client tolerance required | Confirm criteria/tolerances | ⚑ |
| PV-02 | W5 hypothesis ordering when source gives none | Confirmed symptom coverage then stable registry order; no probabilities | Approve or replace ordering | ⚑ |
| PV-03 | W1 checklist criticality | Never infer labels missing from source | Review criticality register | ⚑ |
| PV-04 | Minimum evidence and stability | Marketer-set; undefined means Q4 cannot pass | Define per client with rationale/date | ⚑ |
| PV-05 | W6 verdict mapping/constrained Medium branch | Follow Engine Spec; no override changes gates | Confirm exact mapping | ⚑ |
| PV-06 | Reduce eligibility | Q2 outside client range, evidence rule met, tracking High or corroborated Medium, no relevant recent change | Confirm policy and per-client magnitude | ⚑ |
| PV-07 | Suggested review windows | Handoff's 3–7 day and 14–30 day suggestions are proposals only | Confirm, revise or remove | ⚑ |
| PV-08 | Smallest scaling step | No numeric step without approved configuration | Define allowed steps or require manual selection | ⚑ |
| PV-09 | Output gate/numeric binding | Reject unbound numbers; deterministic fallback | Approve schema/fallback | Review |
| PV-10 | Staleness intervals | No universal interval; absent policy => reconfirm volatile W6 fields | Define freshness classes/intervals | ⚑ |
| PV-11 | W1 required fields/baseline | Baseline capture is required; values never fabricated | Approve form/follow-up | Review |
| PV-12 | CSV duplicate/conflict handling | Preserve and flag; no silent dedupe | Approve import UX | Review |
| PV-13 | Assumed/derived/default basis eligibility | Only confirmed evidence satisfies gates/metrics absent approved exception | Approve any exception | Review |
| PV-14 | Deletion vs append-only history | Privileged erasure removes client content; only non-identifying deletion event may remain | Approve retention policy | ⚑ |
| PV-15 | Source verification | Seed verbatim only; known unverified entries remain `verified:false` | Complete audit | Review |
| PV-16 | Numeric display precision | Decimal arithmetic; presentation rounding configured separately | Approve display precision | Review |
| PV-17 | Campaign Planning & Creative workflow | Deferred; no MVP UI/implementation | Revisit after MVP evaluation passes | Deferred |
| PV-18 | Unclassified W1 item disposition | Potentially critical unknown classification blocks pending review | Approve criticality map | ⚑ |
| PV-19 | Cohort/attribution compatibility | No comparison across mismatched windows without explicit normalization | Approve normalization list | Review |
| PV-20 | Tracking-level override | Log override; critical failure/out-of-tolerance means Q1 remains Fail | Confirm policy | ⚑ |

## 3. Open decisions

| ID | Decision | Safe handling |
|---|---|---|
| OD-01 | Creative score totals /50 but published bands stop at 45 | W4 deferred; no score until anchored |
| OD-02 | Scaling budget bands overlap at ₹10,000 | No automatic step at ambiguous boundary |
| OD-03 | Hook timing differs (2–3 sec vs 3–5 sec) | W4 deferred; preserve source wording/page refs |
| OD-04 | No official tracking criteria | PV-01 configurable and labelled |
| OD-05 | No universal minimum evidence | Marketer-set; undefined Q4 cannot pass |
| OD-06 | No universal Reduce magnitude | Marketer-set; no default |
| OD-07 | Some business-type playbooks/prompts unverified | Keep `verified:false` until checked |
| OD-08 | GoUp owner has not approved provisional policies | Never claim approval |
| OD-09 | Source does not classify every W1 item as critical/non-critical | Preserve `unclassified`; require review |
| OD-10 | Registry release/version workflow needs review | No release until seed fidelity checks pass |

## 4. Phase 4 audit closure

| Finding | Closure |
|---|---|
| Phase 3 draft omitted later sections | `03_ARCHITECTURE.md` is the complete replacement |
| Decision algorithms too vague | `04_ENGINE_SPEC.md` specifies contracts/edge cases |
| Data isolation/immutability unclear | `05_DATA_MODEL.md` specifies entities/RLS |
| Provisional rules mixed with GoUp method | This register gives IDs and visible status |
| Tests/release gates missing | `07_EVALUATION_PLAN.md` |
| Build order missing | `08_BUILD_PLAN.md` |
| Basis labels conflicted with confirmation requirement | Assumed/default do not satisfy gates; engine-derived figures are outputs |
| Checklist criticality could be invented | Unclassified potentially critical items block pending review |
| Override could relabel failed tracking | Override never changes gate state |
| Staleness could use wall clock | Explicit `asOfDate` input |
| Worked examples might become defaults | Test fixtures only |
| Campaign-planning scope could inflate MVP | PV-17 deferred |

## 5. Release-blocking owner flags
Keep affected behaviour explicitly provisional while these remain ⚑: PV-01, PV-03/PV-18, PV-04, PV-05, PV-06, PV-07, PV-08, PV-10, PV-14 and PV-20. Engineering scaffolding/tests may proceed; user-visible behaviour must not silently treat these as approved GoUp method.
