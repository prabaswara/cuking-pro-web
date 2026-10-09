"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement actual forgot password with Better Auth
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "Gagal mengirim email");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint-subtle">
            <span className="material-symbols-outlined text-3xl text-secondary">
              mark_email_read
            </span>
          </div>
          <CardTitle className="text-xl">Email Terkirim!</CardTitle>
          <CardDescription>
            Jika email terdaftar, tautan reset telah dikirim
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-sm text-text-muted">
                Kami telah mengirimkan tautan reset password ke{" "}
                <span className="font-semibold text-on-surface">{email}</span>.
                Silakan cek inbox atau folder spam kamu.
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline"
              >
                Kembali ke halaman login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Reset Password</CardTitle>
        <CardDescription>
          Masukkan email untuk menerima tautan reset
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email}
            className="h-12 w-full rounded-full text-base font-semibold"
          >
            {isLoading ? "Mengirim..." : "Kirim Tautan Reset"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Kembali ke halaman login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
