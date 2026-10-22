import { and, asc, count, eq, getTableColumns } from "drizzle-orm";
import { db } from "@/db";
import { cats, studBookings, studServices } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { getCat } from "@/lib/cats";
import type {
  StudServiceCreateInput,
  StudServiceUpdateInput,
} from "@/lib/validation/stud";

/**
 * Profil pejantan pacak (FR-11). Semua akses memfilter `owner_id` dari sesi.
 * `cat_name` disimpan sebagai salinan agar data tetap terbaca setelah kucing
 * ditransfer pada fase berikutnya.
 */

export type StudServiceRow = typeof studServices.$inferSelect;

export type StudServiceWithCat = StudServiceRow & {
  catBreed: string | null;
  catColor: string | null;
  catPhotoPath: string | null;
  catStatus: "active" | "sold" | "deceased" | null;
  catTrackingStatus: "tracked" | "frozen" | null;
  isBookable: boolean;
};

export async function listStudServices(
  userId: string,
): Promise<StudServiceWithCat[]> {
  const rows = await db
    .select({
      ...getTableColumns(studServices),
      catBreed: cats.breed,
      catColor: cats.color,
      catPhotoPath: cats.photoPath,
      catStatus: cats.status,
      catTrackingStatus: cats.trackingStatus,
    })
    .from(studServices)
    .leftJoin(
      cats,
      and(eq(cats.id, studServices.catId), eq(cats.ownerId, userId)),
    )
    .where(eq(studServices.ownerId, userId))
    .orderBy(asc(studServices.catName));

  return rows.map((row) => ({
    ...row,
    isBookable:
      row.isAvailable &&
      Boolean(row.catId) &&
      row.catStatus === "active" &&
      row.catTrackingStatus === "tracked",
  }));
}

export async function getStudService(
  userId: string,
  serviceId: string,
): Promise<StudServiceWithCat> {
  const rows = await db
    .select({
      ...getTableColumns(studServices),
      catBreed: cats.breed,
      catColor: cats.color,
      catPhotoPath: cats.photoPath,
      catStatus: cats.status,
      catTrackingStatus: cats.trackingStatus,
    })
    .from(studServices)
    .leftJoin(
      cats,
      and(eq(cats.id, studServices.catId), eq(cats.ownerId, userId)),
    )
    .where(
      and(eq(studServices.id, serviceId), eq(studServices.ownerId, userId)),
    )
    .limit(1);

  if (!rows[0]) {
    throw new ApiError("NOT_FOUND", "Pejantan pacak tidak ditemukan.");
  }

  const row = rows[0];

  return {
    ...row,
    isBookable:
      row.isAvailable &&
      Boolean(row.catId) &&
      row.catStatus === "active" &&
      row.catTrackingStatus === "tracked",
  };
}

async function assertEligibleStudCat(userId: string, catId: string) {
  const cat = await getCat(userId, catId);

  if (cat.trackingStatus === "frozen") {
    throw new ApiError(
      "CAT_FROZEN",
      "Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk menjadikannya pejantan pacak.",
    );
  }

  if (cat.sex !== "male") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Pejantan pacak harus kucing jantan.",
      { field: "catId" },
    );
  }

  if (cat.status !== "active" || cat.trackingStatus !== "tracked") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Pilih kucing jantan yang aktif dan dilacak.",
      { field: "catId" },
    );
  }

  return cat;
}

function assertFee(feeAmount: number | null, feeDescription: string | null) {
  if (feeAmount == null && !feeDescription?.trim()) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Isi tarif nominal atau deskripsi tarif.",
      { field: "feeAmount" },
    );
  }

  if (feeAmount != null && feeAmount < 0) {
    throw new ApiError("VALIDATION_ERROR", "Tarif tidak boleh negatif.", {
      field: "feeAmount",
    });
  }
}

export async function createStudService(
  userId: string,
  input: StudServiceCreateInput,
): Promise<StudServiceRow> {
  const cat = await assertEligibleStudCat(userId, input.catId);

  const [existing] = await db
    .select({ id: studServices.id })
    .from(studServices)
    .where(
      and(eq(studServices.ownerId, userId), eq(studServices.catId, input.catId)),
    )
    .limit(1);

  if (existing) {
    throw new ApiError(
      "CONFLICT",
      "Kucing ini sudah terdaftar sebagai pejantan pacak.",
      { field: "catId" },
    );
  }

  assertFee(input.feeAmount ?? null, input.feeDescription ?? null);

  const [created] = await db
    .insert(studServices)
    .values({
      ownerId: userId,
      catId: cat.id,
      catName: cat.name,
      feeAmount: input.feeAmount ?? null,
      feeDescription: input.feeDescription?.trim() || null,
      notes: input.notes?.trim() || null,
      isAvailable: input.isAvailable,
    })
    .returning();

  return created;
}

export async function updateStudService(
  userId: string,
  serviceId: string,
  input: StudServiceUpdateInput,
): Promise<StudServiceRow> {
  const existing = await getStudService(userId, serviceId);

  if (existing.catId) {
    const cat = await getCat(userId, existing.catId);
    if (cat.trackingStatus === "frozen") {
      throw new ApiError(
        "CAT_FROZEN",
        "Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk mengubah profil pacaknya.",
      );
    }
  }

  const nextFeeAmount =
    input.feeAmount !== undefined ? input.feeAmount : existing.feeAmount;
  const nextFeeDescription =
    input.feeDescription !== undefined
      ? input.feeDescription
      : existing.feeDescription;

  assertFee(nextFeeAmount, nextFeeDescription);

  const [updated] = await db
    .update(studServices)
    .set({
      ...(input.feeAmount !== undefined ? { feeAmount: input.feeAmount } : {}),
      ...(input.feeDescription !== undefined
        ? { feeDescription: input.feeDescription?.trim() || null }
        : {}),
      ...(input.notes !== undefined
        ? { notes: input.notes?.trim() || null }
        : {}),
      ...(input.isAvailable !== undefined
        ? { isAvailable: input.isAvailable }
        : {}),
    })
    .where(
      and(eq(studServices.id, serviceId), eq(studServices.ownerId, userId)),
    )
    .returning();

  return updated;
}

export async function deleteStudService(
  userId: string,
  serviceId: string,
): Promise<void> {
  await getStudService(userId, serviceId);

  const [bookings] = await db
    .select({ total: count() })
    .from(studBookings)
    .where(
      and(
        eq(studBookings.ownerId, userId),
        eq(studBookings.studServiceId, serviceId),
      ),
    );

  if (Number(bookings?.total ?? 0) > 0) {
    throw new ApiError(
      "CONFLICT",
      "Pejantan ini punya riwayat booking. Nonaktifkan ketersediaannya saja agar riwayat tetap tersimpan.",
    );
  }

  await db
    .delete(studServices)
    .where(
      and(eq(studServices.id, serviceId), eq(studServices.ownerId, userId)),
    );
}

/**
 * Pastikan pejantan bisa dipakai untuk booking baru:
 * tersedia, kucing masih aktif/dilacak, dan belum dibekukan.
 */
export async function assertStudBookable(
  userId: string,
  serviceId: string,
): Promise<StudServiceWithCat> {
  const service = await getStudService(userId, serviceId);

  if (!service.catId) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Pejantan ini sudah tidak tersedia untuk booking baru.",
      { field: "studServiceId" },
    );
  }

  const cat = await getCat(userId, service.catId);

  if (cat.trackingStatus === "frozen") {
    throw new ApiError(
      "CAT_FROZEN",
      "Pejantan ini dibekukan karena batas paket Free dan tidak bisa dipilih untuk booking baru.",
    );
  }

  if (!service.isAvailable) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Pejantan sedang tidak tersedia untuk booking baru.",
      { field: "studServiceId" },
    );
  }

  if (cat.sex !== "male" || cat.status !== "active" || cat.trackingStatus !== "tracked") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Pejantan harus kucing jantan yang aktif dan dilacak.",
      { field: "studServiceId" },
    );
  }

  return service;
}
