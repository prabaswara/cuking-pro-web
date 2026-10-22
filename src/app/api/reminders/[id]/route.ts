import { handleRouteError, parseBody } from "@/lib/api-error";
import { deleteReminder, updateReminder } from "@/lib/reminders";
import { requireSession } from "@/lib/session";
import { reminderUpdateSchema } from "@/lib/validation/reminder";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const input = await parseBody(request, reminderUpdateSchema);
    const reminder = await updateReminder(session.user.id, id, input);

    return Response.json({ reminder });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteReminder(session.user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
