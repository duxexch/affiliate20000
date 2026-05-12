#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  AffiliateDeals — Hostinger Deployment Package Builder
#  Domain: dux-exch.com
#
#  Usage: bash scripts/create-hostinger-package.sh
#  Output: hostinger-deploy/ folder + hostinger-deploy.zip
# ═══════════════════════════════════════════════════════════════════════════════
set -e

DOMAIN="dux-exch.com"
OUT="hostinger-deploy"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AffiliateDeals — Hostinger Package Builder"
echo "  Domain: $DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "▶ Step 1: Building server bundle..."
pnpm --filter @workspace/api-server run build

echo ""
echo "▶ Step 2: Building React frontend (SITE_URL=$DOMAIN)..."
BASE_PATH=/ NODE_ENV=production VITE_SITE_URL="https://$DOMAIN" \
  pnpm --filter @workspace/affiliate-site run build

echo ""
echo "▶ Step 3: Assembling deployment package..."
rm -rf "$OUT"
mkdir -p "$OUT/dist"
mkdir -p "$OUT/public"

# Copy server bundle (all pino workers + main bundle)
cp artifacts/api-server/dist/index.mjs           "$OUT/dist/"
cp artifacts/api-server/dist/pino-worker.mjs     "$OUT/dist/" 2>/dev/null || true
cp artifacts/api-server/dist/pino-file.mjs       "$OUT/dist/" 2>/dev/null || true
cp artifacts/api-server/dist/pino-pretty.mjs     "$OUT/dist/" 2>/dev/null || true
cp artifacts/api-server/dist/thread-stream-worker.mjs "$OUT/dist/" 2>/dev/null || true

# Copy React SPA static files
cp -r artifacts/affiliate-site/dist/public/. "$OUT/public/"

# Copy startup file and config
cp server.js     "$OUT/server.js"
cp .env.example  "$OUT/.env.example"

# Create minimal package.json for Hostinger
cat > "$OUT/package.json" << 'EOF'
{
  "name": "affiliatedeals",
  "version": "1.0.0",
  "description": "Affiliate Marketing Platform — dux-exch.com",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
EOF

echo ""
echo "▶ Step 4: Creating ZIP archive..."
zip -r "hostinger-deploy.zip" "$OUT/" -x "*.DS_Store" "*.map"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Package ready!"
echo ""
echo "  📁 Folder: hostinger-deploy/"
echo "  📦 Archive: hostinger-deploy.zip  (upload this to Hostinger)"
echo ""
echo "  📋 Hostinger hPanel Setup:"
echo "     1. Upload hostinger-deploy.zip and extract to your home dir"
echo "     2. hPanel → Node.js Manager → Create Application:"
echo "        • Node.js version: 20.x"
echo "        • Application root: /home/username/affiliatedeals"
echo "        • Startup file: server.js"
echo "     3. Add Environment Variables:"
echo "        DATABASE_URL = postgresql://user:pass@host:5432/dbname"
echo "        NODE_ENV     = production"
echo "        SITE_URL     = https://$DOMAIN"
echo "     4. Click 'Restart' — your site is live!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
