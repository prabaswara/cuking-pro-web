import { and, desc, eq, gte, isNull, lte, or, type SQL } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import { catSales, cats, reminders } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { getCat } from "@/lib/cats";
import { todayIso, toIsoDate } from "@/lib/date";
import { getPlanInfo, historyWindowStart } from "@/lib/plan";
import type { HistorySlice } from "@/lib/health";
import {
  saleStateSchema,
  type SaleCreateInput,
  type SaleListQuery,
  type SaleUpdateInput,
  type CatSaleStatus,
} from "@/lib/validation/sale";

/**
 * Penjualan kucing (FR-19). Owner-scoped; status Terjual final dan
 * mengubah status kucing menjadi `sold`, serta menghentikan pengingatnya.
 */

export type CatSaleRow = typeof catSales.$inferSelect;

export type SaleWithCat = CatSaleRow & {
  catPhotoPath: string | null;
  catStatus: string | null;
};

export type SalesSummary = {
  month: string;
  soldCount: number;
  totalRevenue: number;
};

export type SalesListResult = HistorySlice<SaleWithCat> & {
  summary: SalesSummary;
};

const ALLOWED_TRANSITIONS: Record<CatSaleStatus, CatSaleStatus[]> = {
  listed: ["listed", "reserved", "sold", "cancelled"],
  reserved: ["reserved", "sold", "cancelled"],
  sold: ["sold"],
  cancelled: ["cancelled", "listed"],
};

function saleDateOf(row: { saleDate: string | null; createdAt: Date }): string {
  return row.saleDate ?? toIsoDate(row.createdAt);
}

async function assertCatSellable(userId: string, catId: string) {
  const cat = await getCat(userId, catId);

  if (cat.status !== "active") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Hanya kucing aktif yang bisa dijual.",
      { field: "catId" },
    );
  }

  if (cat.trackingStatus === "frozen") {
    throw new ApiError(
      "CAT_FROZEN",
      "Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk menjualnya.",
    );
  }

  return cat;
}

async function assertNoActiveSale(
  userId: string,
  catId: string,
  excludeId?: string,
): Promise<void> {
  const [active] = await db
    .select({ id: catSales.id })
    .from(catSales)
    .where(
      and(
        eq(catSales.ownerId, userId),
        eq(catSales.catId, catId),
        or(eq(catSales.status, "listed"), eq(catSales.status, "reserved")),
      ),
    )
    .limit(1);

  if (active && active.id !== excludeId) {
    throw new ApiError(
      "CONFLICT",
      "Kucing ini sudah punya penjualan aktif (Dijual/Dipesan).",
    );
  }
}

async function stopCatReminders(
  executor: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  catId: string,
): Promise<void> {
  await executor
    .update(reminders)
    .set({ doneAt: new Date() })
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.catId, catId),
        isNull(reminders.doneAt),
      ),
    );
}

function monthRange(month: string): { from: string; to: string } {
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();

  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function assertSaleState(data: unknown) {
  try {
    return saleStateSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      throw new ApiError("VALIDATION_ERROR", issue.message, {
        field: typeof issue.path[0] === "string" ? issue.path[0] : undefined,
      });
    }
    throw error;
  }
}

export async function listSales(
  userId: string,
  query: SaleListQuery = {},
): Promise<SalesListResult> {
  const conditions: SQL[] = [eq(catSales.ownerId, userId)];
  if (query.status) conditions.push(eq(catSales.status, query.status));

  const rows = await db
    .select({
      sale: catSales,
      catPhotoPath: cats.photoPath,
      catStatus: cats.status,
    })
    .from(catSales)
    .leftJoin(cats, eq(cats.id, catSales.catId))
    .where(and(...conditions))
    .orderBy(desc(catSales.createdAt));

  const items: SaleWithCat[] = rows.map((row) => ({
    ...row.sale,
    catPhotoPath: row.catPhotoPath,
    catStatus: row.catStatus,
  }));

  const summaryMonth = query.month ?? todayIso().slice(0, 7);
  const { from, to } = monthRange(summaryMonth);

  const soldRows = await db
    .select({ finalPrice: catSales.finalPrice })
    .from(catSales)
    .where(
      and(
        eq(catSales.ownerId, userId),
        eq(catSales.status, "sold"),
        gte(catSales.saleDate, from),
        lte(catSales.saleDate, to),
      ),
    );

  const summary: SalesSummary = {
    month: summaryMonth,
    soldCount: soldRows.length,
    totalRevenue: soldRows.reduce((total, row) => total + (row.finalPrice ?? 0), 0),
  };

  const plan = await getPlanInfo(userId);
  const windowStart = historyWindowStart(plan.limits.historyMonths);
  const windowStartIso = windowStart ? toIsoDate(windowStart) : null;

  if (!windowStartIso) {
    return { items, lockedCount: 0, windowStart: null, summary };
  }

  const visible = items.filter(
    (row) =>
      row.status === "listed" ||
      row.status === "reserved" ||
      saleDateOf(row) >= windowStartIso,
  );

  return {
    items: visible,
    lockedCount: items.length - visible.length,
    windowStart: windowStartIso,
    summary,
  };
}

export async function getActiveSaleForCat(
  userId: string,
  catId: string,
): Promise<CatSaleRow | null> {
  const [row] = await db
    .select()
    .from(catSales)
    .where(
      and(
        eq(catSales.ownerId, userId),
        eq(catSales.catId, catId),
        or(eq(catSales.status, "listed"), eq(catSales.status, "reserved")),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getSale(
  userId: string,
  saleId: string,
): Promise<SaleWithCat> {
  const [row] = await db
    .select({
      sale: catSales,
      catPhotoPath: cats.photoPath,
      catStatus: cats.status,
    })
    .from(catSales)
    .leftJoin(cats, eq(cats.id, catSales.catId))
    .where(and(eq(catSales.id, saleId), eq(catSales.ownerId, userId)))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Penjualan tidak ditemukan.");
  }

  return {
    ...row.sale,
    catPhotoPath: row.catPhotoPath,
    catStatus: row.catStatus,
  };
}

export async function createSale(
  userId: string,
  input: SaleCreateInput,
): Promise<CatSaleRow> {
  if (!input.catId) {
    throw new ApiError("VALIDATION_ERROR", "Pilih kucing yang dijual", {
      field: "catId",
    });
  }

  const cat = await assertCatSellable(userId, input.catId);

  assertSaleState({
    ...input,
    catId: input.catId,
  });

  if (input.status !== "cancelled") {
    await assertNoActiveSale(userId, input.catId);
  }

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(catSales)
      .values({
        ownerId: userId,
        catId: input.catId,
        catName: cat.name,
        status: input.status,
        askingPrice: input.askingPrice ?? null,
        buyerName: input.buyerName ?? null,
        buyerWhatsapp: input.buyerWhatsapp ?? null,
        finalPrice: input.finalPrice ?? null,
        depositAmount: input.depositAmount ?? null,
        depositPaid: input.depositPaid,
        saleDate: input.saleDate ?? null,
        notes: input.notes ?? null,
      })
      .returning();

    if (input.status === "sold") {
      await tx
        .update(cats)
        .set({ status: "sold" })
        .where(and(eq(cats.id, cat.id), eq(cats.ownerId, userId)));

      await stopCatReminders(tx, userId, cat.id);
    }

    return created;
  });
}

export async function updateSale(
  userId: string,
  saleId: string,
  input: SaleUpdateInput,
): Promise<CatSaleRow> {
  const existing = await getSale(userId, saleId);

  if (existing.status === "sold") {
    throw new ApiError(
      "CONFLICT",
      "Penjualan berstatus Terjual bersifat final. Hapus penjualan untuk mengoreksi.",
    );
  }

  const nextStatus = input.status ?? existing.status;

  if (!ALLOWED_TRANSITIONS[existing.status].includes(nextStatus)) {
    throw new ApiError(
      "CONFLICT",
      `Status penjualan tidak bisa berubah dari ${existing.status} ke ${nextStatus}.`,
    );
  }

  const nextCatId = input.catId !== undefined ? input.catId : existing.catId;

  let catName = existing.catName;

  if (nextCatId && nextCatId !== existing.catId) {
    const cat = await assertCatSellable(userId, nextCatId);
    catName = cat.name;
    await assertNoActiveSale(userId, nextCatId, saleId);
  } else if (!nextCatId) {
    throw new ApiError("VALIDATION_ERROR", "Pilih kucing yang dijual", {
      field: "catId",
    });
  }

  if (
    nextCatId &&
    (nextStatus === "sold" ||
      (existing.status === "cancelled" &&
        (nextStatus === "listed" || nextStatus === "reserved")))
  ) {
    await assertCatSellable(userId, nextCatId);
  }

  if (
    (nextStatus === "listed" || nextStatus === "reserved") &&
    nextCatId &&
    (existing.status === "cancelled" || nextStatus !== existing.status)
  ) {
    await assertNoActiveSale(userId, nextCatId, saleId);
  }

  const merged = {
    catId: nextCatId,
    status: nextStatus,
    askingPrice:
      input.askingPrice !== undefined ? input.askingPrice : existing.askingPrice,
    buyerName:
      input.buyerName !== undefined ? input.buyerName : existing.buyerName,
    buyerWhatsapp:
      input.buyerWhatsapp !== undefined
        ? input.buyerWhatsapp
        : existing.buyerWhatsapp,
    finalPrice:
      input.finalPrice !== undefined ? input.finalPrice : existing.finalPrice,
    depositAmount:
      input.depositAmount !== undefined
        ? input.depositAmount
        : existing.depositAmount,
    depositPaid:
      input.depositPaid !== undefined ? input.depositPaid : existing.depositPaid,
    saleDate: input.saleDate !== undefined ? input.saleDate : existing.saleDate,
    notes: input.notes !== undefined ? input.notes : existing.notes,
  };

  assertSaleState(merged);

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(catSales)
      .set({
        ...(input.catId !== undefined ? { catId: input.catId } : {}),
        catName,
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.askingPrice !== undefined
          ? { askingPrice: input.askingPrice }
          : {}),
        ...(input.buyerName !== undefined
          ? { buyerName: input.buyerName }
          : {}),
        ...(input.buyerWhatsapp !== undefined
          ? { buyerWhatsapp: input.buyerWhatsapp }
          : {}),
        ...(input.finalPrice !== undefined
          ? { finalPrice: input.finalPrice }
          : {}),
        ...(input.depositAmount !== undefined
          ? { depositAmount: input.depositAmount }
          : {}),
        ...(input.depositPaid !== undefined
          ? { depositPaid: input.depositPaid }
          : {}),
        ...(input.saleDate !== undefined
          ? { saleDate: input.saleDate }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      })
      .where(and(eq(catSales.id, saleId), eq(catSales.ownerId, userId)))
      .returning();

    if (nextStatus === "sold" && nextCatId) {
      await tx
        .update(cats)
        .set({ status: "sold" })
        .where(and(eq(cats.id, nextCatId), eq(cats.ownerId, userId)));

      await stopCatReminders(tx, userId, nextCatId);
    }

    return updated;
  });
}

export async function deleteSale(
  userId: string,
  saleId: string,
): Promise<void> {
  const existing = await getSale(userId, saleId);

  await db.transaction(async (tx) => {
    await tx
      .delete(catSales)
      .where(and(eq(catSales.id, saleId), eq(catSales.ownerId, userId)));

    if (existing.status === "sold" && existing.catId) {
      // Kembalikan ke aktif hanya bila kucing masih milik pengguna ini.
      await tx
        .update(cats)
        .set({ status: "active" })
        .where(
          and(
            eq(cats.id, existing.catId),
            eq(cats.ownerId, userId),
            eq(cats.status, "sold"),
          ),
        );
    }
  });
}
