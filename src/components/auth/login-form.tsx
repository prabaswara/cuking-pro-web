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

export type DemoAccount = { email: string; label: string };

type LoginFormProps = {
  demoAccounts?: DemoAccount[];
  demoPassword?: string;
};

export function LoginForm({ demoAccounts = [], demoPassword }: LoginFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isResent, setIsResent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setUnverifiedEmail(null);
    setIsResent(false);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(authErrorMessage(signInError.code, "Email atau password salah"));
        if (signInError.code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(email);
        }
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

  async function handleResendVerification() {
    if (!unverifiedEmail) return;

    setIsResending(true);
    try {
      await authClient.sendVerificationEmail({
        email: unverifiedEmail,
        callbackURL: "/dashboard",
      });
      setIsResent(true);
    } finally {
      setIsResending(false);
    }
  }

  async function handleDemoLogin(email: string) {
    if (!demoPassword) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password: demoPassword,
      });

      if (signInError) {
        setError(authErrorMessage(signInError.code, "Akun demo tidak tersedia"));
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
              <p>{error}</p>
              {unverifiedEmail && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="mt-3 h-10 w-full rounded-full text-sm font-semibold"
                >
                  {isResending
                    ? "Mengirim..."
                    : isResent
                      ? "Email verifikasi terkirim"
                      : "Kirim ulang email verifikasi"}
                </Button>
              )}
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

        {/* Akun demo — hanya dirender bila DEMO_MODE aktif di server */}
        {demoAccounts.length > 0 && demoPassword && (
          <div className="mt-4 rounded-2xl bg-amber-subtle p-3">
            <p className="text-center text-xs text-text-muted">
              Coba akun demo (role & paket berbeda):
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => handleDemoLogin(account.email)}
                  className="h-10 rounded-full text-xs font-semibold"
                >
                  {account.label}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] text-text-muted">
              Data lokal. Tidak tersedia di produksi.
            </p>
          </div>
        )}

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
