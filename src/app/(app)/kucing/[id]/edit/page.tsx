import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GenderSelect } from "@/components/kucing/gender-select";
import { getMockCat } from "@/lib/mock";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditKucingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditKucingPage({ params }: EditKucingPageProps) {
  const { id } = await params;
  const cat = getMockCat(id);

  if (!cat) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/kucing/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Detail
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">Edit Kucing</h1>
        <p className="mt-1 text-text-muted">Perbarui data anabul kesayanganmu</p>
      </div>

      {/* Form */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Data Kucing</CardTitle>
          <CardDescription>Perbarui informasi kucing</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            {/* Photo Upload */}
            <div className="flex flex-col items-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-warm-cream">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-subtle">
                    <span className="material-symbols-outlined text-2xl text-honey-amber">
                      add_a_photo
                    </span>
                  </div>
                  <span className="mt-1 text-xs font-medium text-on-surface">Ubah Foto</span>
                </div>
              </div>
            </div>

            {/* Nama */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Kucing <span className="text-primary">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="cth: Mochi, Luna, Oyen"
                required
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>

            {/* Jenis Kelamin */}
            <div className="space-y-2">
              <Label>
                Jenis Kelamin <span className="text-primary">*</span>
              </Label>
              <GenderSelect defaultValue={cat.sex} />
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-2">
              <Label htmlFor="birthDate">Tanggal Lahir / Adopsi</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>

            {/* Ras */}
            <div className="space-y-2">
              <Label htmlFor="breed">
                Ras Kucing <span className="text-primary">*</span>
              </Label>
              <select
                id="breed"
                name="breed"
                required
                className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-on-surface"
              >
                <option value="">Pilih ras anabul...</option>
                <option value="domestik">Domestik / Kucing Kampung</option>
                <option value="british_shorthair">British Shorthair</option>
                <option value="persia">Persia</option>
                <option value="maine_coon">Maine Coon</option>
                <option value="ragdoll">Ragdoll</option>
                <option value="scottish_fold">Scottish Fold</option>
                <option value="bengal">Bengal</option>
                <option value="siamese">Siamese</option>
                <option value="sphynx">Sphynx</option>
                <option value="mix">Campuran / Mix Breed</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            {/* Warna */}
            <div className="space-y-2">
              <Label htmlFor="color">Warna & Corak Bulu</Label>
              <Input
                id="color"
                name="color"
                type="text"
                placeholder="cth: Orange Tabby, Calico Tiga Warna"
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status Kucing</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white"
                >
                  Aktif
                </button>
                <button
                  type="button"
                  className="rounded-full bg-surface-card px-4 py-2 text-sm font-medium text-text-muted"
                >
                  Terjual
                </button>
                <button
                  type="button"
                  className="rounded-full bg-surface-card px-4 py-2 text-sm font-medium text-text-muted"
                >
                  Meninggal
                </button>
              </div>
            </div>

            {/* Catatan */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Khusus (Opsional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Alergi makanan, kebiasaan, dll..."
                rows={3}
                className="rounded-2xl border-sand-border"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                className="h-14 w-full rounded-full text-base font-semibold"
              >
                Simpan Perubahan
              </Button>
              <Link href={`/kucing/${id}`} className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-full"
                >
                  Batal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
