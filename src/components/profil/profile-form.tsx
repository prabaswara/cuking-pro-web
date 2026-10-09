"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isBreeder, setIsBreeder] = useState(false);
  const [isStudProvider, setIsStudProvider] = useState(false);

  function updateBreeder(val: boolean) {
    setIsBreeder(val);
    try {
      localStorage.setItem("cukingpro:isBreeder", String(val));
    } catch {}
  }

  function updateStudProvider(val: boolean) {
    setIsStudProvider(val);
    try {
      localStorage.setItem("cukingpro:isStudProvider", String(val));
    } catch {}
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    // TODO: Implement profile update
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
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
              >
                Ubah Foto
              </Button>
              <p className="mt-1 text-xs text-text-muted">
                JPG atau PNG, maks. 5MB
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Nama kamu"
              defaultValue="Pengguna"
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@email.com"
              defaultValue="user@example.com"
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
                onCheckedChange={updateBreeder}
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
                onCheckedChange={updateStudProvider}
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
