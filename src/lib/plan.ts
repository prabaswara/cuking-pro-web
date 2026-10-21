import { and, asc, count, desc, eq, gt, lte } from "drizzle-orm";
import { db } from "@/db";
import { cats, plans, subscriptions } from "@/db/schema";
import { ApiError } from "@/lib/api-error";

/**
 * Sumber tunggal aturan paket (FR-17). Jangan hardcode 3 bulan / 2 kucing
 * di route atau komponen — selalu lewat modul ini.
 */

export const FREE_HISTORY_MONTHS = Number(process.env.FREE_HISTORY_MONTHS ?? 3);
export const FREE_MAX_TRACKED_CATS = Number(process.env.FREE_MAX_TRACKED_CATS ?? 2);

export type PlanInfo = {
  code: "free" | "pro";
  name: string;
  isPro: boolean;
  endsAt: Date | null;
  limits: {
    /** null = tanpa batas */
    maxTrackedCats: number | null;
    historyMonths: number | null;
  };
};

/** Langganan Pro aktif, atau null (berarti Free). */
export async function getActiveSubscription(userId: string) {
  const now = new Date();

  const [row] = await db
    .select({
      id: subscriptions.id,
      planId: subscriptions.planId,
      planCode: plans.code,
      planName: plans.name,
      startsAt: subscriptions.startsAt,
      endsAt: subscriptions.endsAt,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(
      and(
        eq(subscriptions.userId, userId),
        lte(subscriptions.startsAt, now),
        gt(subscriptions.endsAt, now),
        eq(plans.isActive, true),
      ),
    )
    .orderBy(desc(subscriptions.endsAt))
    .limit(1);

  return row ?? null;
}

export async function getPlanInfo(userId: string): Promise<PlanInfo> {
  const subscription = await getActiveSubscription(userId);

  if (subscription) {
    return {
      code: "pro",
      name: subscription.planName,
      isPro: true,
      endsAt: subscription.endsAt,
      limits: { maxTrackedCats: null, historyMonths: null },
    };
  }

  return {
    code: "free",
    name: "Free",
    isPro: false,
    endsAt: null,
    limits: {
      maxTrackedCats: FREE_MAX_TRACKED_CATS,
      historyMonths: FREE_HISTORY_MONTHS,
    },
  };
}

/**
 * Awal jendela riwayat (kalender mundur, bukan 90 hari).
 * Akun Pro tidak dibatasi → null.
 */
export function historyWindowStart(
  months: number | null = FREE_HISTORY_MONTHS,
  now = new Date(),
): Date | null {
  if (months === null) return null;

  const start = new Date(now);
  start.setMonth(start.getMonth() - months);
  return start;
}

/** Kucing aktif (bukan terjual/meninggal) milik pengguna. */
export async function countActiveCats(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(cats)
    .where(and(eq(cats.ownerId, userId), eq(cats.status, "active")));

  return Number(row?.total ?? 0);
}

export async function countTrackedCats(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(cats)
    .where(
      and(
        eq(cats.ownerId, userId),
        eq(cats.status, "active"),
        eq(cats.trackingStatus, "tracked"),
      ),
    );

  return Number(row?.total ?? 0);
}

/** Dipakai sebelum insert kucing baru. */
export async function assertCanAddCat(userId: string) {
  const plan = await getPlanInfo(userId);
  if (plan.limits.maxTrackedCats === null) return plan;

  const active = await countActiveCats(userId);

  if (active >= plan.limits.maxTrackedCats) {
    throw new ApiError(
      "PLAN_CAT_LIMIT",
      `Paket Free hanya bisa melacak ${plan.limits.maxTrackedCats} kucing aktif. Upgrade ke Pro untuk menambah lagi.`,
    );
  }

  return plan;
}

/**
 * Menyesuaikan status tracking dengan paket aktif.
 * - Pro: seluruh kucing aktif kembali dilacak (PRD skenario upgrade).
 * - Free: kelebihan kucing aktif dibekukan, 2 yang paling awal dibuat tetap dilacak.
 * Tidak menghapus data apa pun.
 */
export async function reconcileTracking(userId: string): Promise<void> {
  const plan = await getPlanInfo(userId);

  const activeCats = await db
    .select({ id: cats.id, trackingStatus: cats.trackingStatus })
    .from(cats)
    .where(and(eq(cats.ownerId, userId), eq(cats.status, "active")))
    .orderBy(asc(cats.createdAt));

  if (plan.isPro) {
    const frozenIds = activeCats
      .filter((cat) => cat.trackingStatus === "frozen")
      .map((cat) => cat.id);

    if (frozenIds.length > 0) {
      await db
        .update(cats)
        .set({ trackingStatus: "tracked" })
        .where(and(eq(cats.ownerId, userId), eq(cats.trackingStatus, "frozen")));
    }
    return;
  }

  const max = plan.limits.maxTrackedCats ?? FREE_MAX_TRACKED_CATS;
  const keep = new Set(activeCats.slice(0, max).map((cat) => cat.id));

  for (const cat of activeCats) {
    const desired = keep.has(cat.id) ? "tracked" : "frozen";
    if (cat.trackingStatus !== desired) {
      await db.update(cats).set({ trackingStatus: desired }).where(eq(cats.id, cat.id));
    }
  }
}
