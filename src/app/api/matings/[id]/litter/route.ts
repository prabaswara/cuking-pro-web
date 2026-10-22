import { handleRouteError, parseBody } from "@/lib/api-error";
import { createLitter } from "@/lib/litters";
import { requireSession } from "@/lib/session";
import { litterCreateSchema } from "@/lib/validation/breeding";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, litterCreateSchema);
    const litter = await createLitter(session.user.id, id, input);

    return Response.json({ litter }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
