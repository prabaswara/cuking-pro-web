import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface SilsilahPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SilsilahPage({ params }: SilsilahPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/kucing/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Detail
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">Silsilah</h1>
        <p className="mt-1 text-text-muted">Garis keturunan kucing</p>
      </div>

      {/* Pedigree Card */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Garis Keturunan</CardTitle>
          <CardDescription>2 generasi ke atas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Parents */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-xs text-text-muted">Induk (Ibu)</p>
                <p className="mt-1 font-semibold text-on-surface">
                  Queen Cleo of PurrGems
                </p>
                <p className="text-sm text-text-muted">
                  British Shorthair Lilac
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-xs text-text-muted">Ayah</p>
                <p className="mt-1 font-semibold text-on-surface">
                  King Arthur von Fluff
                </p>
                <p className="text-sm text-text-muted">
                  British Shorthair Blue
                </p>
              </div>
            </div>

            {/* Grandparents */}
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="mb-3 text-xs font-semibold text-text-muted">
                Kakek & Nenek
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-surface-card p-3">
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      CH King Arthur von Fluff
                    </p>
                    <p className="text-xs text-text-muted">
                      Sire (Ayah) • British Shorthair Blue
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-lg text-honey-amber">
                    military_tech
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-card p-3">
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      Queen Cleo of PurrGems
                    </p>
                    <p className="text-xs text-text-muted">
                      Dam (Ibu) • British Shorthair Lilac
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-lg text-honey-amber">
                    military_tech
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offspring */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Anak Kucing</CardTitle>
          <CardDescription>Daftar anak yang pernah dihasilkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl bg-surface-container-low p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-2xl text-text-muted">
                child_care
              </span>
            </div>
            <p className="font-semibold text-on-surface">Belum ada anak</p>
            <p className="mt-1 text-sm text-text-muted">
              Anak kucing yang lahir dari kucing ini akan muncul di sini.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
