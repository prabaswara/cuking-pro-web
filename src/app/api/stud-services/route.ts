import { handleRouteError, parseBody } from "@/lib/api-error";
import { requireSession } from "@/lib/session";
import { getStudOverview } from "@/lib/stud-bookings";
import { createStudService } from "@/lib/stud-services";
import { studServiceCreateSchema } from "@/lib/validation/stud";

export async function GET() {
  try {
    const session = await requireSession();
    const overview = await getStudOverview(session.user.id);

    return Response.json({ services: overview.services });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const input = await parseBody(request, studServiceCreateSchema);
    const service = await createStudService(session.user.id, input);

    return Response.json({ service }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
