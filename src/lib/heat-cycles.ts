import { and, asc, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { cats, heatCycles } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { getCat, type CatRow } from "@/lib/cats";
import { daysBetweenIso, isFutureDate, toIsoDate } from "@/lib/date";
import { getPlanInfo, historyWindowStart } from "@/lib/plan";
import type { HistorySlice } from "@/lib/health";
import type {
  HeatCycleCreateInput,
  HeatCycleUpdateInput,
} from "@/lib/validation/breeding";

/**
 * Siklus birahi selalu owner-scoped lewat `cats.owner_id`.
 * Hanya betina aktif & dilacak yang boleh dicatat; kucing beku read-only.
 * Riwayat Free dipotong jendela 3 bulan seperti modul lain.
 */

export type HeatCycleRow = typeof heatCycles.$inferSelect;

export type HeatCycleWithCat = HeatCycleRow & {
  catName: string;
  gapDays: number | null;
};

function assertBreedingFemale(cat: CatRow): void {
  if (cat.trackingStatus === "frozen") {
    throw new ApiError(
      "CAT_FROZEN",
      "Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk mengubah datanya.",
    );
  }

  if (cat.sex !== "female") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Siklus birahi hanya bisa dicatat untuk kucing betina.",
      { field: "catId" },
    );
  }

  if (cat.status !== "active") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Siklus birahi hanya bisa dicatat untuk kucing aktif.",
      { field: "catId" },
    );
  }

  if (cat.trackingStatus !== "tracked") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Aktifkan pelacakan kucing terlebih dahulu untuk mencatat siklus birahi.",
      { field: "catId" },
    );
  }
}

function assertCycleDates(input: {
  startDate: string;
  endDate?: string | null;
}): void {
  if (isFutureDate(input.startDate)) {
    throw new ApiError("VALIDATION_ERROR", "Tanggal tidak boleh di masa depan", {
      field: "startDate",
    });
  }

  if (input.endDate && isFutureDate(input.endDate)) {
    throw new ApiError("VALIDATION_ERROR", "Tanggal tidak boleh di masa depan", {
      field: "endDate",
    });
  }

  if (input.endDate && input.endDate < input.startDate) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Tanggal selesai tidak boleh sebelum tanggal mulai",
      { field: "endDate" },
    );
  }
}

function cyclesOverlap(
  a: { startDate: string; endDate: string | null },
  b: { startDate: string; endDate: string | null },
): boolean {
  const aEnd = a.endDate ?? "9999-12-31";
  const bEnd = b.endDate ?? "9999-12-31";

  return a.startDate <= bEnd && b.startDate <= aEnd;
}

async function assertNoOverlap(
  catId: string,
  input: { startDate: string; endDate: string | null },
  excludeId?: string,
): Promise<void> {
  const rows = await db
    .select({
      id: heatCycles.id,
      startDate: heatCycles.startDate,
      endDate: heatCycles.endDate,
    })
    .from(heatCycles)
    .where(eq(heatCycles.catId, catId));

  const conflict = rows.find(
    (row) =>
      row.id !== excludeId &&
      cyclesOverlap(input, { startDate: row.startDate, endDate: row.endDate }),
  );

  if (conflict) {
    throw new ApiError(
      "CONFLICT",
      `Rentang tanggal tumpang tindih dengan siklus ${conflict.startDate}.`,
      { field: "startDate" },
    );
  }
}

export async function listHeatCycles(
  userId: string,
  catId?: string,
): Promise<HistorySlice<HeatCycleWithCat>> {
  if (catId) await getCat(userId, catId);

  const conditions: SQL[] = [eq(cats.ownerId, userId)];
  if (catId) conditions.push(eq(heatCycles.catId, catId));

  const rows = await db
    .select({
      cycle: heatCycles,
      catName: cats.name,
    })
    .from(heatCycles)
    .innerJoin(cats, eq(cats.id, heatCycles.catId))
    .where(and(...conditions))
    .orderBy(desc(heatCycles.startDate), asc(heatCycles.createdAt));

  // Jarak dihitung dari seluruh siklus (termasuk yang terkunci) per betina.
  const ascending = [...rows].sort((a, b) => {
    const byCat = a.cycle.catId.localeCompare(b.cycle.catId);
    return byCat !== 0
      ? byCat
      : a.cycle.startDate.localeCompare(b.cycle.startDate);
  });

  const gapById = new Map<string, number>();
  const lastByCat = new Map<string, string>();

  for (const row of ascending) {
    const previous = lastByCat.get(row.cycle.catId);
    if (previous) {
      gapById.set(row.cycle.id, daysBetweenIso(previous, row.cycle.startDate));
    }
    lastByCat.set(row.cycle.catId, row.cycle.startDate);
  }

  const items: HeatCycleWithCat[] = rows.map((row) => ({
    ...row.cycle,
    catName: row.catName,
    gapDays: gapById.get(row.cycle.id) ?? null,
  }));

  const plan = await getPlanInfo(userId);
  const windowStart = historyWindowStart(plan.limits.historyMonths);
  const windowStartIso = windowStart ? toIsoDate(windowStart) : null;

  if (!windowStartIso) {
    return { items, lockedCount: 0, windowStart: null };
  }

  const visible = items.filter((row) => row.startDate >= windowStartIso);

  return {
    items: visible,
    lockedCount: items.length - visible.length,
    windowStart: windowStartIso,
  };
}

async function getCycleWithOwner(userId: string, cycleId: string) {
  const [row] = await db
    .select({ cycle: heatCycles, cat: cats })
    .from(heatCycles)
    .innerJoin(cats, eq(cats.id, heatCycles.catId))
    .where(and(eq(heatCycles.id, cycleId), eq(cats.ownerId, userId)))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Siklus birahi tidak ditemukan.");
  }

  return row;
}

export async function createHeatCycle(
  userId: string,
  catId: string,
  input: HeatCycleCreateInput,
): Promise<HeatCycleRow> {
  const cat = await getCat(userId, catId);
  assertBreedingFemale(cat);
  assertCycleDates(input);
  await assertNoOverlap(catId, {
    startDate: input.startDate,
    endDate: input.endDate ?? null,
  });

  const [created] = await db
    .insert(heatCycles)
    .values({
      catId,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      notes: input.notes ?? null,
    })
    .returning();

  return created;
}

export async function updateHeatCycle(
  userId: string,
  cycleId: string,
  input: HeatCycleUpdateInput,
): Promise<HeatCycleRow> {
  const { cycle, cat } = await getCycleWithOwner(userId, cycleId);
  assertBreedingFemale(cat);

  const merged = {
    startDate: input.startDate ?? cycle.startDate,
    endDate: input.endDate !== undefined ? input.endDate : cycle.endDate,
  };

  assertCycleDates(merged);
  await assertNoOverlap(cycle.catId, merged, cycleId);

  const [updated] = await db
    .update(heatCycles)
    .set({
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    })
    .where(eq(heatCycles.id, cycleId))
    .returning();

  return updated;
}

export async function deleteHeatCycle(
  userId: string,
  cycleId: string,
): Promise<void> {
  const { cat } = await getCycleWithOwner(userId, cycleId);
  assertBreedingFemale(cat);
  await db.delete(heatCycles).where(eq(heatCycles.id, cycleId));
}
