import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cats, feedingSchedules } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { getCat } from "@/lib/cats";
import type {
  FeedingCreateInput,
  FeedingUpdateInput,
} from "@/lib/validation/feeding";

export type FeedingScheduleRow = typeof feedingSchedules.$inferSelect;

function assertWritableCat(cat: { trackingStatus: "tracked" | "frozen" }): void {
  if (cat.trackingStatus === "frozen") {
    throw new ApiError(
      "CAT_FROZEN",
      "Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk mengubah datanya.",
    );
  }
}

export async function listFeedingSchedules(
  userId: string,
  catId: string,
): Promise<FeedingScheduleRow[]> {
  await getCat(userId, catId);

  return db
    .select()
    .from(feedingSchedules)
    .where(eq(feedingSchedules.catId, catId))
    .orderBy(asc(feedingSchedules.scheduleTime), asc(feedingSchedules.createdAt));
}

async function getScheduleWithOwner(userId: string, scheduleId: string) {
  const [row] = await db
    .select({ schedule: feedingSchedules, cat: cats })
    .from(feedingSchedules)
    .innerJoin(cats, eq(cats.id, feedingSchedules.catId))
    .where(and(eq(feedingSchedules.id, scheduleId), eq(cats.ownerId, userId)))
    .limit(1);

  if (!row) {
    throw new ApiError("NOT_FOUND", "Jadwal pakan tidak ditemukan.");
  }

  return row;
}

export async function createFeedingSchedule(
  userId: string,
  catId: string,
  input: FeedingCreateInput,
): Promise<FeedingScheduleRow> {
  const cat = await getCat(userId, catId);
  assertWritableCat(cat);

  const [created] = await db
    .insert(feedingSchedules)
    .values({
      catId,
      scheduleTime: input.scheduleTime,
      portionGrams: input.portionGrams,
      foodType: input.foodType,
      notes: input.notes ?? null,
    })
    .returning();

  return created;
}

export async function updateFeedingSchedule(
  userId: string,
  scheduleId: string,
  input: FeedingUpdateInput,
): Promise<FeedingScheduleRow> {
  const { cat } = await getScheduleWithOwner(userId, scheduleId);
  assertWritableCat(cat);

  const [updated] = await db
    .update(feedingSchedules)
    .set({
      ...(input.scheduleTime !== undefined
        ? { scheduleTime: input.scheduleTime }
        : {}),
      ...(input.portionGrams !== undefined
        ? { portionGrams: input.portionGrams }
        : {}),
      ...(input.foodType !== undefined ? { foodType: input.foodType } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    })
    .where(eq(feedingSchedules.id, scheduleId))
    .returning();

  return updated;
}

export async function deleteFeedingSchedule(
  userId: string,
  scheduleId: string,
): Promise<void> {
  const { cat } = await getScheduleWithOwner(userId, scheduleId);
  assertWritableCat(cat);

  await db.delete(feedingSchedules).where(eq(feedingSchedules.id, scheduleId));
}

export async function getFeedingSchedule(
  userId: string,
  scheduleId: string,
): Promise<FeedingScheduleRow> {
  const { schedule } = await getScheduleWithOwner(userId, scheduleId);
  return schedule;
}
