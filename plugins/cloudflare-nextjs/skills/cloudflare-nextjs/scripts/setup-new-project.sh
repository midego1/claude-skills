#!/bin/bash
# Setup new Next.js project for Cloudflare Workers
# Uses Cloudflare's create-cloudflare (C3) CLI

set -e

PROJECT_NAME="${1:-my-next-app}"

echo "🚀 Creating new Next.js project for Cloudflare Workers: $PROJECT_NAME"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

# Create new project with C3 (--platform=workers targets Cloudflare Workers via OpenNext)
echo "📦 Running C3 to scaffold Next.js project for Workers..."
npm create cloudflare@latest -- "$PROJECT_NAME" --framework=next --platform=workers

echo ""
echo "✅ Project created successfully!"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  npm run dev      # Start Next.js dev server"
echo "  npm run preview  # Test in workerd runtime"
echo "  npm run deploy   # Deploy to Cloudflare"
echo ""
echo "📖 Configuration files created:"
echo "  - wrangler.jsonc (Worker config)"
echo "  - open-next.config.ts (OpenNext adapter config)"
echo "  - package.json (with dev/preview/deploy scripts)"
echo ""
