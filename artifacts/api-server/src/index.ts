import app from "./app";
import { logger } from "./lib/logger";

// PORT is optional — falls back to 3000 for shared hosting / Passenger
const rawPort = process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port, env: process.env.NODE_ENV ?? "development" }, "Server listening");
});
