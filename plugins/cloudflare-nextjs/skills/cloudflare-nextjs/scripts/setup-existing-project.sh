#!/bin/bash
# Add OpenNext Cloudflare adapter to an existing Next.js project.
#
# Preferred: use the adapter's own `migrate` command, which automates
# installing deps, creating wrangler.jsonc / open-next.config.ts / .dev.vars,
# wiring package.json scripts, adding public/_headers, .gitignore, the
# `initOpenNextCloudflareForDev()` call in next.config.ts, and an R2 cache
# bucket (if R2 is enabled on the account).
#
# Docs: https://opennext.js.org/cloudflare/get-started
#       https://opennext.js.org/cloudflare/cli

set -e

echo "🔧 Adding OpenNext Cloudflare adapter to existing Next.js project"
echo ""

# Check if we're in a Next.js project
if [ ! -f "package.json" ]; then
    echo "❌ Error: No package.json found. Run this script from your Next.js project root."
    exit 1
fi

if ! grep -q "\"next\":" package.json; then
    echo "⚠️  Warning: Next.js doesn't appear to be installed in package.json"
    echo "Are you sure this is a Next.js project?"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Preferred path: adapter migrate command
echo "🚀 Running: npx @opennextjs/cloudflare migrate"
echo "   (installs deps, creates configs, wires scripts, sets up R2 cache if enabled)"
echo ""
npx @opennextjs/cloudflare@latest migrate

# Check for Edge runtime usage
echo ""
echo "🔍 Checking for Edge runtime usage..."
if grep -r "export const runtime = \"edge\"" app/ pages/ src/ 2>/dev/null; then
    echo "⚠️  WARNING: Found Edge runtime exports!"
    echo "   OpenNext requires the Node.js runtime. Remove 'export const runtime = \"edge\"' from your files."
else
    echo "✅ No Edge runtime exports found"
fi

# proxy.ts caveat (Next 16)
echo ""
echo "📌 Next 16 note: if you renamed middleware.ts → proxy.ts, rename it back."
echo "   @opennextjs/cloudflare does not yet recognize proxy.ts (issue #1277)."

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. npm run dev      # Next.js dev server (fast HMR)"
echo "  2. npm run preview  # Run in the Workers runtime (REQUIRED before deploy)"
echo "  3. npm run deploy   # Build + deploy to Cloudflare"
echo ""
echo "📖 Documentation: https://opennext.js.org/cloudflare"
echo "🐛 Open issues:    https://github.com/opennextjs/opennextjs-cloudflare/issues"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# FALLBACK: manual install (uncomment if you prefer not to use `migrate`)
# ─────────────────────────────────────────────────────────────────────────────
# npm install @opennextjs/cloudflare@latest
# npm install --save-dev wrangler@latest
# # Then create wrangler.jsonc, open-next.config.ts, .dev.vars, and add the
# # dev/preview/deploy/upload/cf-typegen scripts — see the skill's references/.
