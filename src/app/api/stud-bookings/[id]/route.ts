import { handleRouteError, parseBody } from "@/lib/api-error";
import { requireSession } from "@/lib/session";
import {
  deleteStudBooking,
  getStudBooking,
  updateStudBooking,
} from "@/lib/stud-bookings";
import { studBookingUpdateSchema } from "@/lib/validation/stud";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const booking = await getStudBooking(session.user.id, id);

    return Response.json({ booking });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, studBookingUpdateSchema);
    const booking = await updateStudBooking(session.user.id, id, input);

    return Response.json({ booking });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteStudBooking(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
