import { ProfileForm } from "@/components/profil/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Profil Saya</h1>
        <p className="mt-1 text-text-muted">
          Kelola data profil dan preferensi akun kamu
        </p>
      </div>

      <ProfileForm />

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
              className="mt-3 rounded-full bg-error px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Hapus Akun
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
