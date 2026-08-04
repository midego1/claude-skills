# Exhaustive Dependency Audit & Upgrade Plan

## Canonical version targets (verified 2026-08-03 against npm latest)

These are the target versions. Caret ranges (`^x.y.z`) are used in package.json; prose mentions specific x.y versions.

### Root infra
- ajv-cli ^5.0.0 (current), ajv-formats ^3.0.1 (current), fast-json-patch ^3.1.1 (current override) — no change needed
- GitHub Actions (real CI): pin to current majors with SHAs
  - actions/checkout: v5 (was v4.2.2)
  - actions/setup-node: v5 (was v4.1.0)
  - actions/upload-artifact: v4 (current 4.4.3 — verify newer v4 SHA) [v5/v7 exist but v4 still supported; move to v5]
  - actions/dependency-review-action: v5 (was v4.5.0)
  - github/codeql-action: v3 -> v4 (current v4.37.5)

### Runtimes
- Node.js floor: >=20 (was >=18 in many skills — Node 18 EOL 2025-04)
- TypeScript: templates stay ^5.9.3 (TS 7 exists but migration is a separate major effort; typescript-migration skill already documents it)
- Bun: 1.x runtime references stay (1.3.x current); Docker `oven/bun:1` is fine (floating major)
- Python: 3.11 -> 3.12 floor where skills pin 3.11 (3.13 EOL imminent; 3.14 current)

### Web frameworks
- next: ^16.2.0 canonical (align bun-nextjs ^16.1.1 -> ^16.2.x); remove stale 13.5/14.2 prose
- react / react-dom: ^19.2.0 canonical (align ^19.0.0 -> ^19.2.0)
- vue: ^3.5.0 (current 3.5.40)
- nuxt: ^4.0.0 (current 4.5.1) — Nuxt 5 NOT stable; keep v4. Remove Nuxt 3 floors (EOL 2026-07-31)
- hono: ^4.12.12 canonical (align stale 4.10.x prose)
- tailwindcss: ^4.1.0 (v4 current)
- @vitejs/plugin-react: ^5.2.0 canonical (align 4.3.4/5.0.x/5.1.x)
- vite: ^7.3.0

### Data/validation
- zod: ^4.3.6 canonical (resolve 3.x splits deliberately — most skills already on 4; nextjs optional + shadcn-vue legacy are the 3.x holdouts)
- drizzle-orm: ^0.45.2 (align 0.36/0.44)
- drizzle-kit: ^0.31.10 (align 0.28/0.31.5/0.31.7/0.31.8)

### Cloudflare
- @cloudflare/workers-types: ^4.20260408.0 is newest 4.x in repo; but latest is 5.x. Decision: bump all to a consistent recent 4.x date stamp to match existing newest (conservative — avoid 4->5 major across all skills in one pass unless trivial). Use ^4.20260408.0 as the floor reference (matches cloudflare-durable-objects/templates & cloudflare-images/templates).
  - NOTE: workers-types 5.x exists but is a major bump; treat as major -> needs whole-skill review. Defer the 4->5 jump; align all to 4.x newest for now and note 5.x available.
- wrangler: ^4.81.0 canonical (align 4.43/4.50/4.54/bare ^4)
- vitest: ^2.0.0 in cloudflare skills stays consistent (vitest 4 is current but cloudflare/vitest-pool-workers pins vitest 2 — DO NOT bump vitest in cloudflare skills; pool-workers compat). Align cloudflare-workers prose 2.1.8 -> 2.0.0 range note.
- @cloudflare/vitest-pool-workers: 0.5.0 (keep)

### TanStack
- @tanstack/react-query: ^5.96.2 -> bump to ^5.101.4 (latest); update stale prose (5.90.x)
- @tanstack/react-router: ^1.168.10 -> ^1.170.18; update prose (1.134.13)
- @tanstack/react-table: ^8.21.3 (current 8.21.3); update prose (react-virtual 3.13.12 -> 3.13.23, vite 6 -> 7, ts 5.8 -> 5.9)

### Pinia/Vue
- pinia: ^3.0.4 in pinia-v3 (Pinia 4 current but pinia-v3 skill is explicitly about v3 — keep v3 focus, just align minor). pinia-colada: ^0.17.9 -> ^1.4.2? NO — colada 1.x is a major; keep 0.17.x but note. Actually @pinia/colada latest is 1.4.2 (major). Flag for decision.
- vue-router: not directly pinned in templates

### UI
- motion: ^12.4.7 -> ^12.43.0
- @formkit/auto-animate: 0.9.0 -> 0.10.0
- @base-ui-components/react: 1.0.0-beta.4 -> note 1.0.0-rc.0 (still RC; update prose to rc.0)
- maz-ui: 4.3.3 -> 4.9.3
- shadcn-vue zod ^3.22.4 -> deliberate: bump to ^4.x to align repo
- thesys prose 0.6.40/0.8.42 -> 0.9.x to match its own package.json

### Test
- @playwright/test: ^1.59.0 -> ^1.62.1
- @stryker-mutator/core: ^9.0.0 (verify latest)

### Other
- Hugo: verify real latest (research said 0.164.0); skill claims 0.152.2 — correct
- WordPress: 5.9+ floor -> 6.0+ (WP 7 current); PHP 7.4 floor -> 8.0+
- WooCommerce: note v10 current
- ultracite: install example @6 -> @7; biome 1.8.x -> >=1.9.0 reconcile
- mlflow: ==2.8.0 vs ==3.7.0 conflict -> reconcile to 3.7.0 (3.x current)

## GitHub Actions in skill markdown examples (global sweep)
Normalize unsafe/non-existent tags:
- @main, @master, @latest -> current major tag (e.g. @v4)
- actions/checkout: @v2/@v3 -> @v4 (or @v5)
- actions/setup-node: @v3 -> @v4
- actions/upload-artifact: @v3 -> @v4
- oven-sh/setup-bun: @v1 -> @v2
- cloudflare/wrangler-action: @3 -> @v3 (normalize tag form)

## Task breakdown (dispatch order)
T0 (root infra) first — sets canonical versions.
T1-T9 are independent skill groups — dispatch in parallel waves (no shared files between groups).
T10 (global Node floor + GH action sweep) last — cross-cutting, after group tasks.
Final: validation + commit + report.
