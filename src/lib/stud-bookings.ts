import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  inArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { cats, studBookingMatings, studBookings, studServices } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { addDaysIso, isFutureDate, toIsoDate, todayIso } from "@/lib/date";
import type { HistorySlice } from "@/lib/health";
import { getPlanInfo, historyWindowStart } from "@/lib/plan";
import {
  completeBookingDueReminder,
  syncBookingDueReminder,
  syncBookingPlannedReminder,
  type DbExecutor,
} from "@/lib/reminders";
import {
  assertStudBookable,
  getStudService,
  listStudServices,
  type StudServiceWithCat,
} from "@/lib/stud-services";
import type {
  QueenPregnancyStatus,
  StudBookingCreateInput,
  StudBookingListQuery,
  StudBookingStatus,
  StudBookingUpdateInput,
  StudMatingCreateInput,
} from "@/lib/validation/stud";

/**
 * Booking jasa pacak (FR-12, FR-13). Semua akses memfilter `owner_id`.
 * Pengingat jadwal & estimasi lahir dijaga sinkron dari status booking.
 */

export const STUD_PREGNANCY_DAYS = 65;

export type StudBookingRow = typeof studBookings.$inferSelect;
export type StudMatingRow = typeof studBookingMatings.$inferSelect;

export type StudBookingServiceSummary = {
  id: string;
  catId: string | null;
  catName: string;
  feeAmount: number | null;
  feeDescription: string | null;
  isAvailable: boolean;
  catPhotoPath: string | null;
  catStatus: "active" | "sold" | "deceased" | null;
  catTrackingStatus: "tracked" | "frozen" | null;
};

export type StudBookingWithDetails = StudBookingRow & {
  service: StudBookingServiceSummary;
  matings: StudMatingRow[];
  firstMatingDate: string | null;
  matingCount: number;
  isOverdue: boolean;
};

export type StudServiceStats = {
  bookingCount: number;
  matingCount: number;
  pregnantCount: number;
  deliveredCount: number;
};

export type StudServiceWithStats = StudServiceWithCat & {
  stats: StudServiceStats;
};

export type StudOverview = {
  services: StudServiceWithStats[];
  bookings: HistorySlice<StudBookingWithDetails>;
};

const ACTIVE_STATUSES: StudBookingStatus[] = [
  "requested",
  "approved",
  "ongoing",
];

const ALLOWED_TRANSITIONS: Record<StudBookingStatus, StudBookingStatus[]> = {
  requested: ["requested", "approved", "rejected", "cancelled"],
  approved: ["approved", "rejected", "cancelled"],
  ongoing: ["ongoing", "completed", "cancelled"],
  completed: ["completed"],
  rejected: ["rejected"],
  cancelled: ["cancelled"],
};

const bookingSelection = {
  ...getTableColumns(studBookings),
  serviceCatId: studServices.catId,
  serviceCatName: studServices.catName,
  serviceFeeAmount: studServices.feeAmount,
  serviceFeeDescription: studServices.feeDescription,
  serviceIsAvailable: studServices.isAvailable,
  catPhotoPath: cats.photoPath,
  catStatus: cats.status,
  catTrackingStatus: cats.trackingStatus,
};

type BookingSelection = StudBookingRow & {
  serviceCatId: string | null;
  serviceCatName: string;
  serviceFeeAmount: number | null;
  serviceFeeDescription: string | null;
  serviceIsAvailable: boolean;
  catPhotoPath: string | null;
  catStatus: "active" | "sold" | "deceased" | null;
  catTrackingStatus: "tracked" | "frozen" | null;
};

function mapBooking(
  row: BookingSelection,
  matings: StudMatingRow[],
): StudBookingWithDetails {
  const firstMatingDate = matings[0]?.matingDate ?? null;
  const isOverdue =
    Boolean(row.expectedDueDate) &&
    (row.expectedDueDate ?? "") < todayIso() &&
    row.queenPregnancyStatus !== "delivered" &&
    row.queenPregnancyStatus !== "not_pregnant";

  return {
    id: row.id,
    ownerId: row.ownerId,
    studServiceId: row.studServiceId,
    clientName: row.clientName,
    clientWhatsapp: row.clientWhatsapp,
    queenName: row.queenName,
    queenBreed: row.queenBreed,
    queenAgeText: row.queenAgeText,
    plannedDate: row.plannedDate,
    status: row.status,
    feeAgreed: row.feeAgreed,
    depositAmount: row.depositAmount,
    depositPaid: row.depositPaid,
    expectedDueDate: row.expectedDueDate,
    expectedDueDateManual: row.expectedDueDateManual,
    queenPregnancyStatus: row.queenPregnancyStatus,
    notes: row.notes,
    approvedAt: row.approvedAt,
    createdAt: row.createdAt,
    service: {
      id: row.studServiceId,
      catId: row.serviceCatId,
      catName: row.serviceCatName,
      feeAmount: row.serviceFeeAmount,
      feeDescription: row.serviceFeeDescription,
      isAvailable: row.serviceIsAvailable,
      catPhotoPath: row.catPhotoPath,
      catStatus: row.catStatus,
      catTrackingStatus: row.catTrackingStatus,
    },
    matings,
    firstMatingDate,
    matingCount: matings.length,
    isOverdue,
  };
}

async function fetchMatings(
  bookingIds: string[],
  executor: DbExecutor = db,
): Promise<Map<string, StudMatingRow[]>> {
  const grouped = new Map<string, StudMatingRow[]>();
  if (bookingIds.length === 0) return grouped;

  const rows = await executor
    .select()
    .from(studBookingMatings)
    .where(inArray(studBookingMatings.bookingId, bookingIds))
    .orderBy(asc(studBookingMatings.matingDate), asc(studBookingMatings.createdAt));

  for (const row of rows) {
    const list = grouped.get(row.bookingId) ?? [];
    list.push(row);
    grouped.set(row.bookingId, list);
  }

  return grouped;
}

function bookingDateOf(row: { plannedDate: string | null; createdAt: Date }) {
  return row.plannedDate ?? toIsoDate(row.createdAt);
}

export async function listStudBookings(
  userId: string,
  query: StudBookingListQuery = {},
): Promise<HistorySlice<StudBookingWithDetails>> {
  const conditions: SQL[] = [eq(studBookings.ownerId, userId)];
  if (query.status) conditions.push(eq(studBookings.status, query.status));
  if (query.studServiceId) {
    conditions.push(eq(studBookings.studServiceId, query.studServiceId));
  }
  if (query.plannedDate) {
    conditions.push(eq(studBookings.plannedDate, query.plannedDate));
  }

  const rows = await db
    .select(bookingSelection)
    .from(studBookings)
    .innerJoin(studServices, eq(studServices.id, studBookings.studServiceId))
    .leftJoin(cats, eq(cats.id, studServices.catId))
    .where(and(...conditions))
    .orderBy(
      sql`case
        when ${studBookings.plannedDate} is null then 2
        when ${studBookings.plannedDate} >= current_date then 0
        else 1
      end`,
      sql`abs(${studBookings.plannedDate} - current_date)`,
      desc(studBookings.createdAt),
    );

  const matingsByBooking = await fetchMatings(rows.map((row) => row.id));
  const items = rows.map((row) =>
    mapBooking(row, matingsByBooking.get(row.id) ?? []),
  );

  const plan = await getPlanInfo(userId);
  const windowStart = historyWindowStart(plan.limits.historyMonths);
  const windowStartIso = windowStart ? toIsoDate(windowStart) : null;

  if (!windowStartIso) {
    return { items, lockedCount: 0, windowStart: null };
  }

  // Booking yang masih berjalan selalu terlihat walau lebih tua dari jendela.
  const visible = items.filter(
    (row) =>
      ACTIVE_STATUSES.includes(row.status) ||
      bookingDateOf(row) >= windowStartIso,
  );

  return {
    items: visible,
    lockedCount: items.length - visible.length,
    windowStart: windowStartIso,
  };
}

export async function getStudBooking(
  userId: string,
  bookingId: string,
): Promise<StudBookingWithDetails> {
  const [row] = await db
    .select(bookingSelection)
    .from(studBookings)
    .innerJoin(studServices, eq(studServices.id, studBookings.studServiceId))
    .leftJoin(cats, eq(cats.id, studServices.catId))
    .where(and(eq(studBookings.id, bookingId), eq(studBookings.ownerId, userId)))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Booking pacak tidak ditemukan.");
  }

  const matingsByBooking = await fetchMatings([row.id]);

  return mapBooking(row, matingsByBooking.get(row.id) ?? []);
}

async function listMatingsForBooking(
  userId: string,
  bookingId: string,
): Promise<StudMatingRow[]> {
  const booking = await getStudBooking(userId, bookingId);
  return booking.matings;
}

export async function listStudMatings(
  userId: string,
  bookingId: string,
): Promise<StudMatingRow[]> {
  return listMatingsForBooking(userId, bookingId);
}

export async function createStudBooking(
  userId: string,
  input: StudBookingCreateInput,
): Promise<StudBookingWithDetails> {
  await assertStudBookable(userId, input.studServiceId);

  const [created] = await db
    .insert(studBookings)
    .values({
      ownerId: userId,
      studServiceId: input.studServiceId,
      clientName: input.clientName,
      clientWhatsapp: input.clientWhatsapp,
      queenName: input.queenName,
      queenBreed: input.queenBreed?.trim() || null,
      queenAgeText: input.queenAgeText?.trim() || null,
      plannedDate: input.plannedDate ?? null,
      status: "requested",
      feeAgreed: input.feeAgreed ?? null,
      depositAmount: input.depositAmount ?? null,
      depositPaid: input.depositPaid,
      notes: input.notes?.trim() || null,
    })
    .returning({ id: studBookings.id });

  return getStudBooking(userId, created.id);
}

function plannedReminderTitle(booking: {
  queenName: string;
  serviceCatName: string;
}) {
  return `Jadwal pacak ${booking.queenName} (${booking.serviceCatName})`;
}

function dueReminderTitle(queenName: string) {
  return `Estimasi lahir ${queenName}`;
}

async function syncBookingReminders(
  executor: DbExecutor,
  params: {
    userId: string;
    booking: {
      id: string;
      queenName: string;
      serviceCatName: string;
      plannedDate: string | null;
      status: StudBookingStatus;
      expectedDueDate: string | null;
      queenPregnancyStatus: QueenPregnancyStatus;
      matingCount: number;
    };
  },
): Promise<void> {
  const { booking, userId } = params;

  await syncBookingPlannedReminder(executor, {
    userId,
    bookingId: booking.id,
    title: plannedReminderTitle(booking),
    dueDate:
      booking.status === "approved" ? booking.plannedDate : null,
  });

  if (booking.status === "cancelled" || booking.status === "rejected") {
    await syncBookingDueReminder(executor, {
      userId,
      bookingId: booking.id,
      title: dueReminderTitle(booking.queenName),
      dueDate: null,
    });
    return;
  }

  if (booking.queenPregnancyStatus === "not_pregnant") {
    await syncBookingDueReminder(executor, {
      userId,
      bookingId: booking.id,
      title: dueReminderTitle(booking.queenName),
      dueDate: null,
    });
    return;
  }

  if (booking.queenPregnancyStatus === "delivered") {
    await completeBookingDueReminder(executor, {
      userId,
      bookingId: booking.id,
    });
    return;
  }

  const dueDate =
    booking.matingCount > 0 ? booking.expectedDueDate : null;

  await syncBookingDueReminder(executor, {
    userId,
    bookingId: booking.id,
    title: dueReminderTitle(booking.queenName),
    dueDate,
    reopen: Boolean(dueDate),
  });
}

export async function updateStudBooking(
  userId: string,
  bookingId: string,
  input: StudBookingUpdateInput,
): Promise<StudBookingWithDetails> {
  const existing = await getStudBooking(userId, bookingId);
  const nextStatus = input.status ?? existing.status;

  if (!ALLOWED_TRANSITIONS[existing.status].includes(nextStatus)) {
    throw new ApiError(
      "CONFLICT",
      `Status booking tidak bisa berubah dari ${existing.status} ke ${nextStatus}.`,
    );
  }

  if (
    nextStatus === "completed" &&
    (existing.status !== "ongoing" || existing.matings.length === 0)
  ) {
    throw new ApiError(
      "CONFLICT",
      "Booking hanya bisa diselesaikan setelah berlangsung dan punya catatan kawin.",
    );
  }

  const nextServiceId =
    input.studServiceId !== undefined
      ? input.studServiceId
      : existing.studServiceId;

  let nextServiceCatName = existing.service.catName;

  if (nextServiceId !== existing.studServiceId) {
    const nextService = await assertStudBookable(userId, nextServiceId);
    nextServiceCatName = nextService.catName;
  }

  const nextPlannedDate =
    input.plannedDate !== undefined ? input.plannedDate : existing.plannedDate;
  const firstMatingDate = existing.matings[0]?.matingDate ?? null;

  let nextExpectedDueDate =
    input.expectedDueDate !== undefined
      ? input.expectedDueDate
      : existing.expectedDueDate;
  let nextExpectedManual =
    input.expectedDueDateManual !== undefined
      ? input.expectedDueDateManual
      : existing.expectedDueDateManual;

  if (input.expectedDueDate !== undefined) {
    nextExpectedManual = input.expectedDueDate !== null;
  }

  if (input.expectedDueDateManual === false) {
    nextExpectedManual = false;
  }

  if (!nextExpectedManual && firstMatingDate) {
    nextExpectedDueDate = addDaysIso(firstMatingDate, STUD_PREGNANCY_DAYS);
  }

  if (nextExpectedDueDate && firstMatingDate && nextExpectedDueDate < firstMatingDate) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Estimasi lahir tidak boleh sebelum tanggal kawin pertama.",
      { field: "expectedDueDate" },
    );
  }

  if (nextExpectedDueDate && existing.matings.length === 0) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Catat kawin pertama sebelum mengisi estimasi lahir.",
      { field: "expectedDueDate" },
    );
  }

  const nextPregnancyStatus =
    input.queenPregnancyStatus !== undefined
      ? input.queenPregnancyStatus
      : existing.queenPregnancyStatus;

  await db.transaction(async (tx) => {
    await tx
      .update(studBookings)
      .set({
        ...(input.studServiceId !== undefined
          ? { studServiceId: input.studServiceId }
          : {}),
        ...(input.clientName !== undefined
          ? { clientName: input.clientName }
          : {}),
        ...(input.clientWhatsapp !== undefined
          ? { clientWhatsapp: input.clientWhatsapp }
          : {}),
        ...(input.queenName !== undefined
          ? { queenName: input.queenName }
          : {}),
        ...(input.queenBreed !== undefined
          ? { queenBreed: input.queenBreed?.trim() || null }
          : {}),
        ...(input.queenAgeText !== undefined
          ? { queenAgeText: input.queenAgeText?.trim() || null }
          : {}),
        ...(input.plannedDate !== undefined
          ? { plannedDate: input.plannedDate }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.feeAgreed !== undefined
          ? { feeAgreed: input.feeAgreed }
          : {}),
        ...(input.depositAmount !== undefined
          ? { depositAmount: input.depositAmount }
          : {}),
        ...(input.depositPaid !== undefined
          ? { depositPaid: input.depositPaid }
          : {}),
        expectedDueDate: nextExpectedDueDate,
        expectedDueDateManual: nextExpectedManual,
        ...(input.queenPregnancyStatus !== undefined
          ? { queenPregnancyStatus: input.queenPregnancyStatus }
          : {}),
        ...(input.notes !== undefined
          ? { notes: input.notes?.trim() || null }
          : {}),
        ...(nextStatus === "approved" && !existing.approvedAt
          ? { approvedAt: new Date() }
          : {}),
      })
      .where(
        and(
          eq(studBookings.id, bookingId),
          eq(studBookings.ownerId, userId),
        ),
      );

    await syncBookingReminders(tx, {
      userId,
      booking: {
        id: bookingId,
        queenName: input.queenName ?? existing.queenName,
        serviceCatName: nextServiceCatName,
        plannedDate: nextPlannedDate,
        status: nextStatus,
        expectedDueDate: nextExpectedDueDate,
        queenPregnancyStatus: nextPregnancyStatus,
        matingCount: existing.matings.length,
      },
    });
  });

  return getStudBooking(userId, bookingId);
}

export async function deleteStudBooking(
  userId: string,
  bookingId: string,
): Promise<void> {
  await getStudBooking(userId, bookingId);

  await db.transaction(async (tx) => {
    await syncBookingPlannedReminder(tx, {
      userId,
      bookingId,
      title: "",
      dueDate: null,
    });
    await syncBookingDueReminder(tx, {
      userId,
      bookingId,
      title: "",
      dueDate: null,
    });

    await tx
      .delete(studBookings)
      .where(
        and(
          eq(studBookings.id, bookingId),
          eq(studBookings.ownerId, userId),
        ),
      );
  });
}

export async function addStudMating(
  userId: string,
  bookingId: string,
  input: StudMatingCreateInput,
): Promise<StudBookingWithDetails> {
  const booking = await getStudBooking(userId, bookingId);

  if (!["requested", "approved", "ongoing"].includes(booking.status)) {
    throw new ApiError(
      "CONFLICT",
      "Booking yang sudah selesai/dibatalkan tidak bisa ditambah catatan kawin.",
    );
  }

  if (isFutureDate(input.matingDate)) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Tanggal kawin tidak boleh di masa depan.",
      { field: "matingDate" },
    );
  }

  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(studBookingMatings)
      .values({
        bookingId,
        matingDate: input.matingDate,
        notes: input.notes?.trim() || null,
      })
      .returning();

    const allMatings = [...booking.matings, created].sort((a, b) =>
      a.matingDate.localeCompare(b.matingDate),
    );
    const firstMatingDate = allMatings[0].matingDate;

    const nextStatus: StudBookingStatus =
      booking.status === "requested" || booking.status === "approved"
        ? "ongoing"
        : booking.status;

    const nextExpectedDueDate =
      booking.expectedDueDateManual && booking.expectedDueDate
        ? booking.expectedDueDate
        : addDaysIso(firstMatingDate, STUD_PREGNANCY_DAYS);

    await tx
      .update(studBookings)
      .set({
        status: nextStatus,
        expectedDueDate: nextExpectedDueDate,
      })
      .where(
        and(
          eq(studBookings.id, bookingId),
          eq(studBookings.ownerId, userId),
        ),
      );

    await syncBookingReminders(tx, {
      userId,
      booking: {
        id: bookingId,
        queenName: booking.queenName,
        serviceCatName: booking.service.catName,
        plannedDate: booking.plannedDate,
        status: nextStatus,
        expectedDueDate: nextExpectedDueDate,
        queenPregnancyStatus: booking.queenPregnancyStatus,
        matingCount: allMatings.length,
      },
    });
  });

  return getStudBooking(userId, bookingId);
}

export async function deleteStudMating(
  userId: string,
  matingId: string,
): Promise<void> {
  const [row] = await db
    .select({
      mating: studBookingMatings,
      booking: studBookings,
      serviceCatName: studServices.catName,
    })
    .from(studBookingMatings)
    .innerJoin(studBookings, eq(studBookings.id, studBookingMatings.bookingId))
    .innerJoin(studServices, eq(studServices.id, studBookings.studServiceId))
    .where(
      and(
        eq(studBookingMatings.id, matingId),
        eq(studBookings.ownerId, userId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Catatan kawin tidak ditemukan.");
  }

  if (!["requested", "approved", "ongoing"].includes(row.booking.status)) {
    throw new ApiError(
      "CONFLICT",
      "Catatan kawin booking yang sudah selesai/dibatalkan tidak bisa dihapus.",
    );
  }

  const remainingRows = await db
    .select()
    .from(studBookingMatings)
    .where(eq(studBookingMatings.bookingId, row.booking.id))
    .orderBy(asc(studBookingMatings.matingDate), asc(studBookingMatings.createdAt));

  const remaining = remainingRows.filter((mating) => mating.id !== matingId);
  const firstMatingDate = remaining[0]?.matingDate ?? null;

  await db.transaction(async (tx) => {
    await tx
      .delete(studBookingMatings)
      .where(eq(studBookingMatings.id, matingId));

    if (remaining.length === 0) {
      const nextStatus: StudBookingStatus = row.booking.approvedAt
        ? "approved"
        : "requested";

      await tx
        .update(studBookings)
        .set({
          status: nextStatus,
          expectedDueDate: null,
          expectedDueDateManual: false,
        })
        .where(eq(studBookings.id, row.booking.id));

      await syncBookingReminders(tx, {
        userId,
        booking: {
          id: row.booking.id,
          queenName: row.booking.queenName,
          serviceCatName: row.serviceCatName,
          plannedDate: row.booking.plannedDate,
          status: nextStatus,
          expectedDueDate: null,
          queenPregnancyStatus: row.booking.queenPregnancyStatus,
          matingCount: 0,
        },
      });
      return;
    }

    const nextExpectedDueDate =
      row.booking.expectedDueDateManual && row.booking.expectedDueDate
        ? row.booking.expectedDueDate
        : addDaysIso(firstMatingDate!, STUD_PREGNANCY_DAYS);

    await tx
      .update(studBookings)
      .set({ expectedDueDate: nextExpectedDueDate })
      .where(eq(studBookings.id, row.booking.id));

    await syncBookingReminders(tx, {
      userId,
      booking: {
        id: row.booking.id,
        queenName: row.booking.queenName,
        serviceCatName: row.serviceCatName,
        plannedDate: row.booking.plannedDate,
        status: row.booking.status,
        expectedDueDate: nextExpectedDueDate,
        queenPregnancyStatus: row.booking.queenPregnancyStatus,
        matingCount: remaining.length,
      },
    });
  });
}

export function summarizeStudBookings(
  bookings: StudBookingWithDetails[],
): StudServiceStats {
  return {
    bookingCount: bookings.length,
    matingCount: bookings.reduce(
      (total, booking) => total + booking.matingCount,
      0,
    ),
    pregnantCount: bookings.filter(
      (booking) => booking.queenPregnancyStatus === "pregnant",
    ).length,
    deliveredCount: bookings.filter(
      (booking) => booking.queenPregnancyStatus === "delivered",
    ).length,
  };
}

export async function getStudOverview(userId: string): Promise<StudOverview> {
  const [services, bookings] = await Promise.all([
    listStudServices(userId),
    listStudBookings(userId),
  ]);

  const byService = new Map<string, StudBookingWithDetails[]>();
  for (const booking of bookings.items) {
    const list = byService.get(booking.studServiceId) ?? [];
    list.push(booking);
    byService.set(booking.studServiceId, list);
  }

  return {
    services: services.map((service) => ({
      ...service,
      stats: summarizeStudBookings(byService.get(service.id) ?? []),
    })),
    bookings,
  };
}

export async function getStudServiceStats(
  userId: string,
  serviceId: string,
): Promise<StudServiceStats> {
  await getStudService(userId, serviceId);
  const bookings = await listStudBookings(userId, { studServiceId: serviceId });
  return summarizeStudBookings(bookings.items);
}

/** Dipakai UI untuk memeriksa bentrok jadwal sebelum menyimpan. */
export async function findScheduleConflicts(
  userId: string,
  studServiceId: string,
  plannedDate: string,
  excludeBookingId?: string,
): Promise<StudBookingWithDetails[]> {
  const { items } = await listStudBookings(userId, {
    studServiceId,
    plannedDate,
  });

  return items.filter(
    (booking) =>
      booking.id !== excludeBookingId &&
      ACTIVE_STATUSES.includes(booking.status),
  );
}
