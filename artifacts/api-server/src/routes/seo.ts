import { Router } from "express";
import { db } from "@workspace/db";
import { seoSettingsTable, offersTable, categoriesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { UpdateSeoSettingsBody } from "@workspace/api-zod";

const router = Router();

async function getOrCreateSettings() {
  const [existing] = await db.select().from(seoSettingsTable).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(seoSettingsTable).values({}).returning();
  return created;
}

// GET /api/seo/settings
router.get("/settings", async (req, res) => {
  const settings = await getOrCreateSettings();
  return res.json(settings);
});

// PATCH /api/seo/settings (admin)
router.patch("/settings", async (req, res) => {
  const parsed = UpdateSeoSettingsBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const settings = await getOrCreateSettings();
  const [updated] = await db
    .update(seoSettingsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(seoSettingsTable.id, settings.id))
    .returning();
  return res.json(updated);
});

// GET /api/seo/robots.txt  — returns the robots.txt content as plain text
router.get("/robots.txt", async (req, res) => {
  const settings = await getOrCreateSettings();
  const siteUrl = process.env.SITE_URL ?? "";
  let content: string;

  if (!settings.allowIndexing) {
    content = "User-agent: *\nDisallow: /\n";
  } else {
    content = settings.robotsTxt ?? "User-agent: *\nAllow: /\n";
    if (siteUrl && !content.includes("Sitemap:")) {
      content += `\nSitemap: ${siteUrl}/sitemap.xml\n`;
    }
  }
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.send(content);
});

// GET /api/seo/sitemap.xml — returns a proper XML sitemap
router.get("/sitemap.xml", async (req, res) => {
  const baseUrl = process.env.SITE_URL ?? (
    req.headers.host ? `${req.protocol}://${req.headers.host}` : "https://example.com"
  );

  const [offers, categories] = await Promise.all([
    db
      .select({ slug: offersTable.slug, updatedAt: offersTable.updatedAt, createdAt: offersTable.createdAt })
      .from(offersTable)
      .where(eq(offersTable.isActive, true))
      .orderBy(desc(offersTable.updatedAt)),
    db.select({ slug: categoriesTable.slug }).from(categoriesTable),
  ]);

  const today = new Date().toISOString().split("T")[0];

  const urls = [
    `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>`,
    `  <url><loc>${baseUrl}/offers</loc><changefreq>daily</changefreq><priority>0.9</priority><lastmod>${today}</lastmod></url>`,
    ...categories.map(
      (c) =>
        `  <url><loc>${baseUrl}/category/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ),
    ...offers.map((o) => {
      const lastmod = (o.updatedAt ?? o.createdAt)?.toISOString().split("T")[0] ?? today;
      return `  <url><loc>${baseUrl}/offer/${o.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority><lastmod>${lastmod}</lastmod></url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  return res.send(xml);
});

// GET /api/seo/sitemap — returns JSON (legacy, for admin preview)
router.get("/sitemap", async (req, res) => {
  const baseUrl = process.env.SITE_URL ?? "https://example.com";
  const [offers, categories] = await Promise.all([
    db
      .select({ slug: offersTable.slug, updatedAt: offersTable.updatedAt, createdAt: offersTable.createdAt })
      .from(offersTable)
      .where(eq(offersTable.isActive, true))
      .orderBy(desc(offersTable.updatedAt)),
    db.select({ slug: categoriesTable.slug }).from(categoriesTable),
  ]);
  const entries = [
    { url: `${baseUrl}/`, priority: 1.0, changefreq: "daily" },
    { url: `${baseUrl}/offers`, priority: 0.9, changefreq: "daily" },
    ...categories.map((c) => ({ url: `${baseUrl}/category/${c.slug}`, priority: 0.8, changefreq: "weekly" })),
    ...offers.map((o) => ({
      url: `${baseUrl}/offer/${o.slug}`,
      priority: 0.7,
      changefreq: "weekly",
      lastmod: (o.updatedAt ?? o.createdAt)?.toISOString().split("T")[0] ?? null,
    })),
  ];
  return res.json(entries);
});

export default router;
