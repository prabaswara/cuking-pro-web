"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-messages";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      setIsLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (signUpError) {
        setError(authErrorMessage(signUpError.code, "Gagal mendaftar"));
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Buat Akun Baru</CardTitle>
        <CardDescription>
          Isi data diri kamu untuk mendaftar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-2xl bg-error-container p-4 text-sm text-error">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Nama kamu"
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
              placeholder="nama@email.com"
              required
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Ulangi password"
              required
              minLength={8}
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-full text-base font-semibold"
          >
            {isLoading ? "Mendaftar..." : "Daftar"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-muted">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Masuk
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
