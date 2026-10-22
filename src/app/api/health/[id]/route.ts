import { handleRouteError, parseBody } from "@/lib/api-error";
import { deleteHealthRecord, updateHealthRecord } from "@/lib/health";
import { requireSession } from "@/lib/session";
import { healthUpdateSchema } from "@/lib/validation/health";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, healthUpdateSchema);
    const record = await updateHealthRecord(session.user.id, id, input);

    return Response.json({ record });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteHealthRecord(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
