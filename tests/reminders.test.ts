import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { reminders, user } from "@/db/schema";
import { createCat, setTrackingStatus } from "@/lib/cats";
import { addDaysIso, todayIso } from "@/lib/date";
import {
  createReminder,
  deleteReminder,
  getReminder,
  listReminders,
  listUpcomingReminders,
  updateReminder,
} from "@/lib/reminders";

/**
 * Tes integrasi pengingat: isolasi pemilik, filter daftar, penundaan,
 * dan pengecualian kucing beku dari daftar aktif.
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

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await db.delete(user).where(inArray(user.id, createdUserIds));
  }
});

describe("pengingat — isolasi antar pemilik", () => {
  it("pemilik lain tidak bisa membaca, mengubah, atau menghapus", async () => {
    const owner = await createUser("Pemilik Ingat");
    const other = await createUser("Pemilik Lain");

    const reminder = await createReminder(owner, {
      title: "Timbang rutin",
      dueDate: todayIso(),
    });

    await expect(getReminder(other, reminder.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });

    await expect(
      updateReminder(other, reminder.id, { done: true }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(deleteReminder(other, reminder.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    const otherList = await listReminders(other);
    expect(otherList.some((row) => row.id === reminder.id)).toBe(false);

    const ownList = await listReminders(owner);
    expect(ownList.some((row) => row.id === reminder.id)).toBe(true);
  });
});

describe("pengingat — daftar & filter", () => {
  it("memfilter yang belum dan sudah selesai", async () => {
    const owner = await createUser("Pemilik Filter");

    const active = await createReminder(owner, {
      title: "Aktif",
      dueDate: addDaysIso(todayIso(), 3),
    });
    const done = await createReminder(owner, {
      title: "Selesai",
      dueDate: addDaysIso(todayIso(), 2),
    });
    await updateReminder(owner, done.id, { done: true });

    const open = await listReminders(owner, { done: "false" });
    const finished = await listReminders(owner, { done: "true" });

    expect(open.map((row) => row.id)).toEqual([active.id]);
    expect(finished.map((row) => row.id)).toEqual([done.id]);
  });

  it("menyertakan nama kucing pada daftar", async () => {
    const owner = await createUser("Pemilik Nama");
    const cat = await createCat(owner, { name: "Mochi", sex: "female" });

    await createReminder(owner, {
      title: "Vaksin",
      dueDate: todayIso(),
      catId: cat.id,
    });

    const [row] = await listReminders(owner);
    expect(row.catName).toBe("Mochi");
    expect(row.catTrackingStatus).toBe("tracked");
  });
});

describe("pengingat — kucing beku", () => {
  it("tidak bisa menambah atau mengubah pengingat kucing beku", async () => {
    const owner = await createUser("Pemilik Beku Ingat");
    const cat = await createCat(owner, { name: "Beku", sex: "male" });

    const reminder = await createReminder(owner, {
      title: "Sebelum beku",
      dueDate: addDaysIso(todayIso(), 2),
      catId: cat.id,
    });

    await setTrackingStatus(owner, cat.id, "frozen");

    await expect(
      createReminder(owner, {
        title: "Setelah beku",
        dueDate: todayIso(),
        catId: cat.id,
      }),
    ).rejects.toMatchObject({ code: "CAT_FROZEN", status: 403 });

    await expect(
      updateReminder(owner, reminder.id, { title: "Diubah" }),
    ).rejects.toMatchObject({ code: "CAT_FROZEN" });
  });

  it("pengingat kucing beku tidak muncul di beranda", async () => {
    const owner = await createUser("Pemilik Beranda");
    const cat = await createCat(owner, { name: "Beku Home", sex: "female" });

    await createReminder(owner, {
      title: "Kucing beku",
      dueDate: addDaysIso(todayIso(), 1),
      catId: cat.id,
    });
    await createReminder(owner, {
      title: "Umum",
      dueDate: addDaysIso(todayIso(), 1),
    });

    await setTrackingStatus(owner, cat.id, "frozen");

    const upcoming = await listUpcomingReminders(owner, 7);
    expect(upcoming.map((row) => row.title)).toEqual(["Umum"]);
  });
});

describe("pengingat — aksi", () => {
  it("menandai selesai lalu membatalkannya", async () => {
    const owner = await createUser("Pemilik Selesai");
    const reminder = await createReminder(owner, {
      title: "Selesai",
      dueDate: todayIso(),
    });

    const done = await updateReminder(owner, reminder.id, { done: true });
    expect(done.doneAt).not.toBeNull();

    const undone = await updateReminder(owner, reminder.id, { done: false });
    expect(undone.doneAt).toBeNull();
  });

  it("menunda pengingat yang telat dari hari ini, bukan dari tanggal lama", async () => {
    const owner = await createUser("Pemilik Tunda");
    const reminder = await createReminder(owner, {
      title: "Telat",
      dueDate: addDaysIso(todayIso(), -5),
    });

    const updated = await updateReminder(owner, reminder.id, {
      postponeDays: 1,
    });

    expect(updated.dueDate).toBe(addDaysIso(todayIso(), 1));
    expect(updated.doneAt).toBeNull();
  });

  it("menunda pengingat mendatang dari tanggal jatuh temponya", async () => {
    const owner = await createUser("Pemilik Tunda Depan");
    const dueDate = addDaysIso(todayIso(), 4);
    const reminder = await createReminder(owner, {
      title: "Depan",
      dueDate,
    });

    const updated = await updateReminder(owner, reminder.id, {
      postponeDays: 2,
    });

    expect(updated.dueDate).toBe(addDaysIso(dueDate, 2));
  });

  it("mengubah tanggal membuka kembali status selesai", async () => {
    const owner = await createUser("Pemilik Ubah Tanggal");
    const reminder = await createReminder(owner, {
      title: "Geser",
      dueDate: todayIso(),
    });

    await updateReminder(owner, reminder.id, { done: true });

    const moved = await updateReminder(owner, reminder.id, {
      dueDate: addDaysIso(todayIso(), 5),
    });

    expect(moved.doneAt).toBeNull();
  });

  it("daftar beranda hanya memuat 7 hari ke depan yang belum selesai", async () => {
    const owner = await createUser("Pemilik Tujuh Hari");

    await createReminder(owner, {
      title: "Hari ini",
      dueDate: todayIso(),
    });
    await createReminder(owner, {
      title: "Terlambat",
      dueDate: addDaysIso(todayIso(), -1),
    });
    await createReminder(owner, {
      title: "Terlalu jauh",
      dueDate: addDaysIso(todayIso(), 10),
    });
    const done = await createReminder(owner, {
      title: "Sudah selesai",
      dueDate: addDaysIso(todayIso(), 1),
    });
    await updateReminder(owner, done.id, { done: true });

    const upcoming = await listUpcomingReminders(owner, 7);
    expect(upcoming.map((row) => row.title)).toEqual(["Hari ini"]);
  });
});

describe("pengingat — hapus", () => {
  it("menghapus hanya pengingat milik sendiri", async () => {
    const owner = await createUser("Pemilik Hapus");
    const reminder = await createReminder(owner, {
      title: "Hapus saya",
      dueDate: todayIso(),
    });

    await deleteReminder(owner, reminder.id);

    const rows = await db.select().from(reminders).where(inArray(reminders.id, [reminder.id]));
    expect(rows).toHaveLength(0);
  });
});
