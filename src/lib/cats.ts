import { and, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { catOwnershipHistory, cats } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { assertCanAddCat, countTrackedCats, getPlanInfo } from "@/lib/plan";
import { getOwnerDisplayName } from "@/lib/profile";
import type {
  CatCreateInput,
  CatListQuery,
  CatUpdateInput,
} from "@/lib/validation/cat";

/**
 * Semua fungsi di modul ini WAJIB memfilter `owner_id` dari sesi.
 * Dipakai oleh route handler dan tes isolasi data.
 */

export type CatRow = typeof cats.$inferSelect;

const DEFAULT_LIST_STATUS = "active";

export async function listCats(
  userId: string,
  query: CatListQuery = {},
): Promise<CatRow[]> {
  const conditions: SQL[] = [eq(cats.ownerId, userId)];

  const status = query.status ?? DEFAULT_LIST_STATUS;
  if (status !== "all") {
    conditions.push(eq(cats.status, status));
  }

  if (query.sex) {
    conditions.push(eq(cats.sex, query.sex));
  }

  if (query.q) {
    const term = `%${query.q}%`;
    const search = or(
      ilike(cats.name, term),
      ilike(cats.breed, term),
      ilike(cats.microchipNo, term),
    );
    if (search) conditions.push(search);
  }

  return db
    .select()
    .from(cats)
    .where(and(...conditions))
    .orderBy(desc(cats.createdAt));
}

export async function getCat(userId: string, catId: string): Promise<CatRow> {
  const [row] = await db
    .select()
    .from(cats)
    .where(and(eq(cats.id, catId), eq(cats.ownerId, userId)))
    .limit(1);

  if (!row) {
    // 404 (bukan 403) agar keberadaan data pengguna lain tidak bocor.
    throw new ApiError("NOT_FOUND", "Kucing tidak ditemukan.");
  }

  return row;
}

async function assertParentsOwned(
  userId: string,
  sireId?: string | null,
  damId?: string | null,
) {
  const ids = [sireId, damId].filter((id): id is string => Boolean(id));
  if (ids.length === 0) return;

  const rows = await db
    .select({ id: cats.id })
    .from(cats)
    .where(and(eq(cats.ownerId, userId), inArray(cats.id, ids)));

  if (rows.length !== new Set(ids).size) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Ayah/ibu harus kucing milik kamu sendiri.",
      { field: "sireId" },
    );
  }
}

export async function createCat(
  userId: string,
  input: CatCreateInput,
): Promise<CatRow> {
  await assertCanAddCat(userId);
  await assertParentsOwned(userId, input.sireId, input.damId);

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
        birthDate: input.birthDate ?? null,
        photoPath: input.photoPath ?? null,
        isNeutered: input.isNeutered ?? false,
        microchipNo: input.microchipNo ?? null,
        pedigreeNo: input.pedigreeNo ?? null,
        sireId: input.sireId ?? null,
        sireNameManual: input.sireNameManual ?? null,
        damId: input.damId ?? null,
        damNameManual: input.damNameManual ?? null,
        status: input.status ?? "active",
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

export async function updateCat(
  userId: string,
  catId: string,
  input: CatUpdateInput,
): Promise<CatRow> {
  const existing = await getCat(userId, catId);

  if (existing.trackingStatus === "frozen") {
    const allowedKeys = new Set(["status"]);
    const blocked = Object.keys(input).filter((key) => !allowedKeys.has(key));

    if (blocked.length > 0) {
      throw new ApiError(
        "CAT_FROZEN",
        "Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk mengubah datanya.",
      );
    }
  }

  if (input.sireId === catId || input.damId === catId) {
    throw new ApiError("VALIDATION_ERROR", "Kucing tidak boleh menjadi orang tua dirinya sendiri.");
  }

  await assertParentsOwned(userId, input.sireId, input.damId);

  const [updated] = await db
    .update(cats)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.sex !== undefined ? { sex: input.sex } : {}),
      ...(input.breed !== undefined ? { breed: input.breed } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
      ...(input.photoPath !== undefined ? { photoPath: input.photoPath } : {}),
      ...(input.isNeutered !== undefined ? { isNeutered: input.isNeutered } : {}),
      ...(input.microchipNo !== undefined ? { microchipNo: input.microchipNo } : {}),
      ...(input.pedigreeNo !== undefined ? { pedigreeNo: input.pedigreeNo } : {}),
      ...(input.sireId !== undefined ? { sireId: input.sireId } : {}),
      ...(input.sireNameManual !== undefined
        ? { sireNameManual: input.sireNameManual }
        : {}),
      ...(input.damId !== undefined ? { damId: input.damId } : {}),
      ...(input.damNameManual !== undefined
        ? { damNameManual: input.damNameManual }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    })
    .where(and(eq(cats.id, catId), eq(cats.ownerId, userId)))
    .returning();

  return updated;
}

export async function deleteCat(userId: string, catId: string): Promise<void> {
  await getCat(userId, catId);
  await db.delete(cats).where(and(eq(cats.id, catId), eq(cats.ownerId, userId)));
}

export async function setTrackingStatus(
  userId: string,
  catId: string,
  trackingStatus: "tracked" | "frozen",
): Promise<CatRow> {
  const existing = await getCat(userId, catId);

  if (existing.trackingStatus === trackingStatus) return existing;

  if (trackingStatus === "tracked") {
    const plan = await getPlanInfo(userId);
    const max = plan.limits.maxTrackedCats;

    if (max !== null) {
      const tracked = await countTrackedCats(userId);
      if (tracked >= max) {
        throw new ApiError(
          "PLAN_CAT_LIMIT",
          `Paket Free hanya bisa melacak ${max} kucing. Bekukan kucing lain terlebih dahulu.`,
        );
      }
    }
  }

  const [updated] = await db
    .update(cats)
    .set({ trackingStatus })
    .where(and(eq(cats.id, catId), eq(cats.ownerId, userId)))
    .returning();

  return updated;
}

export type PedigreeNode = {
  id: string | null;
  name: string;
  isManual: boolean;
};

export type Pedigree = {
  cat: CatRow;
  sire: PedigreeNode | null;
  dam: PedigreeNode | null;
  grandparents: {
    sireSide: { sire: PedigreeNode | null; dam: PedigreeNode | null };
    damSide: { sire: PedigreeNode | null; dam: PedigreeNode | null };
  };
  children: PedigreeNode[];
};

async function resolveParent(
  userId: string,
  parentId: string | null,
  manualName: string | null,
): Promise<{ node: PedigreeNode | null; row: CatRow | null }> {
  if (parentId) {
    const [row] = await db
      .select()
      .from(cats)
      .where(and(eq(cats.id, parentId), eq(cats.ownerId, userId)))
      .limit(1);

    if (row) {
      return { node: { id: row.id, name: row.name, isManual: false }, row };
    }
  }

  if (manualName) {
    return { node: { id: null, name: manualName, isManual: true }, row: null };
  }

  return { node: null, row: null };
}

export async function getPedigree(
  userId: string,
  catId: string,
): Promise<Pedigree> {
  const cat = await getCat(userId, catId);

  const sire = await resolveParent(userId, cat.sireId, cat.sireNameManual);
  const dam = await resolveParent(userId, cat.damId, cat.damNameManual);

  const sireSire = sire.row
    ? await resolveParent(userId, sire.row.sireId, sire.row.sireNameManual)
    : { node: null, row: null };
  const sireDam = sire.row
    ? await resolveParent(userId, sire.row.damId, sire.row.damNameManual)
    : { node: null, row: null };
  const damSire = dam.row
    ? await resolveParent(userId, dam.row.sireId, dam.row.sireNameManual)
    : { node: null, row: null };
  const damDam = dam.row
    ? await resolveParent(userId, dam.row.damId, dam.row.damNameManual)
    : { node: null, row: null };

  const childRows = await db
    .select({ id: cats.id, name: cats.name })
    .from(cats)
    .where(
      and(
        eq(cats.ownerId, userId),
        or(eq(cats.sireId, catId), eq(cats.damId, catId)),
      ),
    );

  return {
    cat,
    sire: sire.node,
    dam: dam.node,
    grandparents: {
      sireSide: { sire: sireSire.node, dam: sireDam.node },
      damSide: { sire: damSire.node, dam: damDam.node },
    },
    children: childRows.map((child) => ({
      id: child.id,
      name: child.name,
      isManual: false,
    })),
  };
}
