import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  catOwnershipHistory,
  plans,
  reminders,
  studBookings,
  subscriptions,
  user,
} from "@/db/schema";
import { createCat, setTrackingStatus } from "@/lib/cats";
import { addDaysIso, todayIso, toIsoDate } from "@/lib/date";
import { FREE_HISTORY_MONTHS } from "@/lib/plan";
import {
  addStudMating,
  createStudBooking,
  deleteStudBooking,
  deleteStudMating,
  findScheduleConflicts,
  getStudBooking,
  getStudServiceStats,
  listStudBookings,
  updateStudBooking,
} from "@/lib/stud-bookings";
import {
  createStudService,
  deleteStudService,
  getStudService,
  listStudServices,
  updateStudService,
} from "@/lib/stud-services";
import {
  studBookingCreateSchema,
  studMatingCreateSchema,
} from "@/lib/validation/stud";

/**
 * Tes integrasi Fase 4: profil pejantan pacak, booking, kawin, pengingat,
 * statistik, isolasi data, dan jendela riwayat Free.
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

async function createMale(
  owner: string,
  name = "King",
): Promise<{ id: string; name: string }> {
  return createCat(owner, { name, sex: "male" });
}

async function createService(owner: string, name = "King") {
  const cat = await createMale(owner, name);
  return createStudService(owner, {
    catId: cat.id,
    feeAmount: 3_000_000,
    feeDescription: null,
    notes: null,
    isAvailable: true,
  });
}

async function bookingReminders(userId: string, bookingId: string) {
  return db
    .select()
    .from(reminders)
    .where(and(eq(reminders.userId, userId), eq(reminders.sourceId, bookingId)));
}

function bookingInput(serviceId: string, plannedDate?: string) {
  return {
    studServiceId: serviceId,
    clientName: "Dian",
    clientWhatsapp: "081234567890",
    queenName: "Bella",
    queenBreed: "Maine Coon",
    queenAgeText: "2 tahun",
    plannedDate: plannedDate ?? addDaysIso(todayIso(), 7),
    feeAgreed: 3_000_000,
    depositAmount: 1_000_000,
    depositPaid: true,
    notes: null,
  };
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

describe("profil pejantan pacak", () => {
  it("hanya menerima jantan aktif/dilacak, tarif valid, dan satu profil per kucing", async () => {
    const owner = await createUser("Penyedia Pacak");
    const other = await createUser("Pemilik Lain");

    const male = await createMale(owner);
    const female = await createCat(owner, { name: "Mochi", sex: "female" });

    await expect(
      createStudService(owner, {
        catId: female.id,
        feeAmount: 100_000,
        isAvailable: true,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      createStudService(owner, {
        catId: male.id,
        feeAmount: -1,
        isAvailable: true,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      createStudService(owner, {
        catId: male.id,
        feeAmount: null,
        feeDescription: null,
        isAvailable: true,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const service = await createStudService(owner, {
      catId: male.id,
      feeAmount: null,
      feeDescription: "Anak pilihan pertama",
      notes: "Vaksin lengkap",
      isAvailable: true,
    });

    expect(service.catName).toBe("King");
    expect(service.feeAmount).toBeNull();
    expect(service.feeDescription).toBe("Anak pilihan pertama");

    await expect(
      createStudService(owner, {
        catId: male.id,
        feeAmount: 1_000_000,
        isAvailable: true,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const listed = await listStudServices(owner);
    expect(listed).toHaveLength(1);
    expect(listed[0].isBookable).toBe(true);
    expect(listed[0].catBreed).toBeNull();

    // Pengguna lain tidak bisa melihat atau mengubah data ini.
    expect(await listStudServices(other)).toHaveLength(0);
    await expect(getStudService(other, service.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      updateStudService(other, service.id, { isAvailable: false }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const updated = await updateStudService(owner, service.id, {
      feeAmount: 4_000_000,
      feeDescription: null,
      isAvailable: false,
    });
    expect(updated.feeAmount).toBe(4_000_000);
    expect(updated.isAvailable).toBe(false);
  });

  it("menolak kucing beku dan menghapus profil tanpa riwayat booking", async () => {
    const owner = await createUser("Penyedia Beku");
    const cat = await createMale(owner, "Frozen King");

    await setTrackingStatus(owner, cat.id, "frozen");

    await expect(
      createStudService(owner, {
        catId: cat.id,
        feeAmount: 500_000,
        isAvailable: true,
      }),
    ).rejects.toMatchObject({ code: "CAT_FROZEN" });

    await setTrackingStatus(owner, cat.id, "tracked");
    const service = await createStudService(owner, {
      catId: cat.id,
      feeAmount: 500_000,
      isAvailable: true,
    });

    await setTrackingStatus(owner, cat.id, "frozen");

    await expect(
      updateStudService(owner, service.id, { isAvailable: false }),
    ).rejects.toMatchObject({ code: "CAT_FROZEN" });

    await setTrackingStatus(owner, cat.id, "tracked");
    await deleteStudService(owner, service.id);
    expect(await listStudServices(owner)).toHaveLength(0);
  });
});

describe("booking pacak", () => {
  it("membuat booking Diminta, menyetujui, dan membuat pengingat jadwal", async () => {
    const owner = await createUser("Booking Dasar");
    const service = await createService(owner);
    const plannedDate = addDaysIso(todayIso(), 9);

    const booking = await createStudBooking(owner, bookingInput(service.id, plannedDate));

    expect(booking.status).toBe("requested");
    expect(booking.approvedAt).toBeNull();
    expect(booking.matingCount).toBe(0);
    expect(booking.firstMatingDate).toBeNull();

    await expect(
      updateStudBooking(owner, booking.id, { status: "completed" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const approved = await updateStudBooking(owner, booking.id, {
      status: "approved",
    });

    expect(approved.status).toBe("approved");
    expect(approved.approvedAt).not.toBeNull();

    const reminderRows = await bookingReminders(owner, booking.id);
    const planned = reminderRows.find((row) => row.sourceType === "booking_planned");
    expect(planned?.dueDate).toBe(plannedDate);
    expect(planned?.title).toContain("Bella");

    await expect(
      updateStudBooking(owner, booking.id, { status: "requested" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("mengubah status ke Berlangsung lewat kawin pertama dan menghitung estimasi lahir", async () => {
    const owner = await createUser("Booking Kawin");
    const service = await createService(owner);
    const booking = await createStudBooking(owner, bookingInput(service.id));
    await updateStudBooking(owner, booking.id, { status: "approved" });

    const matingDate = addDaysIso(todayIso(), -5);
    const ongoing = await addStudMating(owner, booking.id, {
      matingDate,
      notes: "Kawin pertama",
    });

    expect(ongoing.status).toBe("ongoing");
    expect(ongoing.matingCount).toBe(1);
    expect(ongoing.firstMatingDate).toBe(matingDate);
    expect(ongoing.expectedDueDate).toBe(addDaysIso(matingDate, 65));

    const reminderRows = await bookingReminders(owner, booking.id);
    expect(reminderRows.some((row) => row.sourceType === "booking_planned")).toBe(false);
    const due = reminderRows.find((row) => row.sourceType === "booking_due");
    expect(due?.dueDate).toBe(addDaysIso(matingDate, 65));
    expect(due?.doneAt).toBeNull();

    // Kawin lebih awal menggeser estimasi bila belum manual.
    const earlier = addDaysIso(matingDate, -2);
    const shifted = await addStudMating(owner, booking.id, {
      matingDate: earlier,
      notes: null,
    });
    expect(shifted.expectedDueDate).toBe(addDaysIso(earlier, 65));
    expect(shifted.matingCount).toBe(2);

    const completed = await updateStudBooking(owner, booking.id, {
      status: "completed",
    });
    expect(completed.status).toBe("completed");

    await expect(
      addStudMating(owner, booking.id, {
        matingDate: todayIso(),
        notes: null,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("mempertahankan estimasi manual, menandai lewat estimasi, dan mengatur status kehamilan", async () => {
    const owner = await createUser("Booking Hamil");
    const service = await createService(owner);
    const booking = await createStudBooking(owner, bookingInput(service.id));
    await updateStudBooking(owner, booking.id, { status: "approved" });
    const first = addDaysIso(todayIso(), -70);

    const ongoing = await addStudMating(owner, booking.id, {
      matingDate: first,
      notes: null,
    });
    expect(ongoing.isOverdue).toBe(true);
    expect(ongoing.expectedDueDate).toBe(addDaysIso(first, 65));

    const manualDate = addDaysIso(todayIso(), 5);
    const manual = await updateStudBooking(owner, booking.id, {
      expectedDueDate: manualDate,
    });
    expect(manual.expectedDueDate).toBe(manualDate);
    expect(manual.expectedDueDateManual).toBe(true);

    const earlier = addDaysIso(first, -1);
    const shifted = await addStudMating(owner, booking.id, {
      matingDate: earlier,
      notes: null,
    });
    expect(shifted.expectedDueDate).toBe(manualDate);

    const notPregnant = await updateStudBooking(owner, booking.id, {
      queenPregnancyStatus: "not_pregnant",
    });
    expect(notPregnant.isOverdue).toBe(false);
    let reminderRows = await bookingReminders(owner, booking.id);
    expect(reminderRows.some((row) => row.sourceType === "booking_due")).toBe(false);
    const pregnant = await updateStudBooking(owner, booking.id, {
      queenPregnancyStatus: "pregnant",
    });
    expect(pregnant.queenPregnancyStatus).toBe("pregnant");
    reminderRows = await bookingReminders(owner, booking.id);
    expect(reminderRows.some((row) => row.sourceType === "booking_due")).toBe(true);

    const delivered = await updateStudBooking(owner, booking.id, {
      queenPregnancyStatus: "delivered",
    });
    expect(delivered.queenPregnancyStatus).toBe("delivered");
    reminderRows = await bookingReminders(owner, booking.id);
    const due = reminderRows.find((row) => row.sourceType === "booking_due");
    expect(due?.doneAt).not.toBeNull();
  });

  it("menghapus kawin terakhir dan mengembalikan status ke Disetujui atau Diminta", async () => {
    const owner = await createUser("Booking Batal Kawin");
    const service = await createService(owner);
    const approvedBooking = await createStudBooking(owner, bookingInput(service.id));
    await updateStudBooking(owner, approvedBooking.id, { status: "approved" });
    const approvedMating = await addStudMating(owner, approvedBooking.id, {
      matingDate: todayIso(),
      notes: null,
    });

    expect(approvedMating.status).toBe("ongoing");
    expect(approvedMating.expectedDueDate).toBe(addDaysIso(todayIso(), 65));
    await deleteStudMating(owner, approvedMating.matings[0].id);

    const reverted = await getStudBooking(owner, approvedBooking.id);
    expect(reverted.status).toBe("approved");
    expect(reverted.expectedDueDate).toBeNull();
    expect(reverted.matingCount).toBe(0);
    const reminderRows = await bookingReminders(owner, approvedBooking.id);
    expect(reminderRows.some((row) => row.sourceType === "booking_due")).toBe(false);
    expect(
      reminderRows.some((row) => row.sourceType === "booking_planned"),
    ).toBe(true);

    const requestedBooking = await createStudBooking(owner, bookingInput(service.id));
    const requestedMating = await addStudMating(owner, requestedBooking.id, {
      matingDate: todayIso(),
      notes: null,
    });
    expect(requestedMating.approvedAt).toBeNull();

    await deleteStudMating(owner, requestedMating.matings[0].id);
    const backToRequested = await getStudBooking(owner, requestedBooking.id);
    expect(backToRequested.status).toBe("requested");
  });

  it("menolak tanggal kawin masa depan dan data milik pengguna lain", async () => {
    const owner = await createUser("Booking Validasi");
    const other = await createUser("Pengguna Lain");
    const service = await createService(owner);
    const booking = await createStudBooking(owner, bookingInput(service.id));

    await expect(
      addStudMating(owner, booking.id, {
        matingDate: addDaysIso(todayIso(), 1),
        notes: null,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(getStudBooking(other, booking.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      updateStudBooking(other, booking.id, { status: "cancelled" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(deleteStudBooking(other, booking.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect((await listStudBookings(other)).items).toHaveLength(0);

    await deleteStudBooking(owner, booking.id);
    expect((await listStudBookings(owner, { studServiceId: service.id })).items).toHaveLength(0);
  });

  it("mendeteksi jadwal bentrok tapi tetap mengizinkan penyimpanan", async () => {
    const owner = await createUser("Booking Bentrok");
    const service = await createService(owner);
    const plannedDate = addDaysIso(todayIso(), 12);

    const first = await createStudBooking(owner, bookingInput(service.id, plannedDate));
    const second = await createStudBooking(owner, bookingInput(service.id, plannedDate));

    const conflicts = await findScheduleConflicts(
      owner,
      service.id,
      plannedDate,
      second.id,
    );
    expect(conflicts.map((row) => row.id)).toEqual([first.id]);

    const cancelled = await updateStudBooking(owner, first.id, {
      status: "cancelled",
    });
    expect(cancelled.status).toBe("cancelled");

    const afterCancel = await findScheduleConflicts(
      owner,
      service.id,
      plannedDate,
      second.id,
    );
    expect(afterCancel).toHaveLength(0);

    // Booking batal tidak lagi bisa dipilih untuk booking baru? Pejantan
    // tetap bisa; yang diperiksa hanya ketersediaan pejantan.
    expect(second.status).toBe("requested");
  });

  it("menghitung statistik pejantan dari booking yang terlihat", async () => {
    const owner = await createUser("Statistik Pacak");
    const service = await createService(owner);
    const first = await createStudBooking(owner, bookingInput(service.id));
    const second = await createStudBooking(owner, bookingInput(service.id));

    await addStudMating(owner, first.id, { matingDate: todayIso(), notes: null });
    await updateStudBooking(owner, first.id, {
      queenPregnancyStatus: "pregnant",
    });
    await addStudMating(owner, second.id, {
      matingDate: addDaysIso(todayIso(), -1),
      notes: null,
    });
    await updateStudBooking(owner, second.id, {
      queenPregnancyStatus: "delivered",
    });

    const stats = await getStudServiceStats(owner, service.id);
    expect(stats).toEqual({
      bookingCount: 2,
      matingCount: 2,
      pregnantCount: 1,
      deliveredCount: 1,
    });

    const other = await createUser("Statistik Lain");
    await expect(getStudServiceStats(other, service.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("menyembunyikan booking selesai lama pada paket Free dan menampilkannya untuk Pro", async () => {
    const owner = await createUser("Riwayat Pacak");
    const service = await createService(owner);
    const oldBooking = await createStudBooking(owner, bookingInput(service.id));
    await updateStudBooking(owner, oldBooking.id, { status: "cancelled" });

    const old = new Date();
    old.setMonth(old.getMonth() - (FREE_HISTORY_MONTHS + 1));
    const oldIso = toIsoDate(old);
    await db
      .update(studBookings)
      .set({ createdAt: old, plannedDate: oldIso })
      .where(eq(studBookings.id, oldBooking.id));

    const freeList = await listStudBookings(owner);
    expect(freeList.windowStart).not.toBeNull();
    expect(freeList.items).toHaveLength(0);
    expect(freeList.lockedCount).toBe(1);

    // Booking aktif tetap terlihat walau dibuat lama.
    const activeBooking = await createStudBooking(owner, bookingInput(service.id));
    await db
      .update(studBookings)
      .set({ createdAt: old })
      .where(eq(studBookings.id, activeBooking.id));
    const freeWithActive = await listStudBookings(owner);
    expect(freeWithActive.items.map((row) => row.id)).toContain(activeBooking.id);

    await addProSubscription(owner);
    const proList = await listStudBookings(owner);
    expect(proList.windowStart).toBeNull();
    expect(proList.items.map((row) => row.id)).toContain(oldBooking.id);
  });
});

describe("validasi booking", () => {
  it("menerima input dasar dan menolak tanggal masa depan untuk kawin", () => {
    const valid = studBookingCreateSchema.safeParse({
      studServiceId: "00000000-0000-4000-8000-000000000000",
      clientName: "Klien",
      clientWhatsapp: "08123",
      queenName: "Bella",
    });
    expect(valid.success).toBe(true);

    const future = studMatingCreateSchema.safeParse({
      matingDate: addDaysIso(todayIso(), 1),
    });
    expect(future.success).toBe(false);
  });
});
