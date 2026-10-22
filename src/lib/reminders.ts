import {
  and,
  asc,
  eq,
  getTableColumns,
  gte,
  isNotNull,
  isNull,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { cats, reminders } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { addDaysIso, todayIso } from "@/lib/date";
import { getCat } from "@/lib/cats";
import type {
  ReminderCreateInput,
  ReminderListQuery,
  ReminderUpdateInput,
} from "@/lib/validation/reminder";

/**
 * Pengingat selalu difilter `user_id` dari sesi. Pengingat otomatis
 * (source_type = 'health') dijaga sinkron oleh `src/lib/health.ts`.
 */

export type ReminderRow = typeof reminders.$inferSelect;

export type ReminderWithCat = ReminderRow & {
  catName: string | null;
  catTrackingStatus: "tracked" | "frozen" | null;
};

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = typeof db | DbTransaction;

const reminderSelection = {
  ...getTableColumns(reminders),
  catName: cats.name,
  catTrackingStatus: cats.trackingStatus,
};

export async function listReminders(
  userId: string,
  query: ReminderListQuery = {},
): Promise<ReminderWithCat[]> {
  const conditions: SQL[] = [eq(reminders.userId, userId)];

  if (query.done === "true") {
    conditions.push(isNotNull(reminders.doneAt));
  } else if (query.done === "false") {
    conditions.push(isNull(reminders.doneAt));
  }

  if (query.from) {
    conditions.push(gte(reminders.dueDate, query.from));
  }

  if (query.to) {
    conditions.push(lte(reminders.dueDate, query.to));
  }

  return db
    .select(reminderSelection)
    .from(reminders)
    .leftJoin(cats, eq(cats.id, reminders.catId))
    .where(and(...conditions))
    .orderBy(asc(reminders.dueDate), asc(reminders.createdAt));
}

export async function getReminder(
  userId: string,
  reminderId: string,
): Promise<ReminderWithCat> {
  const [row] = await db
    .select(reminderSelection)
    .from(reminders)
    .leftJoin(cats, eq(cats.id, reminders.catId))
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Pengingat tidak ditemukan.");
  }

  return row;
}

/**
 * Pengingat 7 hari ke depan untuk Beranda.
 * Pengingat kucing yang dibekukan tidak ditampilkan sebagai aktif (FR-06).
 */
export async function listUpcomingReminders(
  userId: string,
  days = 7,
  now = new Date(),
): Promise<ReminderWithCat[]> {
  const from = todayIso(now);
  const to = addDaysIso(from, days);

  return db
    .select(reminderSelection)
    .from(reminders)
    .leftJoin(cats, eq(cats.id, reminders.catId))
    .where(
      and(
        eq(reminders.userId, userId),
        isNull(reminders.doneAt),
        gte(reminders.dueDate, from),
        lte(reminders.dueDate, to),
        or(isNull(reminders.catId), eq(cats.trackingStatus, "tracked")),
      ),
    )
    .orderBy(asc(reminders.dueDate), asc(reminders.createdAt));
}

export async function createReminder(
  userId: string,
  input: ReminderCreateInput,
): Promise<ReminderRow> {
  if (input.catId) {
    const cat = await getCat(userId, input.catId);
    if (cat.trackingStatus === "frozen") {
      throw new ApiError(
        "CAT_FROZEN",
        "Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk menambah pengingat.",
      );
    }
  }

  const [created] = await db
    .insert(reminders)
    .values({
      userId,
      catId: input.catId ?? null,
      title: input.title,
      dueDate: input.dueDate,
      sourceType: "manual",
      sourceId: null,
    })
    .returning();

  return created;
}

export async function updateReminder(
  userId: string,
  reminderId: string,
  input: ReminderUpdateInput,
): Promise<ReminderWithCat> {
  const existing = await getReminder(userId, reminderId);

  // Periksa kucing tujuan (atau kucing lama bila catId tidak diubah).
  const targetCatId = input.catId !== undefined ? input.catId : existing.catId;

  if (targetCatId) {
    const cat = await getCat(userId, targetCatId);
    if (cat.trackingStatus === "frozen") {
      throw new ApiError(
        "CAT_FROZEN",
        "Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk mengubah pengingat.",
      );
    }
  }

  const now = new Date();
  const nextDueDate = input.postponeDays
    ? addDaysIso(
        existing.dueDate > todayIso(now) ? existing.dueDate : todayIso(now),
        input.postponeDays,
      )
    : input.dueDate;

  const dueDateChanged =
    nextDueDate !== undefined && nextDueDate !== existing.dueDate;

  const doneAt =
    input.done === true
      ? now
      : input.done === false
        ? null
        : dueDateChanged || input.postponeDays
          ? null
          : undefined;

  const [updated] = await db
    .update(reminders)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(nextDueDate !== undefined ? { dueDate: nextDueDate } : {}),
      ...(input.catId !== undefined ? { catId: input.catId } : {}),
      ...(doneAt !== undefined ? { doneAt } : {}),
      // Tanggal berubah → kirim ulang notifikasi H-3/hari-H.
      ...(dueDateChanged || input.postponeDays
        ? { notifiedH3At: null, notifiedD0At: null }
        : {}),
    })
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .returning({ id: reminders.id });

  if (!updated) {
    throw new ApiError("NOT_FOUND", "Pengingat tidak ditemukan.");
  }

  return getReminder(userId, reminderId);
}

export async function deleteReminder(userId: string, reminderId: string): Promise<void> {
  await getReminder(userId, reminderId);
  await db
    .delete(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)));
}

/**
 * Sinkronisasi pengingat otomatis dari catatan kesehatan.
 * - `nextDueDate` kosong → pengingat lama dihapus.
 * - sudah ada → diperbarui (tidak membuat duplikat).
 * - belum ada → dibuat.
 */
export async function syncHealthReminder(
  executor: DbExecutor,
  params: {
    userId: string;
    catId: string;
    healthRecordId: string;
    title: string;
    nextDueDate: string | null;
  },
): Promise<void> {
  const [existing] = await executor
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.userId, params.userId),
        eq(reminders.sourceType, "health"),
        eq(reminders.sourceId, params.healthRecordId),
      ),
    )
    .limit(1);

  if (!params.nextDueDate) {
    if (existing) {
      await executor.delete(reminders).where(eq(reminders.id, existing.id));
    }
    return;
  }

  if (existing) {
    const changed = existing.dueDate !== params.nextDueDate;

    await executor
      .update(reminders)
      .set({
        catId: params.catId,
        title: params.title,
        dueDate: params.nextDueDate,
        ...(changed ? { doneAt: null, notifiedH3At: null, notifiedD0At: null } : {}),
      })
      .where(eq(reminders.id, existing.id));
    return;
  }

  await executor.insert(reminders).values({
    userId: params.userId,
    catId: params.catId,
    title: params.title,
    dueDate: params.nextDueDate,
    sourceType: "health",
    sourceId: params.healthRecordId,
  });
}
