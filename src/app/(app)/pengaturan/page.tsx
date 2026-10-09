import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function PengaturanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Pengaturan</h1>
        <p className="mt-1 text-text-muted">
          Kelola preferensi dan pengaturan akun kamu
        </p>
      </div>

      {/* Notifikasi */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Notifikasi</CardTitle>
          <CardDescription>
            Atur preferensi notifikasi kamu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-reminders">Email Pengingat</Label>
              <p className="text-sm text-text-muted">
                Terima pengingat lewat email
              </p>
            </div>
            <Switch id="email-reminders" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Notifikasi Web</Label>
              <p className="text-sm text-text-muted">
                Terima notifikasi di perangkat ini
              </p>
            </div>
            <Switch id="push-notifications" />
          </div>

          <Link
            href="/notifikasi"
            className="flex items-center justify-between rounded-2xl bg-tangerine-subtle p-4 transition-transform active:scale-[0.99]"
          >
            <div>
              <p className="font-semibold text-primary">Kelola Notifikasi</p>
              <p className="text-sm text-primary/70">
                Perangkat, email & notifikasi uji
              </p>
            </div>
            <span className="material-symbols-outlined text-xl text-primary">
              arrow_forward
            </span>
          </Link>

          <Link
            href="/pengingat"
            className="flex items-center justify-between rounded-2xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container"
          >
            <div>
              <p className="font-semibold text-on-surface">Daftar Pengingat</p>
              <p className="text-sm text-text-muted">
                Lihat semua jadwal & tandai selesai
              </p>
            </div>
            <span className="material-symbols-outlined text-xl text-text-muted">
              arrow_forward
            </span>
          </Link>
        </CardContent>
      </Card>

      {/* Akun */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Akun</CardTitle>
          <CardDescription>
            Kelola akun dan keamanan kamu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            type="button"
            className="w-full rounded-2xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container"
          >
            <p className="font-semibold text-on-surface">Ubah Password</p>
            <p className="text-sm text-text-muted">
              Terakhir diubah 30 hari yang lalu
            </p>
          </button>

          <button
            type="button"
            className="w-full rounded-2xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container"
          >
            <p className="font-semibold text-on-surface">Riwayat Kepemilikan</p>
            <p className="text-sm text-text-muted">
              Lihat kucing yang pernah kamu miliki
            </p>
          </button>

          <button
            type="button"
            className="w-full rounded-2xl bg-error-container/50 p-4 text-left transition-colors hover:bg-error-container"
          >
            <p className="font-semibold text-error">Keluar</p>
            <p className="text-sm text-text-muted">
              Akhiri sesi dan kembali ke halaman login
            </p>
          </button>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Informasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            type="button"
            className="w-full rounded-2xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container"
          >
            <p className="font-semibold text-on-surface">Kebijakan Privasi</p>
          </button>

          <button
            type="button"
            className="w-full rounded-2xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container"
          >
            <p className="font-semibold text-on-surface">Syarat Layanan</p>
          </button>

          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-sm text-text-muted">Versi Aplikasi</p>
            <p className="font-semibold text-on-surface">0.1.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
