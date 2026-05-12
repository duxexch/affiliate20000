/**
 * Hostinger Node.js entry point
 * ─────────────────────────────
 * Set this as the "Application startup file" in hPanel → Node.js Manager
 *
 * Required environment variables (set in hPanel → Node.js → Environment Variables):
 *   DATABASE_URL   = postgresql://user:pass@host:5432/dbname
 *   NODE_ENV       = production
 *   SITE_URL       = https://dux-exch.com
 *
 * Hostinger auto-assigns PORT — do NOT set it manually.
 */

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tell the server where the React SPA static files are
process.env.STATIC_DIR =
  process.env.STATIC_DIR || path.join(__dirname, "public");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Load the compiled Express server
import("./dist/index.mjs").catch((err) => {
  console.error("[AffiliateDeals] Failed to start server:", err);
  process.exit(1);
});
