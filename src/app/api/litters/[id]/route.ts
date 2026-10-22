import { handleRouteError } from "@/lib/api-error";
import { getLitter } from "@/lib/litters";
import { requireSession } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const litter = await getLitter(session.user.id, id);

    return Response.json({ litter });
  } catch (error) {
    return handleRouteError(error);
  }
}
