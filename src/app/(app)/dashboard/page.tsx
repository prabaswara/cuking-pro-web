import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { connection } from "next/server";
import { formatDateID, getCatName, mockReminders } from "@/lib/mock";

export default async function DashboardPage() {
  await connection();
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">
          Selamat Pagi, Pengguna! 🐾
        </h1>
        <p className="mt-1 text-text-muted">
          Semua anabulmu dalam kondisi prima hari ini.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="rounded-2xl border-sand-border shadow-warm-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-subtle">
                <span className="material-symbols-outlined text-xl text-honey-amber">
                  pets
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface">0</p>
                <p className="text-xs text-text-muted">Total Kucing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-sand-border shadow-warm-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-subtle">
                <span className="material-symbols-outlined text-xl text-secondary">
                  check_circle
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface">0</p>
                <p className="text-xs text-text-muted">Kondisi Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-sand-border shadow-warm-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender-subtle">
                <span className="material-symbols-outlined text-xl text-tertiary">
                  favorite
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface">0</p>
                <p className="text-xs text-text-muted">Hamil (Queen)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-sand-border shadow-warm-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tangerine-subtle">
                <span className="material-symbols-outlined text-xl text-primary">
                  child_care
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface">0</p>
                <p className="text-xs text-text-muted">Anak Kucing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          <CardDescription>Pencatatan harian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <button
              type="button"
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface-container-low p-4 transition-transform active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-subtle">
                <span className="material-symbols-outlined text-2xl text-honey-amber">
                  scale
                </span>
              </div>
              <span className="text-xs font-semibold text-on-surface">
                Timbang Berat
              </span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface-container-low p-4 transition-transform active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tangerine-subtle">
                <span className="material-symbols-outlined text-2xl text-primary">
                  set_meal
                </span>
              </div>
              <span className="text-xs font-semibold text-on-surface">
                Catat Pakan
              </span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface-container-low p-4 transition-transform active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-subtle">
                <span className="material-symbols-outlined text-2xl text-secondary">
                  account_balance_wallet
                </span>
              </div>
              <span className="text-xs font-semibold text-on-surface">
                Catat Biaya
              </span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface-container-low p-4 transition-transform active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lavender-subtle">
                <span className="material-symbols-outlined text-2xl text-tertiary">
                  medical_services
                </span>
              </div>
              <span className="text-xs font-semibold text-on-surface">
                Rekam Medis
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Reminders */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Mendatang & Pengingat</CardTitle>
              <CardDescription>Jadwal penting untuk anabulmu</CardDescription>
            </div>
            <Link
              href="/pengingat"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Kelola
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2.5">
            {mockReminders
              .filter((r) => !r.doneAt)
              .slice(0, 3)
              .map((r) => (
                <Link
                  key={r.id}
                  href="/pengingat"
                  className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-sand-border bg-surface-card p-3.5 transition-transform active:scale-[0.99]"
                >
                  <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-honey-amber" />
                  <div className="min-w-0 pl-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-on-surface">
                        {getCatName(r.catId)}
                      </span>
                      <span className="truncate text-sm text-text-muted">
                        • {r.title}
                      </span>
                    </div>
                    <span className="text-sm text-text-muted">
                      {formatDateID(r.dueDate)}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Aktivitas Terakhir</CardTitle>
              <CardDescription>Riwayat aktivitas anabulmu</CardDescription>
            </div>
            <Link
              href="/kucing"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Lihat Semua
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl bg-surface-container-low p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-2xl text-text-muted">
                history
              </span>
            </div>
            <p className="font-semibold text-on-surface">Belum ada aktivitas</p>
            <p className="mt-1 text-sm text-text-muted">
              Mulai catat aktivitas anabulmu untuk melihat riwayat di sini.
            </p>
            <Link href="/kucing/tambah">
              <Button className="mt-4 rounded-full">
                Tambah Kucing Pertama
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
