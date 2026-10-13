# ADR 0001: Technical Stack, Quality Baseline, and Environment Deviations

## Status
Accepted

## Date
2026-10-13

## Context
The GoUp AI Performance Marketing Intelligence Agent specification (`AGENTS.md` and `docs/03_ARCHITECTURE.md`) establishes a baseline default stack:
- TypeScript (Strict Mode)
- Node.js 22
- pnpm workspaces
- `decimal.js` for deterministic decimal arithmetic
- `zod` for runtime schema validation
- PostgreSQL 16 with Row-Level Security (RLS)
- Next.js for UI
- Vitest + `fast-check` for testing
- Standalone pure `packages/engine` with zero I/O, zero network, zero clock (`Date`), zero randomness, zero model imports

## Decision & Environment Alignment

1. **Node.js Runtime Target:**
   - **Specified:** Node.js 22
   - **Detected Environment:** Node.js v24.16.0
   - **Decision:** Target `"engines": { "node": ">=22.0.0" }` with `"target": "ES2022"` in TypeScript configuration. Node 24 is a superset of Node 22 capabilities and maintains full backward compatibility for our required dependencies.

2. **Package Manager:**
   - **Specified:** pnpm workspaces
   - **Detected Environment:** pnpm v12.11.2 installed via npm
   - **Decision:** Utilize pnpm 12 with a root `pnpm-workspace.yaml` covering `packages/*` and `apps/*`.

3. **Workspace Layout:**
   - Packages:
     - `packages/shared`: Common types, canonical JSON, hashing, schemas
     - `packages/engine`: Pure deterministic engine (no I/O, no clock, no randomness, no model)
     - `packages/registry`: Rule registry, seed loader, fidelity checks
     - `packages/model`: Provider adapters, extractor/dialogue/narrator roles
     - `packages/gate`: Output gate, numeric binding, claim validation
     - `packages/eval`: Evaluation harness, golden scenarios, oracles
   - Apps:
     - `apps/server`: Fastify / Node API, session gateway, orchestrator, governance
     - `apps/web`: Next.js marketer UI
   - Database:
     - `db/migrations`: PostgreSQL SQL migrations with RLS and append-only triggers

4. **Deterministic Engine Import Boundary Enforcement:**
   - Enforce via dual-layer protection:
     1. **ESLint (`eslint.config.mjs`):** `no-restricted-globals` (banning `Date`, `Math.random`, `fetch`, `setTimeout`, `setInterval`, etc.) and `no-restricted-imports` (banning `fs`, `node:fs`, `http`, `node:http`, `https`, `node:https`, `crypto`, `net`, `axios`, and model packages) scoped to `packages/engine`.
     2. **Automated AST & Import-Graph Check (`scripts/check-engine-boundary.ts`):** Validates all imports, dependencies, and identifiers in `packages/engine/**` during CI and test pipelines, exiting non-zero on any violation.

5. **Database Availability Note:**
   - `psql` / local PostgreSQL binary is not yet in the environment PATH. This is not a blocker for M0 (repo baseline) or M1 (domain contracts/registry), but PostgreSQL 16 instance/Docker will be required for M2 persistence integration.

## Consequences
- Workspace builds, lints, type-checks, and tests cleanly across all packages.
- Engine boundary cannot be breached unintentionally by developers or agents.
- All subsequent milestones build on a unified quality and architectural baseline.
