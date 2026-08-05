import mysql from "mysql2/promise";
import config from "../config";

const DEFAULT_MAX_ATTEMPTS = 30;
const DEFAULT_RETRY_DELAY_MS = 2000;

const sleep = async (delayMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, delayMs));

const getMaxAttempts = (): number => {
  const value = Number(process.env.DB_WAIT_MAX_ATTEMPTS || DEFAULT_MAX_ATTEMPTS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_ATTEMPTS;
};

const getRetryDelayMs = (): number => {
  const value = Number(process.env.DB_WAIT_RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_RETRY_DELAY_MS;
};

export async function waitForDatabase(): Promise<void> {
  const maxAttempts = getMaxAttempts();
  const retryDelayMs = getRetryDelayMs();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const connection = await mysql.createConnection({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.name,
      });

      await connection.ping();
      await connection.end();
      console.log(`✅ Database is ready after ${attempt} attempt(s)`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `Database not ready yet (attempt ${attempt}/${maxAttempts}): ${message}`
      );

      if (attempt === maxAttempts) {
        throw new Error(
          `Database did not become ready after ${maxAttempts} attempts`
        );
      }

      await sleep(retryDelayMs);
    }
  }
}

if (require.main === module) {
  waitForDatabase().catch((error) => {
    console.error("❌ Failed waiting for database:", error);
    process.exitCode = 1;
  });
}