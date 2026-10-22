import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  catOwnershipHistory,
  cats,
  plans,
  reminders,
  subscriptions,
  user,
} from "@/db/schema";
import { createCat, listCats, setTrackingStatus } from "@/lib/cats";
import { addDaysIso, todayIso } from "@/lib/date";
import {
  createSale,
  deleteSale,
  getSale,
  listSales,
  updateSale,
} from "@/lib/sales";
import {
  saleCreateSchema,
  saleUpdateSchema,
  type SaleCreateInput,
} from "@/lib/validation/sale";

/**
 * Tes integrasi Fase 3 penjualan: isolasi, alur status, efek ke kucing
 * dan pengingat, serta ringkasan bulanan.
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

function saleInput(
  catId: string,
  overrides: Partial<SaleCreateInput> = {},
): SaleCreateInput {
  return saleCreateSchema.parse({
    catId,
    status: "listed",
    askingPrice: 5_000_000,
    ...overrides,
  });
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

describe("penjualan — isolasi & satu penjualan aktif", () => {
  it("hanya pemilik yang bisa mengakses dan tidak boleh dobel aktif", async () => {
    const owner = await createUser("Breeder Jual");
    const other = await createUser("Pemilik Lain");

    const cat = await createCat(owner, { name: "Mochi", sex: "female" });

    const sale = await createSale(owner, saleInput(cat.id));

    expect(sale.ownerId).toBe(owner);
    expect(sale.catName).toBe("Mochi");
    expect(sale.status).toBe("listed");

    await expect(
      createSale(owner, saleInput(cat.id, { askingPrice: 4_000_000 })),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await expect(
      createSale(
        owner,
        saleInput(cat.id, {
          status: "sold",
          buyerName: "Pembeli",
          finalPrice: 4_000_000,
          saleDate: todayIso(),
        }),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await expect(getSale(other, sale.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      updateSale(other, sale.id, saleUpdateSchema.parse({ status: "cancelled" })),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(deleteSale(other, sale.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    const otherSales = await listSales(other);
    expect(otherSales.items).toHaveLength(0);
  });
});

describe("penjualan — alur status & validasi", () => {
  it("mengikuti transisi status dan aturan harga/tanggal", async () => {
    const owner = await createUser("Breeder Status");
    const cat = await createCat(owner, { name: "Luna", sex: "female" });
    const sale = await createSale(owner, saleInput(cat.id));

    // PATCH parsial tidak boleh mereset status/boolean ke default.
    const flagged = await updateSale(
      owner,
      sale.id,
      saleUpdateSchema.parse({ depositPaid: true }),
    );
    expect(flagged.status).toBe("listed");

    const notesOnly = await updateSale(
      owner,
      sale.id,
      saleUpdateSchema.parse({ notes: "Catatan pembeli" }),
    );
    expect(notesOnly.status).toBe("listed");
    expect(notesOnly.depositPaid).toBe(true);
    expect(notesOnly.notes).toBe("Catatan pembeli");

    await expect(
      updateSale(owner, sale.id, saleUpdateSchema.parse({ status: "reserved" })),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const reserved = await updateSale(
      owner,
      sale.id,
      saleUpdateSchema.parse({
        status: "reserved",
        buyerName: "Budi",
        buyerWhatsapp: "08123456789",
      }),
    );
    expect(reserved.status).toBe("reserved");

    await expect(
      updateSale(
        owner,
        sale.id,
        saleUpdateSchema.parse({ status: "sold" }),
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      updateSale(
        owner,
        sale.id,
        saleUpdateSchema.parse({
          status: "sold",
          finalPrice: 4_000_000,
          depositAmount: 5_000_000,
          saleDate: todayIso(),
        }),
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      updateSale(
        owner,
        sale.id,
        saleUpdateSchema.parse({
          status: "sold",
          finalPrice: 4_000_000,
          saleDate: addDaysIso(todayIso(), 1),
        }),
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const sold = await updateSale(
      owner,
      sale.id,
      saleUpdateSchema.parse({
        status: "sold",
        finalPrice: 4_000_000,
        depositAmount: 1_000_000,
        depositPaid: true,
        saleDate: todayIso(),
      }),
    );

    expect(sold.status).toBe("sold");

    await expect(
      updateSale(
        owner,
        sale.id,
        saleUpdateSchema.parse({ status: "cancelled" }),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await deleteSale(owner, sale.id);
    await expect(getSale(owner, sale.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("penjualan batal boleh kembali ke Dijual", async () => {
    const owner = await createUser("Breeder Batal");
    const cat = await createCat(owner, { name: "Kitten", sex: "male" });
    const sale = await createSale(owner, saleInput(cat.id));

    const cancelled = await updateSale(
      owner,
      sale.id,
      saleUpdateSchema.parse({ status: "cancelled" }),
    );
    expect(cancelled.status).toBe("cancelled");

    const relisted = await updateSale(
      owner,
      sale.id,
      saleUpdateSchema.parse({ status: "listed" }),
    );
    expect(relisted.status).toBe("listed");
  });
});

describe("penjualan — efek ke kucing, pengingat, dan ringkasan", () => {
  it("Terjual mengubah status kucing, menghentikan pengingat, dan dihitung di ringkasan", async () => {
    const owner = await createUser("Breeder Terjual");
    const cat = await createCat(owner, { name: "Terjual", sex: "female" });

    await db.insert(reminders).values({
      userId: owner,
      catId: cat.id,
      title: "Vaksin",
      dueDate: addDaysIso(todayIso(), 3),
      sourceType: "health",
      sourceId: randomUUID(),
    });

    const sale = await createSale(
      owner,
      saleInput(cat.id, {
        status: "sold",
        buyerName: "Siti",
        finalPrice: 6_000_000,
        depositAmount: 1_000_000,
        depositPaid: true,
        saleDate: todayIso(),
      }),
    );

    expect(sale.status).toBe("sold");

    const [soldCat] = await db
      .select()
      .from(cats)
      .where(and(eq(cats.id, cat.id), eq(cats.ownerId, owner)));

    expect(soldCat.status).toBe("sold");

    const allReminders = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.userId, owner), eq(reminders.catId, cat.id)));
    expect(allReminders[0].doneAt).not.toBeNull();

    const defaultList = await listCats(owner, { status: "active" });
    expect(defaultList.some((row) => row.id === cat.id)).toBe(false);

    const { summary } = await listSales(owner, {
      month: todayIso().slice(0, 7),
    });
    expect(summary.soldCount).toBe(1);
    expect(summary.totalRevenue).toBe(6_000_000);

    await deleteSale(owner, sale.id);

    const [restored] = await db
      .select()
      .from(cats)
      .where(eq(cats.id, cat.id));
    expect(restored.status).toBe("active");

    const afterDelete = await listCats(owner, { status: "active" });
    expect(afterDelete.some((row) => row.id === cat.id)).toBe(true);
  });

  it("kucing beku tidak bisa dijual", async () => {
    const owner = await createUser("Breeder Freeze");
    const cat = await createCat(owner, { name: "Frozen", sex: "male" });

    await setTrackingStatus(owner, cat.id, "frozen");

    await expect(createSale(owner, saleInput(cat.id))).rejects.toMatchObject({
      code: "CAT_FROZEN",
    });
  });
});

describe("penjualan — jendela riwayat Free", () => {
  it("menyembunyikan penjualan lama dan menghitung lockedCount", async () => {
    const owner = await createUser("Breeder Riwayat Jual");
    await addProSubscription(owner);

    const cat = await createCat(owner, { name: "Lama", sex: "female" });
    const oldDate = addDaysIso(todayIso(), -120);

    await createSale(
      owner,
      saleInput(cat.id, {
        status: "sold",
        buyerName: "Lama",
        finalPrice: 3_000_000,
        saleDate: oldDate,
      }),
    );

    // Turunkan paket ke Free dengan mengakhiri langganan.
    await db
      .update(subscriptions)
      .set({ endsAt: new Date(Date.now() - 86_400_000) })
      .where(eq(subscriptions.userId, owner));

    const result = await listSales(owner);
    expect(result.items).toHaveLength(0);
    expect(result.lockedCount).toBe(1);
    expect(result.windowStart).not.toBeNull();
  });
});
