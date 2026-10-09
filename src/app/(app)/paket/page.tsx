import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PaketPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-on-surface">Paket cukingPro</h1>
        <p className="mt-2 text-text-muted">
          Pilih paket yang sesuai dengan kebutuhanmu
        </p>
      </div>

      {/* Current Plan */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Paket Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-2xl bg-mint-subtle p-4">
            <div>
              <p className="font-semibold text-secondary">Paket Free</p>
              <p className="text-sm text-secondary/80">
                2 kucing dilacak • Riwayat 3 bulan
              </p>
            </div>
            <Badge className="rounded-full bg-secondary text-white">Aktif</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Free Plan */}
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardHeader>
            <CardTitle className="text-lg">Free</CardTitle>
            <CardDescription>Untuk pemula</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-on-surface">Rp 0</span>
              <span className="text-text-muted">/selamanya</span>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-secondary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Maksimal 2 kucing dilacak
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-secondary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Riwayat 3 bulan terakhir
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-secondary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Catatan kesehatan & vaksin
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-secondary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Pengingat email
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-secondary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Fitur breeding & jasa pacak
                </span>
              </li>
            </ul>

            <Button
              disabled
              className="w-full rounded-full"
              variant="outline"
            >
              Paket Saat Ini
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="rounded-3xl border-primary/30 shadow-warm-md ring-2 ring-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pro</CardTitle>
                <CardDescription>Untuk breeder & profesional</CardDescription>
              </div>
              <Badge className="rounded-full bg-primary text-white">
                Rekomendasi
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-on-surface">Rp 99.000</span>
              <span className="text-text-muted">/bulan</span>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-primary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Kucing tanpa batas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-primary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Riwayat tanpa batas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-primary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Catatan kesehatan & vaksin
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-primary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Pengingat email & notifikasi web
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-primary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Fitur breeding & jasa pacak
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-primary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Transfer kepemilikan kucing
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-primary">
                  check_circle
                </span>
                <span className="text-sm text-on-surface">
                  Keuangan & laporan
                </span>
              </li>
            </ul>

            <Button className="w-full rounded-full">
              Upgrade ke Pro
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Pertanyaan Umum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-surface-container-low p-4">
            <h4 className="font-semibold text-on-surface">
              Bisa berlangganan kapan saja?
            </h4>
            <p className="mt-1 text-sm text-text-muted">
              Ya! Kamu bisa upgrade ke Pro kapan saja dan langsung mendapatkan
              akses penuh.
            </p>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-4">
            <h4 className="font-semibold text-on-surface">
              Apakah ada jaminan uang kembali?
            </h4>
            <p className="mt-1 text-sm text-text-muted">
              Kami tidak memberikan pengembalian dana untuk masa langganan yang
              sudah berjalan.
            </p>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-4">
            <h4 className="font-semibold text-on-surface">
              Bagaimana cara pembayaran?
            </h4>
            <p className="mt-1 text-sm text-text-muted">
              Kami mendukung berbagai metode pembayaran melalui Midtrans
              (QRIS, virtual account, e-wallet, kartu kredit).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
