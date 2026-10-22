import { handleRouteError, parseBody } from "@/lib/api-error";
import { createReminder, listReminders } from "@/lib/reminders";
import { requireSession } from "@/lib/session";
import {
  reminderCreateSchema,
  reminderListQuerySchema,
} from "@/lib/validation/reminder";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const parsed = reminderListQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    const items = await listReminders(
      session.user.id,
      parsed.success ? parsed.data : {},
    );

    return Response.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const input = await parseBody(request, reminderCreateSchema);
    const reminder = await createReminder(session.user.id, input);

    return Response.json({ reminder }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
