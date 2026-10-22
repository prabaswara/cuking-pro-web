import { handleRouteError, parseBody } from "@/lib/api-error";
import { requireSession } from "@/lib/session";
import {
  addStudMating,
  listStudMatings,
} from "@/lib/stud-bookings";
import { studMatingCreateSchema } from "@/lib/validation/stud";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const matings = await listStudMatings(session.user.id, id);

    return Response.json({ matings });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, studMatingCreateSchema);
    const booking = await addStudMating(session.user.id, id, input);

    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
