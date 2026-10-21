import { handleRouteError } from "@/lib/api-error";
import {
  countActiveCats,
  countTrackedCats,
  getPlanInfo,
  historyWindowStart,
  reconcileTracking,
} from "@/lib/plan";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    // Sesuaikan status beku dengan paket aktif (mis. setelah Pro berakhir).
    await reconcileTracking(userId);

    const [plan, activeCats, trackedCats] = await Promise.all([
      getPlanInfo(userId),
      countActiveCats(userId),
      countTrackedCats(userId),
    ]);

    const windowStart = historyWindowStart(plan.limits.historyMonths);

    return Response.json({
      plan,
      usage: {
        activeCats,
        trackedCats,
        maxTrackedCats: plan.limits.maxTrackedCats,
      },
      historyWindowStart: windowStart?.toISOString() ?? null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
