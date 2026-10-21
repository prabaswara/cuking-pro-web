"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export function VerifyEmailCard({ email }: { email?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResent, setIsResent] = useState(false);

  async function handleResend() {
    if (!email) return;

    setIsLoading(true);
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/dashboard",
      });
      setIsResent(true);
      setTimeout(() => setIsResent(false), 3000);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tangerine-subtle">
          <span className="material-symbols-outlined text-3xl text-primary">
            mark_email_unread
          </span>
        </div>
        <CardTitle className="text-xl">Cek Email Kamu!</CardTitle>
        <CardDescription>
          {email ? (
            <>
              Kami telah mengirimkan tautan verifikasi ke{" "}
              <span className="font-semibold text-on-surface">{email}</span>
            </>
          ) : (
            "Kami telah mengirimkan tautan verifikasi ke email kamu"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-sm text-text-muted">
              Silakan klik tautan verifikasi yang telah kami kirimkan untuk
              mengaktifkan akun kamu. Cek juga folder spam jika tidak menemukan
              email di inbox.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResend}
              disabled={isLoading || !email}
              variant="outline"
              className="h-12 w-full rounded-full text-base font-semibold"
            >
              {isLoading
                ? "Mengirim..."
                : isResent
                  ? "Email Terkirim Ulang!"
                  : "Kirim Ulang Email"}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline"
              >
                Kembali ke halaman login
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
