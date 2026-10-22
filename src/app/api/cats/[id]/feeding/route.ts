import { handleRouteError, parseBody } from "@/lib/api-error";
import { createFeedingSchedule, listFeedingSchedules } from "@/lib/feeding";
import { requireSession } from "@/lib/session";
import { feedingCreateSchema } from "@/lib/validation/feeding";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const items = await listFeedingSchedules(session.user.id, id);

    return Response.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, feedingCreateSchema);
    const schedule = await createFeedingSchedule(session.user.id, id, input);

    return Response.json({ schedule }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
