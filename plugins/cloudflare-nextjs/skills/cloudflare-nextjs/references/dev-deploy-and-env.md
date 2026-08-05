# Development, Deployment & Environment Variables

## The dual dev workflow

| Command | Runtime | Use for |
|---|---|---|
| `npm run dev` (`next dev`) | Node.js (Next dev server) | Fast HMR iteration |
| `npm run preview` | **Workers runtime** (`workerd`) | Production-like validation; **always run before deploy** |
| `npm run deploy` | Workers (remote) | Build + populate remote cache + serve immediately |
| `npm run upload` | Workers (remote) | Build + populate remote cache + upload a version (gradual rollout; does NOT serve automatically) |

`build`, `preview`, `deploy`, `upload` all implicitly call `populateCache` — you do not need to run it manually.

### Local bindings in `next dev`

Add `initOpenNextCloudflareForDev()` to `next.config.ts` so `getCloudflareContext()` works locally:

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { /* ... */ };
export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

In local dev, bindings are **simulated** (they mimic the real Cloudflare resources). To connect local code to **real** remote resources, use **remote bindings** (stabilized in Wrangler 4.36.0; older wrangler needs `experimental: { remoteBindings: true }`). Note: remote bindings are also used **during build**.

### `.dev.vars`

```text
NEXTJS_ENV=development
```

`NEXTJS_ENV` selects which Next.js `.env` file to load for the local Worker. Defaults to `production` when unset.

## CI/CD — Workers Builds

Connect a GitHub/GitLab repo to your Worker (auto-detected in the dashboard), or run the adapter in any CI:

- **Build command:** `npx @opennextjs/cloudflare build`
- **Deploy command:** `npx @opennextjs/cloudflare deploy` (or `upload` for gradual deployments)

For reproducible deploys, prefer Workers Builds or a CI system over running `build`/`deploy` locally.

## Environment variables — the strategy

### Local dev: use Next.js `.env` files (NOT only `.dev.vars`)

Wrangler config and `.dev.vars` **do not play well** with the recommended `next dev` workflow — they are not available during `next dev`. Use standard Next.js `.env` files so variables land on `process.env` for both `next dev` and the local Worker.

- `.env.development` overrides `.env` in the dev environment.
- Use `NEXTJS_ENV` in `.dev.vars` to tell the local Worker which env to load.
- `.env` files are environment-specific; exclude from source control.

### Production: dashboard + `--keep-vars`

1. Set runtime env vars and secrets **in the Cloudflare dashboard**.
2. When deploying with dashboard-set vars, pass `--keep-vars` so the deploy does not erase them:
   ```bash
   opennextjs-cloudflare deploy -- --keep-vars
   ```
3. **Secrets are write-only** — they cannot be read back from the dashboard or CLI after creation.

### Workers Builds

For Workers Builds, set env vars and secrets in the **"Build variables and secrets"** dashboard section — the Next.js build needs them to inline browser-facing variables and supply SSG-page variables.

## Build gotchas

- Running `build` locally means `.dev.vars` and Next.js `.env` files **might override your configuration**. Prefer CI for reproducibility.
- The code transformation step takes time, making the adapter poorly suited for active development where a fast feedback loop is required — that is why `next dev` is recommended for iteration.
- Ensure env vars are set when using Workers Builds.

## Sources

- How-to: Dev/deploy — https://opennext.js.org/cloudflare/howtos/dev-deploy
- How-to: Env vars — https://opennext.js.org/cloudflare/howtos/env-vars
- CLI — https://opennext.js.org/cloudflare/cli
- Get started — https://opennext.js.org/cloudflare/get-started
