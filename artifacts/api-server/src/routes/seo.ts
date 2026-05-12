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

// GET /seo/settings
router.get("/settings", async (req, res) => {
  const settings = await getOrCreateSettings();
  return res.json(settings);
});

// PATCH /seo/settings (admin)
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

// GET /seo/sitemap
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
    { url: `${baseUrl}/`, priority: 1.0, changefreq: "daily", lastmod: new Date().toISOString().split("T")[0] },
    { url: `${baseUrl}/offers`, priority: 0.9, changefreq: "daily", lastmod: new Date().toISOString().split("T")[0] },
    ...categories.map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      priority: 0.8,
      changefreq: "weekly",
      lastmod: null,
    })),
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
