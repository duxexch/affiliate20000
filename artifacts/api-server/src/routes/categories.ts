import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, offersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  CreateCategoryBody,
  UpdateCategoryParams,
  UpdateCategoryBody,
  DeleteCategoryParams,
} from "@workspace/api-zod";

const router = Router();

// GET /categories
router.get("/", async (req, res) => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);

  const withCounts = await Promise.all(
    cats.map(async (cat) => {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(offersTable)
        .where(
          and(eq(offersTable.categoryId, cat.id), eq(offersTable.isActive, true))
        );
      return { ...cat, offerCount: Number(result?.count ?? 0) };
    })
  );
  return res.json(withCounts);
});

// POST /categories (admin)
router.post("/", async (req, res) => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
  return res.status(201).json({ ...cat, offerCount: 0 });
});

// PATCH /categories/:id (admin)
router.patch("/:id", async (req, res) => {
  const params = UpdateCategoryParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateCategoryBody.safeParse(req.body);
  if (!params.success || !body.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const [updated] = await db
    .update(categoriesTable)
    .set(body.data)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(offersTable)
    .where(and(eq(offersTable.categoryId, updated.id), eq(offersTable.isActive, true)));

  return res.json({ ...updated, offerCount: Number(result?.count ?? 0) });
});

// DELETE /categories/:id (admin)
router.delete("/:id", async (req, res) => {
  const parsed = DeleteCategoryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid params" });

  await db.delete(categoriesTable).where(eq(categoriesTable.id, parsed.data.id));
  return res.status(204).send();
});

export default router;
