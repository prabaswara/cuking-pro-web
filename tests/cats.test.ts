import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  catOwnershipHistory,
  cats,
  plans,
  subscriptions,
  user,
} from "@/db/schema";
import {
  createCat,
  deleteCat,
  getCat,
  getPedigree,
  listCats,
  setTrackingStatus,
  updateCat,
} from "@/lib/cats";
import { FREE_MAX_TRACKED_CATS } from "@/lib/plan";

/**
 * Tes integrasi lapisan data terhadap PostgreSQL sungguhan.
 * Fokus: isolasi antar pemilik dan penegakan batas paket.
 *
 * Prasyarat: `npm run db:test:setup` (lihat README).
 */

const createdUserIds: string[] = [];
const createdPlanIds: string[] = [];

async function createUser(name: string): Promise<string> {
  const id = `test_${randomUUID()}`;

  await db.insert(user).values({
    id,
    name,
    email: `${id}@example.test`,
    emailVerified: true,
  });

  createdUserIds.push(id);
  return id;
}

async function addProSubscription(userId: string) {
  const code = `pro_test_${randomUUID()}`;

  const [plan] = await db
    .insert(plans)
    .values({
      code,
      name: "Pro Test",
      priceIdr: 1000,
      durationDays: 30,
      isActive: true,
    })
    .returning({ id: plans.id });

  createdPlanIds.push(plan.id);

  const startsAt = new Date(Date.now() - 86_400_000);
  const endsAt = new Date(Date.now() + 30 * 86_400_000);

  await db.insert(subscriptions).values({
    userId,
    planId: plan.id,
    startsAt,
    endsAt,
  });
}

afterAll(async () => {
  if (createdUserIds.length > 0) {
    // Riwayat memakai ON DELETE SET NULL, jadi harus dibersihkan eksplisit.
    await db
      .delete(catOwnershipHistory)
      .where(inArray(catOwnershipHistory.ownerId, createdUserIds));

    await db
      .delete(subscriptions)
      .where(inArray(subscriptions.userId, createdUserIds));

    await db.delete(user).where(inArray(user.id, createdUserIds));
  }

  for (const planId of createdPlanIds) {
    await db.delete(plans).where(eq(plans.id, planId));
  }
});

describe("kucing — isolasi antar pemilik", () => {
  it("hanya pemilik yang bisa membaca, mengubah, dan menghapus", async () => {
    const owner = await createUser("Pemilik A");
    const other = await createUser("Pemilik B");

    const cat = await createCat(owner, { name: "Mochi", sex: "female" });

    expect(cat.ownerId).toBe(owner);

    // Pemilik lain tidak menemukan (404, bukan 403).
    await expect(getCat(other, cat.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });

    await expect(
      updateCat(other, cat.id, { name: "Bajakan" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(deleteCat(other, cat.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    // Daftar milik pemilik lain tidak memuat kucing ini.
    const otherCats = await listCats(other, { status: "all" });
    expect(otherCats.some((row) => row.id === cat.id)).toBe(false);
  });

  it("mencatat riwayat kepemilikan saat kucing dibuat", async () => {
    const owner = await createUser("Pemilik Riwayat");
    const cat = await createCat(owner, { name: "Luna", sex: "female" });

    const history = await db
      .select()
      .from(catOwnershipHistory)
      .where(eq(catOwnershipHistory.catId, cat.id));

    expect(history).toHaveLength(1);
    expect(history[0].ownerId).toBe(owner);
    expect(history[0].ownerDisplayName).toBe("Pemilik Riwayat");
    expect(history[0].endedAt).toBeNull();
    expect(history[0].acquiredVia).toBe("created");
  });

  it("menolak ayah/ibu milik pengguna lain (tanpa FK lintas pemilik)", async () => {
    const owner = await createUser("Pemilik Induk");
    const other = await createUser("Pemilik Lain");

    const parent = await createCat(owner, { name: "King", sex: "male" });

    await expect(
      createCat(other, {
        name: "Anak",
        sex: "female",
        sireId: parent.id,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});

describe("paket Free", () => {
  it(`menolak kucing aktif ke-${FREE_MAX_TRACKED_CATS + 1}`, async () => {
    const owner = await createUser("Pemilik Free");

    for (let i = 0; i < FREE_MAX_TRACKED_CATS; i += 1) {
      await createCat(owner, { name: `Kucing ${i + 1}`, sex: "female" });
    }

    await expect(
      createCat(owner, { name: "Kucing Ekstra", sex: "male" }),
    ).rejects.toMatchObject({ code: "PLAN_CAT_LIMIT", status: 403 });
  });

  it("kucing beku hanya boleh diubah statusnya", async () => {
    const owner = await createUser("Pemilik Beku");
    const cat = await createCat(owner, { name: "Beku", sex: "male" });

    await setTrackingStatus(owner, cat.id, "frozen");

    await expect(
      updateCat(owner, cat.id, { name: "Tetap Beku" }),
    ).rejects.toMatchObject({ code: "CAT_FROZEN" });

    const updated = await updateCat(owner, cat.id, { status: "deceased" });
    expect(updated.status).toBe("deceased");
  });

  it("tidak bisa melacak kucing melebihi batas", async () => {
    const owner = await createUser("Pemilik Tukar");

    // Simulasikan data lama/Pro yang berakhir: 3 kucing aktif, 2 dilacak.
    const inserted = await db
      .insert(cats)
      .values([
        { ownerId: owner, name: "Satu", sex: "female" },
        { ownerId: owner, name: "Dua", sex: "female" },
        {
          ownerId: owner,
          name: "Tiga",
          sex: "female",
          trackingStatus: "frozen",
        },
      ])
      .returning({ id: cats.id });

    await expect(
      setTrackingStatus(owner, inserted[2].id, "tracked"),
    ).rejects.toMatchObject({ code: "PLAN_CAT_LIMIT", status: 403 });
  });
});

describe("paket Pro", () => {
  it("bisa menambah kucing tanpa batas Free", async () => {
    const owner = await createUser("Pemilik Pro");
    await addProSubscription(owner);

    for (let i = 0; i < FREE_MAX_TRACKED_CATS + 1; i += 1) {
      const cat = await createCat(owner, {
        name: `Pro ${i + 1}`,
        sex: "female",
      });
      expect(cat.trackingStatus).toBe("tracked");
    }

    const cats = await listCats(owner, { status: "active" });
    expect(cats.length).toBe(FREE_MAX_TRACKED_CATS + 1);
  });
});

describe("silsilah", () => {
  it("menggabungkan induk tertaut dan nama manual", async () => {
    const owner = await createUser("Pemilik Silsilah");

    const sire = await createCat(owner, { name: "Ayah", sex: "male" });
    const child = await createCat(owner, {
      name: "Anak",
      sex: "female",
      sireId: sire.id,
      damNameManual: "Ibu Manual",
    });

    const pedigree = await getPedigree(owner, child.id);

    expect(pedigree.sire).toEqual({
      id: sire.id,
      name: "Ayah",
      isManual: false,
    });
    expect(pedigree.dam).toEqual({
      id: null,
      name: "Ibu Manual",
      isManual: true,
    });
    expect(pedigree.children).toEqual([]);

    const sirePedigree = await getPedigree(owner, sire.id);
    expect(sirePedigree.children.map((node) => node.id)).toContain(child.id);
  });
});
