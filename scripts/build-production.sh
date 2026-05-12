#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Production build script for AffiliateDeals
# Usage: bash scripts/build-production.sh
#
# Produces:
#   artifacts/api-server/dist/         ← compiled Express server bundle
#   artifacts/affiliate-site/dist/public/ ← built React SPA static files
#
# For shared hosting: upload BOTH folders + package.json + app.js + .env
# ──────────────────────────────────────────────────────────────────────────────

set -e

echo "▶ Installing dependencies..."
pnpm install --frozen-lockfile

echo "▶ Building shared libraries..."
pnpm run typecheck:libs

echo "▶ Building API server..."
pnpm --filter @workspace/api-server run build

echo "▶ Building frontend (React SPA)..."
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/affiliate-site run build

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Output:"
echo "   API server bundle:  artifacts/api-server/dist/"
echo "   Frontend assets:    artifacts/affiliate-site/dist/public/"
echo ""
echo "🚀 To run locally:  NODE_ENV=production PORT=3000 node artifacts/api-server/dist/index.mjs"
echo "   For cPanel:       configure app.js as startup file (see app.js comments)"
echo "   For PM2:          pm2 start ecosystem.config.cjs --env production"
