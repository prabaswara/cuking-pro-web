import { handleRouteError, parseBody } from "@/lib/api-error";
import { deleteCat, getCat, updateCat } from "@/lib/cats";
import { requireSession } from "@/lib/session";
import { catUpdateSchema } from "@/lib/validation/cat";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const cat = await getCat(session.user.id, id);

    return Response.json({ cat });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, catUpdateSchema);
    const cat = await updateCat(session.user.id, id, input);

    return Response.json({ cat });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteCat(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
