import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, user } from "@/db/schema";
import { handleRouteError, parseBody } from "@/lib/api-error";
import { getPlanInfo } from "@/lib/plan";
import { getAccount, getOrCreateProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { profileUpdateSchema } from "@/lib/validation/profile";

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const [account, profile, plan] = await Promise.all([
      getAccount(userId),
      getOrCreateProfile(userId),
      getPlanInfo(userId),
    ]);

    return Response.json({ user: account, profile, plan });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const input = await parseBody(request, profileUpdateSchema);

    if (input.name !== undefined) {
      await db.update(user).set({ name: input.name }).where(eq(user.id, userId));
    }

    await getOrCreateProfile(userId);

    const profilePatch = {
      ...(input.whatsapp !== undefined ? { whatsapp: input.whatsapp } : {}),
      ...(input.kennelName !== undefined ? { kennelName: input.kennelName } : {}),
      ...(input.avatarPath !== undefined ? { avatarPath: input.avatarPath } : {}),
      ...(input.isBreeder !== undefined ? { isBreeder: input.isBreeder } : {}),
      ...(input.isStudProvider !== undefined
        ? { isStudProvider: input.isStudProvider }
        : {}),
      ...(input.emailRemindersEnabled !== undefined
        ? { emailRemindersEnabled: input.emailRemindersEnabled }
        : {}),
    };

    if (Object.keys(profilePatch).length > 0) {
      await db.update(profiles).set(profilePatch).where(eq(profiles.userId, userId));
    }

    const [account, profile] = await Promise.all([
      getAccount(userId),
      getOrCreateProfile(userId),
    ]);

    return Response.json({ user: account, profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
