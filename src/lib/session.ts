import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

/** Sesi aktif atau null. Dipakai di server component maupun route handler. */
export async function getSession() {
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
