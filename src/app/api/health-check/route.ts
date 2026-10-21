import { sql } from "drizzle-orm";
import { db } from "@/db";
import { handleRouteError } from "@/lib/api-error";

/**
 * Health check (PRD Fase 0): `{ "ok": true }`.
 * Sekaligus memastikan koneksi PostgreSQL hidup.
 */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[health-check] database tidak dapat dihubungi:", error);
    return handleRouteError(error);
  }
}
