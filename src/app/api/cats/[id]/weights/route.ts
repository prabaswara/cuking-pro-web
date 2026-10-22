import { handleRouteError, parseBody } from "@/lib/api-error";
import { createWeight, listWeights } from "@/lib/health";
import { requireSession } from "@/lib/session";
import { weightCreateSchema } from "@/lib/validation/health";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const result = await listWeights(session.user.id, id);

    return Response.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, weightCreateSchema);
    const weight = await createWeight(session.user.id, id, input);

    return Response.json({ weight }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
