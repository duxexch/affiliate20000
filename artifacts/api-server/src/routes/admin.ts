import { Router } from "express";
import { db } from "@workspace/db";
import { adminUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AdminLoginBody } from "@workspace/api-zod";

const router = Router();

// Simple session-based auth using cookie
function getSessionUserId(req: { cookies?: Record<string, string> }): number | null {
  const raw = req.cookies?.admin_session;
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded) as { id: number; expires: number };
    if (Date.now() > parsed.expires) return null;
    return parsed.id;
  } catch {
    return null;
  }
}

function createSessionToken(id: number): string {
  const payload = { id, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 }; // 7 days
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

// POST /admin/login
router.post("/login", async (req, res) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, username))
    .limit(1);

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = createSessionToken(user.id);

  res.cookie("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return res.json({
    success: true,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// POST /admin/logout
router.post("/logout", (req, res) => {
  res.clearCookie("admin_session", { path: "/" });
  return res.json({ success: true });
});

// GET /admin/me
router.get("/me", async (req, res) => {
  const userId = getSessionUserId(req as Parameters<typeof getSessionUserId>[0]);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, userId))
    .limit(1);

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  return res.json({ id: user.id, username: user.username, role: user.role });
});

export default router;
