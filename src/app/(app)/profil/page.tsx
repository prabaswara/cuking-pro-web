import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profil/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccount, getOrCreateProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";

export default async function ProfilPage() {
  await connection();

  const session = await getSession();
  if (!session) redirect("/login");

  const [account, profile] = await Promise.all([
    getAccount(session.user.id),
    getOrCreateProfile(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Profil Saya</h1>
        <p className="mt-1 text-text-muted">
          Kelola data profil dan preferensi akun kamu
        </p>
      </div>

      <ProfileForm
        user={{ name: account.name, email: account.email }}
        profile={{
          whatsapp: profile.whatsapp,
          kennelName: profile.kennelName,
          isBreeder: profile.isBreeder,
          isStudProvider: profile.isStudProvider,
        }}
      />

      {/* Danger Zone */}
      <Card className="rounded-3xl border-error/20 shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg text-error">Zona Berbahaya</CardTitle>
          <CardDescription>
            Tindakan berikut tidak dapat dibatalkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl bg-error-container/50 p-4">
            <h4 className="font-semibold text-on-surface">Hapus Akun</h4>
            <p className="mt-1 text-sm text-text-muted">
              Seluruh data, foto, dan riwayat kucing akan dihapus permanen.
              Sisa masa Pro akan hangus tanpa pengembalian dana.
            </p>
            <button
              type="button"
              disabled
              className="mt-3 rounded-full bg-error px-4 py-2 text-sm font-semibold text-white opacity-60"
            >
              Hapus Akun (segera hadir)
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
