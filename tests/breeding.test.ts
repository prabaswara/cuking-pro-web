import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  catOwnershipHistory,
  cats,
  heatCycles,
  litters,
  plans,
  reminders,
  subscriptions,
  user,
} from "@/db/schema";
import { createCat, setTrackingStatus } from "@/lib/cats";
import { addDaysIso, todayIso } from "@/lib/date";
import {
  createHeatCycle,
  deleteHeatCycle,
  listHeatCycles,
  updateHeatCycle,
} from "@/lib/heat-cycles";
import { addKitten, createLitter, getLitter } from "@/lib/litters";
import {
  createMating,
  defaultExpectedDueDate,
  getMating,
  listMatings,
  updateMating,
} from "@/lib/matings";
import { FREE_MAX_TRACKED_CATS } from "@/lib/plan";
import { matingUpdateSchema } from "@/lib/validation/breeding";

/**
 * Tes integrasi Fase 3: siklus birahi, kawin/kehamilan, kelahiran,
 * anak kucing, dan jendela riwayat Free.
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

  await db.insert(subscriptions).values({
    userId,
    planId: plan.id,
    startsAt: new Date(Date.now() - 86_400_000),
    endsAt: new Date(Date.now() + 30 * 86_400_000),
  });
}

async function pregnancyReminders(userId: string, matingId: string) {
  return db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.sourceType, "pregnancy"),
        eq(reminders.sourceId, matingId),
      ),
    );
}

afterAll(async () => {
  if (createdUserIds.length > 0) {
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

describe("siklus birahi", () => {
  it("hanya betina, menolak rentang terbalik/tumpang tindih, dan menghitung jarak", async () => {
    const owner = await createUser("Breeder Birahi");
    const other = await createUser("Pemilik Lain");

    const female = await createCat(owner, { name: "Mochi", sex: "female" });
    const male = await createCat(owner, { name: "King", sex: "male" });

    await expect(
      createHeatCycle(owner, male.id, { startDate: todayIso() }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const first = await createHeatCycle(owner, female.id, {
      startDate: addDaysIso(todayIso(), -40),
      endDate: addDaysIso(todayIso(), -36),
      notes: "Gelisah",
    });

    expect(first.catId).toBe(female.id);

    const second = await createHeatCycle(owner, female.id, {
      startDate: addDaysIso(todayIso(), -9),
      endDate: addDaysIso(todayIso(), -6),
    });

    await expect(
      createHeatCycle(owner, female.id, {
        startDate: addDaysIso(todayIso(), -37),
        endDate: addDaysIso(todayIso(), -35),
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await expect(
      createHeatCycle(owner, female.id, {
        startDate: addDaysIso(todayIso(), -20),
        endDate: addDaysIso(todayIso(), -25),
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const { items } = await listHeatCycles(owner, female.id);
    const byId = new Map(items.map((item) => [item.id, item]));

    expect(byId.get(second.id)?.gapDays).toBe(31);
    expect(byId.get(first.id)?.gapDays).toBeNull();

    const otherList = await listHeatCycles(other);
    expect(otherList.items).toHaveLength(0);

    await expect(
      updateHeatCycle(other, second.id, { notes: "Bajakan" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(deleteHeatCycle(other, first.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    await expect(
      updateHeatCycle(owner, second.id, {
        startDate: addDaysIso(todayIso(), -38),
        endDate: addDaysIso(todayIso(), -37),
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("menolak kucing beku", async () => {
    const owner = await createUser("Breeder Beku");
    const cat = await createCat(owner, { name: "Frozen", sex: "female" });

    await setTrackingStatus(owner, cat.id, "frozen");

    await expect(
      createHeatCycle(owner, cat.id, { startDate: todayIso() }),
    ).rejects.toMatchObject({ code: "CAT_FROZEN" });
  });
});

describe("kawin & kehamilan", () => {
  it("default estimasi lahir +65 hari dan pengingat tersinkron", async () => {
    const owner = await createUser("Breeder Hamil");
    const other = await createUser("Pemilik Lain");

    const queen = await createCat(owner, { name: "Luna", sex: "female" });
    const sire = await createCat(owner, { name: "King", sex: "male" });

    const matingDate = todayIso();
    const mating = await createMating(owner, {
      queenId: queen.id,
      queenNameManual: null,
      sireId: sire.id,
      sireNameManual: null,
      matingDate,
      outcome: "pregnant",
      expectedDueDate: null,
      notes: null,
    });

    expect(mating.queenName).toBe("Luna");
    expect(mating.sireName).toBe("King");
    expect(mating.expectedDueDate).toBe(defaultExpectedDueDate(matingDate));

    let linked = await pregnancyReminders(owner, mating.id);
    expect(linked).toHaveLength(1);
    expect(linked[0].dueDate).toBe(defaultExpectedDueDate(matingDate));
    expect(linked[0].catId).toBe(queen.id);

    const notPregnant = await updateMating(owner, mating.id, {
      outcome: "not_pregnant",
    });
    expect(notPregnant.expectedDueDate).toBeNull();
    linked = await pregnancyReminders(owner, mating.id);
    expect(linked).toHaveLength(0);

    const manualDue = addDaysIso(matingDate, 60);
    const pregnantAgain = await updateMating(owner, mating.id, {
      outcome: "pregnant",
      expectedDueDate: manualDue,
    });
    expect(pregnantAgain.expectedDueDate).toBe(manualDue);
    linked = await pregnancyReminders(owner, mating.id);
    expect(linked).toHaveLength(1);
    expect(linked[0].dueDate).toBe(manualDue);

    // PATCH parsial (hanya tanggal) tidak boleh mereset hasil menjadi pending.
    const partialDue = addDaysIso(matingDate, 62);
    const partial = await updateMating(
      owner,
      mating.id,
      matingUpdateSchema.parse({ expectedDueDate: partialDue }),
    );
    expect(partial.outcome).toBe("pregnant");
    expect(partial.expectedDueDate).toBe(partialDue);
    linked = await pregnancyReminders(owner, mating.id);
    expect(linked).toHaveLength(1);
    expect(linked[0].dueDate).toBe(partialDue);

    await expect(getMating(other, mating.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("memvalidasi jenis kelamin, nama manual, dan peringatan sedarah", async () => {
    const owner = await createUser("Breeder Sedarah");

    const queen = await createCat(owner, { name: "Anak", sex: "female" });
    const sire = await createCat(owner, { name: "Ayah", sex: "male" });

    await db
      .update(cats)
      .set({ sireId: sire.id })
      .where(and(eq(cats.id, queen.id), eq(cats.ownerId, owner)));

    await expect(
      createMating(owner, {
        queenId: sire.id,
        sireId: sire.id,
        matingDate: todayIso(),
        outcome: "pending",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const related = await createMating(owner, {
      queenId: queen.id,
      sireId: sire.id,
      matingDate: todayIso(),
      outcome: "pending",
    });

    expect(related.relationshipWarning).not.toBeNull();

    const external = await createMating(owner, {
      queenNameManual: "Betina Luar",
      sireNameManual: "Pejantan Luar",
      matingDate: todayIso(),
      outcome: "pending",
    });

    expect(external.queenName).toBe("Betina Luar");
    expect(external.sireName).toBe("Pejantan Luar");
    expect(external.relationshipWarning).toBeNull();
  });
});

describe("kelahiran & anak kucing", () => {
  it("satu litter per kawin, menutup pengingat, dan membatasi pendaftaran anak", async () => {
    const owner = await createUser("Breeder Litter");
    const other = await createUser("Pemilik Lain");
    await addProSubscription(owner);

    const queen = await createCat(owner, { name: "Mochi", sex: "female" });
    const sire = await createCat(owner, { name: "King", sex: "male" });

    const mating = await createMating(owner, {
      queenId: queen.id,
      sireId: sire.id,
      matingDate: addDaysIso(todayIso(), -2),
      outcome: "pregnant",
    });

    const litter = await createLitter(owner, mating.id, {
      birthDate: todayIso(),
      totalBorn: 3,
      totalAlive: 2,
      notes: "Sehat",
    });

    const delivered = await getMating(owner, mating.id);
    expect(delivered.outcome).toBe("delivered");
    expect(delivered.litter?.id).toBe(litter.id);
    expect(await pregnancyReminders(owner, mating.id)).toHaveLength(0);

    await expect(
      createLitter(owner, mating.id, {
        birthDate: todayIso(),
        totalBorn: 2,
        totalAlive: 2,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const first = await addKitten(owner, litter.id, {
      name: "Anak 1",
      sex: "female",
      color: "Lilac",
    });
    expect(first.litterId).toBe(litter.id);
    expect(first.damId).toBe(queen.id);
    expect(first.sireId).toBe(sire.id);
    expect(first.birthDate).toBe(todayIso());

    const second = await addKitten(owner, litter.id, {
      name: "Anak 2",
      sex: "male",
      color: "Blue",
      breed: "British Shorthair",
    });
    expect(second.birthDate).toBe(todayIso());

    await expect(
      addKitten(owner, litter.id, {
        name: "Anak 3",
        sex: "female",
        color: "Cream",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const details = await getLitter(owner, litter.id);
    expect(details.kittens).toHaveLength(2);
    expect(details.queenName).toBe("Mochi");
    expect(details.sireName).toBe("King");

    await expect(getLitter(other, litter.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      addKitten(other, litter.id, {
        name: "Bajakan",
        sex: "male",
        color: "Putih",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const registered = await db
      .select({ id: cats.id })
      .from(cats)
      .where(and(eq(cats.ownerId, owner), eq(cats.litterId, litter.id)));
    expect(registered).toHaveLength(2);
  });

  it("menolak jumlah hidup > lahir dan kelahiran sebelum kawin", async () => {
    const owner = await createUser("Breeder Validasi");
    const matingDate = addDaysIso(todayIso(), -10);

    const mating = await createMating(owner, {
      queenNameManual: "Luar",
      sireNameManual: "Luar",
      matingDate,
      outcome: "pregnant",
    });

    await expect(
      createLitter(owner, mating.id, {
        birthDate: todayIso(),
        totalBorn: 2,
        totalAlive: 3,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      createLitter(owner, mating.id, {
        birthDate: addDaysIso(matingDate, -1),
        totalBorn: 2,
        totalAlive: 2,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(await db.select().from(litters).where(eq(litters.matingId, mating.id)))
      .toHaveLength(0);
  });

  it("anak kucing tetap terkena batas kucing paket Free", async () => {
    const owner = await createUser("Breeder Free");

    for (let i = 0; i < FREE_MAX_TRACKED_CATS; i += 1) {
      await createCat(owner, { name: `Kucing ${i + 1}`, sex: "female" });
    }

    const mating = await createMating(owner, {
      queenNameManual: "Luar",
      sireNameManual: "Luar",
      matingDate: todayIso(),
      outcome: "pregnant",
    });

    const litter = await createLitter(owner, mating.id, {
      birthDate: todayIso(),
      totalBorn: 1,
      totalAlive: 1,
    });

    await expect(
      addKitten(owner, litter.id, {
        name: "Anak Ekstra",
        sex: "male",
        color: "Putih",
      }),
    ).rejects.toMatchObject({ code: "PLAN_CAT_LIMIT" });
  });
});

describe("jendela riwayat Free", () => {
  it("menyembunyikan siklus dan kawin lama, tetapi kehamilan aktif tetap tampil", async () => {
    const owner = await createUser("Breeder Riwayat");
    const female = await createCat(owner, { name: "Luna", sex: "female" });

    const oldDate = addDaysIso(todayIso(), -120);

    await createHeatCycle(owner, female.id, { startDate: oldDate });

    const oldNotPregnant = await createMating(owner, {
      queenNameManual: "Luar",
      sireNameManual: "Luar",
      matingDate: oldDate,
      outcome: "not_pregnant",
    });
    const oldPregnant = await createMating(owner, {
      queenNameManual: "Luar 2",
      sireNameManual: "Luar 2",
      matingDate: oldDate,
      outcome: "pregnant",
    });

    const heat = await listHeatCycles(owner);
    expect(heat.items).toHaveLength(0);
    expect(heat.lockedCount).toBe(1);
    expect(heat.windowStart).not.toBeNull();

    const breeding = await listMatings(owner);
    expect(breeding.items.map((row) => row.id)).toContain(oldPregnant.id);
    expect(breeding.items.map((row) => row.id)).not.toContain(
      oldNotPregnant.id,
    );
    expect(breeding.lockedCount).toBe(1);

    await addProSubscription(owner);

    const proHeat = await listHeatCycles(owner);
    expect(proHeat.items).toHaveLength(1);
    expect(proHeat.lockedCount).toBe(0);
    expect(proHeat.windowStart).toBeNull();

    const proBreeding = await listMatings(owner);
    expect(proBreeding.items.map((row) => row.id)).toEqual(
      expect.arrayContaining([oldPregnant.id, oldNotPregnant.id]),
    );
  });
});

describe("pemilik beku tidak bisa diubah", () => {
  it("siklus milik kucing yang dibekukan tidak bisa diedit/dihapus", async () => {
    const owner = await createUser("Breeder Beku 2");
    const cat = await createCat(owner, { name: "Beku", sex: "female" });
    const cycle = await createHeatCycle(owner, cat.id, {
      startDate: todayIso(),
    });

    await setTrackingStatus(owner, cat.id, "frozen");

    await expect(
      updateHeatCycle(owner, cycle.id, { notes: "Tidak boleh" }),
    ).rejects.toMatchObject({ code: "CAT_FROZEN" });

    await expect(deleteHeatCycle(owner, cycle.id)).rejects.toMatchObject({
      code: "CAT_FROZEN",
    });

    // Data lama tetap ada setelah percobaan gagal.
    const [row] = await db
      .select()
      .from(heatCycles)
      .where(eq(heatCycles.id, cycle.id));
    expect(row).toBeTruthy();
  });
});
