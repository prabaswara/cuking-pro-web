import { and, asc, count, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { catOwnershipHistory, cats, litters, matings } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { isFutureDate } from "@/lib/date";
import { assertCanAddCat } from "@/lib/plan";
import { getOwnerDisplayName } from "@/lib/profile";
import { syncPregnancyReminder } from "@/lib/reminders";
import type { CatRow } from "@/lib/cats";
import type { KittenCreateInput, LitterCreateInput } from "@/lib/validation/breeding";

/**
 * Kelahiran (FR-10): satu litter per catatan kawin, status kehamilan
 * menjadi "delivered", dan pengingat estimasi lahir ditutup.
 * Anak kucing adalah baris `cats` yang terhubung ke litter.
 */

export type LitterRow = typeof litters.$inferSelect;

export type KittenRow = {
  id: string;
  name: string;
  sex: "male" | "female";
  breed: string | null;
  color: string | null;
  birthDate: string | null;
  photoPath: string | null;
};

export type LitterDetails = LitterRow & {
  matingDate: string;
  outcome: string;
  queenName: string;
  sireName: string;
  kittens: KittenRow[];
};

const queen = alias(cats, "litter_queen");
const sire = alias(cats, "litter_sire");

async function getLitterRow(userId: string, litterId: string) {
  const [row] = await db
    .select({
      litter: litters,
      matingDate: matings.matingDate,
      outcome: matings.outcome,
      queenName: queen.name,
      queenNameManual: matings.queenNameManual,
      sireName: sire.name,
      sireNameManual: matings.sireNameManual,
    })
    .from(litters)
    .innerJoin(matings, eq(matings.id, litters.matingId))
    .leftJoin(queen, eq(queen.id, matings.queenId))
    .leftJoin(sire, eq(sire.id, matings.sireId))
    .where(and(eq(litters.id, litterId), eq(matings.ownerId, userId)))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Litter tidak ditemukan.");
  }

  return row;
}

export async function getLitter(
  userId: string,
  litterId: string,
): Promise<LitterDetails> {
  const row = await getLitterRow(userId, litterId);

  const kittens = await db
    .select({
      id: cats.id,
      name: cats.name,
      sex: cats.sex,
      breed: cats.breed,
      color: cats.color,
      birthDate: cats.birthDate,
      photoPath: cats.photoPath,
    })
    .from(cats)
    .where(and(eq(cats.ownerId, userId), eq(cats.litterId, litterId)))
    .orderBy(asc(cats.createdAt));

  return {
    ...row.litter,
    matingDate: row.matingDate,
    outcome: row.outcome,
    queenName: row.queenName ?? row.queenNameManual ?? "Betina luar",
    sireName: row.sireName ?? row.sireNameManual ?? "Pejantan luar",
    kittens,
  };
}

async function getMatingForLitter(userId: string, matingId: string) {
  const [row] = await db
    .select({
      mating: matings,
      litter: litters,
      queenName: queen.name,
      queenNameManual: matings.queenNameManual,
    })
    .from(matings)
    .leftJoin(litters, eq(litters.matingId, matings.id))
    .leftJoin(queen, eq(queen.id, matings.queenId))
    .where(and(eq(matings.id, matingId), eq(matings.ownerId, userId)))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Catatan kawin tidak ditemukan.");
  }

  return row;
}

export async function createLitter(
  userId: string,
  matingId: string,
  input: LitterCreateInput,
): Promise<LitterRow> {
  const { mating, litter } = await getMatingForLitter(userId, matingId);

  if (litter) {
    throw new ApiError(
      "CONFLICT",
      "Kelahiran untuk catatan kawin ini sudah pernah dicatat.",
    );
  }

  if (mating.outcome !== "pregnant") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Kelahiran hanya bisa dicatat untuk kehamilan berstatus Hamil.",
    );
  }

  if (isFutureDate(input.birthDate)) {
    throw new ApiError("VALIDATION_ERROR", "Tanggal tidak boleh di masa depan", {
      field: "birthDate",
    });
  }

  if (input.birthDate < mating.matingDate) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Tanggal lahir tidak boleh sebelum tanggal kawin",
      { field: "birthDate" },
    );
  }

  if (input.totalAlive > input.totalBorn) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Jumlah hidup tidak boleh lebih dari jumlah lahir",
      { field: "totalAlive" },
    );
  }

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(litters)
      .values({
        matingId,
        birthDate: input.birthDate,
        totalBorn: input.totalBorn,
        totalAlive: input.totalAlive,
        notes: input.notes ?? null,
      })
      .returning();

    await tx
      .update(matings)
      .set({ outcome: "delivered" })
      .where(and(eq(matings.id, matingId), eq(matings.ownerId, userId)));

    await syncPregnancyReminder(tx, {
      userId,
      catId: mating.queenId,
      matingId,
      title: "",
      dueDate: null,
    });

    return created;
  });
}

export async function addKitten(
  userId: string,
  litterId: string,
  input: KittenCreateInput,
): Promise<CatRow> {
  const row = await getLitterRow(userId, litterId);

  const [mating] = await db
    .select()
    .from(matings)
    .where(and(eq(matings.id, row.litter.matingId), eq(matings.ownerId, userId)))
    .limit(1);

  if (!mating) {
    throw new ApiError("NOT_FOUND", "Catatan kawin tidak ditemukan.");
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(cats)
    .where(and(eq(cats.ownerId, userId), eq(cats.litterId, litterId)));

  if (Number(total) >= row.litter.totalAlive) {
    throw new ApiError(
      "CONFLICT",
      "Semua anak kucing yang hidup sudah didaftarkan untuk litter ini.",
    );
  }

  await assertCanAddCat(userId);

  const displayName = await getOwnerDisplayName(userId);

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(cats)
      .values({
        ownerId: userId,
        name: input.name,
        sex: input.sex,
        breed: input.breed ?? null,
        color: input.color ?? null,
        birthDate: row.litter.birthDate,
        photoPath: input.photoPath ?? null,
        sireId: mating.sireId ?? null,
        sireNameManual: mating.sireId ? null : mating.sireNameManual,
        damId: mating.queenId ?? null,
        damNameManual: mating.queenId ? null : mating.queenNameManual,
        litterId,
        notes: input.notes ?? null,
      })
      .returning();

    await tx.insert(catOwnershipHistory).values({
      catId: created.id,
      catName: created.name,
      ownerId: userId,
      ownerDisplayName: displayName,
      startedAt: new Date(),
      acquiredVia: "created",
    });

    return created;
  });
}

export async function countRegisteredKittens(
  userId: string,
  litterId: string,
): Promise<number> {
  await getLitterRow(userId, litterId);

  const [{ total }] = await db
    .select({ total: count() })
    .from(cats)
    .where(and(eq(cats.ownerId, userId), eq(cats.litterId, litterId)));

  return Number(total);
}

/** Daftar litter terbaru (dipakai ringkasan/tes). */
export async function listLitters(userId: string): Promise<LitterRow[]> {
  return db
    .select({ litter: litters })
    .from(litters)
    .innerJoin(matings, eq(matings.id, litters.matingId))
    .where(eq(matings.ownerId, userId))
    .orderBy(desc(litters.birthDate))
    .then((rows) => rows.map((row) => row.litter));
}
