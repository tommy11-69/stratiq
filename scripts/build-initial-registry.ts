import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalHash } from '../packages/shared/src/index.js';
import { normalizeToolkitText } from '../packages/registry/src/fidelity.js';
import { RegistryEntry, RegistryRelease } from '../packages/registry/src/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const extractedPagesPath = path.resolve(
  rootDir,
  'packages',
  'registry',
  'data',
  'extracted_pages.json',
);

const extractedPagesData = JSON.parse(fs.readFileSync(extractedPagesPath, 'utf8'));
const pagesMap = new Map<number, string>();
for (const p of extractedPagesData.pages) {
  pagesMap.set(p.page_pdf, p.text);
}

const entries: RegistryEntry[] = [
  // ----------------------------------------------------
  // Core GoUp Toolkits: W1 Launch Readiness (Toolkit 1 & 6)
  // ----------------------------------------------------
  {
    id: 'GOUP_T1_GO',
    kind: 'Gate',
    status: 'active',
    strength: 'firm rule',
    provenance: 'GoUp',
    page_pdf: 5,
    page_printed: 4,
    statement_verbatim:
      'GO: Business goal + offer + funnel + tracking + creative + sales process are ready.',
    workflows: ['W1'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T1_NOGO',
    kind: 'Gate',
    status: 'active',
    strength: 'firm rule',
    provenance: 'GoUp',
    page_pdf: 5,
    page_printed: 4,
    statement_verbatim: 'NO-GO: Any critical conversion-path or tracking issue is unresolved.',
    workflows: ['W1'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T1_POST_LAUNCH_CHAIN',
    kind: 'Catalogue',
    status: 'active',
    strength: 'firm rule',
    provenance: 'GoUp',
    page_pdf: 5,
    page_printed: 4,
    statement_verbatim:
      'Spend → Clicks → Leads/Sales → Qualified → Appointment/Site Visit → Revenue.',
    workflows: ['W1', 'W5'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T6_ONBOARDING_LAUNCH_DATE',
    kind: 'Gate',
    status: 'active',
    strength: 'firm rule',
    provenance: 'GoUp',
    page_pdf: 41,
    page_printed: 1,
    statement_verbatim:
      'Do not promise a launch date until access, assets, offer, tracking and client-side responsibilities are confirmed.',
    workflows: ['W1'],
    verified: true,
    version: '1.0.0',
  },

  // ----------------------------------------------------
  // Core GoUp Toolkits: W6 Scaling SOP Questions (Toolkit 7, pp.75-76)
  // ----------------------------------------------------
  {
    id: 'GOUP_T7_Q1_TRACKING',
    kind: 'Gate',
    status: 'active',
    strength: 'firm rule',
    provenance: 'GoUp',
    page_pdf: 75,
    page_printed: 27,
    statement_verbatim: '1. Is tracking reliable? No → Fix tracking. Yes → Continue.',
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T7_Q2_BUSINESS_RESULTS',
    kind: 'Gate',
    status: 'active',
    strength: 'firm rule',
    provenance: 'GoUp',
    page_pdf: 75,
    page_printed: 27,
    statement_verbatim: '2. Are business results acceptable?',
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T7_Q3_QUALITY',
    kind: 'Gate',
    status: 'active',
    strength: 'firm rule',
    provenance: 'GoUp',
    page_pdf: 76,
    page_printed: 28,
    statement_verbatim:
      '3. Is lead/purchase quality acceptable? No → Fix quality first. Yes → Continue.',
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T7_Q4_STABILITY',
    kind: 'Gate',
    status: 'active',
    strength: 'firm rule',
    provenance: 'GoUp',
    page_pdf: 76,
    page_printed: 28,
    statement_verbatim:
      '4. Is the campaign reasonably stable? No → Collect more data. Yes → Continue.',
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T7_Q5_CAPACITY',
    kind: 'Gate',
    status: 'active',
    strength: 'firm rule',
    provenance: 'GoUp',
    page_pdf: 76,
    page_printed: 28,
    statement_verbatim:
      '5. Can the business handle more volume? No → Fix operations first. Yes → Continue.',
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T7_Q6_CREATIVE',
    kind: 'Gate',
    status: 'active',
    strength: 'firm rule',
    provenance: 'GoUp',
    page_pdf: 76,
    page_printed: 28,
    statement_verbatim:
      '6. Is the creative pipeline ready? No → Develop more creative. Yes → Continue.',
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T7_Q7_BEST_LEVER',
    kind: 'Gate',
    status: 'active',
    strength: 'firm rule',
    provenance: 'GoUp',
    page_pdf: 76,
    page_printed: 28,
    statement_verbatim: '7. What is the best scaling lever?',
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },

  // ----------------------------------------------------
  // GoUp Guidelines: Budget Scaling Levels (Toolkit 7, pp.56-59)
  // ----------------------------------------------------
  {
    id: 'GOUP_T7_BUDGET_L1',
    kind: 'Guideline range',
    status: 'active',
    strength: 'guideline',
    provenance: 'GoUp',
    page_pdf: 56,
    page_printed: 8,
    statement_verbatim: 'consider increases of approximately: 10%–25% at a time',
    parameters: { min: 300, max: 1000, stepMin: 0.1, stepMax: 0.25 },
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T7_BUDGET_L2',
    kind: 'Guideline range',
    status: 'active',
    strength: 'guideline',
    provenance: 'GoUp',
    page_pdf: 57,
    page_printed: 9,
    statement_verbatim: 'Consider approximately: 15%–25% controlled increases',
    parameters: { min: 1000, max: 3000, stepMin: 0.15, stepMax: 0.25 },
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T7_BUDGET_L3',
    kind: 'Guideline range',
    status: 'active',
    strength: 'guideline',
    provenance: 'GoUp',
    page_pdf: 58,
    page_printed: 10,
    statement_verbatim: 'Controlled budget increases may often fall around: 10%–20%',
    parameters: { min: 3000, max: 10000, stepMin: 0.1, stepMax: 0.2 },
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'GOUP_T7_BUDGET_L4',
    kind: 'Guideline range',
    status: 'active',
    strength: 'guideline',
    provenance: 'GoUp',
    page_pdf: 59,
    page_printed: 11,
    statement_verbatim:
      'There is no universal percentage allocation. Set it according to the business and available data.',
    parameters: { min: 10000 },
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },

  // ----------------------------------------------------
  // GoUp Guidelines: Review Windows (Toolkit 7, p.75)
  // ----------------------------------------------------
  {
    id: 'GOUP_T7_REVIEW_WINDOW_SHORT',
    kind: 'Guideline range',
    status: 'active',
    strength: 'guideline',
    provenance: 'GoUp',
    page_pdf: 75,
    page_printed: 27,
    statement_verbatim:
      '3–7 Day Review Useful for many normal lead-generation and ecommerce campaigns to understand recent direction.',
    parameters: { minDays: 3, maxDays: 7 },
    workflows: ['W6'],
    verified: true,
    version: '1.0.0',
  },

  // ----------------------------------------------------
  // Canonical Provisional Rules (PV-01 to PV-20, PV-29 to PV-32)
  // ----------------------------------------------------
  {
    id: 'PV_01_TRACKING_CONFIDENCE_CRITERIA',
    kind: 'Definition slot',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-01',
    statement_verbatim:
      'Provisional, not GoUp method: Configurable tracking confidence criteria evaluate ten audit items and reconciliation tolerance; marketer-set tolerance required.',
    workflows: ['W1', 'W5', 'W6'],
    overridable_by: ['agency', 'client'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_02_W5_HYPOTHESIS_ORDER',
    kind: 'Decision table',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-02',
    statement_verbatim:
      'Provisional, not GoUp method: Confirmed symptom coverage then stable registry ladder order; no probabilistic weights.',
    workflows: ['W5'],
    overridable_by: ['agency'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_03_W1_CHECKLIST_CRITICALITY',
    kind: 'Catalogue',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-03',
    statement_verbatim:
      'Provisional, not GoUp method: Critical conversion-path items are maintained as an explicit register; never infer unclassified items as non-critical.',
    workflows: ['W1'],
    overridable_by: ['agency'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_04_MIN_EVIDENCE_STABILITY',
    kind: 'Definition slot',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-04',
    statement_verbatim:
      'Provisional, not GoUp method: Minimum evidence is marketer-set (conversions, days, spend); undefined rule fails Q4 stability check.',
    workflows: ['W5', 'W6'],
    overridable_by: ['client'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_05_W6_VERDICT_MAPPING',
    kind: 'Decision table',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-05',
    statement_verbatim:
      'Provisional, not GoUp method: W6 questions evaluated in strict sequence; first Fail maps to verdict; first Cannot evaluate ends sequence with no verdict.',
    workflows: ['W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_06_REDUCE_ELIGIBILITY',
    kind: 'Decision table',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-06',
    statement_verbatim:
      'Provisional, not GoUp method: Reduce is selected at Q2 Fail only when primary KPI is beyond range, minimum evidence is met, tracking is High or corroborated Medium, and no recent change event occurred inside change window.',
    workflows: ['W6'],
    overridable_by: ['agency'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_07_SUGGESTED_REVIEW_WINDOWS',
    kind: 'Guideline range',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-07',
    statement_verbatim:
      'Provisional, not GoUp method: Review window classes (3–7 days and 14–30 days) are proposals; exact review days must be confirmed by the marketer.',
    workflows: ['W6'],
    overridable_by: ['agency', 'client'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_08_SMALLEST_SCALING_STEP',
    kind: 'Calculation',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-08',
    statement_verbatim:
      'Provisional, not GoUp method: Constrained Scale at Medium tracking uses the smallest guideline step; no step is proposed without approved configuration.',
    workflows: ['W6'],
    overridable_by: ['agency'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_09_OUTPUT_GATE_NUMERIC_BINDING',
    kind: 'Gate',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-09',
    statement_verbatim:
      'Provisional, not GoUp method: Output gate rejects unbound numbers in model prose and falls back to deterministic templates on failure.',
    workflows: ['W1', 'W5', 'W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_10_STALENESS_INTERVALS',
    kind: 'Definition slot',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-10',
    statement_verbatim:
      'Provisional, not GoUp method: Volatile fields (tracking, capacity, recent changes, budget) become stale after marketer interval or on every W6 run if unset.',
    workflows: ['W1', 'W6'],
    overridable_by: ['client'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_11_W1_REQUIRED_FIELDS_BASELINE',
    kind: 'Gate',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-11',
    statement_verbatim:
      'Provisional, not GoUp method: Launch baseline capture is required before launch advice; missing baseline blocks Go advice.',
    workflows: ['W1'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_12_CSV_CONFLICT_HANDLING',
    kind: 'Gate',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-12',
    statement_verbatim:
      'Provisional, not GoUp method: Conflicting or duplicate imported evidence rows are preserved and flagged; silent deduplication is forbidden.',
    workflows: ['W1', 'W5', 'W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_13_BASIS_ELIGIBILITY',
    kind: 'Gate',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-13',
    statement_verbatim:
      'Provisional, not GoUp method: Only user-confirmed evidence may satisfy gates or metric calculations; assumed/derived/default basis values do not satisfy gates.',
    workflows: ['W1', 'W5', 'W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_14_DELETION_VS_APPEND_ONLY',
    kind: 'Gate',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-14',
    statement_verbatim:
      'Provisional, not GoUp method: Hard deletion completely cascades all client-identifying data and crypto-shreds tenant key; only a content-free tombstone remains.',
    workflows: ['W1', 'W5', 'W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_15_SOURCE_VERIFICATION',
    kind: 'Gate',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-15',
    statement_verbatim:
      'Provisional, not GoUp method: Verified registry entries require exact verbatim substring matching with toolkit PDF; unverified entries must remain verified:false.',
    workflows: ['W1', 'W5', 'W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_16_NUMERIC_DISPLAY_PRECISION',
    kind: 'Calculation',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-16',
    statement_verbatim:
      'Provisional, not GoUp method: All internal arithmetic uses exact decimal math; display rounding is applied strictly at presentation time without altering comparisons.',
    workflows: ['W1', 'W5', 'W6'],
    overridable_by: ['agency'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_17_DEFERRED_CAMPAIGN_PLANNING',
    kind: 'Gate',
    status: 'deferred',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-17',
    statement_verbatim:
      'Provisional, not GoUp method: Campaign planning and creative copy generation workflows are deferred from the MVP scope.',
    workflows: ['W2', 'W3', 'W4', 'W7'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_18_UNCLASSIFIED_W1_ITEMS',
    kind: 'Gate',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-18',
    statement_verbatim:
      'Provisional, not GoUp method: Any unclassified W1 checklist item that is potentially critical blocks Go verdict until confirmed by marketer or owner.',
    workflows: ['W1'],
    overridable_by: ['agency'],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_19_COHORT_COMPATIBILITY',
    kind: 'Gate',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-19',
    statement_verbatim:
      'Provisional, not GoUp method: Metric comparisons across mismatched attribution windows or cohorts require explicit normalization or flag cannot conclude.',
    workflows: ['W5', 'W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_20_TRACKING_OVERRIDE',
    kind: 'Gate',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-20',
    statement_verbatim:
      'Provisional, not GoUp method: Tracking level overrides are logged as immutable records; raising tracking level when critical items fail does not turn Q1 into Pass.',
    workflows: ['W1', 'W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_29_CONFIG_HIERARCHY',
    kind: 'Decision table',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-29',
    statement_verbatim:
      'Provisional, not GoUp method: Config hierarchy is resolved as: platform default (registry release) < agency override < client override.',
    workflows: ['W1', 'W5', 'W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_30_CLAIM_TAXONOMY',
    kind: 'Catalogue',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-30',
    statement_verbatim:
      'Provisional, not GoUp method: Every model narrative segment is typed as figure | rule | hypothesis | question | platform | general with required reference IDs.',
    workflows: ['W1', 'W5', 'W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_31_BUDGET_BOUNDARY_RESOLUTIONS',
    kind: 'Decision table',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-31',
    statement_verbatim:
      'Provisional, not GoUp method: Daily budget exactly on level boundary belongs to the lower level with the smaller adjacent lower-end step.',
    workflows: ['W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },
  {
    id: 'PV_32_HARD_DELETE_GOVERNANCE',
    kind: 'Decision table',
    status: 'active',
    strength: 'provisional',
    provenance: 'Provisional',
    register_id: 'PV-32',
    statement_verbatim:
      'Provisional, not GoUp method: Client deletion executes atomic cascade, destroys tenant encryption key (crypto-shredding), and creates content-free tombstone.',
    workflows: ['W1', 'W5', 'W6'],
    overridable_by: [],
    verified: true,
    version: '1.0.0',
  },

  // ----------------------------------------------------
  // Unverified Entries explicitly tagged verified: false
  // (Per docs/02_KNOWLEDGE_DIGEST.md §1 & docs/08_BUILD_PLAN.md)
  // ----------------------------------------------------
  {
    id: 'GOUP_BUSINESS_PLAYBOOK_LOCAL_SERVICE',
    kind: 'Ladder',
    status: 'active',
    strength: 'guideline',
    provenance: 'GoUp',
    page_pdf: 64,
    page_printed: 16,
    statement_verbatim:
      'TODO_SEED: Local service playbook (Lead → Contacted → Appointment → Customer; Creative → Budget → Geography)',
    workflows: ['W6'],
    verified: false,
    version: '1.0.0',
    notes: 'Unverified business-type playbook; treated as verified:false until checked.',
  },
  {
    id: 'GOUP_BUSINESS_PLAYBOOK_ECOMMERCE',
    kind: 'Ladder',
    status: 'active',
    strength: 'guideline',
    provenance: 'GoUp',
    page_pdf: 67,
    page_printed: 19,
    statement_verbatim:
      'TODO_SEED: Ecommerce playbook (Purchases, AOV, ROAS, CAC, contribution margin; Creative → Budget → Product → Audience → Geography)',
    workflows: ['W6'],
    verified: false,
    version: '1.0.0',
    notes: 'Unverified business-type playbook; treated as verified:false until checked.',
  },
];

// Check all verified GoUp entries against the PDF
console.log(`Validating ${entries.length} seed entries against PDF extraction...`);
let passed = 0;
let errors = 0;

for (const entry of entries) {
  if (entry.provenance === 'GoUp' && entry.verified && entry.page_pdf) {
    const rawPage = pagesMap.get(entry.page_pdf) || '';
    const normPage = normalizeToolkitText(rawPage);
    const normStmt = normalizeToolkitText(entry.statement_verbatim);

    if (!normPage.includes(normStmt)) {
      console.error(
        `❌ Substring mismatch for entry [${entry.id}] on PDF page ${entry.page_pdf}:\n  Statement: "${entry.statement_verbatim}"`,
      );
      errors++;
    } else {
      passed++;
    }
  }
}

if (errors > 0) {
  console.error(`\nFailed: ${errors} errors found.`);
  process.exit(1);
}

console.log(`✓ All ${passed} verified GoUp entries matched the source PDF text verbatim.`);

const releaseId = 'a0000000-0000-0000-0000-000000000001';
const version = '1.0.0';
const releasedAt = '2026-10-13T00:00:00.000Z';
const releasedBy = 'System Initial Release';
const contentHash = canonicalHash(entries);

const release: RegistryRelease = {
  id: releaseId,
  version,
  released_at: releasedAt,
  released_by: releasedBy,
  status: 'released',
  entries,
  content_hash: contentHash,
};

const seedDir = path.resolve(rootDir, 'packages', 'registry', 'seed');
osMkdir(seedDir);
const releasePath = path.resolve(seedDir, 'initial_release.json');
fs.writeFileSync(releasePath, JSON.stringify(release, null, 2), 'utf8');

console.log(`✓ Initial registry release written to ${releasePath} (Hash: ${contentHash})`);

function osMkdir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
