import app from "./app";
import { logger } from "./lib/logger";
import { ensureAdminUsers } from "./lib/ensureAdminUsers";

// PORT is optional — falls back to 3000 for shared hosting / Passenger
const rawPort = process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  // Create/ensure required admin table + admin row (from ADMIN_USERNAME/ADMIN_PASSWORD)
  // before accepting requests.
  await ensureAdminUsers();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info(
      { port, env: process.env.NODE_ENV ?? "development" },
      "Server listening",
    );
  });
}

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
