import { handleRouteError } from "@/lib/api-error";
import { getPedigree } from "@/lib/cats";
import { requireSession } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const pedigree = await getPedigree(session.user.id, id);

    return Response.json(pedigree);
  } catch (error) {
    return handleRouteError(error);
  }
}
