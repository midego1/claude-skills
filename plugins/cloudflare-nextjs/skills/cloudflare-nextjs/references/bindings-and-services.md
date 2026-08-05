# Bindings & Service Integration

How to access Cloudflare bindings from Next.js routes, and how to wire common ORMs/SDKs.

## `getCloudflareContext()` — the only correct way

**Do not use `process.env` for bindings.** Import `getCloudflareContext` from `@opennextjs/cloudflare`.

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  const { env, cf, ctx } = getCloudflareContext();
  await env.MY_KV.put("foo", "bar");
  return new Response(await env.MY_KV.get("foo"));
}
```

- `env` — bindings (D1, R2, KV, AI, Hyperdrive, DOs, service bindings, vars, secrets).
- `cf` — request properties (city, country, colo, TLS version, …).
- `ctx` — Workers lifecycle (`waitUntil`, `passThroughOnException`).

### Static routes (ISR/SSG) — async mode required

```ts
const { env } = await getCloudflareContext({ async: true });
```

**Caution:** secrets (`.dev.vars`) and local-dev binding values are used during static generation. Do not leak them into static HTML.

### TypeScript types

```bash
npx wrangler types --env-interface CloudflareEnv
# or, per the get-started template:
npx wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts
```

Generates `worker-configuration.d.ts` (or `cloudflare-env.d.ts`). Re-run after any binding change.

### Remote bindings (local dev → real resources)

Stabilized in **Wrangler 4.36.0**. On older wrangler, enable via `initOpenNextCloudflareForDev({ experimental: { remoteBindings: true } })` and use the `experimental_remote` (not `remote`) key on binding options. Remote bindings are **also used during build**.

## Database integration

**Core rule:** create a new client **per request**. Global clients use connection pooling that is forbidden in Workers and causes `Error: Cannot perform I/O on behalf of a different request`.

Wrap with `cache()` from `react` to reuse the client within a single request (only affects server components).

### Drizzle + Cloudflare D1

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { cache } from "react";
import * as schema from "./schema/d1";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return drizzle(env.MY_D1, { schema });
});

// For static routes (ISR/SSG):
export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.MY_D1, { schema });
});
```

### Drizzle + Cloudflare Hyperdrive (PostgreSQL)

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/node-postgres";
import { cache } from "react";
import * as schema from "./schema/pg";
import { Pool } from "pg";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const pool = new Pool({
    connectionString: env.HYPERDRIVE.connectionString,
    maxUses: 1, // do not reuse connections across requests
  });
  return drizzle({ client: pool, schema });
});

export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  const pool = new Pool({ connectionString: env.HYPERDRIVE.connectionString, maxUses: 1 });
  return drizzle({ client: pool, schema });
});
```

> ⚠️ Known issue: Hyperdrive + `pg` / `@prisma/adapter-pg` bundling failure — see #1322 / #1214.

### Drizzle + standard PostgreSQL (no Hyperdrive)

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { cache } from "react";
import { Pool } from "pg";
import * as schema from "./schema/pg";

export const getDb = cache(() => {
  const pool = new Pool({
    connectionString: process.env.PG_URL,
    maxUses: 1, // critical
  });
  return drizzle({ client: pool, schema });
});
```

### Prisma + Cloudflare D1

`schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

> ⚠️ Do **not** specify an output directory in `schema.prisma` — the generated client must be patched by OpenNext to work on Workers; specifying output prevents patching.

`next.config.ts`:
```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};
```

`lib/db.ts`:
```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const adapter = new PrismaD1(env.MY_D1);
  return new PrismaClient({ adapter });
});

export const getDbAsync = async () => {
  const { env } = await getCloudflareContext({ async: true });
  const adapter = new PrismaD1(env.MY_D1);
  return new PrismaClient({ adapter });
};
```

### Prisma + PostgreSQL (Hyperdrive)

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const adapter = new PrismaPg({ connectionString: env.HYPERDRIVE.connectionString, maxUses: 1 });
  return new PrismaClient({ adapter });
});

export const getDbAsync = async () => {
  const { env } = await getCloudflareContext({ async: true });
  const adapter = new PrismaPg({ connectionString: env.HYPERDRIVE.connectionString, maxUses: 1 });
  return new PrismaClient({ adapter });
};
```

### Prisma + plain PostgreSQL

```ts
import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const getDb = cache(() => {
  const adapter = new PrismaPg({ connectionString: process.env.PG_URL ?? "", maxUses: 1 });
  return new PrismaClient({ adapter });
});
```

## Other bindings

### R2

```ts
const { env } = getCloudflareContext();
const obj = await env.MY_BUCKET.get("file.txt");
return new Response(obj?.body);
```

### KV

```ts
const { env } = getCloudflareContext();
await env.MY_KV.put("key", "value");
const v = await env.MY_KV.get("key");
```

### Workers AI

```ts
const { env } = getCloudflareContext();
const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", { prompt: "Hello" });
```

## Stripe

The default Stripe HTTP client uses `node:https`, which is **not** implemented on Workers. Use the Fetch-based client:

```ts
import Stripe from "stripe";

const stripe = Stripe(process.env.STRIPE_API_KEY!, {
  httpClient: Stripe.createFetchHttpClient(),
});
```

No `wrangler.jsonc` or `open-next.config.ts` changes required.

## Sources

- Bindings — https://opennext.js.org/cloudflare/bindings
- How-to: DB (Drizzle, Prisma, D1, Hyperdrive, PG) — https://opennext.js.org/cloudflare/howtos/db
- How-to: Stripe — https://opennext.js.org/cloudflare/howtos/stripeAPI
