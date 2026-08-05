// OpenNext Cloudflare Adapter Configuration — three tiers
// Docs: https://opennext.js.org/cloudflare/caching
//       https://opennext.js.org/cloudflare/howtos/skew
//
// Pick ONE tier below. The `defineCloudflareConfig({ ... })` call is how you
// wire cache "overrides" (incremental cache, queue, tag cache, cache purge)
// exported from subpaths of @opennextjs/cloudflare.

import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// ───────────────────────────────────────────────────────────────────────────
// Tier 1 — SSG only (no revalidation). Fastest; read-only.
// Requires: enableCacheInterception: true
// Docs: https://opennext.js.org/cloudflare/caching#incremental-cache
// ───────────────────────────────────────────────────────────────────────────
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

const ssgConfig = defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true, // Required for SSG interception
});

// ───────────────────────────────────────────────────────────────────────────
// Tier 2 — Small site (ISR + on-demand revalidation, low traffic).
// Requires in wrangler.jsonc:
//   services:        [{ binding: "WORKER_SELF_REFERENCE", service: "<worker>" }]
//   r2_buckets:      [{ binding: "NEXT_INC_CACHE_R2_BUCKET", bucket_name: "<bucket>" }]
//   durable_objects: [{ name: "NEXT_CACHE_DO_QUEUE", class_name: "DOQueueHandler" }]
//   migrations:      [{ tag: "v1", new_sqlite_classes: ["DOQueueHandler"] }]
//   d1_databases:    [{ binding: "NEXT_TAG_CACHE_D1", ... }]  // only if on-demand revalidation
// ───────────────────────────────────────────────────────────────────────────
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

const smallSiteConfig = defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  // Only required for on-demand revalidation (revalidateTag/revalidatePath)
  tagCache: d1NextTagCache,
});

// ───────────────────────────────────────────────────────────────────────────
// Tier 3 — Large/high-traffic site.
// Adds: regional cache (long-lived), DO-sharded tag cache, automatic cache purge.
// Requires in wrangler.jsonc (beyond Tier 2):
//   durable_objects also binds NEXT_TAG_CACHE_DO_SHARDED + NEXT_CACHE_DO_PURGE
//   migrations new_sqlite_classes: ["DOQueueHandler", "DOShardedTagCache", "BucketCachePurge"]
//   Secrets: CACHE_PURGE_API_TOKEN, CACHE_PURGE_ZONE_ID  (cache purge needs a zone/custom domain)
// Docs: https://opennext.js.org/cloudflare/perf
// ───────────────────────────────────────────────────────────────────────────
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";
import { purgeCache } from "@opennextjs/cloudflare/overrides/cache-purge/index";

const largeSiteConfig = defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  queue: doQueue,
  // Only required for on-demand revalidation
  tagCache: doShardedTagCache({ baseShardSize: 12 }),
  // Disable enableCacheInterception if you use PPR (incompatible today)
  enableCacheInterception: true,
  // Only works on a zone (custom domain); needs CACHE_PURGE_* secrets
  cachePurge: purgeCache({ type: "direct" }),
});

// ───────────────────────────────────────────────────────────────────────────
// Optional — queue cache (Cache API wrapper around the DO queue)
// regionalCacheTtlSec default 5s. waitForQueueAck: true waits for ack before
// returning; false populates cache ASAP and calls queue after.
// ───────────────────────────────────────────────────────────────────────────
import queueCache from "@opennextjs/cloudflare/overrides/queue/queue-cache";

const withQueueCache = defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: queueCache(doQueue, {
    regionalCacheTtlSec: 5,
    waitForQueueAck: true,
  }),
});

// ───────────────────────────────────────────────────────────────────────────
// Optional — Skew protection (preview-URL version matching)
// Also requires wrangler.jsonc: assets.run_worker_first = true
// And env vars: CF_WORKER_NAME, CF_PREVIEW_DOMAIN, CF_WORKERS_SCRIPTS_API_TOKEN, CF_ACCOUNT_ID
// And next.config.ts: deploymentId: getDeploymentId()
// DISABLED for workers that implement a Durable Object (move DOs to a separate worker).
// Docs: https://opennext.js.org/cloudflare/howtos/skew
// ───────────────────────────────────────────────────────────────────────────
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const withSkewProtection = {
  cloudflare: {
    skewProtection: {
      enabled: true,
      maxNumberOfVersions: 20, // optional, default 20
      maxVersionAgeDays: 7, // optional, default 7
    },
  },
} satisfies OpenNextConfig;

// ───────────────────────────────────────────────────────────────────────────
// EXPORT the one you want. Default for a fresh project is the empty config:
// ───────────────────────────────────────────────────────────────────────────
export default defineCloudflareConfig({
  // incrementalCache: r2IncrementalCache,        // uncomment when you add the R2 binding
  // queue: doQueue,                              // uncomment when you add the DO queue
  // tagCache: d1NextTagCache,                    // uncomment for on-demand revalidation
});
