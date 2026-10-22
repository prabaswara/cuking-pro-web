import { handleRouteError, parseBody } from "@/lib/api-error";
import { createDocument, listDocuments } from "@/lib/documents";
import { requireSession } from "@/lib/session";
import { documentCreateSchema } from "@/lib/validation/document";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const result = await listDocuments(session.user.id, id);

    return Response.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, documentCreateSchema);
    const document = await createDocument(session.user.id, id, input);

    return Response.json({ document }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
