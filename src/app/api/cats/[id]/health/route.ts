import { handleRouteError, parseBody } from "@/lib/api-error";
import { createHealthRecord, listHealthRecords } from "@/lib/health";
import { requireSession } from "@/lib/session";
import {
  healthCreateSchema,
  healthListQuerySchema,
} from "@/lib/validation/health";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const parsed = healthListQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    const result = await listHealthRecords(
      session.user.id,
      id,
      parsed.success ? parsed.data : {},
    );

    return Response.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, healthCreateSchema);
    const record = await createHealthRecord(session.user.id, id, input);

    return Response.json({ record }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
