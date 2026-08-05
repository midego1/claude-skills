# Known Issues & Migration

## Build/Runtime warnings for caching Durable Objects

Caching Durable Objects (`DOQueueHandler`, `DOShardedTagCache`) are **not used during the build**, which produces build-time and runtime warnings. These are safe to ignore (no production impact).

**Build-time warning:**
```
▲ [WARNING] You have defined bindings to the following internal Durable Objects:
- {"name":"NEXT_CACHE_DO_QUEUE","class_name":"DOQueueHandler"}
These will not work in local development, but they should work in production.
```

**Runtime warning:**
```
workerd/server/server.c++:1951: warning: A DurableObjectNamespace in the config referenced the class "DOQueueHandler"...
```

**To test DOs locally:** define your DO in a separate Worker, with a separate configuration file. See [Wrangler supported bindings](https://developers.cloudflare.com/workers/wrangler/api#supported-bindings).

## Migration: 0.6 → 1.0.0-beta

The codebase was refactored with breaking changes.

### 1. Class/binding renames

`DurableObjectQueueHandler` → **`DOQueueHandler`**. Update durable object bindings in `wrangler.jsonc` accordingly.

### 2. Environment variable rename

`NEXT_CACHE_DO_QUEUE_MAX_NUM_REVALIDATIONS` → **`NEXT_CACHE_DO_QUEUE_MAX_RETRIES`**.

### 3. `D1TagCache` removed

Replaced by **`D1NextModeTagCache`** (`d1NextTagCache` import) — more efficient, also D1-based.

### 4. `shardReplication` consolidated

`enableShardReplication` and `shardReplicationOptions` params to `ShardedDOTagCache` were folded into a single `shardReplication` object. You **must** specify it as an object to enable the feature.

**Before:**
```js
shardedDOTagCache({
  baseShardSize: 4,
  enableShardReplication: true,
  shardReplicationOptions: {
    numberOfSoftReplicas: 4,
    numberOfHardReplicas: 2,
  },
});
```

**After:**
```js
shardedDOTagCache({
  baseShardSize: 4,
  shardReplication: {
    numberOfSoftReplicas: 4,
    numberOfHardReplicas: 2,
  },
});
```

## Sources

- Known issues — https://opennext.js.org/cloudflare/known-issues
- Migration 0.6 → 1.0.0-beta — https://opennext.js.org/cloudflare/migrate-from-0.6-to-1.0.0-beta
