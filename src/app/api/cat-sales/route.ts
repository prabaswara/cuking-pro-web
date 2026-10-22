import { handleRouteError, parseBody } from "@/lib/api-error";
import { createSale, listSales } from "@/lib/sales";
import { requireSession } from "@/lib/session";
import { saleCreateSchema, saleListQuerySchema } from "@/lib/validation/sale";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const parsed = saleListQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    const result = await listSales(
      session.user.id,
      parsed.success ? parsed.data : {},
    );

    return Response.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const input = await parseBody(request, saleCreateSchema);
    const sale = await createSale(session.user.id, input);

    return Response.json({ sale }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
