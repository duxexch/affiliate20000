import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// express-rate-limit expects `trust proxy` to match when `X-Forwarded-For` exists.
// When running behind a reverse proxy (shared hosting / CDN), enable it.
const trustProxyRaw = process.env.TRUST_PROXY;
const trustProxy: boolean | number =
  trustProxyRaw === undefined
    ? process.env.NODE_ENV === "production"
    : trustProxyRaw === "true"
      ? true
      : trustProxyRaw === "false"
        ? false
        : Number.isNaN(Number(trustProxyRaw))
          ? true
          : Number(trustProxyRaw);

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
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
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
app.use("/api", router);

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
