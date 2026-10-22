import { handleRouteError, parseBody } from "@/lib/api-error";
import { requireSession } from "@/lib/session";
import {
  deleteStudService,
  getStudService,
  updateStudService,
} from "@/lib/stud-services";
import { studServiceUpdateSchema } from "@/lib/validation/stud";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const service = await getStudService(session.user.id, id);

    return Response.json({ service });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, studServiceUpdateSchema);
    const service = await updateStudService(session.user.id, id, input);

    return Response.json({ service });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteStudService(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
