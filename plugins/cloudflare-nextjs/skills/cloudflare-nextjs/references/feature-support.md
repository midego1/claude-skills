# Next.js Feature Support on Cloudflare Workers

Complete feature compatibility matrix for Next.js deployed on Cloudflare Workers using the OpenNext adapter.

**Last Verified**: 2026-08-05
**OpenNext Version**: `@opennextjs/cloudflare` ^1.18.1
**Next.js Versions**: v16 (all minors); latest minors of v14 and v15; v14 dropped Q1 2026

**Important caveats**:
- **Edge Runtime** is NOT supported — use the Node.js runtime via `nodejs_compat`.
- **Node Middleware** (Next.js 15.2+) is not yet supported (issue #617).
- **Turbopack** is supported but has several open bugs (#1305, #1317, #1326) — webpack is safer.
- **Cache interception + PPR** are incompatible today.

**Sources**:
- Overview — https://opennext.js.org/cloudflare
- Cloudflare guide — https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

---

## ✅ Fully Supported Features

### Routing

| Feature | Status | Notes |
|---------|--------|-------|
| **App Router** | ✅ Fully Supported | Latest App Router features work |
| **Pages Router** | ✅ Fully Supported | Legacy Pages Router fully functional |
| **Route Handlers** | ✅ Fully Supported | API routes work as expected |
| **Dynamic Routes** | ✅ Fully Supported | `[param]`, `[...slug]`, `[[...slug]]` |
| **Route Groups** | ✅ Fully Supported | `(group)` folder organization |
| **Parallel Routes** | ✅ Fully Supported | `@folder` parallel routes |
| **Intercepting Routes** | ✅ Fully Supported | `(..)` intercepting routes |

---

### Rendering

| Feature | Status | Notes |
|---------|--------|-------|
| **Server-Side Rendering (SSR)** | ✅ Fully Supported | Dynamic page generation |
| **Static Site Generation (SSG)** | ✅ Fully Supported | Build-time page generation |
| **Incremental Static Regeneration (ISR)** | ✅ Fully Supported | Revalidate static pages |
| **React Server Components** | ✅ Fully Supported | RSC fully functional |
| **Client Components** | ✅ Fully Supported | `"use client"` directive works |
| **Response Streaming** | ✅ Fully Supported | Streaming SSR responses |

---

### Data Fetching

| Feature | Status | Notes |
|---------|--------|-------|
| **`fetch()` API** | ✅ Fully Supported | Native fetch in Server Components |
| **Data Cache** | ✅ Fully Supported | `fetch()` caching works |
| **Request Memoization** | ✅ Fully Supported | Automatic request deduplication |
| **Revalidation** | ✅ Fully Supported | `revalidate`, `revalidatePath`, `revalidateTag` |
| **`cookies()`** | ✅ Fully Supported | Read/write cookies |
| **`headers()`** | ✅ Fully Supported | Access request headers |
| **`searchParams`** | ✅ Fully Supported | Access URL search parameters |

---

### Server Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Server Actions** | ✅ Fully Supported | Form actions and mutations |
| **Route Handlers (API Routes)** | ✅ Fully Supported | Full CRUD operations |
| **Middleware** | ✅ Supported* | *Except Node.js middleware (15.2+) |
| **`next/after` API** | ✅ Fully Supported | Post-response async work |
| **Async Request APIs** | ✅ Fully Supported | Async `cookies()`, `headers()`, etc. |

**Middleware Limitation**: Node.js middleware introduced in Next.js 15.2 is not yet supported. Standard middleware works fine.

**⚠️ Do NOT rename `middleware.ts` to `proxy.ts` on Cloudflare.** Next.js 16 renamed `middleware.ts` → `proxy.ts`, but `@opennextjs/cloudflare` does not yet recognize the `proxy.ts` filename — renaming will silently disable your middleware when deployed to Cloudflare Workers. Keep using `middleware.ts` (still supported by Next 16, just deprecated upstream) until OpenNext adds `proxy.ts` support.

---

### Experimental Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Partial Prerendering (PPR)** | ✅ Supported | Experimental in Next.js |
| **Composable Caching** | ✅ Supported | `'use cache'` directive |
| **Dynamic I/O** | ✅ Supported | Experimental async APIs |

**Note**: These features are experimental in Next.js itself, not just in the Cloudflare adapter.

---

### Image Optimization

| Feature | Status | Notes |
|---------|--------|-------|
| **`next/image` Component** | ✅ Supported | Via Cloudflare Images |
| **Automatic Image Optimization** | ✅ Supported | Requires Cloudflare Images plan |
| **Remote Images** | ✅ Supported | Configure in `next.config.js` |
| **Image Formats** | ✅ Supported | WebP, AVIF automatic conversion |
| **Responsive Images** | ✅ Supported | `srcset` generation works |

**Configuration**:
```typescript
// open-next.config.ts
export default defineCloudflareConfig({
  imageOptimization: {
    loader: 'cloudflare'
  }
});
```

**Billing**: Cloudflare Images usage is billed separately from Workers.

**Docs**: https://developers.cloudflare.com/images/

---

### Fonts

| Feature | Status | Notes |
|---------|--------|-------|
| **`next/font`** | ✅ Fully Supported | Google Fonts and local fonts |
| **Font Optimization** | ✅ Fully Supported | Automatic font optimization |
| **Font Display** | ✅ Fully Supported | Control font loading behavior |
| **Variable Fonts** | ✅ Fully Supported | Full variable font support |

---

### Metadata

| Feature | Status | Notes |
|---------|--------|-------|
| **Static Metadata** | ✅ Fully Supported | `metadata` export in layouts/pages |
| **Dynamic Metadata** | ✅ Fully Supported | `generateMetadata()` function |
| **Metadata Files** | ✅ Fully Supported | `opengraph-image.tsx`, `icon.tsx`, etc. |
| **Sitemap Generation** | ✅ Fully Supported | `sitemap.xml` generation |
| **Robots.txt** | ✅ Fully Supported | Dynamic robots.txt |

---

### Caching

| Feature | Status | Notes |
|---------|--------|-------|
| **Full Route Cache** | ✅ Supported | Static route caching |
| **Router Cache** | ✅ Supported | Client-side navigation cache |
| **Data Cache** | ✅ Supported | `fetch()` response caching |
| **Request Memoization** | ✅ Supported | Automatic deduplication |
| **`unstable_cache`** | ✅ Supported | Explicit cache API |
| **Composable Caching** | ✅ Supported | `'use cache'` directive (experimental) |

**Custom Configuration**:
```typescript
// open-next.config.ts
export default defineCloudflareConfig({
  cache: {
    // Custom cache behavior
    // See: https://opennext.js.org/cloudflare/caching
  }
});
```

---

### TypeScript

| Feature | Status | Notes |
|---------|--------|-------|
| **TypeScript Support** | ✅ Fully Supported | Full TS support |
| **Type Generation** | ✅ Supported | Generate binding types with `cf-typegen` |
| **Type Checking** | ✅ Fully Supported | `next build` type checks |
| **Strict Mode** | ✅ Fully Supported | TypeScript strict mode works |

**Generate Cloudflare binding types**:
```bash
npm run cf-typegen
# Creates cloudflare-env.d.ts
```

---

### Build Optimization

| Feature | Status | Notes |
|---------|--------|-------|
| **Code Splitting** | ✅ Fully Supported | Automatic code splitting |
| **Tree Shaking** | ✅ Fully Supported | Dead code elimination |
| **Minification** | ✅ Fully Supported | Production builds minified |
| **Source Maps** | ✅ Fully Supported | Generate source maps |
| **Bundle Analysis** | ✅ Supported | Via ESBuild analyzer |

---

### Internationalization (i18n)

| Feature | Status | Notes |
|---------|--------|-------|
| **App Router i18n** | ✅ Fully Supported | Manual i18n routing |
| **`next-intl`** | ✅ Compatible | Third-party i18n library works |
| **Locale Detection** | ✅ Supported | Via middleware |
| **Locale Routing** | ✅ Supported | Dynamic locale segments |

**Note**: Built-in i18n routing (Pages Router) works, but App Router requires manual setup (as per Next.js 13+).

---

## ❌ Not Supported / Limitations

### Runtime Limitations

| Feature | Status | Notes |
|---------|--------|-------|
| **Edge Runtime** | ❌ Not Supported | Use Node.js runtime instead |
| **Node.js Middleware (15.2+)** | ❌ Not Yet Supported | Future support planned |
| **Turbopack** | ❌ Not Supported | Use standard Next.js build |

**Edge Runtime Workaround**: Remove `export const runtime = "edge"` from your code. The Node.js runtime on Workers provides similar performance.

---

### Build Tools

| Feature | Status | Notes |
|---------|--------|-------|
| **Turbopack (Build)** | ❌ Not Supported | Causes chunk loading errors |
| **Turbopack (Dev)** | ✅ OK for Dev | Only for `next dev`, not builds |

**Correct Configuration**:
```json
{
  "scripts": {
    "dev": "next dev",              // Can use Turbopack here
    "build": "next build"           // ❌ Don't use --turbo flag
  }
}
```

---

### Platform Constraints

| Feature | Status | Notes |
|---------|--------|-------|
| **Worker Size** | ⚠️ Limited | 3 MiB (free) / 10 MiB (paid) |
| **Windows Development** | ⚠️ Limited | WSL recommended |
| **Global Database Clients** | ❌ Not Supported | Must be request-scoped |

---

## 🔧 Cloudflare-Specific Features

### Workers Integration

| Feature | Status | Notes |
|---------|--------|-------|
| **D1 Database** | ✅ Fully Supported | SQL database access |
| **R2 Storage** | ✅ Fully Supported | Object storage |
| **KV Storage** | ✅ Fully Supported | Key-value storage |
| **Workers AI** | ✅ Fully Supported | AI model inference |
| **Vectorize** | ✅ Fully Supported | Vector database |
| **Queues** | ✅ Fully Supported | Message queues |
| **Durable Objects** | ✅ Supported | Stateful objects |
| **Service Bindings** | ✅ Fully Supported | Call other Workers |
| **Analytics Engine** | ✅ Fully Supported | Event analytics |

**Access bindings** via `process.env`:
```typescript
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const env = process.env as any;

  // Access D1
  const data = await env.DB.prepare('SELECT * FROM users').all();

  // Access R2
  const file = await env.BUCKET.get('file.txt');

  // Access KV
  const value = await env.KV.get('key');

  // Access Workers AI
  const result = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
    prompt: 'Hello'
  });

  return Response.json({ data });
}
```

---

### Custom Domains

| Feature | Status | Notes |
|---------|--------|-------|
| **Custom Domains** | ✅ Fully Supported | Must be Cloudflare zone |
| **Workers.dev Subdomain** | ✅ Fully Supported | Free `*.workers.dev` domain |
| **Multiple Domains** | ✅ Fully Supported | Route to multiple domains |
| **SSL/TLS** | ✅ Automatic | Cloudflare SSL |

---

## Version Compatibility

### Next.js Versions

| Version | Status | Notes |
|---------|--------|-------|
| **Next.js 15.x** | ✅ Fully Supported | All minor/patch versions |
| **Next.js 14.2+** | ✅ Fully Supported | Latest 14.x minor release |
| **Next.js 14.0-14.1** | ⚠️ Partial | Update to 14.2+ recommended |
| **Next.js 13.x** | ⚠️ May Work | Not officially supported |

**Recommendation**: Use Next.js 14.2+ or 15.x for best compatibility.

---

### React Versions

| Version | Status | Notes |
|---------|--------|-------|
| **React 19** | ✅ Fully Supported | Latest stable |
| **React 18** | ✅ Fully Supported | Fully compatible |
| **React 17** | ⚠️ Limited | Next.js 14+ requires React 18+ |

---

## Migration Paths

### From Vercel

All standard Next.js features supported on Vercel work on Cloudflare Workers.

**Platform-specific replacements**:
- Vercel Postgres → Cloudflare D1
- Vercel Blob → Cloudflare R2
- Vercel KV → Cloudflare KV
- Vercel Edge Config → Cloudflare KV
- Vercel Cron Jobs → Cloudflare Cron Triggers

---

### From AWS / Other Platforms

Same as Vercel migration - the adapter handles standard Next.js features automatically.

**Considerations**:
- Replace platform-specific SDKs with Cloudflare equivalents
- Ensure database clients are request-scoped
- Review environment variable usage
- Test thoroughly in `preview` mode before deploying

---

## Testing Recommendations

### Local Development

1. **Use Next.js dev server** for fast iteration:
   ```bash
   npm run dev
   ```

2. **Test in workerd runtime** before deploying:
   ```bash
   npm run preview
   ```

3. **Always preview before production**:
   ```bash
   npm run preview
   # Test all features
   npm run deploy
   ```

### Feature Testing Checklist

Before deploying to production, test:

- [ ] SSR pages render correctly
- [ ] Static pages generate at build time
- [ ] ISR pages revalidate as expected
- [ ] API routes work (GET, POST, PUT, DELETE)
- [ ] Server Actions execute properly
- [ ] Middleware runs without errors
- [ ] Image optimization loads images
- [ ] Database queries succeed
- [ ] External API calls work
- [ ] Forms submit and validate
- [ ] Authentication flows complete
- [ ] Environment variables accessible

---

## Resources

### Official Documentation
- **Next.js Features**: https://nextjs.org/docs
- **OpenNext Cloudflare**: https://opennext.js.org/cloudflare
- **Cloudflare Guide**: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

### Related Skills
- `cloudflare-d1` - D1 database integration
- `cloudflare-r2` - R2 object storage
- `cloudflare-kv` - KV key-value storage
- `cloudflare-workers-ai` - Workers AI integration
- `cloudflare-vectorize` - Vector database

---

## Sources

- Overview — https://opennext.js.org/cloudflare
- Cloudflare guide — https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
