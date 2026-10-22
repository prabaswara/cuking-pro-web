import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { healthRecords, plans, reminders, subscriptions, user } from "@/db/schema";
import { createCat, setTrackingStatus } from "@/lib/cats";
import { addDaysIso, todayIso, toIsoDate } from "@/lib/date";
import {
  createHealthRecord,
  createWeight,
  deleteHealthRecord,
  getHealthRecord,
  listHealthRecords,
  listWeights,
  updateHealthRecord,
} from "@/lib/health";
import { historyWindowStart } from "@/lib/plan";
import { healthCreateSchema, weightCreateSchema } from "@/lib/validation/health";

/**
 * Tes integrasi Fase 2 — catatan kesehatan, berat, dan sinkronisasi
 * pengingat otomatis terhadap PostgreSQL sungguhan.
 *
 * Prasyarat: `npm run db:test:setup`.
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

async function healthReminders(userId: string) {
  return db
    .select()
    .from(reminders)
    .where(and(eq(reminders.userId, userId), eq(reminders.sourceType, "health")));
}

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await db.delete(user).where(inArray(user.id, createdUserIds));
  }

  for (const planId of createdPlanIds) {
    await db.delete(plans).where(eq(plans.id, planId));
  }
});

describe("catatan kesehatan — isolasi antar pemilik", () => {
  it("pemilik lain tidak bisa membaca, mengubah, atau menghapus", async () => {
    const owner = await createUser("Pemilik Sehat");
    const other = await createUser("Pemilik Lain");

    const cat = await createCat(owner, { name: "Mochi", sex: "female" });
    const record = await createHealthRecord(owner, cat.id, {
      type: "vaccine",
      recordDate: todayIso(),
      title: "Vaksin tahunan",
    });

    await expect(getHealthRecord(other, record.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });

    await expect(
      updateHealthRecord(other, record.id, { title: "Bajakan" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(deleteHealthRecord(other, record.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    await expect(
      listHealthRecords(other, cat.id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const own = await listHealthRecords(owner, cat.id);
    expect(own.items.map((row) => row.id)).toContain(record.id);
  });

  it("kucing beku bersifat read-only", async () => {
    const owner = await createUser("Pemilik Beku Sehat");
    const cat = await createCat(owner, { name: "Beku", sex: "male" });
    const record = await createHealthRecord(owner, cat.id, {
      type: "other",
      recordDate: todayIso(),
    });

    await setTrackingStatus(owner, cat.id, "frozen");

    await expect(
      createHealthRecord(owner, cat.id, {
        type: "other",
        recordDate: todayIso(),
      }),
    ).rejects.toMatchObject({ code: "CAT_FROZEN", status: 403 });

    await expect(
      updateHealthRecord(owner, record.id, { notes: "tetap beku" }),
    ).rejects.toMatchObject({ code: "CAT_FROZEN" });

    await expect(deleteHealthRecord(owner, record.id)).rejects.toMatchObject({
      code: "CAT_FROZEN",
    });

    // Membaca tetap diizinkan.
    const listed = await listHealthRecords(owner, cat.id);
    expect(listed.items).toHaveLength(1);
  });
});

describe("catatan kesehatan — validasi", () => {
  it("menolak tanggal di masa depan", async () => {
    const owner = await createUser("Pemilik Masa Depan");
    const cat = await createCat(owner, { name: "Future", sex: "female" });

    await expect(
      createHealthRecord(owner, cat.id, {
        type: "vaccine",
        recordDate: addDaysIso(todayIso(), 1),
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      field: "recordDate",
    });
  });

  it("menolak nextDueDate sebelum recordDate", async () => {
    const owner = await createUser("Pemilik Tanggal");
    const cat = await createCat(owner, { name: "Tanggal", sex: "female" });

    await expect(
      createHealthRecord(owner, cat.id, {
        type: "vaccine",
        recordDate: todayIso(),
        nextDueDate: addDaysIso(todayIso(), -1),
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      field: "nextDueDate",
    });
  });

  it("skema berat menolak 0 kg dan lebih dari 20 kg", () => {
    expect(
      weightCreateSchema.safeParse({ weightKg: 0 }).success,
    ).toBe(false);
    expect(
      weightCreateSchema.safeParse({ weightKg: 20.01 }).success,
    ).toBe(false);
    expect(weightCreateSchema.safeParse({ weightKg: 20 }).success).toBe(true);
  });

  it("catatan bertipe weight wajib punya berat", () => {
    const result = healthCreateSchema.safeParse({
      type: "weight",
      recordDate: todayIso(),
    });

    expect(result.success).toBe(false);
  });
});

describe("pengingat otomatis dari catatan kesehatan", () => {
  it("membuat, memperbarui tanpa duplikat, lalu menghapus", async () => {
    const owner = await createUser("Pemilik Pengingat");
    const cat = await createCat(owner, { name: "Remi", sex: "female" });
    const dueDate = addDaysIso(todayIso(), 30);

    const record = await createHealthRecord(owner, cat.id, {
      type: "vaccine",
      recordDate: todayIso(),
      nextDueDate: dueDate,
    });

    let rows = await healthReminders(owner);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      sourceType: "health",
      sourceId: record.id,
      catId: cat.id,
      dueDate,
      title: "Vaksinasi",
    });

    const nextDue = addDaysIso(todayIso(), 60);
    await updateHealthRecord(owner, record.id, { nextDueDate: nextDue });

    rows = await healthReminders(owner);
    expect(rows).toHaveLength(1);
    expect(rows[0].dueDate).toBe(nextDue);

    await updateHealthRecord(owner, record.id, { nextDueDate: null });

    rows = await healthReminders(owner);
    expect(rows).toHaveLength(0);

    await updateHealthRecord(owner, record.id, { nextDueDate: nextDue });
    await deleteHealthRecord(owner, record.id);

    rows = await healthReminders(owner);
    expect(rows).toHaveLength(0);
  });

  it("memakai judul catatan bila diisi", async () => {
    const owner = await createUser("Pemilik Judul");
    const cat = await createCat(owner, { name: "Judul", sex: "female" });

    await createHealthRecord(owner, cat.id, {
      type: "deworming",
      recordDate: todayIso(),
      nextDueDate: addDaysIso(todayIso(), 14),
      title: "Obat cacing triwulan",
    });

    const [row] = await healthReminders(owner);
    expect(row.title).toBe("Obat cacing triwulan");
  });

  it("catatan berat tidak membuat pengingat", async () => {
    const owner = await createUser("Pemilik Berat");
    const cat = await createCat(owner, { name: "Bulat", sex: "male" });

    await createWeight(owner, cat.id, {
      recordDate: todayIso(),
      weightKg: 4.2,
    });

    expect(await healthReminders(owner)).toHaveLength(0);
  });

  it("mengubah tipe menjadi berat menghapus pengingat lama", async () => {
    const owner = await createUser("Pemilik Ubah Tipe");
    const cat = await createCat(owner, { name: "Tipe", sex: "female" });

    const record = await createHealthRecord(owner, cat.id, {
      type: "vaccine",
      recordDate: todayIso(),
      nextDueDate: addDaysIso(todayIso(), 30),
    });
    expect(await healthReminders(owner)).toHaveLength(1);

    await updateHealthRecord(owner, record.id, {
      type: "weight",
      weightKg: 3.5,
    });

    expect(await healthReminders(owner)).toHaveLength(0);

    // Kembali ke tipe kesehatan tanpa nextDueDate tidak membuat pengingat.
    await updateHealthRecord(owner, record.id, { type: "other" });
    expect(await healthReminders(owner)).toHaveLength(0);
  });
});

describe("berat badan", () => {
  it("menyimpan berat dan menampilkannya di daftar", async () => {
    const owner = await createUser("Pemilik Timbangan");
    const cat = await createCat(owner, { name: "Timbang", sex: "male" });

    await createWeight(owner, cat.id, {
      recordDate: todayIso(),
      weightKg: 4.25,
      notes: "Pagi",
    });

    const { items } = await listWeights(owner, cat.id);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kg: 4.25, note: "Pagi" });

    const raw = await db
      .select()
      .from(healthRecords)
      .where(eq(healthRecords.catId, cat.id));

    expect(raw[0].type).toBe("weight");
    expect(raw[0].weightKg).toBe(4.25);
  });
});

describe("jendela riwayat paket", () => {
  it("Free menyembunyikan data di luar 3 bulan dan menghitung lockedCount", async () => {
    const owner = await createUser("Pemilik Free Riwayat");
    const cat = await createCat(owner, { name: "Lama", sex: "female" });

    const windowStart = historyWindowStart(3);
    if (!windowStart) throw new Error("Jendela Free harus dibatasi");

    const oldDate = addDaysIso(toIsoDate(windowStart), -1);
    const recentDate = addDaysIso(todayIso(), -10);

    await createHealthRecord(owner, cat.id, {
      type: "other",
      recordDate: oldDate,
      title: "Catatan lama",
    });
    await createHealthRecord(owner, cat.id, {
      type: "other",
      recordDate: recentDate,
      title: "Catatan baru",
    });

    const listed = await listHealthRecords(owner, cat.id);

    expect(listed.windowStart).not.toBeNull();
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0].title).toBe("Catatan baru");
    expect(listed.lockedCount).toBe(1);
  });

  it("Pro melihat seluruh riwayat", async () => {
    const owner = await createUser("Pemilik Pro Riwayat");
    await addProSubscription(owner);

    const cat = await createCat(owner, { name: "Semua", sex: "female" });

    await createHealthRecord(owner, cat.id, {
      type: "other",
      recordDate: addDaysIso(todayIso(), -200),
      title: "Lama",
    });
    await createHealthRecord(owner, cat.id, {
      type: "other",
      recordDate: addDaysIso(todayIso(), -5),
      title: "Baru",
    });

    const listed = await listHealthRecords(owner, cat.id);

    expect(listed.windowStart).toBeNull();
    expect(listed.lockedCount).toBe(0);
    expect(listed.items).toHaveLength(2);
  });
});
