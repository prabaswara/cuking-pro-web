import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, user } from "@/db/schema";
import { ApiError } from "@/lib/api-error";

export type ProfileRow = typeof profiles.$inferSelect;

/** Profil dibuat lewat hook Better Auth; ini jaring pengaman untuk data lama. */
export async function getOrCreateProfile(userId: string): Promise<ProfileRow> {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(profiles)
    .values({ userId })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Profil tidak ditemukan.");
  }

  return row;
}

export async function getAccount(userId: string) {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Akun tidak ditemukan.");
  }

  return row;
}

/** Nama tampilan untuk riwayat kepemilikan: kennel, lalu nama pengguna. */
export async function getOwnerDisplayName(userId: string): Promise<string> {
  const [row] = await db
    .select({ kennelName: profiles.kennelName, name: user.name })
    .from(user)
    .leftJoin(profiles, eq(profiles.userId, user.id))
    .where(eq(user.id, userId))
    .limit(1);

  return row?.kennelName?.trim() || row?.name || "Pengguna";
}
