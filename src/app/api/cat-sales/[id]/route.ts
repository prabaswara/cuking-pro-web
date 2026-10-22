import { handleRouteError, parseBody } from "@/lib/api-error";
import { deleteSale, getSale, updateSale } from "@/lib/sales";
import { requireSession } from "@/lib/session";
import { saleUpdateSchema } from "@/lib/validation/sale";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const sale = await getSale(session.user.id, id);

    return Response.json({ sale });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, saleUpdateSchema);
    const sale = await updateSale(session.user.id, id, input);

    return Response.json({ sale });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteSale(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
