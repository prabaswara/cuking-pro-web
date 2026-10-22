import { handleRouteError, parseBody } from "@/lib/api-error";
import { deleteMating, getMating, updateMating } from "@/lib/matings";
import { requireSession } from "@/lib/session";
import { matingUpdateSchema } from "@/lib/validation/breeding";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const mating = await getMating(session.user.id, id);

    return Response.json({ mating });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, matingUpdateSchema);
    const mating = await updateMating(session.user.id, id, input);

    return Response.json({ mating });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteMating(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
