# Advanced: Custom Worker, Multi-Worker, Skew Protection, Assets, keep_names, workerd, Images

## Custom Worker (extend the generated worker)

The default adapter worker only exports a `fetch` handler. A custom worker lets you add other handlers (e.g. `scheduled`) or export Durable Objects while reusing the generated fetch handler.

`custom-worker.ts`:
```ts
// @ts-ignore `.open-next/worker.ts` is generated at build time
import { default as handler } from "./.open-next/worker.js";

export default {
  fetch: handler.fetch,

  async scheduled(event) {
    // ...
  },
} satisfies ExportedHandler<CloudflareEnv>;

// Re-export ONLY required if your app uses the DO Queue and/or DO Tag Cache.
// @ts-ignore `.open-next/worker.ts` is generated at build time
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
```

`wrangler.jsonc`:
```jsonc
{
  // "main": "./.open-next/worker.js",   // default
  "main": "./path/to/custom-worker.ts",  // repoint to your custom worker
}
```

## Multi-Worker (split middleware from server)

Splits the app across two workers for reduced per-worker memory and improved cold starts (middleware + OpenNext routing in one worker, the main server in another).

**Limitations — cannot be used with:**
- Preview URLs (staging deployments)
- Skew protection
- The standard `@opennextjs/cloudflare deploy` command

### `open-next.config.ts` (large-site config with regional cache)

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import { purgeCache } from "@opennextjs/cloudflare/overrides/cache-purge/index";

export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  queue: doQueue,
  tagCache: doShardedTagCache({
    baseShardSize: 12,
    regionalCache: true,
    regionalCacheTtlSec: 3600,
    regionalCacheDangerouslyPersistMissingTags: true,
    shardReplication: {
      numberOfSoftReplicas: 4,
      numberOfHardReplicas: 2,
      regionalReplication: { defaultRegion: "enam" },
    },
  }),
  enableCacheInterception: true,
  cachePurge: purgeCache({ type: "direct" }),
});
```

### `middleware.js`

```js
import { WorkerEntrypoint } from "cloudflare:workers";
import { runWithCloudflareRequestContext } from "./.open-next/cloudflare/init.js";
import { handler as middlewareHandler } from "./.open-next/middleware/handler.mjs";

export { DOQueueHandler } from "./.open-next/.build/durable-objects/queue.js";
export { DOShardedTagCache } from "./.open-next/.build/durable-objects/sharded-tag-cache.js";

export default class extends WorkerEntrypoint {
  async fetch(request) {
    return runWithCloudflareRequestContext(request, this.env, this.ctx, async () => {
      const reqOrResp = await middlewareHandler(request, this.env, this.ctx);
      if (reqOrResp instanceof Response) return reqOrResp;
      // Version affinity: route to the correct server worker version
      reqOrResp.headers.set(
        "Cloudflare-Workers-Version-Overrides",
        `server="${this.env.WORKER_VERSION_ID}"`,
      );
      return this.env.DEFAULT_WORKER.fetch(reqOrResp, {
        redirect: "manual",
        cf: { cacheEverything: false },
      });
    });
  }
}
```

### `server.js`

```js
import { runWithCloudflareRequestContext } from "./.open-next/cloudflare/init.js";
import { handler } from "./.open-next/server-functions/default/handler.mjs";

export default {
  async fetch(request, env, ctx) {
    return runWithCloudflareRequestContext(request, env, ctx, async () => {
      return handler(request, env, ctx);
    });
  },
};
```

### Gradual rollout (Wrangler CLI)

1. `wrangler versions upload --config ./path-to/serverWrangler.jsonc` → note `NEW_SERVER_VERSION_ID`.
2. Set `WORKER_VERSION_ID` in middleware's wrangler config to that ID.
3. `wrangler versions upload --config ./path-to/middlewareWrangler.jsonc` → note `NEW_MIDDLEWARE_ID`.
4. `wrangler deployments status --config ./path-to/server-wrangler.jsonc` → note `CURRENT_SERVER_ID`.
5. `wrangler versions deploy <CURRENT_SERVER_ID>@100% <NEW_SERVER_VERSION_ID>@0% -y --config ./path-to/server-wrangler.jsonc`
6. `wrangler versions deploy <NEW_MIDDLEWARE_ID>@100% -y --config ./path-to/middlewareWrangler.jsonc`
7. `wrangler versions deploy <NEW_SERVER_VERSION_ID>@100% -y --config ./path-to/server-wrangler.jsonc`

(See [version affinity docs](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/#version-affinity).)

## Skew Protection (version-skew protection during deployments)

Experimental. Leverages preview URLs to serve the correct app assets for a given deployment version.

**Critical caveat:** preview URLs are **disabled for Workers that implement a Durable Object**. Apps using DOs must put them in a separate Worker.

### `open-next.config.ts`

```ts
import type { OpenNextConfig } from "@opennextjs/cloudflare";

export default {
  cloudflare: {
    skewProtection: {
      enabled: true,
      maxNumberOfVersions: 20, // optional, default 20
      maxVersionAgeDays: 7,    // optional, default 7 (from last deployment date)
    },
  },
} satisfies OpenNextConfig;
```

### `wrangler.jsonc`

Set `run_worker_first: true` (with it on, every asset request counts as a Worker request):

```jsonc
{
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS",
    "run_worker_first": true,
  },
}
```

### Required environment variables

- `CF_WORKER_NAME` — worker name (include env suffix if using environments, e.g. `my-app-<env>`).
- `CF_PREVIEW_DOMAIN` — `workers.dev` subdomain for previews, formatted `<version>-<worker_name>.<domain>.workers.dev`.
- `CF_WORKERS_SCRIPTS_API_TOKEN` — API token with **Workers Scripts:Read** permission.
- `CF_ACCOUNT_ID` — Cloudflare account ID.

Process env vars take precedence over local Cloudflare env vars.

### `next.config.ts`

```ts
import type { NextConfig } from "next";
import { getDeploymentId } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  deploymentId: getDeploymentId(), // must be unique per deploy; reusing errors
};
```

Notes: fetching an older deployment costs 2 requests (latest + older) and is slightly slower. Deployments cannot currently be deleted. Requests beyond `maxNumberOfVersions`/`maxVersionAgeDays` fall back to the current deployment.

## Static Assets — `run_worker_first`

```jsonc
"assets": {
  "directory": ".open-next/assets",
  "binding": "ASSETS",
  "run_worker_first": false, // default; or true, or an array of patterns
}
```

- `false` (default) — **most cost-efficient**: asset requests bypass the Worker (not billed). You **cannot** serve assets behind middleware or apply `next.config.ts` rewrites/headers in this mode.
- `true` — all requests reach the Worker (billed). Required for middleware/rewrites/headers on assets, and for skew protection.
- With `run_worker_first: true`, static-asset headers/redirects **do not apply**.

## `keep_names: false` (fixes `__name is not defined`)

Wrangler's esbuild enables `keep-names` by default, injecting a `__name` function that can leak into generated script strings some libraries eval at runtime (e.g. `next-themes`), causing `Uncaught ReferenceError: __name is not defined`. Requires **Wrangler ≥ 4.13.0**.

```jsonc
{
  "keep_names": false,
}
```

Trade-off: you may lose original function names in debugging tools. Depending on minification, `__name` may be minified so the error looks ambiguous.

## workerd-specific package exports

Some packages ship a `workerd` entry point via conditional exports. By default Next.js bundles these with Node conditions, so you must tell Next to leave them unbundled via `serverExternalPackages`:

```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client", "postgres"],
};
```

Known packages with `workerd`-specific code:
- `@libsql/isomorphic-ws`
- `@prisma/client` (and generated `.prisma/client`)
- `jose`
- `postgres`
- `react-textarea-autosize`

Report others via the adapter GitHub issues.

## Image Optimization

Two options.

### Option A — Cloudflare Images binding (`wrangler.jsonc`)

```jsonc
{ "images": { "binding": "IMAGES" } }
```

### Option B — Custom loader

Enable Cloudflare Images for your zone; restrict image origins to where your images live (e.g. an R2 bucket).

`image-loader.ts`:
```ts
import type { ImageLoaderProps } from "next/image";

const normalizeSrc = (src: string) => (src.startsWith("/") ? src.slice(1) : src);

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps) {
  const params = [`width=${width}`];
  if (quality) params.push(`quality=${quality}`);
  if (process.env.NODE_ENV === "development") return `${src}?${params.join("&")}`;
  return `/cdn-cgi/image/${params.join(",")}/${normalizeSrc(src)}`;
}
```

`next.config.ts`:
```ts
const nextConfig: NextConfig = {
  images: { loader: "custom", loaderFile: "./image-loader.ts" },
};
```

**Limitations:** supported formats PNG/JPEG/WEBP/AVIF/GIF/SVG (others bypass optimization). `minimumCacheTTL` **not** supported. `dangerouslyAllowLocalIP` **not** supported (local IPs allowed if `remotePatterns` permits). The basic custom loader does **not** respect `remotePatterns` (configure allowed origins in the dashboard), and custom-loader images bypass middleware. Image optimization can incur additional cost.

## Sources

- Custom worker — https://opennext.js.org/cloudflare/howtos/custom-worker
- Multi-worker — https://opennext.js.org/cloudflare/howtos/multi-worker
- Skew protection — https://opennext.js.org/cloudflare/howtos/skew
- Assets — https://opennext.js.org/cloudflare/howtos/assets
- keep_names — https://opennext.js.org/cloudflare/howtos/keep_names
- workerd — https://opennext.js.org/cloudflare/howtos/workerd
- Image — https://opennext.js.org/cloudflare/howtos/image
