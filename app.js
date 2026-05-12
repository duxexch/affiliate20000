/**
 * Entry point for cPanel Node.js Passenger applications.
 *
 * cPanel shared hosting uses Phusion Passenger to run Node.js apps.
 * This file is the "Application startup file" configured in cPanel.
 *
 * How to use on shared hosting (cPanel):
 * 1. Upload the entire project folder
 * 2. In cPanel → Setup Node.js App:
 *    - Node.js version: 20.x or 22.x
 *    - Application mode: Production
 *    - Application root: /home/username/affiliatedeals
 *    - Application startup file: app.js
 *    - Environment variables: DATABASE_URL, NODE_ENV=production, SITE_URL
 * 3. Run "npm install" from the app root
 * 4. Run "npm run build" to build frontend + backend
 * 5. Click "Restart" in cPanel
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createRequire } = require("module");
const require2 = createRequire(import.meta?.url ?? __filename);

// Load the compiled API server bundle
// After running `npm run build`, the bundle is at artifacts/api-server/dist/index.mjs
// Passenger sets PORT automatically; our server defaults to 3000 if unset.
require2("./artifacts/api-server/dist/index.mjs");
