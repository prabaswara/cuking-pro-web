import { handleRouteError, parseBody } from "@/lib/api-error";
import { deleteFeedingSchedule, updateFeedingSchedule } from "@/lib/feeding";
import { requireSession } from "@/lib/session";
import { feedingUpdateSchema } from "@/lib/validation/feeding";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, feedingUpdateSchema);
    const schedule = await updateFeedingSchedule(session.user.id, id, input);

    return Response.json({ schedule });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteFeedingSchedule(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
