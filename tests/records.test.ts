import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { createCat, setTrackingStatus } from "@/lib/cats";
import { addDaysIso, todayIso, toIsoDate } from "@/lib/date";
import {
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument,
} from "@/lib/documents";
import {
  createFeedingSchedule,
  deleteFeedingSchedule,
  listFeedingSchedules,
  updateFeedingSchedule,
} from "@/lib/feeding";
import { createHealthRecord, createWeight } from "@/lib/health";
import { historyWindowStart } from "@/lib/plan";
import { getCatTimeline } from "@/lib/timeline";
import { documentCreateSchema } from "@/lib/validation/document";
import { feedingCreateSchema } from "@/lib/validation/feeding";

/**
 * Tes integrasi jadwal pakan, brankas dokumen, dan linimasa gabungan.
 */

const createdUserIds: string[] = [];

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

function oldIsoDate(): string {
  const start = historyWindowStart(3);
  if (!start) throw new Error("Jendela Free harus dibatasi");

  return addDaysIso(toIsoDate(start), -1);
}

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await db.delete(user).where(inArray(user.id, createdUserIds));
  }
});

describe("jadwal pakan", () => {
  it("membuat, mengubah, dan menghapus jadwal", async () => {
    const owner = await createUser("Pemilik Pakan");
    const cat = await createCat(owner, { name: "Pakan", sex: "female" });

    const created = await createFeedingSchedule(owner, cat.id, {
      scheduleTime: "07:30",
      portionGrams: 80,
      foodType: "Dry food",
      notes: "Pagi",
    });

    const listed = await listFeedingSchedules(owner, cat.id);
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      id: created.id,
      scheduleTime: "07:30",
      portionGrams: 80,
    });

    const updated = await updateFeedingSchedule(owner, created.id, {
      portionGrams: 90,
    });
    expect(updated.portionGrams).toBe(90);

    await deleteFeedingSchedule(owner, created.id);
    expect(await listFeedingSchedules(owner, cat.id)).toHaveLength(0);
  });

  it("mengisolasi data antar pemilik dan menolak kucing beku", async () => {
    const owner = await createUser("Pemilik Pakan A");
    const other = await createUser("Pemilik Pakan B");

    const cat = await createCat(owner, { name: "Pakan A", sex: "female" });
    const schedule = await createFeedingSchedule(owner, cat.id, {
      scheduleTime: "18:00",
      portionGrams: 70,
      foodType: "Wet food",
    });

    await expect(
      createFeedingSchedule(other, cat.id, {
        scheduleTime: "08:00",
        portionGrams: 50,
        foodType: "Dry food",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      listFeedingSchedules(other, cat.id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      updateFeedingSchedule(other, schedule.id, { portionGrams: 10 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await setTrackingStatus(owner, cat.id, "frozen");

    await expect(
      createFeedingSchedule(owner, cat.id, {
        scheduleTime: "12:00",
        portionGrams: 40,
        foodType: "Snack",
      }),
    ).rejects.toMatchObject({ code: "CAT_FROZEN", status: 403 });
  });

  it("skema menolak waktu dan porsi tidak valid", () => {
    const base = { scheduleTime: "07:00", portionGrams: 50, foodType: "Dry" };

    expect(feedingCreateSchema.safeParse(base).success).toBe(true);
    expect(
      feedingCreateSchema.safeParse({ ...base, scheduleTime: "24:00" }).success,
    ).toBe(false);
    expect(
      feedingCreateSchema.safeParse({ ...base, portionGrams: 0 }).success,
    ).toBe(false);
    expect(
      feedingCreateSchema.safeParse({ ...base, foodType: " " }).success,
    ).toBe(false);
  });
});

describe("brankas dokumen", () => {
  it("membuat, mengubah, dan menghapus dokumen", async () => {
    const owner = await createUser("Pemilik Dokumen");
    const cat = await createCat(owner, { name: "Dokumen", sex: "female" });

    const created = await createDocument(owner, cat.id, {
      title: "Sertifikat vaksin",
      category: "vaccine_book",
      fileType: "pdf",
      uploadedAt: todayIso(),
    });

    expect(created.verified).toBe(false);

    const listed = await listDocuments(owner, cat.id);
    expect(listed.items).toHaveLength(1);
    expect(listed.lockedCount).toBe(0);

    const updated = await updateDocument(owner, created.id, {
      title: "Buku vaksin 2026",
    });
    expect(updated.title).toBe("Buku vaksin 2026");

    await deleteDocument(owner, created.id);
    expect(await listDocuments(owner, cat.id)).toMatchObject({
      items: [],
      lockedCount: 0,
    });
  });

  it("mengisolasi data antar pemilik dan menolak kucing beku", async () => {
    const owner = await createUser("Pemilik Dokumen A");
    const other = await createUser("Pemilik Dokumen B");

    const cat = await createCat(owner, { name: "Dok A", sex: "male" });
    const document = await createDocument(owner, cat.id, {
      title: "Pedigree",
      category: "pedigree",
      fileType: "pdf",
      uploadedAt: todayIso(),
    });

    await expect(getDocument(other, document.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });

    await expect(
      updateDocument(other, document.id, { title: "Bajakan" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(deleteDocument(other, document.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    await setTrackingStatus(owner, cat.id, "frozen");

    await expect(
      createDocument(owner, cat.id, {
        title: "Baru",
        category: "other",
        fileType: "pdf",
        uploadedAt: todayIso(),
      }),
    ).rejects.toMatchObject({ code: "CAT_FROZEN", status: 403 });
  });

  it("Free menghitung dokumen lama sebagai terkunci", async () => {
    const owner = await createUser("Pemilik Dokumen Lama");
    const cat = await createCat(owner, { name: "Arsip", sex: "female" });

    await createDocument(owner, cat.id, {
      title: "Lama",
      category: "other",
      fileType: "pdf",
      uploadedAt: oldIsoDate(),
    });
    await createDocument(owner, cat.id, {
      title: "Baru",
      category: "other",
      fileType: "pdf",
      uploadedAt: todayIso(),
    });

    const listed = await listDocuments(owner, cat.id);

    expect(listed.windowStart).not.toBeNull();
    expect(listed.items.map((row) => row.title)).toEqual(["Baru"]);
    expect(listed.lockedCount).toBe(1);
  });

  it("skema menolak berkas lebih dari 15 MB", () => {
    const base = { title: "Dokumen" };

    expect(
      documentCreateSchema.safeParse({
        ...base,
        sizeBytes: 15 * 1024 * 1024,
      }).success,
    ).toBe(true);
    expect(
      documentCreateSchema.safeParse({
        ...base,
        sizeBytes: 15 * 1024 * 1024 + 1,
      }).success,
    ).toBe(false);
    expect(
      documentCreateSchema.safeParse({ ...base, title: " " }).success,
    ).toBe(false);
  });
});

describe("linimasa kucing", () => {
  it("menggabungkan kesehatan, berat, dokumen, dan pakan", async () => {
    const owner = await createUser("Pemilik Linimasa");
    const cat = await createCat(owner, { name: "Linimasa", sex: "female" });

    await createHealthRecord(owner, cat.id, {
      type: "vet_visit",
      recordDate: addDaysIso(todayIso(), -3),
      title: "Kontrol dokter",
    });
    await createWeight(owner, cat.id, {
      recordDate: addDaysIso(todayIso(), -2),
      weightKg: 4.1,
    });
    await createDocument(owner, cat.id, {
      title: "Hasil lab",
      category: "lab",
      fileType: "pdf",
      uploadedAt: addDaysIso(todayIso(), -1),
    });
    await createFeedingSchedule(owner, cat.id, {
      scheduleTime: "08:00",
      portionGrams: 60,
      foodType: "Dry food",
    });

    const timeline = await getCatTimeline(owner, cat.id);

    expect(timeline.items).toHaveLength(4);
    expect(timeline.items.map((event) => event.category).sort()).toEqual(
      ["feeding", "medical", "note", "weight"].sort(),
    );

    const weightEvent = timeline.items.find(
      (event) => event.category === "weight",
    );
    expect(weightEvent?.title).toBe("Berat 4.10 kg");
  });

  it("tidak membocorkan data pemilik lain", async () => {
    const owner = await createUser("Pemilik Linimasa A");
    const other = await createUser("Pemilik Linimasa B");
    const cat = await createCat(owner, { name: "Privat", sex: "male" });

    await expect(getCatTimeline(other, cat.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
