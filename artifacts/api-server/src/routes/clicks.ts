import { Router } from "express";
import { db } from "@workspace/db";
import { clicksTable, offersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { TrackClickBody } from "@workspace/api-zod";

const router = Router();

// POST /clicks/track
router.post("/track", async (req, res) => {
  const parsed = TrackClickBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { offerId, referrer, userAgent } = parsed.data;

  // Fetch offer to get affiliate URL
  const [offer] = await db
    .select()
    .from(offersTable)
    .where(eq(offersTable.id, offerId))
    .limit(1);

  if (!offer) return res.status(404).json({ error: "Offer not found" });

  // Record click asynchronously
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.socket.remoteAddress ?? "";

  // Insert click record
  await db.insert(clicksTable).values({
    offerId,
    referrer: referrer ?? null,
    userAgent: userAgent ?? null,
    ip,
  });

  // Increment click count on offer
  await db
    .update(offersTable)
    .set({ clickCount: sql`${offersTable.clickCount} + 1` })
    .where(eq(offersTable.id, offerId));

  return res.json({ affiliateUrl: offer.affiliateUrl });
});

export default router;
