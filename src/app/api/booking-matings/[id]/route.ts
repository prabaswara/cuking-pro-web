import { handleRouteError } from "@/lib/api-error";
import { requireSession } from "@/lib/session";
import { deleteStudMating } from "@/lib/stud-bookings";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteStudMating(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
