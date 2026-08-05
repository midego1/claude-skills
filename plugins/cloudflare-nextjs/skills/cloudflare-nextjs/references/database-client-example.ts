// Database Client Examples for Next.js on Cloudflare Workers via OpenNext
// Demonstrates the request-scoped client pattern required to avoid
// "Cannot perform I/O on behalf of a different request" errors.
//
// Docs: https://opennext.js.org/cloudflare/howtos/db
//       https://opennext.js.org/cloudflare/bindings

import type { NextRequest } from "next/server";
import { cache } from "react";

// ============================================================================
// ❌ WRONG: Global Database Client (DO NOT DO THIS)
// ============================================================================
//
// import { Pool } from "pg";
// // ❌ Fails: "Cannot perform I/O on behalf of a different request"
// const globalPool = new Pool({ connectionString: process.env.DATABASE_URL });
// export async function GET() {
//   const result = await globalPool.query("SELECT * FROM users");
//   return Response.json(result.rows);
// }

// ============================================================================
// ✅ BEST: Cloudflare D1 via getCloudflareContext() — designed for Workers
// ============================================================================

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema/d1";

// Request-scoped via react `cache()` (reused within a single request, never across)
export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
});

// Static routes (ISR/SSG) MUST use async mode
export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
});

// Raw D1 (no ORM):
export async function GET_D1() {
  const { env } = getCloudflareContext();
  const result = await env.DB.prepare("SELECT * FROM users WHERE active = ?")
    .bind(true)
    .all();
  return Response.json(result.results);
}

export async function POST_D1(request: NextRequest) {
  const { env } = getCloudflareContext();
  const { name, email } = await request.json();
  const result = await env.DB.prepare(
    "INSERT INTO users (name, email, active) VALUES (?, ?, ?)",
  )
    .bind(name, email, true)
    .run();
  return Response.json({ id: result.meta.last_row_id, success: result.success });
}

// ============================================================================
// ✅ External Postgres via Hyperdrive (request-scoped, maxUses: 1)
// ============================================================================

import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as pgSchema from "./schema/pg";

export const getPgDb = cache(() => {
  const { env } = getCloudflareContext();
  const pool = new Pool({
    connectionString: env.HYPERDRIVE.connectionString,
    maxUses: 1, // critical: do not reuse connections across requests
  });
  return drizzlePg({ client: pool, schema: pgSchema });
});

export const getPgDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  const pool = new Pool({ connectionString: env.HYPERDRIVE.connectionString, maxUses: 1 });
  return drizzlePg({ client: pool, schema: pgSchema });
});

// ============================================================================
// TypeScript types for Cloudflare bindings
// ============================================================================
// Generate with: npx wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts
// (re-run after any binding change). This produces a global CloudflareEnv interface
// and types `getCloudflareContext().env` accordingly.

// Example hand-written shape (replace with generated types):
interface CloudflareEnv {
  DB: D1Database;
  MY_BUCKET: R2Bucket;
  MY_KV: KVNamespace;
  AI: Ai;
  HYPERDRIVE: Hyperdrive;
}
