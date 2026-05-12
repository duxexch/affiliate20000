# AffiliateDeals

منصة تسويق بالعمولة (Affiliate Marketing) متكاملة للمراهنات الرياضية وعروض الكازينو — تدعم العربية (RTL) والإنجليزية مع لوحة تحكم ادارية كاملة، تتبع النقرات، وتحليلات.

A production-ready affiliate marketing platform for sports betting and casino offers, supporting Arabic (RTL) and English bilingual content with full admin panel, click tracking, and SEO analytics.

---

## Run & Operate (Development)

```bash
# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend dev server (auto-assigned port)
pnpm --filter @workspace/affiliate-site run dev

# Full typecheck (all packages)
pnpm run typecheck

# Regenerate API hooks + Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only!)
pnpm --filter @workspace/db run push
```

Required env var: `DATABASE_URL` — PostgreSQL connection string

---

## Shared Hosting Deployment (cPanel / Passenger)

### Prerequisites
- Node.js 20+ on the hosting panel
- PostgreSQL database
- Your domain pointing to the hosting account

### Step-by-step

**1. Prepare the production build locally:**
```bash
cp .env.example .env
# Edit .env: set DATABASE_URL and SITE_URL
pnpm install
pnpm run build:production
```
This produces:
- `artifacts/api-server/dist/` — Express server bundle
- `artifacts/affiliate-site/dist/public/` — React SPA static files

**2. Upload to your server:**
Upload the full project folder to your server (e.g., via FTP or Git).

**3. Configure cPanel → Setup Node.js App:**
| Field | Value |
|---|---|
| Node.js version | 20.x or 22.x |
| Application mode | Production |
| Application root | `/home/username/affiliatedeals` |
| Application startup file | `app.js` |

**4. Set Environment Variables in cPanel:**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/affiliatedeals
NODE_ENV=production
SITE_URL=https://yourdomain.com
```

**5. Run install & restart:**
In cPanel Node.js App → Run NPM Install → Restart

**6. Database setup:**
```bash
# From the app directory on the server:
pnpm --filter @workspace/db run push
```

### Using PM2 (VPS / semi-dedicated)
```bash
pnpm run build:production
pm2 start ecosystem.config.cjs --env production
pm2 save && pm2 startup
```

### How the server works in production
The Express server serves BOTH the API and the static React frontend:
- `/api/*` → Express API routes
- `/*` → Serves `artifacts/affiliate-site/dist/public/index.html` (React SPA)
- Static assets cached for 1 day via `Cache-Control`
- Sitemap available at `/api/seo/sitemap.xml`
- Robots.txt available at `/api/seo/robots.txt`

---

## Stack

- **pnpm workspaces**, Node.js 24, TypeScript 5.9
- **Frontend**: React + Vite, Tailwind CSS v4, wouter, TanStack Query, Recharts, lucide-react
- **API**: Express 5
- **DB**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

---

## Where things live

| Path | Purpose |
|---|---|
| `lib/api-spec/openapi.yaml` | OpenAPI spec — source of truth for all contracts |
| `lib/api-client-react/src/generated/` | Generated hooks + Zod schemas (do not edit) |
| `lib/db/src/schema/index.ts` | Drizzle DB schema (source of truth) |
| `artifacts/api-server/src/routes/` | Express route handlers |
| `artifacts/api-server/src/app.ts` | Express app setup (CORS, rate limit, static serving) |
| `artifacts/affiliate-site/src/pages/` | All route pages |
| `artifacts/affiliate-site/src/components/` | Shared UI components |
| `artifacts/affiliate-site/src/contexts/LanguageContext.tsx` | EN/AR bilingual context |
| `artifacts/affiliate-site/public/` | Static public assets (robots.txt, .htaccess) |
| `app.js` | cPanel Passenger entry point |
| `ecosystem.config.cjs` | PM2 config for VPS |
| `.env.example` | Template for environment variables |
| `scripts/build-production.sh` | Production build script |

---

## Architecture Decisions

- **Contract-first API**: OpenAPI spec → codegen → typed hooks. Never write fetch calls manually.
- **Click tracking**: Frontend calls `useTrackClick()` on CTA click → backend returns `affiliateUrl` → frontend opens in new tab (`noopener,noreferrer`).
- **Admin auth**: httpOnly cookie `admin_session` (base64 JSON, 7-day expiry). `useAdminAuth()` redirects to `/admin/login` on 401.
- **RTL**: `dir="rtl"` applied to `<html>` when `language === "ar"`. Cairo font loads automatically via CSS `[dir="rtl"]` selector.
- **Single server for production**: Express serves API + static frontend. No Nginx/Apache proxy needed. Works on cPanel Passenger.
- **Rate limiting**: 300 req/15min on all API routes; 20 clicks/min on `/api/clicks`.
- **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy.

---

## Product Features

### Public Site
- **Homepage** (`/`): Hero banner, featured offers, trending section, category quick-nav, paginated all-offers
- **All Offers** (`/offers`): Search bar, category filter, real-time pagination
- **Offer Detail** (`/offer/:slug`): Full-page layout, sticky CTA sidebar, star ratings, breadcrumbs, trust badges, FAQ schema, related offers, keyword tags
- **Category Pages** (`/category/:slug`): Filtered offer grid with breadcrumbs
- **404 Page**: Branded bilingual not-found page

### Admin Panel (`/admin`)
- **Dashboard**: 6 stats cards (total offers/clicks/categories, today/week/month), interactive line chart, top offers leaderboard
- **Offers management** (`/admin/offers`): Full table with edit/delete/create, status/featured/trending badges
- **Offer form** (`/admin/offers/new`, `/admin/offers/edit/:id`): All fields (EN+AR, SEO, FAQ schema JSON, visibility toggles)
- **Categories CRUD** (`/admin/categories`): Modal-based create/edit/delete
- **SEO Settings** (`/admin/seo`): Site title/description, GA ID, robots.txt editor, indexing toggle

### Platform
- Bilingual EN/AR with RTL layout toggle (stored in localStorage)
- Click tracking on every CTA → increments `clickCount`, records in `clicks` table
- XML sitemap auto-generated from active offers + categories
- robots.txt dynamically served (respects `allowIndexing` setting)

---

## User Preferences

- Dark gold theme (slate-900 background, amber/gold primary)
- Arabic font: Cairo; English font: Inter
- No emojis in UI copy (only category icons from DB)
- Project will run on shared hosting (cPanel + Passenger)

---

## Admin Credentials

- Username: `admin`
- Password: `admin123`
- **Change before going live!**

---

## Gotchas

- `GetOfferBySlugParams` has path param only (no `lang` query param) — spec fix from TS2308 collision
- Express 5 uses `path-to-regexp` v8: use `/{*path}` not `*` for wildcard routes
- `useAdminMe` requires `queryKey` in its query options
- `useAdminLogout` takes `void` → cast as `undefined as unknown as void`
- Run `pnpm run typecheck:libs` before running server typecheck (libs must be built first)
- Do NOT run `pnpm dev` at workspace root — use workflows
- Build requires `BASE_PATH=/` env var for the frontend in production

---

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- API rate limits: 300 req/15min (general), 20 req/min (clicks)
- Static file serving is auto-detected in `app.ts` — no config needed if paths match
