import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { db, offersTable, categoriesTable, seoSettingsTable } from "@workspace/db";
import { and, desc, eq, ilike, sql } from "drizzle-orm";

const app: Express = express();

// express-rate-limit expects `trust proxy` to match when `X-Forwarded-For` exists.
// When running behind a reverse proxy (shared hosting / CDN), enable it.
const trustProxyRaw = process.env.TRUST_PROXY;
const trustProxy: boolean =
  trustProxyRaw === undefined || trustProxyRaw.trim() === ""
    ? true
    : trustProxyRaw === "false"
      ? false
      : true;

logger.info(
  { TRUST_PROXY_RAW: trustProxyRaw, trustProxy },
  "trust proxy configuration",
);

app.set("trust proxy", trustProxy);

// ── Security headers ────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ── Request logger ───────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// ── API rate limiting ────────────────────────────────────────────────────────
// Rate-limit API endpoints, but never throttle SEO assets (sitemap/robots)
// or crawlers will waste crawl budget / get 429s.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip(req) {
    // Mounted at /api, so /api/seo/* => req.path starts with "/seo"
    return typeof req.path === "string" && req.path.startsWith("/seo/");
  },
  message: { error: "Too many requests, please try again later." },
});

const clickLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many clicks, please slow down." },
});

app.use("/api", apiLimiter);
app.use("/api/clicks", clickLimiter);

// ── API routes ────────────────────────────────────────────────────────────────
// API routes
app.use("/api", router);

// SEO standard endpoints expected by crawlers:
// Your React SPA fallback would otherwise serve `index.html` for these.
// Redirect them to the API versions.
app.get("/sitemap.xml", (_req, res) => {
  res.redirect(302, "/api/seo/sitemap.xml");
});

// Robots sitemap endpoints (standard for crawlers)
app.get("/robots.txt", (_req, res) => {
  res.redirect(302, "/api/seo/robots.txt");
});

// ── Dynamic rendering for crawlers (not humans) ──────────────────────────────
const BOT_UA_REGEX =
  /(googlebot|bingbot|yandex(bot)?|duckduckbot|baiduspider|sogou|exabot|facebot|facebookexternalhit|twitterbot|linkedinbot|pinterest|semrushbot|ahrefsbot|mj12bot|rambler|applebot|chrome-lighthouse)/i;

function isCrawler(req: express.Request) {
  const ua = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : "";
  return BOT_UA_REGEX.test(ua);
}

function stripTags(input: string) {
  return input.replace(/<[^>]*>/g, "");
}

function safeText(input: unknown) {
  if (input === null || input === undefined) return "";
  return stripTags(String(input));
}

function getFirstQueryValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function buildPage({
  title,
  description,
  body,
}: {
  title: string;
  description?: string;
  body: string;
}) {
  const desc = description ? safeText(description) : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${safeText(title)}</title>
${desc ? `<meta name="description" content="${desc}"/>` : ""}
</head>
<body>
${body}
</body>
</html>`;
}

// Minimal HTML for better indexing than “SPA-only skeleton”
// Minimal deterministic HTML so bots can index without waiting for React JS.
async function renderHomeHtml() {
  const [seoRows, featured, categories] = await Promise.all([
    db.select().from(seoSettingsTable).limit(1),
    db
      .select({
        slug: offersTable.slug,
        title: offersTable.title,
        seoTitle: offersTable.seoTitle,
      })
      .from(offersTable)
      .where(eq(offersTable.isActive, true))
      .orderBy(desc(offersTable.sortOrder), desc(offersTable.createdAt))
      .limit(6),
    db
      .select({
        slug: categoriesTable.slug,
        name: categoriesTable.name,
      })
      .from(categoriesTable)
      .orderBy(desc(categoriesTable.createdAt))
      .limit(12),
  ]);

  const settings = seoRows?.[0];

  const body = `
  <h1>Affiliate Offers</h1>
  <section>
    <h2>Featured</h2>
    <ul>
      ${featured
      .map(
        (o) =>
          `<li><a href="/offer/${o.slug}">${safeText(o.seoTitle ?? o.title)}</a></li>`,
      )
      .join("")}
    </ul>
  </section>
  <section>
    <h2>Categories</h2>
    <ul>
      ${categories
      .map((c) => `<li><a href="/category/${c.slug}">${safeText(c.name)}</a></li>`)
      .join("")}
    </ul>
  </section>
  `;

  return buildPage({
    title: settings?.siteTitle ?? "Best Affiliate Offers",
    description:
      settings?.siteDescription ?? "Discover top affiliate offers and bonuses.",
    body,
  });
}

async function renderOffersHtml(req: express.Request) {
  const page = Math.max(1, Number(getFirstQueryValue(req.query.page) ?? "1") || 1);
  const limit = Math.max(1, Math.min(50, Number(getFirstQueryValue(req.query.limit) ?? "12") || 12));
  const offset = (page - 1) * limit;

  const categoryIdRaw = getFirstQueryValue(req.query.categoryId);
  const search = getFirstQueryValue(req.query.search);
  const featured = getFirstQueryValue(req.query.featured);
  const trending = getFirstQueryValue(req.query.trending);

  const whereClauses: any[] = [];
  whereClauses.push(eq(offersTable.isActive, true));

  if (categoryIdRaw) {
    const id = Number(categoryIdRaw);
    if (!Number.isNaN(id)) whereClauses.push(eq(offersTable.categoryId, id));
  }
  if (search) {
    // Keep it lightweight for bots: LIKE is enough.
    whereClauses.push(sql`${offersTable.title} LIKE ${`%${search}%`}`);
  }
  if (featured === "true") whereClauses.push(eq(offersTable.isFeatured, true));
  if (trending === "true") whereClauses.push(eq(offersTable.isTrending, true));

  const where =
    whereClauses.length === 1 ? whereClauses[0] : and(...whereClauses);

  const rows = await db
    .select({
      slug: offersTable.slug,
      title: offersTable.title,
      seoTitle: offersTable.seoTitle,
      seoTitleAr: offersTable.seoTitleAr,
    })
    .from(offersTable)
    .where(where)
    .limit(limit)
    .offset(offset);

  const offers = (rows ?? []).map((o: any) => ({
    slug: o.slug,
    title: o.seoTitle ?? o.title,
  }));

  const body = `
  <h1>Offers</h1>
  <ul>
    ${offers.map((o: any) => `<li><a href="/offer/${o.slug}">${safeText(o.title)}</a></li>`).join("")}
  </ul>
  `;

  return buildPage({
    title: "Offers",
    description: "Browse affiliate offers.",
    body,
  });
}

// Category HTML for bots (Drizzle syntax: use eq(...) + select real columns from schema)
async function renderCategoryHtml(req: express.Request, slug: string) {
  const [category] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, slug))
    .limit(1);

  if (!category) {
    return buildPage({ title: "Category not found", body: "<h1>Not found</h1>" });
  }

  const offers = await db
    .select({ slug: offersTable.slug, title: offersTable.title, seoTitle: offersTable.seoTitle })
    .from(offersTable)
    .where(eq(offersTable.isActive, true))
    .limit(50);

  const body = `
  <h1>${safeText(category.name)}</h1>
  <ul>
    ${offers.map((o: any) => `<li><a href="/offer/${o.slug}">${safeText(o.seoTitle ?? o.title)}</a></li>`).join("")}
  </ul>
  `;

  return buildPage({
    title: category.name,
    description: category.description ?? undefined,
    body,
  });
}

// Offer HTML for bots (Drizzle syntax: use eq(...) + where(...) once)
async function renderOfferHtml(req: express.Request, slug: string) {
  const [offer] = await db
    .select()
    .from(offersTable)
    .where(and(eq(offersTable.isActive, true), eq(offersTable.slug, slug)))
    .limit(1);

  if (!offer) {
    return buildPage({ title: "Offer not found", body: "<h1>Not found</h1>" });
  }

  const title = offer.seoTitle ?? offer.title;
  const description = offer.seoDescription ?? offer.shortDescription ?? undefined;

  const body = `
  <article>
    <h1>${safeText(title)}</h1>
    <p>${safeText(description ?? "")}</p>
    <p><a href="${safeText(offer.affiliateUrl)}" target="_blank" rel="noopener noreferrer">Claim / Visit</a></p>
  </article>
  `;

  return buildPage({ title, description, body });
}

// Serve bot HTML for SEO-critical routes
app.get("/", async (req, res, next) => {
  if (!isCrawler(req)) return next();
  try {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(await renderHomeHtml());
  } catch (e) {
    next(e);
  }
});

app.get("/offers", async (req, res, next) => {
  if (!isCrawler(req)) return next();
  try {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(await renderOffersHtml(req));
  } catch (e) {
    next(e);
  }
});

app.get("/category/:slug", async (req, res, next) => {
  if (!isCrawler(req)) return next();
  try {
    const slug = String(req.params.slug ?? "");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(await renderCategoryHtml(req, slug));
  } catch (e) {
    next(e);
  }
});

app.get("/offer/:slug", async (req, res, next) => {
  if (!isCrawler(req)) return next();
  try {
    const slug = String(req.params.slug ?? "");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(await renderOfferHtml(req, slug));
  } catch (e) {
    next(e);
  }
});

// ── Global error handler (log underlying DB/Postgres errors) ────────────────
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    // Drizzle/pg often nests the real error inside `cause`
    const anyErr = err as { message?: string; cause?: unknown };
    logger.error(
      { err: anyErr, cause: anyErr?.cause, message: anyErr?.message },
      "Unhandled request error",
    );

    if (res.headersSent) return;

    res.status(500).json({ error: "Internal Server Error" });
  },
);

// ── Serve frontend static files in production ─────────────────────────────────
// Shared hosting: Express serves both the API and the built React SPA
const staticDir = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : path.resolve(import.meta.dirname ?? __dirname, "..", "..", "affiliate-site", "dist", "public");

if (existsSync(staticDir)) {
  logger.info({ staticDir }, "Serving static frontend");
  app.use(express.static(staticDir, { maxAge: "1d", etag: true }));

  // SPA fallback: serve index.html for all non-API routes (Express 5 syntax)
  app.get("/{*path}", (_req, res) => {
    const indexHtml = path.join(staticDir, "index.html");
    if (existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.status(404).json({ error: "Frontend not built. Run: pnpm build:frontend" });
    }
  });
}

export default app;
