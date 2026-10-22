import { handleRouteError, parseBody } from "@/lib/api-error";
import { addKitten } from "@/lib/litters";
import { requireSession } from "@/lib/session";
import { kittenCreateSchema } from "@/lib/validation/breeding";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, kittenCreateSchema);
    const kitten = await addKitten(session.user.id, id, input);

    return Response.json({ kitten }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
