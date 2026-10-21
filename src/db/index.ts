import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL belum diatur. Salin .env.example ke .env lalu isi DATABASE_URL.",
  );
}

/**
 * Reuse koneksi saat dev (HMR) agar tidak menghabiskan pool PostgreSQL.
 * Pola mengikuti dokumentasi Drizzle untuk postgres-js.
 */
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle({ client, schema });
export { client as pgClient };
