/**
 * PostgreSQL Database Client
 *
 * Handles connection pooling and query execution
 */

import { Pool, QueryResult } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  console.warn(
    "Warning: DATABASE_URL not set. Database operations will fail."
  );
}

// Connection pool for PostgreSQL
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export async function query<T = any>(
  text: string,
  values?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, values);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

export async function close(): Promise<void> {
  await pool.end();
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query("SELECT NOW()");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}
