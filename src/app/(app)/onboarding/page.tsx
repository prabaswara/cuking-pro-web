import { connection } from "next/server";
import { redirect } from "next/navigation";
import { RolePicker } from "@/components/onboarding/role-picker";
import { getOrCreateProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";

export default async function OnboardingPage() {
  await connection();

  const session = await getSession();
  if (!session) redirect("/login");

  const profile = await getOrCreateProfile(session.user.id);

  return (
    <RolePicker
      initialIsBreeder={profile.isBreeder}
      initialIsStudProvider={profile.isStudProvider}
    />
  );
}
