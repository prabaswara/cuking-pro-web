"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // TODO: Implement actual login with Better Auth
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "Email atau password salah");
        return;
      }

      router.push("/dashboard");
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
        <CardTitle className="text-xl">Masuk ke Akun</CardTitle>
        <CardDescription>
          Masukkan email dan password kamu
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Lupa password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-full text-base font-semibold"
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        {/* Bypass demo sementara — hapus saat Better Auth dipasang */}
        <div className="mt-4 rounded-2xl bg-amber-subtle p-3 text-center">
          <p className="text-xs text-text-muted">
            Backend auth belum dipasang. Untuk preview UI:
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="mt-2 h-10 w-full rounded-full text-sm font-semibold"
          >
            Masuk sebagai Demo →
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-muted">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
