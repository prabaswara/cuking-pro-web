import { handleRouteError } from "@/lib/api-error";
import { requireSession } from "@/lib/session";
import { getStudServiceStats } from "@/lib/stud-bookings";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const stats = await getStudServiceStats(session.user.id, id);

    return Response.json({ stats });
  } catch (error) {
    return handleRouteError(error);
  }
}
