import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS shares (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT,
        content TEXT,
        file_name TEXT,
        file_size BIGINT,
        mime_type TEXT,
        file_path TEXT,
        author_name TEXT NOT NULL DEFAULT 'Anonymous',
        download_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      )
    `);
    logger.info("Database migrations complete");
  } finally {
    client.release();
  }
}

runMigrations()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to run migrations");
    process.exit(1);
  });
