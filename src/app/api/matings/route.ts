import { handleRouteError, parseBody } from "@/lib/api-error";
import { createMating, listMatings } from "@/lib/matings";
import { requireSession } from "@/lib/session";
import { matingCreateSchema, matingListQuerySchema } from "@/lib/validation/breeding";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const parsed = matingListQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    const result = await listMatings(
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
    const input = await parseBody(request, matingCreateSchema);
    const mating = await createMating(session.user.id, input);

    return Response.json({ mating }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
