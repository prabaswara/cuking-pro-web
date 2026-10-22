import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { catDocuments, cats } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { getCat } from "@/lib/cats";
import { toIsoDate } from "@/lib/date";
import { getPlanInfo, historyWindowStart } from "@/lib/plan";
import { deleteStoredDocument } from "@/lib/storage";
import type {
  DocumentCreateInput,
  DocumentUpdateInput,
} from "@/lib/validation/document";
import type { HistorySlice } from "@/lib/health";

export type CatDocumentRow = typeof catDocuments.$inferSelect;

function assertWritableCat(cat: { trackingStatus: "tracked" | "frozen" }): void {
  if (cat.trackingStatus === "frozen") {
    throw new ApiError(
      "CAT_FROZEN",
      "Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk mengubah datanya.",
    );
  }
}

export async function listDocuments(
  userId: string,
  catId: string,
): Promise<HistorySlice<CatDocumentRow>> {
  await getCat(userId, catId);

  const plan = await getPlanInfo(userId);
  const windowStart = historyWindowStart(plan.limits.historyMonths);
  const windowStartIso = windowStart ? toIsoDate(windowStart) : null;

  const rows = await db
    .select()
    .from(catDocuments)
    .where(eq(catDocuments.catId, catId))
    .orderBy(desc(catDocuments.uploadedAt), desc(catDocuments.createdAt));

  if (!windowStartIso) {
    return { items: rows, lockedCount: 0, windowStart: null };
  }

  const items = rows.filter((row) => row.uploadedAt >= windowStartIso);

  return {
    items,
    lockedCount: rows.length - items.length,
    windowStart: windowStartIso,
  };
}

async function getDocumentWithOwner(userId: string, documentId: string) {
  const [row] = await db
    .select({ document: catDocuments, cat: cats })
    .from(catDocuments)
    .innerJoin(cats, eq(cats.id, catDocuments.catId))
    .where(and(eq(catDocuments.id, documentId), eq(cats.ownerId, userId)))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Dokumen tidak ditemukan.");
  }

  return row;
}

export async function getDocument(
  userId: string,
  documentId: string,
): Promise<CatDocumentRow> {
  const { document } = await getDocumentWithOwner(userId, documentId);
  return document;
}

export async function createDocument(
  userId: string,
  catId: string,
  input: DocumentCreateInput,
): Promise<CatDocumentRow> {
  const cat = await getCat(userId, catId);
  assertWritableCat(cat);

  const [created] = await db
    .insert(catDocuments)
    .values({
      catId,
      title: input.title,
      category: input.category,
      filePath: input.filePath ?? null,
      fileType: input.fileType,
      sizeBytes: input.sizeBytes ?? null,
      uploadedAt: input.uploadedAt,
      source: input.source ?? null,
      notes: input.notes ?? null,
      verified: false,
    })
    .returning();

  return created;
}

export async function updateDocument(
  userId: string,
  documentId: string,
  input: DocumentUpdateInput,
): Promise<CatDocumentRow> {
  const { cat } = await getDocumentWithOwner(userId, documentId);
  assertWritableCat(cat);

  const [updated] = await db
    .update(catDocuments)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.filePath !== undefined ? { filePath: input.filePath } : {}),
      ...(input.fileType !== undefined ? { fileType: input.fileType } : {}),
      ...(input.sizeBytes !== undefined ? { sizeBytes: input.sizeBytes } : {}),
      ...(input.uploadedAt !== undefined ? { uploadedAt: input.uploadedAt } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    })
    .where(eq(catDocuments.id, documentId))
    .returning();

  return updated;
}

export async function deleteDocument(
  userId: string,
  documentId: string,
): Promise<void> {
  const { document, cat } = await getDocumentWithOwner(userId, documentId);
  assertWritableCat(cat);

  await db.delete(catDocuments).where(eq(catDocuments.id, documentId));

  if (document.filePath) {
    await deleteStoredDocument(document.filePath);
  }
}
