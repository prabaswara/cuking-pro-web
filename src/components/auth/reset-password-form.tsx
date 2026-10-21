"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-messages";

export function ResetPasswordForm({ token }: { token?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(
    token ? null : "Tautan tidak valid atau sudah kedaluwarsa",
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setError("Password tidak cocok");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password minimal 8 karakter");
      setIsLoading(false);
      return;
    }

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (resetError) {
        setError(authErrorMessage(resetError.code, "Gagal mengatur ulang password"));
        return;
      }

      setIsDone(true);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isDone) {
    return (
      <Card className="w-full rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tangerine-subtle">
            <span className="material-symbols-outlined text-3xl text-primary">
              check_circle
            </span>
          </div>
          <CardTitle className="text-xl">Password Berhasil Diubah</CardTitle>
          <CardDescription>
            Kata sandi baru kamu sudah aktif. Silakan masuk kembali.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button className="h-12 w-full rounded-full text-base font-semibold">
              Ke Halaman Masuk
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Atur Ulang Password</CardTitle>
        <CardDescription>Masukkan kata sandi baru kamu</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-2xl bg-error-container p-4 text-sm text-error">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
              disabled={!token}
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Ulangi password baru"
              required
              minLength={8}
              disabled={!token}
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !token}
            className="h-12 w-full rounded-full text-base font-semibold"
          >
            {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Minta tautan baru
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
