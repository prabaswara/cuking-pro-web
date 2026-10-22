import { handleRouteError, parseBody } from "@/lib/api-error";
import { deleteWeight, updateWeight } from "@/lib/health";
import { requireSession } from "@/lib/session";
import { weightUpdateSchema } from "@/lib/validation/health";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, weightUpdateSchema);
    const weight = await updateWeight(session.user.id, id, input);

    return Response.json({ weight });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteWeight(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
