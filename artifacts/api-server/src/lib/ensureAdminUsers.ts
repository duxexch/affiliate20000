import bcrypt from "bcryptjs";
import { pool } from "@workspace/db";
import { logger } from "./logger";

const ADMIN_USERNAME_ENV = "ADMIN_USERNAME";
const ADMIN_PASSWORD_ENV = "ADMIN_PASSWORD";
const ADMIN_BCRYPT_SALT_ROUNDS_ENV = "ADMIN_BCRYPT_SALT_ROUNDS";

const DEFAULT_BCRYPT_SALT_ROUNDS = 10;

function getRequiredEnv(name: string): string | null {
    const value = process.env[name];
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
}

export async function ensureAdminUsers(): Promise<void> {
    const username = getRequiredEnv(ADMIN_USERNAME_ENV);
    const password = getRequiredEnv(ADMIN_PASSWORD_ENV);

    // If not configured, don't block the server.
    if (!username || !password) {
        logger.info(
            {
                hasAdminUsername: Boolean(username),
                hasAdminPassword: Boolean(password),
            },
            "Admin seeding skipped: ADMIN_USERNAME / ADMIN_PASSWORD not set",
        );
        return;
    }

    const saltRoundsRaw = process.env[ADMIN_BCRYPT_SALT_ROUNDS_ENV];
    const saltRounds = saltRoundsRaw ? Number(saltRoundsRaw) : DEFAULT_BCRYPT_SALT_ROUNDS;

    if (!Number.isFinite(saltRounds) || saltRounds <= 0) {
        throw new Error(
            `Invalid ${ADMIN_BCRYPT_SALT_ROUNDS_ENV}: "${saltRoundsRaw}"`,
        );
    }

    try {
        // Ensure table exists (matches lib/db/src/schema/adminUsers.ts expectation)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS public.admin_users (
        id serial PRIMARY KEY,
        username text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role text NOT NULL DEFAULT 'admin',
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

        // Always upsert the admin row so the stored hash matches bcryptjs.compare.
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const before = await pool.query(
            `SELECT password_hash FROM public.admin_users WHERE username = $1 LIMIT 1;`,
            [username],
        );
        const beforeHash = before.rows?.[0]?.password_hash as string | undefined;

        await pool.query(
            `
      INSERT INTO public.admin_users (username, password_hash, role)
      VALUES ($1, $2, 'admin')
      ON CONFLICT (username)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role;
      `,
            [username, passwordHash],
        );

        const after = await pool.query(
            `SELECT password_hash FROM public.admin_users WHERE username = $1 LIMIT 1;`,
            [username],
        );
        const afterHash = after.rows?.[0]?.password_hash as string | undefined;

        const updated = Boolean(beforeHash && afterHash && beforeHash !== afterHash);

        logger.info(
            {
                username,
                hasPasswordHashBefore: Boolean(beforeHash),
                hasPasswordHashAfter: Boolean(afterHash),
                updated,
            },
            "Admin seeding ensured admin_users row (password_hash update check)",
        );
    } catch (err) {
        logger.error({ err }, "Admin seeding failed");
        throw err;
    }
}
