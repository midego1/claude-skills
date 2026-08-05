# Troubleshooting

Step-by-step error resolution plus performance profiling.

## 1. "Your Worker exceeded the size limit of 3 MiB"

**Cause:** Workers Free plan. Only **gzip-compressed** size counts toward the limit.

**Fix:** Upgrade to the Workers Paid plan (raises limit to 10 MiB).

## 2. "Your Worker exceeded the size limit of 10 MiB"

**Cause:** Unnecessary code in the production bundle.

**Fix:** Analyze the bundle:
```bash
npx @opennextjs/cloudflare build
cd .open-next/server-functions/default
```
Find `handler.mjs.meta.json` and visualize it with the ESBuild Bundle Analyzer tool. Remove unused deps, use dynamic imports.

## 3. App fails to build when importing a specific NPM package

**Cause:** Wrangler's esbuild handles module export selection in a way incompatible with some NPM packages.

**Fix:** Ensure `nodejs_compat` is enabled and `compatibility_date` is `2024-09-23` or later. Create a `.env` file:
```env
WRANGLER_BUILD_CONDITIONS=""
WRANGLER_BUILD_PLATFORM="node"
```
For packages with `workerd` exports, add them to `serverExternalPackages` (see `advanced.md`).

## 4. Error: Cannot perform I/O on behalf of a different request

**Error:** `"Error: Cannot perform I/O on behalf of a different request. I/O objects (such as streams, request/response bodies, and others) created "`

**Cause:** Database clients (e.g. `postgres`) instantiate a global connection reused across requests — incompatible with Workers.

**Fix:** Create the client inside request context:
```ts
export const dynamic = "force-dynamic";

export async function GET() {
  const client = postgres(process.env.DATABASE_URL, { max: 5 });
  return new Response(JSON.stringify(await client`SELECT * FROM users;`));
}
```

## 5. Error: Failed to load chunk `server/chunks/ssr/<chunk_name>.js`

**Error:** `"✘ [ERROR] ⨯ Error: Failed to load chunk server/chunks/ssr/<chunk_name>.js"`

**Cause:** Outdated OpenNext adapter with Turbopack builds.

**Fix:** Upgrade `@opennextjs/cloudflare` to newest version (for Turbopack support), or switch to webpack.

## 6. `X [ERROR] Could not resolve "<package>"`

**Cause:** Package may contain `workerd`-specific code.

**Fix:** See `references/advanced.md` → "workerd-specific package exports" and the howto at https://opennext.js.org/cloudflare/howtos/workerd.

## 7. `ReferenceError: FinalizationRegistry is not defined`

**Error:** `"✘ [ERROR] ⨯ ReferenceError: FinalizationRegistry is not defined"`

**Cause:** Older compatibility date missing the `FinalizationRegistry` API.

**Fix:** Set `compatibility_date` to `2025-05-05` or later in `wrangler.jsonc`.

## 8. "Failed to send request to R2 worker" / "Could not determine Cloudflare auth credentials"

**Cause:** `populateCache remote` errors when a Cloudflare Access application fronts the helper worker.

**Fix:** See `references/error-catalog-extended.md` #10 and the CLI docs ("Populating remote bindings when Workers are protected by Cloudflare Access").

## Performance profiling

### Disable minification

`next.config.ts`:
```js
const nextConfig = {
  experimental: { serverMinification: false },
  webpack: (config) => {
    config.optimization.minimize = false;
    return config;
  },
};
```

CLI flag:
```bash
opennextjs-cloudflare build --noMinify
```

### Record a CPU profile

```bash
opennextjs-cloudflare preview
```
Then follow the Cloudflare Workers CPU profile recording docs.

### General perf checklist

- Keep `@opennextjs/cloudflare` updated.
- **SSG:** use Workers Static Assets incremental cache (fastest; read-only).
- **Apps with revalidation:** R2 + `withRegionalCache({ mode: "long-lived" })` + automatic cache purge. Do not override `shouldLazilyUpdateOnCacheHit`/`bypassTagCacheOnCacheHit` (defaults are optimal). **Avoid KV** (eventually consistent).
- **Tag cache:** D1 for low-traffic, DO-sharded for most sites. If using `revalidateTag` exclusively (not `revalidatePath`), wrap with `withFilter` + `softTagFilter`.
- **Static assets:** ship a `public/_headers` file.
- **Multiple workers:** split middleware + main server so the server can be bypassed on cache hits.

## Sources

- Troubleshooting — https://opennext.js.org/cloudflare/troubleshooting
- Performance — https://opennext.js.org/cloudflare/perf
- workerd how-to — https://opennext.js.org/cloudflare/howtos/workerd
- CLI — https://opennext.js.org/cloudflare/cli
