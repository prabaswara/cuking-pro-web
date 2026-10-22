import { handleRouteError, parseBody } from "@/lib/api-error";
import { requireSession } from "@/lib/session";
import {
  createStudBooking,
  listStudBookings,
} from "@/lib/stud-bookings";
import {
  studBookingCreateSchema,
  studBookingListQuerySchema,
} from "@/lib/validation/stud";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const raw = {
      status: searchParams.get("status") ?? undefined,
      studServiceId:
        searchParams.get("stud_service_id") ??
        searchParams.get("studServiceId") ??
        undefined,
      plannedDate:
        searchParams.get("planned_date") ??
        searchParams.get("plannedDate") ??
        undefined,
    };

    const parsed = studBookingListQuerySchema.safeParse(raw);
    const result = await listStudBookings(
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
    const input = await parseBody(request, studBookingCreateSchema);
    const booking = await createStudBooking(session.user.id, input);

    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
