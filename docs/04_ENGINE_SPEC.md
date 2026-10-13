# 04. Engine Specification

Status: assembled from Phase 2.1 Addendum §3–§5, Phase 3 §6, `01_PRODUCT_SPEC.md`, `02_KNOWLEDGE_DIGEST.md`, `03_ARCHITECTURE.md`. Existing documents are authoritative; where this file adds a completion that no existing document states, it is tagged `PV-NEW-nn ⚑` and registered in `06_PROVISIONAL_REGISTER.md`. Nothing here is application code.
Section numbers are fixed because `01` cites them: **W6 = §5, W1 = §6, W5 = §7**.

Labels: `[GoUp p.N]` · `[Decision]` · `[Provisional PV-xx]` · `[Marketer-set]` · `[Architecture]`. Page numbers are PDF pages (`02` header). ⚑ = awaits owner ruling.

---
## 1. Contract

**Engine** `[Architecture]` = `packages/engine`: pure, total, no I/O, no model, no clock, no randomness, decimal arithmetic (AGENTS §5.1, `03` §6).

**Request** (`03` §6): `{workflow, context_snapshot, evidence_items (confirmed only), resolved_config, as_of, marketer_choices}`
**Result**: one structured object holding: figures, question/gate results, verdict (if any), deciding gate, qualifier, actions, `known/assumed/unknown` classification, `rejected_inputs`, `not_evaluated`, `readiness_preview`, rule references (registry ID + status + strength), and `result_hash`.

**Closed vocabularies** (`01` §12):
| Context | Values |
|---|---|
| Launch | Go, No-Go |
| Question result | Pass, Fail, Cannot evaluate; **Conditional at Q1 only** (PV-11) |
| W5 stage state | healthy, weak, cannot conclude |
| W6 verdict | Scale, Hold, Reduce, Diagnose (qualifier: `constrained (Medium tracking)`) |
| Figure status | computed, derived, not computable, no incremental outcomes, below minimum evidence (+ flags, §3) |

**Totality.** The engine never throws on domain input. Invalid input appears in `rejected_inputs`; dependent items become `Cannot evaluate` / `not computable`.
**A verdict is never a Cannot evaluate.** First Cannot evaluate ends W6 with **no verdict** (PV-12).
**Scale is never issued** when any gate failed or could not be evaluated (AGENTS §5.2).

---
## 2. Inputs and numeric rules (Addendum §5, rules 1–7)

1. Every input carries `value, unit, currency, period_start, period_end, basis, confirmed`. Only `confirmed=true` items enter. Image-derived values are rejected (MVP).
2. Basis ∈ `confirmed | assumed | derived | default`. Staged and unconfirmed values never reach the engine (G5).
3. **Periods.** Spend and outcomes share one period. Marginal calculations use two periods of equal length, or normalise per day and **say so** in the figure. Budgets are per day unless the client's stored `spend_basis` says otherwise; that question is asked once per client and stored (6A item 6).
4. **Long sales cycles.** The marketer states `outcome_count_basis` = spend-date or lead-created cohort. Recent periods are flagged `incomplete_period` where outcomes lag spend. Flag criterion: period end is within the client's `sales_cycle_length` of `as_of` (PV-NEW-05 ⚑). The flag does not change any gate.
5. **Rejected inputs:** negative counts, negative spend, rates above 100%, mixed currencies in one calculation, unit mismatches, period end before start.
6. **Decimals.** Arithmetic is decimal. Rates are stored as fractions (0–1) and displayed as percentages. Canonical JSON writes decimals as strings, never floats.
7. **Compare before rounding.** Guardrail and tolerance comparisons use unrounded values. Display rounding mode and places live in formula-set config and are stated on each figure `[Architecture]`; rounding never changes a comparison.
8. **No benchmark ever.** "High / low / good / poor" are judged only against the client's baseline, target or prior period (P7). No reference → `cannot conclude`.
9. **Non-INR accounts** get no rupee guideline values (§4.5).
10. **Minimum evidence is never hard-coded.** It is a Marketer-set structured rule (conversions, days, spend; any subset). If none exists the agent offers options built from toolkit wording and asks; it never states a number as GoUp's.

---
## 3. Metric dictionary and figure contract

Formulas are standard arithmetic unless a GoUp page is cited. Each formula has a `formula_id` in the versioned formula set.

| formula_id | Formula | Notes |
|---|---|---|
| `cpl` | spend ÷ leads | |
| `cpql` | spend ÷ qualified leads | If only a rate is given: qualified = leads × rate, status `derived` |
| `stage_rate` | stage count ÷ previous stage count | Stage names from client context |
| `cost_per_stage_outcome` | spend ÷ outcomes | Appointment, admission, sale. Primary metric by business type (pp.64–68) |
| `cac` | spend ÷ new customers | Media-only unless marketer states a loaded definition. Labelled either way |
| `roas` | revenue ÷ spend | |
| `breakeven_roas` | 1 ÷ contribution margin | Margin from user. **Standard arithmetic, not GoUp method** |
| `blended_cpo` | S2 ÷ O2 | |
| `marginal_cpo` | (S2 − S1) ÷ (O2 − O1) | **GoUp pp.73–74.** Leads, qualified leads or sales |
| `budget_step` | (new − current) ÷ current | |
| `guardrail_position` | value vs target and acceptable range | §4.2 |
| `reconciliation_gap` | see §4.7 | PV-NEW-06 ⚑ |

**Figure contract** (`03` §4, Addendum §5.8): every figure returns `{figure_id, value, formula_id, inputs, period, unit/currency, status, flags, display_rounding}`. The narrative may quote only these.

**Edge cases**
| Case | Result |
|---|---|
| Zero denominator | `not computable`. Never 0 or infinity |
| ΔS > 0 and ΔO ≤ 0 | `no incremental outcomes` (the worst marginal result) |
| ΔS < 0 | Labelled `spend decrease`. Not a scale marginal |
| ΔS = 0 | Not a scale marginal; labelled `no spend change` (PV-NEW-05 ⚑: Addendum silent) |
| Unequal period lengths | Normalise per day and flag; otherwise reject |
| Below minimum-evidence rule | status `below minimum evidence`; text says "cannot conclude"; **no significance claims** |
| Rate input derived from a count | status `derived` |

Marginal and blended figures are shown in output; **no gate depends on them** (none is stated in the Addendum).

---
## 4. Shared assessors

### 4.1 Reference and sufficiency
- Reference = the client's baseline, target or prior period. W5 needs one (`01` §8 footnote). If more than one exists the marketer chooses via `marketer_choices`; the engine has no default (PV-NEW-04 ⚑).
- Sufficiency compares each figure's underlying counts, days and spend with the Marketer-set rule and states the result per figure.
- Sufficiency **never flips Q2**. It blocks Reduce and is what fails Q4 (PV-13).

### 4.2 Guardrail position `[Provisional PV-08]`
Compare the unrounded value with target and acceptable range. Result: `within target | within range | beyond range`. **Bounds are inclusive.** Guardrail values are Marketer-set. GoUp's ₹300 / ₹300–360 / 30% are illustrative fixtures and can never populate a profile.
Direction (lower-is-better vs higher-is-better) is not stated by any source document. Beyond-range counts only on the adverse side; a result better than target is `within target` (PV-NEW-02 ⚑). Direction is a per-KPI attribute in the registry.

### 4.3 Tracking assessor `[Provisional PV-01]` (labels High/Medium/Low are GoUp p.34; criteria are not)
Inputs: ten audit items (p.34; names seeded from the PDF, `TODO_SEED`), each `working | failing | not checked | not applicable`; reconciliation state (§4.7); campaign age class; critical set; staleness (§4.4).

**Critical set** (Provisional, configurable): pixel or dataset installed · correct events firing · conversion event matches campaign goal · duplication checked · CRM or lead delivery working · test event or test lead completed.

Suggestion, evaluated in this order:
| Step | Condition | Level |
|---|---|---|
| 1 | Any critical item `failing`, **or** reconciliation `outside tolerance` | **Low** |
| 2 | Every applicable item `working` **and** reconciliation `within tolerance` | **High** |
| 3 | Otherwise (item unverified, non-critical item failing, or reconciliation not done) | **Medium** |

Caps (applied after the suggestion): a **new campaign** cannot be High (reconciliation needs data; a clean pre-launch check is Medium). A **stale** confirmation counts as Medium at most. Effective level = min(suggestion, caps). "New" is a marketer-stated `campaign_age_class`; the sources give no numeric threshold.

The marketer confirms or overrides **with a reason**. Lowering is always allowed. **Raising above the engine's suggestion is a logged override and does not change the effective level.** In the Low cases this is the 01 §6 rule: Q1 stays Fail (`PV-20 ⚑`). For other raises the sources are silent, so the conservative default is `effective = min(confirmed, suggestion after caps)` (⚑ under PV-20). A marketer can legitimately reach High by correcting the audit item states or reconciliation evidence.

### 4.4 Staleness `[Provisional PV-03]`
Fields covered: tracking, capacity, recent changes, current budget. Each is stale when any holds, using `as_of` (never a clock):
1. A change event of type site, form, pixel, events, CRM link, offer, creative set, audience, budget or page is dated after the field's confirmation.
2. The marketer-set interval has elapsed since confirmation.
3. **No interval is set and the workflow is W6**: re-confirm at every W6 run.
Stale fields are classified `assumed` and shown with a "still true?" prompt. Stale tracking is capped at Medium (§4.3).

### 4.5 Budget level and step `[GoUp pp.56–59 guideline, INR only]` + `[Provisional PV-07, PV-31 ⚑]`
GoUp: "practical guidelines, not fixed rules" (p.56). Client guardrails always override.
| Level | Daily budget (₹) | Step range |
|---|---|---|
| L1 | 300–1,000 | 10–25% |
| L2 | 1,000–3,000 | 15–25% |
| L3 | 3,000–10,000 | 10–20% |
| L4 | 10,000 and above | none given (portfolio management) |

Resolution:
1. A budget **exactly on a boundary belongs to the lower level**; the proposed step is the **smaller of the two adjacent levels' lower ends**.
2. A budget strictly inside a level gets that level's lower-end step.
3. Below ₹300/day, at L4, or in any non-INR account: **no percentage**; the marketer is asked.
4. Constrained Scale always uses this smallest step.

| Budget (₹/day) | Level | Step |
|---|---|---|
| 300 | L1 | 10% |
| 1,000 | L1 | 10% |
| 2,000 | L2 | 15% |
| 3,000 | L2 | 10% |
| 10,000 | L3 ⚑ | 10% |
| above 10,000 / below 300 / non-INR | none | none, ask |

⚑ Exactly ₹10,000: the boundary rule gives L3, but the Addendum words L4 as "10,000 and above". Surfaced for owner confirmation (PV-31). Until ruled, the engine follows the boundary rule.
A step applies only to the **budget** lever. GoUp states no percentage for creative, audience, geography, funnel or offer levers; the engine returns none and the marketer sets it (PV-NEW-05 ⚑).

### 4.6 Review window `[GoUp p.75, guideline]`
- Short-term review for failures.
- **3–7 days**: normal lead generation and ecommerce.
- **14–30 days**: real estate, B2B, high-ticket and long sales cycles; also lower-volume campaigns per toolkit p.75 (`02` §6; earlier docs omitted it; **toolkit wins, verify at seeding** ⚑).
The engine picks the class from business type and the marketer's `cycle_class`; the marketer sets exact days. `review_date = as_of + marketer days`.

### 4.7 Reconciliation `[Provisional PV-NEW-06 ⚑]`
GoUp says business data should "roughly match" (p.54). **Tolerance is Marketer-set per client; no default.** Inputs: business/CRM count and Meta-reported count for the same period and outcome. The engine computes the relative gap against the business count and compares it with the tolerance (inclusive). States: `within tolerance | outside tolerance | not done` (no counts, zero business count, or no tolerance set).

---
## 5. W6 Scale decision (Toolkit 7, pp.75–76; firm rule order)

### 5.1 Evaluation order `[Provisional PV-11, PV-12]`
1. **Apply caps** to the confirmed tracking level (§4.3, §4.4).
2. **Q1 from the level:** High → Pass. Low → **Fail**, verdict Diagnose, action "fix tracking". Medium → **Conditional**: the sequence continues and "resolve the tracking uncertainty" stays attached to whatever verdict results. Tracking missing/unconfirmed → Cannot evaluate.
3. **Q2–Q6 in order.** The first **Fail** ends the sequence with its mapped verdict. The first **Cannot evaluate** ends it with no verdict, names the missing field and why it matters, and lists later questions as `not evaluated`. A separate `readiness_preview` lists every other blocking field still missing (§5.7).
4. If Q1 was Conditional and Q2–Q6 all pass → test safeguards (§5.4). All hold → "Scale, constrained (Medium tracking)". Any fails or cannot be evaluated → Diagnose naming the safeguard.
5. If Q1 was Pass and Q2–Q6 pass → Q7 (§5.5).
6. Attach step, guardrail range, review window, main risk and metric to watch (§5.6); draft the Scaling Log entry.

### 5.2 Question definitions
| Q | Check (GoUp pp.75–76) | Pass | Fail → verdict | Cannot evaluate when |
|---|---|---|---|---|
| 1 | Tracking reliable? | High | Low → **Diagnose** "fix tracking". Medium = Conditional | Level missing/unconfirmed |
| 2 | Business results acceptable? | Primary KPI `within target` or `within range` | `beyond range` → **Reduce** if all four conditions hold (§5.3), else **Diagnose** (diagnosis plan from W5) | Primary KPI not computable, no guardrail, or period/currency mismatch |
| 3 | Lead/purchase quality acceptable? | Quality rate ≥ marketer's minimum quality rate (inclusive) | **Diagnose** (lead-quality diagnosis: marketing, sales or both) | Rate not computable, no minimum quality rate, or no sales feedback flag (`none`) |
| 4 | Campaign reasonably stable? | Marketer's minimum-evidence rule met | **Hold**: run on until the rule is met | No minimum-evidence rule, or "reasonably stable" not yet defined (Phase 2 §4: no Scale before it is defined) |
| 5 | Business can handle more volume? | Every applicable capacity item confirmed OK | **Hold**: client resolves capacity; no marketing change | Any applicable capacity item unconfirmed or stale |
| 6 | Creative pipeline ready? | Marketer confirms ready | **Hold**: state the creative gap; creative work is on the roadmap | No marketer confirmation |
| 7 | Best lever? | Marketer confirms one lever (§5.5) | None justified → **Hold** | Lever not yet chosen |

Notes
- Q2 uses the client's own target and range, never a benchmark (P7). **Q2 Pass/Fail comes from the primary KPI against the guardrail only; sufficiency does not flip it** (PV-13).
- Q3 uses the Marketer-set minimum quality rate. The guardrail profile names the numerator and denominator stages for it (structure, Marketer-set). Sales feedback is a closed flag (`positive | mixed | poor | none`); a flag that conflicts with the rate is surfaced as a conflict and does not change the result (PV-NEW-03 ⚑).
- Q5 capacity items (pp.54–55): sales team, inventory, appointments, delivery, support, cash flow; each `ok | constrained | not applicable | unknown`. Any `constrained` fails; any applicable `unknown` is Cannot evaluate (PV-NEW-03 ⚑).
- Q6 is a marketer-confirmed question. The agent generates no creative.
- Q4 and Q3 insufficiency: sufficiency fails Q4 only (PV-13). Q3 is judged on the rate alone (PV-NEW-03 ⚑).

### 5.3 Reduce rule `[Provisional PV-06]`
At a Q2 Fail the verdict is **Reduce** instead of Diagnose only when **all four** hold:
1. Primary KPI is beyond the client's acceptable range.
2. The minimum-evidence rule is met.
3. Tracking is High, **or** Medium with business-data corroboration within tolerance (§4.7).
4. No change event of type budget, creative, audience or page lies inside the marketer's change window (`01` §7; "relevant recent change"). Conservative reading: any such event blocks Reduce.
Otherwise Diagnose. **Direction only.** GoUp states no reduction step; the marketer sets it and the output says the size is outside the framework (OD-06).

### 5.4 Constrained Scale at Medium `[Decision: principle · Provisional PV-04, PV-18: conditions]`
All six must hold, else **Diagnose** naming the failing or unevaluable safeguard:
| # | Safeguard | Evaluated by |
|---|---|---|
| S1 | Reason for Medium documented; no critical item failing | Engine from tracking record (A) |
| S2 | Outcome corroborated by business data within tolerance, **and** the open item does not affect how that outcome is measured | Engine (reconciliation) + marketer confirmation with reason (A) |
| S3 | Q2–Q6 pass on the marketer's own definitions incl. minimum evidence | Sequence result (A) |
| S4 | Only budget changes, by the smallest guideline step, one change at a time | Engine from §4.5 (B). **No guideline step (non-INR, below ₹300, L4) → S4 cannot be evaluated → Diagnose** (PV-18) |
| S5 | Stop condition and review window set before the change; guardrail breach or reconciliation drift triggers Hold/Reduce review | Marketer-set, recorded as confirmation (B) |
| S6 | Marketer acknowledges the risk and the entry is logged | Marketer confirmation, recorded (B) |
S2, S5 and S6 rest on marketer confirmations, **recorded with a reason, never inferred**. The output reads **"Scale, constrained (Medium tracking)"**, never plain Scale. Under Medium only the budget lever is allowed.
A pending confirmation yields Diagnose naming it; supplying it creates a new run. No run is edited.

### 5.5 Q7 lever `[Provisional PV-14]`
The engine returns the business-type lever order (pp.64–68, 78–80; **unverified, `verified:false` until checked**) with each lever's preconditions (`TODO_SEED`). The marketer confirms one lever, or confirms none is justified → **Hold**. Choosing a lever out of order is allowed and flagged with the skipped levers' preconditions (⚑ under PV-14). Under Medium tracking only the budget lever is allowed.
| Business type | Lever order (unverified) |
|---|---|
| Local service | Creative → Budget → Geography |
| Education | Creative → Budget → Audience |
| Real estate | Creative → Lead quality → Geography → Budget |
| High-ticket B2B | Offer → Quality → Creative → Budget |
| Ecommerce | Creative → Budget → Product → Audience → Geography |
| WhatsApp/messaging | Creative → Offer → Conversation quality → Budget |

### 5.6 Attachments to a Scale decision
Step as a **labelled guideline** (never a rule) · guardrail range · review window class · main risk (registry-coded, seed from T7 pp.72–73, 77; `TODO_SEED`) · metric to watch · Scaling Log draft (17 fields seeded verbatim; "Test" → **"Next test"**). Rule 3 (never scale on cheap CPL alone): Scale results carry the Q2 KPI figure and the Q3 quality figure by construction. Do-not-change list: seed the p.61 seven items verbatim.

### 5.7 Readiness preview `[Provisional PV-12]`
On Cannot evaluate, list every other `B` field for W6 still missing (field matrix, `01` §8) so the marketer can supply them in one pass. Later questions are listed as `not evaluated`. No verdict is shown.

### 5.8 Verdict mapping `[Provisional PV-05]`
| Outcome | Verdict | Required action |
|---|---|---|
| Q1 Low | Diagnose | Fix tracking |
| Q1 Medium, safeguards fail | Diagnose | Resolve tracking uncertainty; name failing safeguard |
| Q2 Fail, four Reduce conditions hold | Reduce | Direction only; marketer sets size |
| Q2 Fail, otherwise | Diagnose | Diagnosis plan from W5 |
| Q3 Fail | Diagnose | Lead-quality diagnosis |
| Q4 Fail | Hold | Run on until minimum evidence met |
| Q5 Fail | Hold | Client resolves capacity |
| Q6 Fail | Hold | State creative gap |
| Q1 Medium + all safeguards hold | **Scale, constrained (Medium tracking)** | Budget only, smallest step |
| Q1 High, Q2–Q6 pass, lever confirmed | Scale (one lever) | Guideline step, guardrail, window, risk, metric |
| Q1 High, Q2–Q6 pass, no lever justified | Hold | |
| First Cannot evaluate | **No verdict** | Missing field + why; later Qs not evaluated; readiness preview |

---
## 6. W1 Launch readiness (Toolkits 1 and 6)

**Rule [GoUp p.5, firm]:** GO = goal + offer + funnel + tracking + creative + sales process ready. NO-GO = any critical conversion-path or tracking issue unresolved. **[GoUp p.41, firm]:** no launch date until access, assets, offer, tracking and client responsibilities are confirmed. Minimum 3 creative angles, not visual variants (p.4).

### 6.1 Inputs
Field matrix `W1` column (`01` §8): B = business type, outcome/KPI hierarchy, offer and audience, funnel stages and "qualified" definition, tracking checklist and confidence, currency/market/language. C = guardrails, capacity. Launch baseline is **produced**, not required.
Launch checklist: 8 sections (business & offer, funnel, tracking & technical, campaign structure, creative, copy & compliance, sales team, final pre-launch check), seeded as a Catalogue from pp.2–5. Items are **not** labelled critical in the source; the mapping of items to the six readiness areas is `TODO_SEED` (stop and ask if the PDF does not give it).

### 6.2 Evaluation
1. Any B field missing → **no verdict**: name the field and why it matters (Rule 1; applied by analogy to PV-12, PV-NEW-01 ⚑).
2. Compute tracking level (§4.3). New campaign → at most Medium.
3. Critical set: any critical item `failing` **or** `not checked` is **unresolved** (PV-NEW-01 ⚑). Critical conversion-path items are a Marketer-set definition slot (p.5 does not list them).
4. Six readiness areas, each marketer-confirmed ready from the checklist.
5. **No-Go** if any critical item is unresolved or tracking is Low (failing critical items named). **Go** if all six areas are ready and no critical item is unresolved. Open non-critical items are listed as **caveats**.
6. **Launch date permission** (p.41): `permitted` only if access, assets, offer, tracking and client responsibilities are all confirmed; otherwise `blocked` with the open items.
7. Offer baseline capture (metrics from the p.5 chain, period) as an output action.

### 6.3 Tracking level → W1 (Addendum §3)
| Level | W1 |
|---|---|
| High | Go if the rest of the gate passes |
| Medium | Go if no critical item is unresolved; open non-critical items are caveats |
| Low | No-Go; failing critical items named |
A marketer who proceeds against No-Go creates an override record; the verdict is never relabelled.

---
## 7. W5 Diagnosis (T2 §10 pp.12–13, T4 §10 pp.28–29, T5 §9)

### 7.1 Inputs
Field matrix `W5` column: B = business type, KPI hierarchy, funnel stages and qualified definition, guardrails, minimum-evidence rule, recent changes, currency/market/language. C = offer, tracking, sales cycle, lead-quality feedback, launch baseline. **Footnote wins:** baseline and guardrail target are alternatives (one reference must exist, else every stage is `cannot conclude`).

### 7.2 Per-stage state
For each stage in the client's funnel, in order, first matching rule applies:
1. Metric not computable → cannot conclude (reason).
2. Below minimum evidence → cannot conclude.
3. No reference chosen → cannot conclude.
4. Tracking Low and the metric is tracking-dependent → cannot conclude (Addendum §3).
5. No Marketer-set deviation band → cannot conclude, naming the definition slot.
6. Otherwise adverse deviation beyond the band → **weak**; else **healthy**. Direction comes from the registry per metric (PV-NEW-04 ⚑).
Medium tracking: states stand but are flagged `lower_confidence` and tracking appears among the candidates. Low tracking: tracking is **candidate 1**.

### 7.3 Ladder lookup (hypothesis generators, never verdicts)
The engine returns candidate suspects from the T2 and T4 ladders (`02` §4) that match the stage-state pattern (for example "good CTR, low landing conversion"). Client stages map to ladder positions through registry metadata (`ladder_slot`, `tracking_dependent`; PV-NEW-04 ⚑). Candidates carry registry ID, status, strength and page. Order is ladder order, not a ranking; the dialogue role may rank them as typed `hypothesis` claims but cannot demote tracking at Low. Change events inside the marketer's change window are listed as candidate causes.
**Lead-quality diagnosis** ("marketing problem, sales problem or both?", T5 §9): T5 §9 has no GoUp mapping, so the engine does not classify. It returns the relevant ladder rows and the sales-feedback flag; the classification is a typed hypothesis (PV-NEW-04 ⚑).

### 7.4 Output
Standard shape (`01` §10): state per stage · Known / Assumed / Not yet known · hypotheses, **each with one controlled test** (model-written, typed `hypothesis`) · **do-not-change list** (change categories not under test; PV-NEW-04 ⚑) · main risk · log offer (learning record draft, PV-19). Hypotheses are never worded as fact (P8).

---
## 8. Classification and labels
| Class | Rule |
|---|---|
| **Known** | basis `confirmed`, status confirmed, not stale |
| **Assumed** | basis `derived`, `default` or `assumed`; or stale; or unconfirmed |
| **Unknown** | missing |
Every rule outcome carries `{registry_id, status, strength, page}`. The output gate adds the text labels (G2). Provisional outputs read "Provisional, not GoUp method". Marketer-set values read as Marketer-set with owner and date. Worked examples are unreachable by the model.

---
## 9. Determinism, versioning, replay
- `result_hash` = hash of canonical JSON of the result. `input_hash` = hash of canonical request.
- A run records: context snapshot ID, evidence hash, engine version, formula-set version, rule-configuration version (resolved effective config blob, PV-29), `as_of`.
- Engine versions are archived (`engine-archive/vX.Y.Z`); `replay(run_id)` reloads the exact versions and asserts hash equality (G6, G11).
- Structural logic is code tagged `// @rule PV-xx`; parameters and tables are registry data (`03` §5).

---
## 10. Fixtures (never defaults, seeds or prompt content)
| Fixture | Expected |
|---|---|
| Campaign A: CPL ₹100, 100 leads, 10 qualified | cost per qualified lead ₹1,000 |
| Campaign B: CPL ₹250, 50 leads, 25 qualified | cost per qualified lead ₹500 |
| A and B cost per sale (1 and 6 sales) | ≈ ₹10,000 and ≈ ₹2,083 (Phase 1 [Calc]) |
| ₹10,000 → 100 leads; ₹15,000 → 125 leads | blended CPL ₹100 → ₹120; marginal ₹5,000 ÷ 25 = **₹200** |
| Guardrail ₹300 target, ₹300–360, 30% | illustrative only; boundary tests (inclusive) |
| Budget steps | table in §4.5 |

## 11. Open items
All rulings and candidate IDs: `06_PROVISIONAL_REGISTER.md`. Seeding blanks (`TODO_SEED`): the ten audit items, checklist-to-readiness mapping, lever preconditions, risk catalogue, Scaling Log 17 fields, p.61 list.
