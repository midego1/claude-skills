# OpenNext Cloudflare Adapter — Next.js on Workers

Deploy Next.js applications to **Cloudflare Workers** using the OpenNext adapter (`@opennextjs/cloudflare`). Covers SSR/ISR/SSG, App and Pages Router, `getCloudflareContext` bindings (D1/R2/KV/AI/Hyperdrive), caching tiers, skew protection, multi-worker, custom worker, env vars, and every Workers-specific error.

## Auto-Trigger Keywords

This skill should be automatically discovered when the user mentions:

### Primary / identity
- **opennext cloudflare** · **opennext adapter** · **@opennextjs/cloudflare** · **opennextjs-cloudflare cli**
- **next.js cloudflare** · **nextjs workers** · **deploy next.js to cloudflare** · **next.js on workers** · **cloudflare next app**

### Framework features
- **next.js app router cloudflare** · **next.js pages router workers** · **next.js ssr cloudflare**
- **next.js isr workers** · **server components cloudflare** · **server actions workers** · **next.js middleware cloudflare**

### Bindings / integrations
- **getCloudflareContext** · **next.js d1 database** · **next.js r2 storage** · **next.js workers ai**
- **next.js cloudflare kv** · **next.js cloudflare images** · **hyperdrive nextjs**

### Advanced
- **skew protection cloudflare** · **multi-worker nextjs** · **custom worker nextjs**
- **keep_names nextjs** · **workerd nextjs** · **nodejs_compat**

### Migration
- **migrate next.js to cloudflare** · **vercel to cloudflare nextjs** · **next.js serverless cloudflare**

### Errors
- **worker size limit nextjs** · **finalizationregistry nextjs** · **cannot perform i/o nextjs**
- **nextjs turbopack cloudflare** · **opennext errors** · **proxy.ts cloudflare** · **__name is not defined**

## What This Skill Covers

- **Setup**: new project (`npm create cloudflare@latest -- --framework=next --platform=workers`), existing project (`npx @opennextjs/cloudflare migrate`), manual install.
- **Bindings**: `getCloudflareContext()` (sync/async/remote), `cf-typegen`, D1/R2/KV/AI/Hyperdrive.
- **Caching**: three components (incremental/queue/tag) and three tiers (SSG / small / large), regional cache, cache purge, PPR caveat.
- **Integrations**: Drizzle/Prisma + D1/Hyperdrive/PG (request-scoped), Stripe (fetch client), image optimization, env vars.
- **Advanced**: custom worker, multi-worker (gradual rollout), skew protection, static assets (`run_worker_first`), `keep_names`, workerd packages.
- **Errors**: 13-entry catalog + live cross-reference to the open GitHub issues.
- **Migration**: from Vercel/AWS/other platforms, and from adapter 0.6 → 1.0.0-beta.

## When to Use This Skill

1. Deploying Next.js (App or Pages Router) to Cloudflare Workers.
2. Needing SSR/SSG/ISR, Server Components/Actions, or middleware on Workers.
3. Integrating Cloudflare bindings (D1/R2/KV/AI/Hyperdrive) into Next.js.
4. Configuring OpenNext caching tiers, skew protection, or multi-worker setups.
5. Troubleshooting Workers-specific errors (size limits, runtime, connection scoping, `keep_names`, `FinalizationRegistry`).

## When NOT to Use This Skill

- **Framework patterns on any platform** (App Router, Server Components, `"use cache"`, `proxy.ts`/`async params`) → use the **`nextjs`** skill. (This skill handles the deployment + Workers-specific concerns; `nextjs` handles the framework.)
- **Vite + React (not Next.js)** → use `cloudflare-worker-base`.
- **Cloudflare Pages (not Workers)** → this skill is specifically for Workers deployment.
- **Static export only (no SSR/ISR)** → consider simpler Workers Static Assets setup.
- **Other frameworks (Remix, SvelteKit, …)** → refer to framework-specific guides.

> **proxy.ts caveat (Next 16):** `nextjs` skill documents the `middleware.ts` → `proxy.ts` rename, but `@opennextjs/cloudflare` does not yet recognize `proxy.ts` (issue #1277). On Cloudflare, keep `middleware.ts`. This is the one place the framework skill's guidance does not apply here.

## Related Skills

| Skill | Use for |
|---|---|
| `nextjs` | Framework/App Router patterns on any platform (the `proxy.ts`/cache/Server Components reference) |
| `cloudflare-workers` | Generic Workers patterns; framework decision tree (Hono vs OpenNext) |
| `cloudflare-d1` · `cloudflare-r2` · `cloudflare-kv` · `cloudflare-workers-ai` | Service-specific deep dives |
| `drizzle-orm-d1` | Drizzle + D1 (note: OpenNext must not bundle Wrangler) |
| `dependency-upgrade` | Pinning/auditing `@opennextjs/cloudflare` (production traffic) |

## Quick Start

### New project

```bash
npm create cloudflare@latest -- my-next-app --framework=next --platform=workers
cd my-next-app
npm run dev      # Next.js dev server (fast HMR)
npm run preview  # Run in the Workers runtime (REQUIRED before deploy)
npm run deploy   # Build + deploy to Cloudflare
```

### Existing project

```bash
npx @opennextjs/cloudflare migrate   # automated: deps, configs, scripts, R2 cache
npm run preview
npm run deploy
```

## Critical Configuration

```jsonc
// wrangler.jsonc (MINIMUM)
{
  "main": ".open-next/worker.js",
  "name": "my-app",
  "compatibility_date": "2025-05-05",                     // FinalizationRegistry + more
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"]
}
```

## Key Differences vs Standard Next.js

| Aspect | Standard Next.js | Cloudflare Workers (OpenNext) |
|---|---|---|
| Runtime | Node.js or Edge | **Node.js only** via `nodejs_compat` (Edge unsupported) |
| Bindings | n/a | `getCloudflareContext()` (NOT `process.env`) |
| Dev server | `next dev` | `next dev` (with `initOpenNextCloudflareForDev`) + `preview` |
| Worker size | none | 3 MiB free / 10 MiB paid (gzip) |
| DB connections | global OK | **request-scoped** (`cache()` + `maxUses: 1`) |

## Version Information

- `@opennextjs/cloudflare`: **^1.18.1**
- `next`: v16 (all minors); latest minors of v14/v15; **v14 dropped Q1 2026**
- `wrangler`: ≥ 3.99.0 (deploy); ≥ 4.13.0 (`keep_names`); ≥ 4.36.0 (remote bindings)
- `compatibility_date`: ≥ `2024-09-23`, recommend ≥ `2025-05-05`

**Last Verified**: 2026-08-05

## Resources Included

### References
- `caching.md` — cache components, tiers, regional cache, purge
- `bindings-and-services.md` — `getCloudflareContext`, Drizzle/Prisma/Stripe
- `dev-deploy-and-env.md` — dual dev workflow, Workers Builds CI, env vars
- `advanced.md` — custom worker, multi-worker, skew protection, assets, keep_names, workerd, images
- `known-issues.md` — DO warnings, 0.6 → 1.0.0-beta migration
- `error-catalog-extended.md` — 13 errors + open GitHub issues table
- `troubleshooting.md` — step-by-step + profiling/minification
- `feature-support.md` — feature compatibility matrix
- `wrangler.jsonc` / `open-next.config.ts` / `package.json` — runnable templates
- `database-client-example.ts` — request-scoped DB patterns
- `assets/workflow-diagram.md` — dev workflow visualization

### Scripts
- `setup-new-project.sh` — scaffold via C3 (`--platform=workers`)
- `setup-existing-project.sh` — run `npx @opennextjs/cloudflare migrate`
- `analyze-bundle.sh` — debug worker size issues

## Sources (full documentation set)

- Overview — https://opennext.js.org/cloudflare
- Get started — https://opennext.js.org/cloudflare/get-started
- CLI — https://opennext.js.org/cloudflare/cli
- Bindings — https://opennext.js.org/cloudflare/bindings
- Caching — https://opennext.js.org/cloudflare/caching
- How-to: Stripe — https://opennext.js.org/cloudflare/howtos/stripeAPI
- How-to: DB — https://opennext.js.org/cloudflare/howtos/db
- How-to: Dev/deploy — https://opennext.js.org/cloudflare/howtos/dev-deploy
- How-to: Env vars — https://opennext.js.org/cloudflare/howtos/env-vars
- How-to: Image — https://opennext.js.org/cloudflare/howtos/image
- How-to: Custom worker — https://opennext.js.org/cloudflare/howtos/custom-worker
- How-to: keep_names — https://opennext.js.org/cloudflare/howtos/keep_names
- How-to: workerd — https://opennext.js.org/cloudflare/howtos/workerd
- How-to: Skew protection — https://opennext.js.org/cloudflare/howtos/skew
- How-to: Assets — https://opennext.js.org/cloudflare/howtos/assets
- How-to: Multi-worker — https://opennext.js.org/cloudflare/howtos/multi-worker
- Performance — https://opennext.js.org/cloudflare/perf
- Known issues — https://opennext.js.org/cloudflare/known-issues
- Troubleshooting — https://opennext.js.org/cloudflare/troubleshooting
- Migration 0.6 → 1.0.0-beta — https://opennext.js.org/cloudflare/migrate-from-0.6-to-1.0.0-beta
- Open issues — https://github.com/opennextjs/opennextjs-cloudflare/issues

---

**License**: MIT
