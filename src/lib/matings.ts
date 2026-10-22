import { and, asc, desc, eq, getTableColumns, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { cats, litters, matings } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { getCat, type CatRow } from "@/lib/cats";
import { addDaysIso, isFutureDate, toIsoDate } from "@/lib/date";
import { getPlanInfo, historyWindowStart } from "@/lib/plan";
import { syncPregnancyReminder } from "@/lib/reminders";
import type { HistorySlice } from "@/lib/health";
import type {
  MatingCreateInput,
  MatingListQuery,
  MatingUpdateInput,
} from "@/lib/validation/breeding";

/**
 * Catatan kawin & kehamilan (FR-09). Semua akses memfilter `owner_id`.
 * Status "Hamil" menjaga pengingat estimasi lahir tetap sinkron.
 */

export const PREGNANCY_DAYS = 65;

export type MatingRow = typeof matings.$inferSelect;
export type LitterSummary = {
  id: string;
  birthDate: string;
  totalBorn: number;
  totalAlive: number;
};

export type MatingWithDetails = MatingRow & {
  queenName: string;
  sireName: string;
  litter: LitterSummary | null;
  relationshipWarning: string | null;
};

export type MatingRecord = {
  mating: MatingRow;
  queen: CatRow | null;
  sire: CatRow | null;
  litter: LitterSummary | null;
};

const queen = alias(cats, "mating_queen");
const sire = alias(cats, "mating_sire");

const matingSelection = {
  ...getTableColumns(matings),
  queenName: queen.name,
  queenSireId: queen.sireId,
  queenDamId: queen.damId,
  sireName: sire.name,
  sireSireId: sire.sireId,
  sireDamId: sire.damId,
  litterId: litters.id,
  litterBirthDate: litters.birthDate,
  litterTotalBorn: litters.totalBorn,
  litterTotalAlive: litters.totalAlive,
};

type MatingSelection = MatingRow & {
  queenName: string | null;
  queenSireId: string | null;
  queenDamId: string | null;
  sireName: string | null;
  sireSireId: string | null;
  sireDamId: string | null;
  litterId: string | null;
  litterBirthDate: string | null;
  litterTotalBorn: number | null;
  litterTotalAlive: number | null;
};

function relationshipWarning(
  input: {
    id: string;
    name: string;
    sireId: string | null;
    damId: string | null;
  } | null,
  other: {
    id: string;
    name: string;
    sireId: string | null;
    damId: string | null;
  } | null,
): string | null {
  if (!input || !other) return null;

  if (input.sireId === other.id || input.damId === other.id) {
    return `${other.name} adalah orang tua langsung dari ${input.name}. Kawin sedarah tetap bisa disimpan, tetapi pertimbangkan kesehatan keturunan.`;
  }

  if (other.sireId === input.id || other.damId === input.id) {
    return `${input.name} adalah orang tua langsung dari ${other.name}. Kawin sedarah tetap bisa disimpan, tetapi pertimbangkan kesehatan keturunan.`;
  }

  return null;
}

function mapMating(row: MatingSelection): MatingWithDetails {
  const queenName = row.queenName ?? row.queenNameManual ?? "Betina luar";
  const sireName = row.sireName ?? row.sireNameManual ?? "Pejantan luar";

  const litter =
    row.litterId && row.litterBirthDate
      ? {
          id: row.litterId,
          birthDate: row.litterBirthDate,
          totalBorn: row.litterTotalBorn ?? 0,
          totalAlive: row.litterTotalAlive ?? 0,
        }
      : null;

  return {
    id: row.id,
    ownerId: row.ownerId,
    queenId: row.queenId,
    queenNameManual: row.queenNameManual,
    sireId: row.sireId,
    sireNameManual: row.sireNameManual,
    matingDate: row.matingDate,
    outcome: row.outcome,
    expectedDueDate: row.expectedDueDate,
    notes: row.notes,
    createdAt: row.createdAt,
    queenName,
    sireName,
    litter,
    relationshipWarning: row.queenId && row.sireId
      ? relationshipWarning(
          {
            id: row.queenId,
            name: queenName,
            sireId: row.queenSireId,
            damId: row.queenDamId,
          },
          {
            id: row.sireId,
            name: sireName,
            sireId: row.sireSireId,
            damId: row.sireDamId,
          },
        )
      : null,
  };
}

export async function listMatings(
  userId: string,
  query: MatingListQuery = {},
): Promise<HistorySlice<MatingWithDetails>> {
  const conditions: SQL[] = [eq(matings.ownerId, userId)];
  if (query.outcome) conditions.push(eq(matings.outcome, query.outcome));

  const rows = await db
    .select(matingSelection)
    .from(matings)
    .leftJoin(queen, eq(queen.id, matings.queenId))
    .leftJoin(sire, eq(sire.id, matings.sireId))
    .leftJoin(litters, eq(litters.matingId, matings.id))
    .where(and(...conditions))
    .orderBy(desc(matings.matingDate), asc(matings.createdAt));

  const items = rows.map(mapMating);

  const plan = await getPlanInfo(userId);
  const windowStart = historyWindowStart(plan.limits.historyMonths);
  const windowStartIso = windowStart ? toIsoDate(windowStart) : null;

  if (!windowStartIso) {
    return { items, lockedCount: 0, windowStart: null };
  }

  // Kehamilan yang belum selesai tetap terlihat walau lebih tua dari jendela.
  const visible = items.filter(
    (row) =>
      row.matingDate >= windowStartIso ||
      row.outcome === "pregnant" ||
      row.outcome === "pending" ||
      (row.litter ? row.litter.birthDate >= windowStartIso : false),
  );

  return {
    items: visible,
    lockedCount: items.length - visible.length,
    windowStart: windowStartIso,
  };
}

async function getMatingRow(userId: string, matingId: string) {
  const [row] = await db
    .select(matingSelection)
    .from(matings)
    .leftJoin(queen, eq(queen.id, matings.queenId))
    .leftJoin(sire, eq(sire.id, matings.sireId))
    .leftJoin(litters, eq(litters.matingId, matings.id))
    .where(and(eq(matings.id, matingId), eq(matings.ownerId, userId)))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Catatan kawin tidak ditemukan.");
  }

  return row;
}

/** Detail + baris kucing asli (untuk validasi & peringatan hubungan). */
export async function getMating(
  userId: string,
  matingId: string,
): Promise<MatingWithDetails> {
  return mapMating(await getMatingRow(userId, matingId));
}

export async function getMatingRecord(
  userId: string,
  matingId: string,
): Promise<MatingRecord> {
  const row = await getMatingRow(userId, matingId);

  const [queenRow] = row.queenId
    ? await db
        .select()
        .from(cats)
        .where(and(eq(cats.id, row.queenId), eq(cats.ownerId, userId)))
        .limit(1)
    : [];
  const [sireRow] = row.sireId
    ? await db
        .select()
        .from(cats)
        .where(and(eq(cats.id, row.sireId), eq(cats.ownerId, userId)))
        .limit(1)
    : [];

  const details = mapMating(row);

  return {
    mating: {
      id: row.id,
      ownerId: row.ownerId,
      queenId: row.queenId,
      queenNameManual: row.queenNameManual,
      sireId: row.sireId,
      sireNameManual: row.sireNameManual,
      matingDate: row.matingDate,
      outcome: row.outcome,
      expectedDueDate: row.expectedDueDate,
      notes: row.notes,
      createdAt: row.createdAt,
    },
    queen: queenRow ?? null,
    sire: sireRow ?? null,
    litter: details.litter,
  };
}

async function resolveParent(
  userId: string,
  catId: string | null | undefined,
  sex: "male" | "female",
  field: string,
): Promise<CatRow | null> {
  if (!catId) return null;

  const cat = await getCat(userId, catId);

  if (cat.sex !== sex) {
    throw new ApiError(
      "VALIDATION_ERROR",
      sex === "female"
        ? "Betina harus kucing berjenis kelamin betina."
        : "Pejantan harus kucing berjenis kelamin jantan.",
      { field },
    );
  }

  if (cat.trackingStatus === "frozen") {
    throw new ApiError(
      "CAT_FROZEN",
      "Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk mengubah datanya.",
    );
  }

  if (cat.status !== "active" || cat.trackingStatus !== "tracked") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Pilih kucing yang aktif dan dilacak.",
      { field },
    );
  }

  return cat;
}

function assertMatingDates(matingDate: string, expectedDueDate?: string | null) {
  if (isFutureDate(matingDate)) {
    throw new ApiError("VALIDATION_ERROR", "Tanggal tidak boleh di masa depan", {
      field: "matingDate",
    });
  }

  if (expectedDueDate && expectedDueDate < matingDate) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Estimasi lahir tidak boleh sebelum tanggal kawin",
      { field: "expectedDueDate" },
    );
  }
}

function reminderTitle(queenName: string): string {
  return `Estimasi lahir ${queenName}`;
}

function dueDateFor(
  outcome: MatingRow["outcome"],
  matingDate: string,
  expectedDueDate: string | null | undefined,
): string | null {
  if (outcome !== "pregnant") return null;
  return expectedDueDate ?? addDaysIso(matingDate, PREGNANCY_DAYS);
}

export async function createMating(
  userId: string,
  input: MatingCreateInput,
): Promise<MatingWithDetails> {
  if (input.outcome === "delivered") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Status Sudah Melahirkan hanya bisa dicapai lewat pencatatan kelahiran.",
      { field: "outcome" },
    );
  }

  if (!input.queenId && !input.queenNameManual?.trim()) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Pilih betina atau isi nama betina luar",
      { field: "queenId" },
    );
  }
  if (!input.sireId && !input.sireNameManual?.trim()) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Pilih pejantan atau isi nama pejantan luar",
      { field: "sireId" },
    );
  }

  const queenRow = await resolveParent(
    userId,
    input.queenId,
    "female",
    "queenId",
  );
  const sireRow = await resolveParent(userId, input.sireId, "male", "sireId");

  if (queenRow && sireRow && queenRow.id === sireRow.id) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Betina dan pejantan tidak boleh kucing yang sama",
      { field: "sireId" },
    );
  }

  assertMatingDates(input.matingDate, input.expectedDueDate);

  const queenName =
    queenRow?.name ?? input.queenNameManual?.trim() ?? "Betina luar";
  const dueDate = dueDateFor(
    input.outcome,
    input.matingDate,
    input.expectedDueDate,
  );

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(matings)
      .values({
        ownerId: userId,
        queenId: input.queenId ?? null,
        queenNameManual: input.queenId
          ? null
          : (input.queenNameManual ?? null),
        sireId: input.sireId ?? null,
        sireNameManual: input.sireId ? null : (input.sireNameManual ?? null),
        matingDate: input.matingDate,
        outcome: input.outcome,
        expectedDueDate: dueDate,
        notes: input.notes ?? null,
      })
      .returning({ id: matings.id });

    await syncPregnancyReminder(tx, {
      userId,
      catId: input.queenId ?? null,
      matingId: created.id,
      title: reminderTitle(queenName),
      dueDate,
    });

    const row = await tx
      .select(matingSelection)
      .from(matings)
      .leftJoin(queen, eq(queen.id, matings.queenId))
      .leftJoin(sire, eq(sire.id, matings.sireId))
      .leftJoin(litters, eq(litters.matingId, matings.id))
      .where(eq(matings.id, created.id))
      .limit(1);

    return mapMating(row[0]);
  });
}

export async function updateMating(
  userId: string,
  matingId: string,
  input: MatingUpdateInput,
): Promise<MatingWithDetails> {
  const existing = await getMatingRow(userId, matingId);

  const nextQueenId =
    input.queenId !== undefined ? input.queenId : existing.queenId;
  const nextSireId =
    input.sireId !== undefined ? input.sireId : existing.sireId;
  const nextQueenManual =
    input.queenNameManual !== undefined
      ? input.queenNameManual
      : existing.queenNameManual;
  const nextSireManual =
    input.sireNameManual !== undefined
      ? input.sireNameManual
      : existing.sireNameManual;

  if (!nextQueenId && !nextQueenManual?.trim()) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Pilih betina atau isi nama betina luar",
      { field: "queenId" },
    );
  }
  if (!nextSireId && !nextSireManual?.trim()) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Pilih pejantan atau isi nama pejantan luar",
      { field: "sireId" },
    );
  }

  const queenRow = await resolveParent(userId, nextQueenId, "female", "queenId");
  const sireRow = await resolveParent(userId, nextSireId, "male", "sireId");

  if (queenRow && sireRow && queenRow.id === sireRow.id) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Betina dan pejantan tidak boleh kucing yang sama",
      { field: "sireId" },
    );
  }

  const nextMatingDate = input.matingDate ?? existing.matingDate;
  const nextOutcome = input.outcome ?? existing.outcome;
  const nextExpectedInput =
    input.expectedDueDate !== undefined
      ? input.expectedDueDate
      : existing.expectedDueDate;

  if (nextOutcome === "delivered" && !existing.litterId) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Status Sudah Melahirkan hanya bisa dicapai lewat pencatatan kelahiran.",
      { field: "outcome" },
    );
  }

  assertMatingDates(nextMatingDate, nextExpectedInput);

  const dueDate = dueDateFor(nextOutcome, nextMatingDate, nextExpectedInput);
  const queenName =
    queenRow?.name ?? nextQueenManual?.trim() ?? "Betina luar";

  return db.transaction(async (tx) => {
    await tx
      .update(matings)
      .set({
        ...(input.queenId !== undefined ? { queenId: input.queenId } : {}),
        ...(input.queenNameManual !== undefined
          ? { queenNameManual: input.queenNameManual }
          : {}),
        ...(input.sireId !== undefined ? { sireId: input.sireId } : {}),
        ...(input.sireNameManual !== undefined
          ? { sireNameManual: input.sireNameManual }
          : {}),
        ...(input.matingDate !== undefined
          ? { matingDate: input.matingDate }
          : {}),
        ...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
        expectedDueDate: dueDate,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      })
      .where(and(eq(matings.id, matingId), eq(matings.ownerId, userId)));

    await syncPregnancyReminder(tx, {
      userId,
      catId: nextQueenId ?? null,
      matingId,
      title: reminderTitle(queenName),
      dueDate,
    });

    const row = await tx
      .select(matingSelection)
      .from(matings)
      .leftJoin(queen, eq(queen.id, matings.queenId))
      .leftJoin(sire, eq(sire.id, matings.sireId))
      .leftJoin(litters, eq(litters.matingId, matings.id))
      .where(eq(matings.id, matingId))
      .limit(1);

    return mapMating(row[0]);
  });
}

export async function deleteMating(
  userId: string,
  matingId: string,
): Promise<void> {
  await getMatingRow(userId, matingId);

  await db.transaction(async (tx) => {
    await syncPregnancyReminder(tx, {
      userId,
      catId: null,
      matingId,
      title: "",
      dueDate: null,
    });

    await tx
      .delete(matings)
      .where(and(eq(matings.id, matingId), eq(matings.ownerId, userId)));
  });
}

export function defaultExpectedDueDate(matingDate: string): string {
  return addDaysIso(matingDate, PREGNANCY_DAYS);
}
