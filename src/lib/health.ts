import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { cats, healthRecords } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { getCat } from "@/lib/cats";
import { isFutureDate, toIsoDate } from "@/lib/date";
import { HEALTH_TYPE_LABEL } from "@/lib/labels";
import { getPlanInfo, historyWindowStart } from "@/lib/plan";
import { syncHealthReminder } from "@/lib/reminders";
import type {
  HealthCreateInput,
  HealthListQuery,
  HealthUpdateInput,
  WeightCreateInput,
  WeightUpdateInput,
} from "@/lib/validation/health";

/**
 * Catatan kesehatan + berat (type='weight') selalu owner-scoped lewat
 * `cats.owner_id`. Riwayat akun Free dipotong jendela 3 bulan; jumlah
 * data yang terkunci dikembalikan agar UI bisa menampilkan banner.
 */

export type HealthRecordRow = typeof healthRecords.$inferSelect;

export type HistorySlice<T> = {
  items: T[];
  lockedCount: number;
  windowStart: string | null;
};

export type WeightEntry = {
  id: string;
  catId: string;
  date: string;
  kg: number;
  note: string | null;
  createdAt: Date;
};

function assertWritableCat(cat: { trackingStatus: "tracked" | "frozen" }): void {
  if (cat.trackingStatus === "frozen") {
    throw new ApiError(
      "CAT_FROZEN",
      "Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk mengubah datanya.",
    );
  }
}

function assertHealthInput(input: {
  type: HealthRecordRow["type"];
  recordDate: string;
  nextDueDate?: string | null;
  weightKg?: number | null;
}): void {
  if (isFutureDate(input.recordDate)) {
    throw new ApiError("VALIDATION_ERROR", "Tanggal tidak boleh di masa depan", {
      field: "recordDate",
    });
  }

  if (input.nextDueDate && input.nextDueDate < input.recordDate) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Tanggal berikutnya tidak boleh sebelum tanggal catatan",
      { field: "nextDueDate" },
    );
  }

  if (input.type === "weight" && input.weightKg == null) {
    throw new ApiError("VALIDATION_ERROR", "Berat badan wajib diisi", {
      field: "weightKg",
    });
  }
}

function reminderTitle(record: {
  type: HealthRecordRow["type"];
  title: string | null;
}): string {
  return record.title?.trim() || HEALTH_TYPE_LABEL[record.type];
}

export async function listHealthRecords(
  userId: string,
  catId: string,
  query: HealthListQuery = {},
): Promise<HistorySlice<HealthRecordRow>> {
  await getCat(userId, catId);

  const conditions: SQL[] = [eq(healthRecords.catId, catId)];

  if (query.type) {
    conditions.push(eq(healthRecords.type, query.type));
  }
  if (query.from) {
    conditions.push(gte(healthRecords.recordDate, query.from));
  }
  if (query.to) {
    conditions.push(lte(healthRecords.recordDate, query.to));
  }

  // Jendela riwayat dihitung dari hari ini, bukan dari filter klien.
  const plan = await getPlanInfo(userId);
  const windowStart = historyWindowStart(plan.limits.historyMonths);
  const windowStartIso = windowStart ? toIsoDate(windowStart) : null;

  const rows = await db
    .select()
    .from(healthRecords)
    .where(and(...conditions))
    .orderBy(desc(healthRecords.recordDate), desc(healthRecords.createdAt));

  if (!windowStartIso) {
    return { items: rows, lockedCount: 0, windowStart: null };
  }

  const items = rows.filter((row) => row.recordDate >= windowStartIso);

  return {
    items,
    lockedCount: rows.length - items.length,
    windowStart: windowStartIso,
  };
}

export async function getHealthRecord(
  userId: string,
  healthRecordId: string,
): Promise<{ record: HealthRecordRow; cat: typeof cats.$inferSelect }> {
  const [row] = await db
    .select({ record: healthRecords, cat: cats })
    .from(healthRecords)
    .innerJoin(cats, eq(cats.id, healthRecords.catId))
    .where(and(eq(healthRecords.id, healthRecordId), eq(cats.ownerId, userId)))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Catatan kesehatan tidak ditemukan.");
  }

  return row;
}

export async function createHealthRecord(
  userId: string,
  catId: string,
  input: HealthCreateInput,
): Promise<HealthRecordRow> {
  const cat = await getCat(userId, catId);
  assertWritableCat(cat);
  assertHealthInput(input);

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(healthRecords)
      .values({
        catId,
        type: input.type,
        title: input.title ?? null,
        recordDate: input.recordDate,
        nextDueDate: input.nextDueDate ?? null,
        weightKg: input.weightKg ?? null,
        vetName: input.vetName ?? null,
        cost: input.cost ?? null,
        photoPath: input.photoPath ?? null,
        notes: input.notes ?? null,
      })
      .returning();

    if (input.type !== "weight") {
      await syncHealthReminder(tx, {
        userId,
        catId,
        healthRecordId: created.id,
        title: reminderTitle(created),
        nextDueDate: created.nextDueDate,
      });
    }

    return created;
  });
}

export async function updateHealthRecord(
  userId: string,
  healthRecordId: string,
  input: HealthUpdateInput,
): Promise<HealthRecordRow> {
  const { record: existing, cat } = await getHealthRecord(userId, healthRecordId);
  assertWritableCat(cat);

  const nextType = input.type ?? existing.type;

  const merged = {
    type: nextType,
    title: input.title !== undefined ? input.title : existing.title,
    recordDate: input.recordDate ?? existing.recordDate,
    nextDueDate:
      nextType === "weight" && input.nextDueDate === undefined
        ? null
        : input.nextDueDate !== undefined
          ? input.nextDueDate
          : existing.nextDueDate,
    weightKg: input.weightKg !== undefined ? input.weightKg : existing.weightKg,
  };

  assertHealthInput(merged);

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(healthRecords)
      .set({
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.recordDate !== undefined ? { recordDate: input.recordDate } : {}),
        ...(input.nextDueDate !== undefined
          ? { nextDueDate: input.nextDueDate }
          : merged.type === "weight"
            ? { nextDueDate: null }
            : {}),
        ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
        ...(input.vetName !== undefined ? { vetName: input.vetName } : {}),
        ...(input.cost !== undefined ? { cost: input.cost } : {}),
        ...(input.photoPath !== undefined ? { photoPath: input.photoPath } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      })
      .where(eq(healthRecords.id, healthRecordId))
      .returning();

    if (merged.type === "weight") {
      await syncHealthReminder(tx, {
        userId,
        catId: existing.catId,
        healthRecordId,
        title: reminderTitle(updated),
        nextDueDate: null,
      });
    } else {
      await syncHealthReminder(tx, {
        userId,
        catId: existing.catId,
        healthRecordId,
        title: reminderTitle(updated),
        nextDueDate: updated.nextDueDate,
      });
    }

    return updated;
  });
}

export async function deleteHealthRecord(
  userId: string,
  healthRecordId: string,
): Promise<void> {
  const { record, cat } = await getHealthRecord(userId, healthRecordId);
  assertWritableCat(cat);

  await db.transaction(async (tx) => {
    await syncHealthReminder(tx, {
      userId,
      catId: record.catId,
      healthRecordId,
      title: "",
      nextDueDate: null,
    });

    await tx.delete(healthRecords).where(eq(healthRecords.id, healthRecordId));
  });
}

// ============================================================
// Berat badan — permukaan khusus di atas health_records
// ============================================================

export async function listWeights(
  userId: string,
  catId: string,
): Promise<HistorySlice<WeightEntry>> {
  const { items, lockedCount, windowStart } = await listHealthRecords(userId, catId, {
    type: "weight",
  });

  return {
    items: items
      .filter((row) => row.weightKg != null)
      .map((row) => ({
        id: row.id,
        catId: row.catId,
        date: row.recordDate,
        kg: row.weightKg as number,
        note: row.notes,
        createdAt: row.createdAt,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    lockedCount,
    windowStart,
  };
}

export async function createWeight(
  userId: string,
  catId: string,
  input: WeightCreateInput,
): Promise<WeightEntry> {
  const record = await createHealthRecord(userId, catId, {
    type: "weight",
    recordDate: input.recordDate,
    weightKg: input.weightKg,
    notes: input.notes ?? null,
  });

  return {
    id: record.id,
    catId: record.catId,
    date: record.recordDate,
    kg: record.weightKg as number,
    note: record.notes,
    createdAt: record.createdAt,
  };
}

export async function updateWeight(
  userId: string,
  weightId: string,
  input: WeightUpdateInput,
): Promise<WeightEntry> {
  const { record } = await getHealthRecord(userId, weightId);

  if (record.type !== "weight") {
    throw new ApiError("NOT_FOUND", "Catatan berat tidak ditemukan.");
  }

  const updated = await updateHealthRecord(userId, weightId, input);

  return {
    id: updated.id,
    catId: updated.catId,
    date: updated.recordDate,
    kg: updated.weightKg as number,
    note: updated.notes,
    createdAt: updated.createdAt,
  };
}

export async function deleteWeight(userId: string, weightId: string): Promise<void> {
  const { record } = await getHealthRecord(userId, weightId);

  if (record.type !== "weight") {
    throw new ApiError("NOT_FOUND", "Catatan berat tidak ditemukan.");
  }

  await deleteHealthRecord(userId, weightId);
}

/** Berat terbaru untuk ringkasan halaman detail kucing. */
export async function getLatestWeight(
  userId: string,
  catId: string,
): Promise<WeightEntry | null> {
  await getCat(userId, catId);

  const [row] = await db
    .select()
    .from(healthRecords)
    .where(and(eq(healthRecords.catId, catId), eq(healthRecords.type, "weight")))
    .orderBy(desc(healthRecords.recordDate), desc(healthRecords.createdAt))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    catId: row.catId,
    date: row.recordDate,
    kg: row.weightKg as number,
    note: row.notes,
    createdAt: row.createdAt,
  };
}

/** Riwayat kesehatan terbaru untuk ringkasan (tanpa window paket). */
export async function getLatestHealthRecord(
  userId: string,
  catId: string,
  type?: HealthRecordRow["type"],
): Promise<HealthRecordRow | null> {
  await getCat(userId, catId);

  const conditions: SQL[] = [eq(healthRecords.catId, catId)];
  if (type) conditions.push(eq(healthRecords.type, type));

  const [row] = await db
    .select()
    .from(healthRecords)
    .where(and(...conditions))
    .orderBy(desc(healthRecords.recordDate), asc(healthRecords.createdAt))
    .limit(1);

  return row ?? null;
}
