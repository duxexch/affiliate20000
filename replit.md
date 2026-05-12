# AffiliateDeals

A production-ready affiliate marketing platform for sports betting and casino offers, supporting Arabic (RTL) and English bilingual content with full admin panel, click tracking, and SEO analytics.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/affiliate-site run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, wouter, TanStack Query, Recharts, lucide-react
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/` — generated hooks + Zod schemas (do not edit)
- `lib/db/src/schema/index.ts` — Drizzle DB schema (source of truth)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/affiliate-site/src/` — React frontend
  - `pages/` — all route pages (Home, Offers, OfferDetail, Category, admin/*)
  - `components/` — shared UI (Navbar, Footer, OfferCard, AdminLayout, etc.)
  - `contexts/LanguageContext.tsx` — EN/AR bilingual context
  - `hooks/` — use-seo, use-admin-auth, use-toast

## Architecture decisions

- Contract-first API: OpenAPI spec → codegen → typed hooks. Never write fetch calls manually.
- Click tracking: frontend calls `useTrackClick()` on CTA click, backend returns `affiliateUrl`, frontend opens it in new tab.
- Admin auth: httpOnly cookie `admin_session` (base64 JSON). `useAdminAuth()` hook redirects to `/admin/login` if 401.
- RTL: `dir="rtl"` applied to `<html>` when `language === "ar"`, Cairo font loads automatically via CSS `[dir="rtl"]` selector.
- All offers have bilingual fields (`title`/`titleAr`, `shortDescription`/`shortDescriptionAr`, etc.) — `t(en, ar)` helper picks the right one.

## Product

- **Homepage**: hero banner, featured offers grid, trending offers, category quick-nav, paginated all-offers section
- **Offers page** (`/offers`): search + category filter, paginated grid
- **Offer detail** (`/offer/:slug`): image, rating stars, description, sticky CTA sidebar, trust badges, FAQ, related offers
- **Category page** (`/category/:slug`): filtered offers with breadcrumbs
- **Admin panel** (`/admin`): dashboard with stats + charts, offers CRUD, categories CRUD, SEO settings
- Bilingual EN/AR with RTL layout toggle in navbar

## User preferences

- Dark gold theme (slate-900 background, amber primary)
- No emojis in UI (except category icons from DB data)
- Arabic font: Cairo; English font: Inter

## Gotchas

- The `GetOfferBySlugParams` has path param only (no `lang` query param) — spec fix from TS2308 collision
- Admin logout mutation takes `void` argument — cast as `undefined as unknown as void`
- Do NOT run `pnpm dev` at workspace root — use workflows
- `useAdminMe` requires `queryKey` in its query options

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Admin credentials: username=`admin`, password=`admin123`
