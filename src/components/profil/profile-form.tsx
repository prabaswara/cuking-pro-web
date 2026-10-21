"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type ProfileFormProps = {
  user: { name: string; email: string };
  profile: {
    whatsapp: string | null;
    kennelName: string | null;
    isBreeder: boolean;
    isStudProvider: boolean;
  };
};

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isBreeder, setIsBreeder] = useState(profile.isBreeder);
  const [isStudProvider, setIsStudProvider] = useState(profile.isStudProvider);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const whatsapp = String(formData.get("whatsapp") ?? "").trim();
    const kennelName = String(formData.get("kennelName") ?? "").trim();

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          whatsapp: whatsapp || null,
          kennelName: kennelName || null,
          isBreeder,
          isStudProvider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message ?? "Gagal menyimpan profil");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader>
        <CardTitle className="text-lg">Data Profil</CardTitle>
        <CardDescription>
          Perbarui informasi profil kamu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-surface-container">
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-3xl">
                  person
                </span>
              </div>
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled
              >
                Unggah Foto
              </Button>
              <p className="mt-1 text-xs text-text-muted">
                JPG, PNG, atau WebP, maks. 5MB (segera hadir)
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-error-container p-4 text-sm text-error">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-mint-subtle p-4 text-sm text-secondary">
              Profil berhasil disimpan.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Nama kamu"
              defaultValue={user.name}
              required
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              disabled
              className="h-12 rounded-2xl border-sand-border bg-surface-container-low"
            />
            <p className="text-xs text-text-muted">
              Email tidak dapat diubah
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              placeholder="08xxxxxxxxxx"
              defaultValue={profile.whatsapp ?? ""}
              className="h-12 rounded-2xl border-sand-border"
            />
            <p className="text-xs text-text-muted">
              Format Indonesia, diawali 08 atau +62
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kennelName">Nama Kennel (Opsional)</Label>
            <Input
              id="kennelName"
              name="kennelName"
              type="text"
              placeholder="Nama kennel atau cattery kamu"
              defaultValue={profile.kennelName ?? ""}
              className="h-12 rounded-2xl border-sand-border"
            />
            <p className="text-xs text-text-muted">
              Dipakai sebagai nama tampilan di riwayat kepemilikan
            </p>
          </div>

          {/* Role Toggles */}
          <div className="space-y-4 rounded-2xl bg-surface-container-low p-4">
            <h4 className="font-semibold text-on-surface">Peran</h4>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-breeder">Saya Breeder</Label>
                <p className="text-sm text-text-muted">
                  Aktifkan fitur breeding dan pencatatan kawin
                </p>
              </div>
              <Switch
                id="is-breeder"
                checked={isBreeder}
                onCheckedChange={setIsBreeder}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-stud-provider">Saya Menyediakan Jasa Pacak</Label>
                <p className="text-sm text-text-muted">
                  Aktifkan fitur booking dan catatan kawin pacak
                </p>
              </div>
              <Switch
                id="is-stud-provider"
                checked={isStudProvider}
                onCheckedChange={setIsStudProvider}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-full text-base font-semibold"
          >
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
