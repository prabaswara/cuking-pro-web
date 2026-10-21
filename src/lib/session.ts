import { headers } from "next/headers";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

/**
 * Sesi aktif atau null. Dipakai di server component maupun route handler.
 * `connection()` menandai pemanggil sebagai dinamis — mencegah Next
 * mencoba mem-prerender route handler yang membaca sesi.
 */
export async function getSession() {
  await connection();
  return auth.api.getSession({ headers: await headers() });
}

/** Sesi aktif; melempar ApiError 401 bila belum login. */
export async function requireSession() {
  const session = await getSession();

  if (!session) {
    throw new ApiError("UNAUTHORIZED", "Kamu harus masuk terlebih dahulu.");
  }

  return session;
}
