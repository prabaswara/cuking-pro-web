/**
 * Seed data demo (Fase 1).
 *
 * Akun demo memakai Better Auth (bukan insert tabel auth manual) supaya
 * hashing password tetap benar. Aman dijalankan berulang (idempoten).
 *
 * Jalankan: npm run db:seed
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pgClient } from "@/db";
import {
  catOwnershipHistory,
  cats,
  plans,
  profiles,
  subscriptions,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth";

const DEMO_PASSWORD = "demo12345";

type DemoCat = {
  name: string;
  sex: "male" | "female";
  breed: string;
  color: string;
  birthDate: string;
  isNeutered?: boolean;
  notes?: string;
};

type DemoAccount = {
  email: string;
  name: string;
  kennelName: string;
  isBreeder: boolean;
  isStudProvider: boolean;
  monthlyPro?: boolean;
  cats: DemoCat[];
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "free@demo.cukingpro",
    name: "Demo Free",
    kennelName: "Rumah Free",
    isBreeder: false,
    isStudProvider: false,
    cats: [
      {
        name: "Mochi",
        sex: "female",
        breed: "British Shorthair",
        color: "Lilac Solid",
        birthDate: "2024-06-14",
        notes: "Induk aktif, nafsu makan stabil.",
      },
      {
        name: "Luna",
        sex: "female",
        breed: "Persia",
        color: "Putih Solid",
        birthDate: "2025-07-01",
      },
    ],
  },
  {
    email: "breeder@demo.cukingpro",
    name: "Demo Breeder",
    kennelName: "PurrGems Cattery",
    isBreeder: true,
    isStudProvider: false,
    cats: [
      {
        name: "King Arthur",
        sex: "male",
        breed: "Maine Coon",
        color: "Brown Tabby",
        birthDate: "2023-02-11",
      },
      {
        name: "Queen Cleo",
        sex: "female",
        breed: "Maine Coon",
        color: "Silver Tabby",
        birthDate: "2023-05-20",
      },
    ],
  },
  {
    email: "stud@demo.cukingpro",
    name: "Demo Stud",
    kennelName: "Fluff Stud Service",
    isBreeder: false,
    isStudProvider: true,
    cats: [
      {
        name: "Raja",
        sex: "male",
        breed: "Ragdoll",
        color: "Seal Bicolor",
        birthDate: "2022-11-02",
        notes: "Pejantan pacak utama.",
      },
      {
        name: "Bima",
        sex: "male",
        breed: "Ragdoll",
        color: "Blue Point",
        birthDate: "2024-01-15",
      },
    ],
  },
  {
    email: "pro@demo.cukingpro",
    name: "Demo Pro",
    kennelName: "Pro Cattery",
    isBreeder: true,
    isStudProvider: true,
    monthlyPro: true,
    cats: [
      {
        name: "Aurora",
        sex: "female",
        breed: "Bengal",
        color: "Brown Rosetted",
        birthDate: "2023-03-08",
      },
      {
        name: "Zeus",
        sex: "male",
        breed: "Bengal",
        color: "Snow Marble",
        birthDate: "2022-09-19",
      },
      {
        name: "Kiko",
        sex: "male",
        breed: "Scottish Fold",
        color: "Golden Chinchilla",
        birthDate: "2024-04-27",
      },
    ],
  },
];

async function ensurePlan() {
  const [existing] = await db.select().from(plans).where(eq(plans.code, "pro")).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(plans)
    .values({
      code: "pro",
      name: "Pro",
      // PLACEHOLDER: harga & durasi final ditentukan pemilik produk (FR-18).
      priceIdr: 49000,
      durationDays: 30,
      isActive: true,
    })
    .returning();

  return created;
}

async function ensureUser(account: DemoAccount) {
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.email, account.email))
    .limit(1);

  if (existing) return existing;

  await auth.api.signUpEmail({
    body: {
      name: account.name,
      email: account.email,
      password: DEMO_PASSWORD,
    },
  });

  await db.update(user).set({ emailVerified: true }).where(eq(user.email, account.email));

  const [created] = await db
    .select()
    .from(user)
    .where(eq(user.email, account.email))
    .limit(1);

  return created;
}

async function seedAccount(account: DemoAccount, proPlanId: string) {
  const row = await ensureUser(account);
  if (!row) throw new Error(`Gagal membuat user demo ${account.email}`);

  await db
    .insert(profiles)
    .values({
      userId: row.id,
      kennelName: account.kennelName,
      isBreeder: account.isBreeder,
      isStudProvider: account.isStudProvider,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        kennelName: account.kennelName,
        isBreeder: account.isBreeder,
        isStudProvider: account.isStudProvider,
      },
    });

  if (account.monthlyPro) {
    const [active] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.userId, row.id))
      .limit(1);

    if (!active) {
      const startsAt = new Date();
      const endsAt = new Date(startsAt);
      endsAt.setDate(endsAt.getDate() + 30);

      await db.insert(subscriptions).values({
        userId: row.id,
        planId: proPlanId,
        startsAt,
        endsAt,
      });
    }
  }

  const existingCats = await db
    .select({ id: cats.id })
    .from(cats)
    .where(eq(cats.ownerId, row.id))
    .limit(1);

  if (existingCats.length > 0) return;

  for (const demoCat of account.cats) {
    const [cat] = await db
      .insert(cats)
      .values({
        ownerId: row.id,
        name: demoCat.name,
        sex: demoCat.sex,
        breed: demoCat.breed,
        color: demoCat.color,
        birthDate: demoCat.birthDate,
        isNeutered: demoCat.isNeutered ?? false,
        notes: demoCat.notes,
      })
      .returning({ id: cats.id, name: cats.name });

    await db.insert(catOwnershipHistory).values({
      catId: cat.id,
      catName: cat.name,
      ownerId: row.id,
      ownerDisplayName: account.kennelName || account.name,
      startedAt: new Date(),
      acquiredVia: "created",
    });
  }
}

async function main() {
  const proPlan = await ensurePlan();

  for (const account of DEMO_ACCOUNTS) {
    await seedAccount(account, proPlan.id);
    console.log(`✓ ${account.email} (${account.cats.length} kucing)`);
  }

  console.log(`\nSelesai. Password semua akun demo: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pgClient.end();
  });
