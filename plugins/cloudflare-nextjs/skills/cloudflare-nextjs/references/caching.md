# Caching Deep Dive

OpenNext's cache has three independent components. You compose them in `open-next.config.ts` and wire the backing resources in `wrangler.jsonc`.

## The three components

| Component | Purpose | Backing options |
|---|---|---|
| **Incremental Cache** | Stores cache data (rendered pages, fetch results) | R2 (recommended), Workers KV (not recommended), Workers Static Assets (SSG only) |
| **Queue** | Synchronizes/dedupes time-based revalidations | Durable Object Queue (production), memory (per-isolate only), direct (debug only) |
| **Tag Cache** | On-demand revalidation (`revalidateTag`/`revalidatePath`) | D1 (`d1NextTagCache`) for small sites; Durable Objects (`doShardedTagCache`) for large sites |

Some components additionally use the Cache API to improve performance.

## Incremental Cache options

- **R2 Object Storage** — cost-effective S3-compatible store for large unstructured data. **Recommended for apps that revalidate.**
- **Workers KV** — fast KV via Cloudflare Tiered Cache. **Avoid** — eventually consistent, can persist stale data indefinitely.
- **Workers Static Assets** — read-only build-time store. **Revalidation not supported.** Fastest option for SSG.

Prefix env var: `NEXT_INC_CACHE_R2_PREFIX` (default `incremental-cache`).

## Regional cache modes (wraps an incremental cache)

```ts
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

incrementalCache: withRegionalCache(r2IncrementalCache, {
  mode: "long-lived",            // "short-lived" | "long-lived"
  bypassTagCacheOnCacheHit: false, // default false; perf recommends leaving default
});
```

- **short-lived** — responses re-used for up to a minute.
- **long-lived** — fetch responses re-used until revalidated; ISR/SSG responses re-used up to 30 min.

Perf guidance for long-lived: do **not** explicitly set `shouldLazilyUpdateOnCacheHit` or `bypassTagCacheOnCacheHit` — defaults are the most performant.

## Queue modes

- **Durable Object Queue (`doQueue`)** — production. Default max 10 DO instances × 5 parallel revalidations = up to 50 concurrent ISR revalidations.
- **memory** — dedupes per isolate only. **Not production-suitable.**
- **direct** — debug only; only works in preview (`wrangler dev`).

DO Queue env vars:
- `NEXT_CACHE_DO_QUEUE_MAX_REVALIDATION` — max simultaneous revalidations per DO instance.
- `NEXT_CACHE_DO_QUEUE_REVALIDATION_TIMEOUT_MS` — revalidation timeout.
- `NEXT_CACHE_DO_QUEUE_RETRY_INTERVAL_MS` — backoff between retries.
- `NEXT_CACHE_DO_QUEUE_MAX_RETRIES` — max attempts.
- `NEXT_CACHE_DO_QUEUE_DISABLE_SQLITE` — disable SQLite in the DO (only if incremental cache is strongly consistent).

### Queue cache (Cache API wrapper)

```ts
import queueCache from "@opennextjs/cloudflare/overrides/queue/queue-cache";

queue: queueCache(doQueue, {
  regionalCacheTtlSec: 5,   // default 5s
  waitForQueueAck: true,    // true = wait for ack; false = populate cache ASAP
}),
```

## Tag Cache options

- **`d1NextTagCache`** (D1) — small sites only. Requires `NEXT_TAG_CACHE_D1` D1 binding.
- **`doShardedTagCache`** (Durable Objects + SQLite) — large sites. Requires `NEXT_TAG_CACHE_DO_SHARDED` DO binding.

```ts
tagCache: doShardedTagCache({
  baseShardSize: 12,
  // Optional advanced replication:
  regionalCache: true,
  regionalCacheTtlSec: 3600,
  regionalCacheDangerouslyPersistMissingTags: true,
  shardReplication: {
    numberOfSoftReplicas: 4,
    numberOfHardReplicas: 2,
    regionalReplication: { defaultRegion: "enam" },
  },
}),
```

**Perf optimization:** if the app uses `revalidateTag` **exclusively** (never `revalidatePath`), wrap with `withFilter` + `softTagFilter` filter.

## Cache Purge (automatic, on-demand revalidation only)

If you use on-demand revalidation, also enable the Cache Purge component so the cache is purged when a page is revalidated:

```ts
import { purgeCache } from "@opennextjs/cloudflare/overrides/cache-purge/index";
cachePurge: purgeCache({ type: "direct" }),
```

Constraints:
- Only works on a **zone** (custom domain). Requires secrets `CACHE_PURGE_API_TOKEN` and `CACHE_PURGE_ZONE_ID`.
- Requires `NEXT_CACHE_DO_PURGE` DO binding (`BucketCachePurge` class) + migration.
- Env var `NEXT_CACHE_DO_PURGE_BUFFER_TIME_IN_SECONDS` (default 5s) — purge buffering duration.

## Init requirement (deploy step)

For the cache to be properly initialized with build-time revalidation data, the deploy step must populate it. The adapter's `preview`/`deploy`/`upload` commands implicitly call `populateCache` — you don't need to run it manually.

R2 batch uploads (no `rclone`) are supported from adapter **1.13.0**. Earlier versions need `rclone` + `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`CLOUDFLARE_ACCOUNT_ID`.

### Cloudflare Access gotcha

If the account is behind Cloudflare Access, `populateCache remote` deploys a helper worker `open-next-cache-populate` and may fail with timeout or 403. Do **not** create a separate Access app for it (that has been observed to block uploads). Instead, attach a Service Auth policy to the existing Access app covering `*.<account>.workers.dev`, create a service token, and export `CLOUDFLARE_ACCESS_CLIENT_ID` / `CLOUDFLARE_ACCESS_CLIENT_SECRET`.

## Static asset headers

The Worker does not run in front of static assets, so `next.config.ts` `headers()` does **not** apply to `public/` or immutable build files. Use `public/_headers`:

```text
/_next/static/*
  Cache-Control: public,max-age=31536000,immutable
```

## PPR + cache interception

Cache interception does **not** work with Partial Prerendering and is **not** enabled by default. If you use PPR, set `enableCacheInterception: false` (or omit it).

## Pages Router

`res.revalidate` requires a self-reference service binding named `WORKER_SELF_REFERENCE` in `wrangler.jsonc`:

```jsonc
"services": [{ "binding": "WORKER_SELF_REFERENCE", "service": "<worker-name>" }]
```

## Debugging

`NEXT_PRIVATE_DEBUG_CACHE=1` in `.env` logs every cache access.

## Reserved binding names

`ASSETS`, `WORKER_SELF_REFERENCE`, `NEXT_INC_CACHE_R2_BUCKET`, `NEXT_CACHE_DO_QUEUE`, `NEXT_TAG_CACHE_D1`, `NEXT_TAG_CACHE_DO_SHARDED`, `NEXT_CACHE_DO_PURGE`, `IMAGES`.

## Sources

- Caching — https://opennext.js.org/cloudflare/caching
- CLI (populateCache, R2 batch, Access gotcha) — https://opennext.js.org/cloudflare/cli
- Performance — https://opennext.js.org/cloudflare/perf
- Get started (`public/_headers`) — https://opennext.js.org/cloudflare/get-started
