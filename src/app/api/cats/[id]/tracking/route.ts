import { handleRouteError, parseBody } from "@/lib/api-error";
import { setTrackingStatus } from "@/lib/cats";
import { requireSession } from "@/lib/session";
import { catTrackingSchema } from "@/lib/validation/cat";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, catTrackingSchema);
    const cat = await setTrackingStatus(
      session.user.id,
      id,
      input.trackingStatus,
    );

    return Response.json({ cat });
  } catch (error) {
    return handleRouteError(error);
  }
}
