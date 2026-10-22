import { handleRouteError, parseBody } from "@/lib/api-error";
import { deleteDocument, updateDocument } from "@/lib/documents";
import { requireSession } from "@/lib/session";
import { documentUpdateSchema } from "@/lib/validation/document";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, documentUpdateSchema);
    const document = await updateDocument(session.user.id, id, input);

    return Response.json({ document });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteDocument(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
