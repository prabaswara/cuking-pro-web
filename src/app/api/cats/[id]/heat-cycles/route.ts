import { handleRouteError, parseBody } from "@/lib/api-error";
import { createHeatCycle, listHeatCycles } from "@/lib/heat-cycles";
import { requireSession } from "@/lib/session";
import { heatCycleCreateSchema } from "@/lib/validation/breeding";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const result = await listHeatCycles(session.user.id, id);

    return Response.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, heatCycleCreateSchema);
    const cycle = await createHeatCycle(session.user.id, id, input);

    return Response.json({ cycle }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
