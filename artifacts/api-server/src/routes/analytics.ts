import { Router } from "express";
import { db } from "@workspace/db";
import { clicksTable, offersTable, categoriesTable } from "@workspace/db";
import { sql, desc, eq, gte } from "drizzle-orm";
import { GetTopOffersQueryParams, GetClicksOverTimeQueryParams } from "@workspace/api-zod";

const router = Router();

// GET /analytics/dashboard
router.get("/dashboard", async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOffersResult,
    totalClicksResult,
    totalCategoriesResult,
    clicksTodayResult,
    clicksWeekResult,
    clicksMonthResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(offersTable),
    db.select({ count: sql<number>`count(*)` }).from(clicksTable),
    db.select({ count: sql<number>`count(*)` }).from(categoriesTable),
    db.select({ count: sql<number>`count(*)` }).from(clicksTable).where(gte(clicksTable.createdAt, todayStart)),
    db.select({ count: sql<number>`count(*)` }).from(clicksTable).where(gte(clicksTable.createdAt, weekStart)),
    db.select({ count: sql<number>`count(*)` }).from(clicksTable).where(gte(clicksTable.createdAt, monthStart)),
  ]);

  return res.json({
    totalOffers: Number(totalOffersResult[0]?.count ?? 0),
    totalClicks: Number(totalClicksResult[0]?.count ?? 0),
    totalCategories: Number(totalCategoriesResult[0]?.count ?? 0),
    clicksToday: Number(clicksTodayResult[0]?.count ?? 0),
    clicksThisWeek: Number(clicksWeekResult[0]?.count ?? 0),
    clicksThisMonth: Number(clicksMonthResult[0]?.count ?? 0),
  });
});

// GET /analytics/top-offers
router.get("/top-offers", async (req, res) => {
  const parsed = GetTopOffersQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;
  const days = parsed.success ? (parsed.data.days ?? 30) : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await db
    .select({
      offerId: clicksTable.offerId,
      totalClicks: sql<number>`count(*)`,
    })
    .from(clicksTable)
    .where(gte(clicksTable.createdAt, since))
    .groupBy(clicksTable.offerId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  const withOffers = await Promise.all(
    results.map(async (r) => {
      const [offer] = await db
        .select()
        .from(offersTable)
        .where(eq(offersTable.id, r.offerId))
        .limit(1);
      return {
        offerId: r.offerId,
        title: offer?.title ?? "Unknown",
        slug: offer?.slug ?? "",
        imageUrl: offer?.imageUrl ?? "",
        totalClicks: Number(r.totalClicks),
      };
    })
  );

  return res.json(withOffers);
});

// GET /analytics/clicks-over-time
router.get("/clicks-over-time", async (req, res) => {
  const parsed = GetClicksOverTimeQueryParams.safeParse(req.query);
  const days = parsed.success ? (parsed.data.days ?? 30) : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await db
    .select({
      date: sql<string>`date(${clicksTable.createdAt})`,
      clicks: sql<number>`count(*)`,
    })
    .from(clicksTable)
    .where(gte(clicksTable.createdAt, since))
    .groupBy(sql`date(${clicksTable.createdAt})`)
    .orderBy(sql`date(${clicksTable.createdAt})`);

  return res.json(results.map((r) => ({ date: r.date, clicks: Number(r.clicks) })));
});

export default router;
