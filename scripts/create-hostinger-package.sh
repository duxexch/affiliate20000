#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  AffiliateDeals — Hostinger Deployment Package Builder
#  Domain: dux-ex.com
#
#  Usage: bash scripts/create-hostinger-package.sh
#  Output: hostinger-deploy/ folder + hostinger-deploy.zip
# ═══════════════════════════════════════════════════════════════════════════════
set -e

# Ensure pnpm is available even in non-login shells (e.g., WSL bash scripts).
if command -v pnpm >/dev/null 2>&1; then
  PNPM_CMD="pnpm"
else
  PNPM_FALLBACK_BIN="$(npm prefix -g)/bin/pnpm"
  if [ -x "$PNPM_FALLBACK_BIN" ]; then
    PNPM_CMD="$PNPM_FALLBACK_BIN"
  else
    PNPM_CMD="pnpm"
  fi
fi

DOMAIN="dux-ex.com"
OUT="hostinger-deploy"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AffiliateDeals — Hostinger Package Builder"
echo "  Domain: $DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "▶ Step 1: Building server bundle..."
if "$PNPM_CMD" --version >/dev/null 2>&1; then
  "$PNPM_CMD" --filter @workspace/api-server run build
else
  echo "⚠️  pnpm not available here — skipping server build (using existing artifacts/api-server/dist)"
fi

echo ""
echo "▶ Step 2: Building React frontend (SITE_URL=$DOMAIN)..."
if "$PNPM_CMD" --version >/dev/null 2>&1; then
  BASE_PATH=/ NODE_ENV=production VITE_SITE_URL="https://$DOMAIN" \
    "$PNPM_CMD" --filter @workspace/affiliate-site run build
else
  echo "⚠️  pnpm not available here — skipping frontend build (using existing artifacts/affiliate-site/dist)"
fi

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
  "description": "Affiliate Marketing Platform — dux-ex.com",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "build": "node -e \"console.log('hostinger-deploy: build skipped (prebuilt dist/public included)')\"",
    "start": "node server.js"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
EOF

echo ""
echo "▶ Step 4: Creating ZIP archive..."
ZIP_NAME="${HOSTINGER_ZIP_NAME:-hostinger-standalone-latest.zip}"
rm -f "$ZIP_NAME"
# Preserve previous behavior: exclude source maps
find "$OUT" -name "*.map" -type f -delete 2>/dev/null || true

# Create ZIP using Windows PowerShell (zip utility isn't available in this WSL environment)
if command -v wslpath >/dev/null 2>&1; then
  WIN_PWD="$(wslpath -w "$PWD")"
  WIN_OUT="${WIN_PWD}\\${OUT}"
  WIN_ZIP="${WIN_PWD}\\${ZIP_NAME}"
  powershell.exe -NoProfile -Command "Compress-Archive -Path '${WIN_OUT}\\*' -DestinationPath '${WIN_ZIP}' -Force"
else
  # Fallback: use relative paths (may work depending on WSL/PowerShell cwd mapping)
  powershell.exe -NoProfile -Command "Compress-Archive -Path '${OUT}\\*' -DestinationPath '${ZIP_NAME}' -Force"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Package ready!"
echo ""
echo "  📁 Folder: hostinger-deploy/"
echo "  � Archive: $ZIP_NAME  (upload this to Hostinger)"
echo ""
echo "  �📋 Hostinger hPanel Setup:"
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
