# Extended Error Catalog

Load this file when encountering ANY error during Next.js on Cloudflare Workers setup, build, or deployment.

## 1. Worker size limit — 3 MiB (Free plan)

**Error:** `"Your Worker exceeded the size limit of 3 MiB"`

**Cause:** Free plan limit; only **gzip-compressed** size counts.

**Fix:** Upgrade to Workers Paid plan (10 MiB), or analyze and shrink the bundle:

```bash
npx @opennextjs/cloudflare build
cd .open-next/server-functions/default
# Inspect handler.mjs.meta.json with ESBuild Bundle Analyzer
```

Remove unused deps, use dynamic imports for code-splitting.

## 2. Worker size limit — 10 MiB (Paid plan)

**Error:** `"Your Worker exceeded the size limit of 10 MiB"`

**Cause:** Unnecessary code in the production bundle.

**Fix:** Same bundle analysis as above; identify and externalize/remove large dependencies.

## 3. `ReferenceError: FinalizationRegistry is not defined`

**Cause:** `compatibility_date` too old.

**Fix:** Set `"compatibility_date": "2025-05-05"` (or later) in `wrangler.jsonc`.

## 4. Cannot perform I/O on behalf of a different request

**Error:** `"Error: Cannot perform I/O on behalf of a different request. I/O objects (such as streams, request/response bodies, and others) created "`

**Cause:** Global database client (e.g. `postgres`, `pg` `Pool`) reused across requests.

**Fix:** Create the client **inside** the request handler (or wrap with `cache()` from `react`), and set `maxUses: 1` on PG pools:

```ts
export const dynamic = "force-dynamic";

export async function GET() {
  const client = postgres(process.env.DATABASE_URL!, { max: 5 });
  return new Response(JSON.stringify(await client`SELECT * FROM users;`));
}
```

For D1 (preferred — designed for Workers), use `getCloudflareContext()` (NOT `process.env`):

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
const { env } = getCloudflareContext();
await env.DB.prepare("SELECT * FROM users").all();
```

## 5. NPM package import / `Could not resolve "<package>"`

**Cause:** Missing `nodejs_compat` flag, or a package ships a `workerd`-specific export that Next tries to bundle with Node conditions.

**Fix 1:** Enable `nodejs_compat`, ensure `compatibility_date ≥ 2024-09-23`.

**Fix 2:** Add the package to `serverExternalPackages` so the adapter picks the `workerd` entry point (see `references/advanced.md` for the known list):

```ts
const nextConfig = { serverExternalPackages: ["@prisma/client", ".prisma/client", "postgres"] };
```

**Fix 3:** Or set `.env`:
```env
WRANGLER_BUILD_CONDITIONS=""
WRANGLER_BUILD_PLATFORM="node"
```

## 6. Failed to load chunk `server/chunks/ssr/<chunk_name>.js`

**Cause:** Outdated adapter with Turbopack builds.

**Fix:** Upgrade `@opennextjs/cloudflare` to the newest version (for Turbopack support), or switch to webpack (`next build` without `--turbo`).

## 7. SSRF (CVE-2025-6087) — versions < 1.3.0

**Vulnerability:** SSRF via `/_next/image`.

**Fix:** Upgrade immediately — `@opennextjs/cloudflare@^1.3.0` (current: `^1.18.1`).

## 8. Caching Durable Object warnings

**Warning (build):** `"You have defined bindings to the following internal Durable Objects... will not work in local development, but they should work in production."`
**Warning (runtime):** `"workerd/server/server.c++:1951: warning: A DurableObjectNamespace in the config referenced the class..."`

**Cause:** Caching DOs (`DOQueueHandler`, `DOShardedTagCache`) aren't used during build.

**Fix:** Safe to ignore (no production impact). To test DOs locally, define them in a separate Worker with its own config.

## 9. `Uncaught ReferenceError: __name is not defined`

**Cause:** Wrangler's esbuild `keep-names` injects `__name` into generated script strings some libs (e.g. `next-themes`) eval at runtime.

**Fix:** `"keep_names": false` in `wrangler.jsonc` (requires **Wrangler ≥ 4.13.0**). Loses original function names in debugging.

## 10. `Failed to send request to R2 worker` / 403 during `populateCache remote`

**Cause:** Account protected by Cloudflare Access blocks the `open-next-cache-populate` helper worker.

**Fix:** Do **not** create a separate Access app for it. Add a Service Auth policy (Include = Any Access Service Token) to the existing Access app covering `*.<account>.workers.dev`, create a service token, export `CLOUDFLARE_ACCESS_CLIENT_ID` / `CLOUDFLARE_ACCESS_CLIENT_SECRET`.

## 11. Prisma + D1 conflicts

**Error:** Build errors with `@prisma/client` + `@prisma/adapter-d1`.

**Fix:** Add `serverExternalPackages: ["@prisma/client", ".prisma/client"]` to `next.config.ts`, enable `previewFeatures = ["driverAdapters"]` in `schema.prisma`, and do **not** specify an output directory in `schema.prisma` (the client must be patched by OpenNext).

## 12. `cross-fetch` errors

**Cause:** OpenNext patches the deployment package, causing `cross-fetch` to try Node libraries when native `fetch` is available.

**Fix:** Use native `fetch` directly instead of `cross-fetch`.

## 13. Windows development

**Issue:** Full Windows support not guaranteed (Next.js tooling issues).

**Fix:** WSL, Linux VM, or Linux/macOS CI. See open issue #1305 (Windows + Turbopack routes 500).

## Open-issue cross-reference (live bugs at time of writing)

| Issue | Bug | Workaround |
|---|---|---|
| [#1171](https://github.com/opennextjs/opennextjs-cloudflare/issues/1171) | **v1.18.0 breaks R2 cache population** (pinned) | Pin 1.17.x or upgrade past the fix |
| [#1277](https://github.com/opennextjs/opennextjs-cloudflare/issues/1277) | `proxy.js`/`proxy.ts` not supported (Next 16) | Keep `middleware.ts` on Cloudflare |
| [#1130](https://github.com/opennextjs/opennextjs-cloudflare/issues/1130) | `cacheComponents: true` crash (`Unexpected identifier '$'`) | Disable `cacheComponents` |
| [#1225](https://github.com/opennextjs/opennextjs-cloudflare/issues/1225) | `cacheComponents: true` permanent `Connection closed` | Disable `cacheComponents` |
| [#1321](https://github.com/opennextjs/opennextjs-cloudflare/issues/1321) | Intermittent React hydration mismatch (~9%) | — |
| [#1322](https://github.com/opennextjs/opennextjs-cloudflare/issues/1322) | Hyperdrive + `pg` bundling failure | — |
| [#1214](https://github.com/opennextjs/opennextjs-cloudflare/issues/1214) | esbuild fails resolving `pg-cloudflare` (Hyperdrive + node-postgres) | — |
| [#1315](https://github.com/opennextjs/opennextjs-cloudflare/issues/1315) | Time-based fetch-cache revalidation silently no-ops on Next 16 (deployed) | — |
| [#1305](https://github.com/opennextjs/opennextjs-cloudflare/issues/1305) | Windows + Turbopack routes 500 | Use Linux/macOS or webpack |
| [#1317](https://github.com/opennextjs/opennextjs-cloudflare/issues/1317) | `@cf-wasm/photon` Turbopack build fails (raw `.wasm`) | Use webpack |
| [#1326](https://github.com/opennextjs/opennextjs-cloudflare/issues/1326) | Webpack chunk inlining misses named chunks → `Unknown chunk N` | — |
| [#969](https://github.com/opennextjs/opennextjs-cloudflare/issues/969) | OpenTelemetry bundling error with Next 16 | — |
| [#1284](https://github.com/opennextjs/opennextjs-cloudflare/issues/1284) | `populateCache remote` fails writing to R2 after 15 attempts | — |
| [#617](https://github.com/opennextjs/opennextjs-cloudflare/issues/617) | Node middleware (Next 15.2+) unsupported | Use standard middleware |

## Sources

- Troubleshooting — https://opennext.js.org/cloudflare/troubleshooting
- Known issues — https://opennext.js.org/cloudflare/known-issues
- Open issues — https://github.com/opennextjs/opennextjs-cloudflare/issues
- Overview (Windows) — https://opennext.js.org/cloudflare
- CVE-2025-6087 — https://github.com/advisories/GHSA-rvpw-p7vw-wj3m
