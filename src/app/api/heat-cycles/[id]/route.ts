import { handleRouteError, parseBody } from "@/lib/api-error";
import { deleteHeatCycle, updateHeatCycle } from "@/lib/heat-cycles";
import { requireSession } from "@/lib/session";
import { heatCycleUpdateSchema } from "@/lib/validation/breeding";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, heatCycleUpdateSchema);
    const cycle = await updateHeatCycle(session.user.id, id, input);

    return Response.json({ cycle });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteHeatCycle(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
