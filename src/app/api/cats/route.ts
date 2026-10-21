import { handleRouteError, parseBody } from "@/lib/api-error";
import { createCat, listCats } from "@/lib/cats";
import { requireSession } from "@/lib/session";
import { catCreateSchema, catListQuerySchema } from "@/lib/validation/cat";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const parsed = catListQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    const query = parsed.success ? parsed.data : {};
    const items = await listCats(session.user.id, query);

    return Response.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const input = await parseBody(request, catCreateSchema);
    const cat = await createCat(session.user.id, input);

    return Response.json({ cat }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
