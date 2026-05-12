import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable, categoriesTable } from "@workspace/db";
import { eq, desc, ilike, and, sql } from "drizzle-orm";
import {
  ListOffersQueryParams,
  GetOfferBySlugParams,
  GetOfferParams,
  UpdateOfferParams,
  UpdateOfferBody,
  DeleteOfferParams,
  CreateOfferBody,
} from "@workspace/api-zod";

const router = Router();

// Helper to attach category to offers
async function attachCategory(offer: typeof offersTable.$inferSelect) {
  if (!offer.categoryId) return { ...offer, category: null };
  const [cat] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, offer.categoryId))
    .limit(1);
  const offerCount = cat
    ? (
        await db
          .select({ count: sql<number>`count(*)` })
          .from(offersTable)
          .where(
            and(
              eq(offersTable.categoryId, cat.id),
              eq(offersTable.isActive, true)
            )
          )
      )[0]?.count ?? 0
    : 0;
  return {
    ...offer,
    category: cat ? { ...cat, offerCount: Number(offerCount) } : null,
  };
}

// GET /offers
router.get("/", async (req, res) => {
  const parsed = ListOffersQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid params" });

  const { page = 1, limit = 12, categoryId, search, featured, trending } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(offersTable.isActive, true)];
  if (categoryId) conditions.push(eq(offersTable.categoryId, categoryId));
  if (search) conditions.push(ilike(offersTable.title, `%${search}%`));
  if (featured === true) conditions.push(eq(offersTable.isFeatured, true));
  if (trending === true) conditions.push(eq(offersTable.isTrending, true));

  const where = and(...conditions);

  const [totalResult, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(offersTable).where(where),
    db
      .select()
      .from(offersTable)
      .where(where)
      .orderBy(desc(offersTable.sortOrder), desc(offersTable.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  const offers = await Promise.all(rows.map(attachCategory));

  return res.json({
    offers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /offers/featured
router.get("/featured", async (req, res) => {
  const limit = Number(req.query.limit) || 6;
  const rows = await db
    .select()
    .from(offersTable)
    .where(and(eq(offersTable.isActive, true), eq(offersTable.isFeatured, true)))
    .orderBy(desc(offersTable.sortOrder))
    .limit(limit);
  const offers = await Promise.all(rows.map(attachCategory));
  return res.json(offers);
});

// GET /offers/trending
router.get("/trending", async (req, res) => {
  const limit = Number(req.query.limit) || 6;
  const rows = await db
    .select()
    .from(offersTable)
    .where(and(eq(offersTable.isActive, true), eq(offersTable.isTrending, true)))
    .orderBy(desc(offersTable.clickCount))
    .limit(limit);
  const offers = await Promise.all(rows.map(attachCategory));
  return res.json(offers);
});

// GET /offers/slug/:slug
router.get("/slug/:slug", async (req, res) => {
  const parsed = GetOfferBySlugParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid params" });

  const [offer] = await db
    .select()
    .from(offersTable)
    .where(eq(offersTable.slug, parsed.data.slug))
    .limit(1);

  if (!offer) return res.status(404).json({ error: "Not found" });
  const withCat = await attachCategory(offer);
  return res.json(withCat);
});

// GET /offers/:id
router.get("/:id", async (req, res) => {
  const parsed = GetOfferParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid params" });

  const [offer] = await db
    .select()
    .from(offersTable)
    .where(eq(offersTable.id, parsed.data.id))
    .limit(1);

  if (!offer) return res.status(404).json({ error: "Not found" });
  const withCat = await attachCategory(offer);
  return res.json(withCat);
});

// POST /offers (admin)
router.post("/", async (req, res) => {
  const parsed = CreateOfferBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const [offer] = await db
    .insert(offersTable)
    .values({ ...parsed.data, updatedAt: new Date() })
    .returning();
  const withCat = await attachCategory(offer);
  return res.status(201).json(withCat);
});

// PATCH /offers/:id (admin)
router.patch("/:id", async (req, res) => {
  const params = UpdateOfferParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateOfferBody.safeParse(req.body);
  if (!params.success || !body.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const [updated] = await db
    .update(offersTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(offersTable.id, params.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  const withCat = await attachCategory(updated);
  return res.json(withCat);
});

// DELETE /offers/:id (admin)
router.delete("/:id", async (req, res) => {
  const parsed = DeleteOfferParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid params" });

  await db.delete(offersTable).where(eq(offersTable.id, parsed.data.id));
  return res.status(204).send();
});

export default router;
